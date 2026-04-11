import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createMapSlice } from '@/store/slices/mapSlice';
import type { FishingMarker, MapStore } from '@/types/domain';

export const useMapStore = create<MapStore>()(
  persist(
    (...args) => ({
      ...createMapSlice(...args)
    }),
    {
      name: 'carpmapper-map-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        anchor: state.anchor,
        anchorAccuracy: state.anchorAccuracy,
        markerIds: state.markerIds,
        markersById: state.markersById
      })
    }
  )
);

export function selectMarkers(state: MapStore): FishingMarker[] {
  return state.markerIds.map((id) => state.markersById[id]).filter(Boolean);
}
