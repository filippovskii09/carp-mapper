import type { StateCreator } from 'zustand';
import { geoService } from '@/services/GeoService';
import type { FishingMarker, Location, MapStore, MarkerDraft, MarkerFormDraft } from '@/types/domain';

const initialMarkerDraft: MarkerFormDraft = {
  name: '',
  distance: '',
  azimuth: '',
  depth: '',
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
  isCalibratingAnchor: false,
  isPlacingAnchorManually: false,
  editingMarkerId: null,
  markerDraft: initialMarkerDraft,
  markerIds: [],
  markersById: {},
  setAnchor: (loc: Location) => {
    set((state) => ({
      anchor: loc,
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
        distance: String(marker.distance),
        azimuth: String(marker.azimuth),
        depth: String(marker.depth),
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
