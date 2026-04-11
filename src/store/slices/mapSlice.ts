import type { StateCreator } from 'zustand';
import { getDefaultPegDistanceMeters } from '@/services/DistanceService';
import { geoService } from '@/services/GeoService';
import type { FishingMarker, Location, MapStore, MarkerDraft, MarkerFormDraft } from '@/types/domain';

const initialMarkerDraft: MarkerFormDraft = {
  name: '',
  distanceMode: 'meters',
  distance: '',
  wraps: '',
  wrapRemainder: '0',
  pegDistance: String(getDefaultPegDistanceMeters()),
  azimuth: '',
  depth: '',
  horizonMarker: '',
  structure: 'sand'
};

function recalculateMarkers(anchor: Location, markersById: Record<string, FishingMarker>) {
  return Object.fromEntries(
    Object.entries(markersById).map(([id, marker]) => [
      id,
      {
        ...marker,
        coords: geoService.calculateDestination(anchor, marker.distance, marker.azimuth)
      }
    ])
  );
}

export const createMapSlice: StateCreator<MapStore, [], [], MapStore> = (set, get) => ({
  anchor: null,
  anchorAccuracy: null,
  isCalibratingAnchor: false,
  isPlacingAnchorManually: false,
  editingMarkerId: null,
  markerDraft: initialMarkerDraft,
  markerIds: [],
  markersById: {},
  setAnchor: (loc: Location, accuracyMeters: number | null = null) => {
    set((state) => ({
      anchor: loc,
      anchorAccuracy: accuracyMeters,
      isPlacingAnchorManually: false,
      markersById: recalculateMarkers(loc, state.markersById)
    }));
  },
  setAnchorCalibrationState: (isCalibrating: boolean) => {
    set({ isCalibratingAnchor: isCalibrating });
  },
  setManualAnchorPlacement: (isPlacing: boolean) => {
    set({ isPlacingAnchorManually: isPlacing });
  },
  placeDraftMarker: (loc: Location) => {
    const anchor = get().anchor;

    if (!anchor) {
      return;
    }

    const distance = geoService.calculateDistance(anchor, loc);
    const azimuth = geoService.calculateBearing(anchor, loc);

    set((state) => ({
      editingMarkerId: null,
      markerDraft: {
        ...state.markerDraft,
        distanceMode: 'meters',
        distance: distance.toFixed(1),
        azimuth: azimuth.toFixed(0),
        wraps: '',
        wrapRemainder: '0'
      }
    }));
  },
  setMarkerDraftField: (field, value) => {
    set((state) => ({
      markerDraft: {
        ...state.markerDraft,
        [field]: value
      }
    }));
  },
  resetMarkerDraft: () => {
    set({
      editingMarkerId: null,
      markerDraft: initialMarkerDraft
    });
  },
  selectMarkerForEditing: (id: string) => {
    const marker = get().markersById[id];

    if (!marker) {
      return;
    }

    set({
      editingMarkerId: id,
      markerDraft: {
        name: marker.name,
        distanceMode: marker.distanceMode ?? 'meters',
        distance: String(marker.distance),
        wraps: marker.wrapDistance ? String(marker.wrapDistance.wraps) : '',
        wrapRemainder: marker.wrapDistance ? String(marker.wrapDistance.remainderMeters) : '0',
        pegDistance: marker.wrapDistance
          ? String(marker.wrapDistance.pegDistanceMeters)
          : String(getDefaultPegDistanceMeters()),
        azimuth: String(marker.azimuth),
        depth: String(marker.depth),
        horizonMarker: marker.horizonMarker ?? '',
        structure: marker.structure
      }
    });
  },
  clearMarkerEditing: () => {
    set({
      editingMarkerId: null,
      markerDraft: initialMarkerDraft
    });
  },
  addMarker: (draft: MarkerDraft) => {
    const anchor = get().anchor;

    if (!anchor) {
      throw new Error('Anchor point is required before adding markers.');
    }

    const id = crypto.randomUUID();
    const marker: FishingMarker = {
      ...draft,
      id,
      coords: geoService.calculateDestination(anchor, draft.distance, draft.azimuth),
      timestamp: Date.now()
    };

    set((state) => ({
      markerIds: [id, ...state.markerIds],
      markersById: {
        ...state.markersById,
        [id]: marker
      }
    }));
  },
  updateMarker: (id: string, draft: MarkerDraft) => {
    const anchor = get().anchor;

    if (!anchor) {
      throw new Error('Anchor point is required before updating markers.');
    }

    set((state) => {
      const currentMarker = state.markersById[id];

      if (!currentMarker) {
        return state;
      }

      return {
        markersById: {
          ...state.markersById,
          [id]: {
            ...currentMarker,
            ...draft,
            coords: geoService.calculateDestination(anchor, draft.distance, draft.azimuth)
          }
        }
      };
    });
  },
  deleteMarker: (id: string) => {
    set((state) => {
      const remainingMarkers = { ...state.markersById };
      delete remainingMarkers[id];

      return {
        editingMarkerId: state.editingMarkerId === id ? null : state.editingMarkerId,
        markerDraft: state.editingMarkerId === id ? initialMarkerDraft : state.markerDraft,
        markerIds: state.markerIds.filter((markerId) => markerId !== id),
        markersById: remainingMarkers
      };
    });
  }
});
