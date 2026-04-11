import { useMemo } from 'react';
import { markerSchema } from '@/features/markers/markerSchema';
import { calculateDistanceFromWraps, getDefaultPegDistanceMeters } from '@/services/DistanceService';
import { geoService } from '@/services/GeoService';
import { useMapStore } from '@/store';
import type { MarkerPreview } from '@/types/domain';

export function useMarkerPreview(): MarkerPreview | null {
  const anchor = useMapStore((state) => state.anchor);
  const draft = useMapStore((state) => state.markerDraft);

  return useMemo(() => {
    if (!anchor || draft.distance === '' || draft.azimuth === '') {
      return null;
    }

    const parsed = markerSchema.safeParse({
      ...draft,
      distance:
        draft.distanceMode === 'wraps'
          ? String(
              calculateDistanceFromWraps({
                wraps: Number(draft.wraps),
                remainderMeters: Number(draft.wrapRemainder || 0),
                pegDistanceMeters: Number(draft.pegDistance || getDefaultPegDistanceMeters())
              })
            )
          : draft.distance,
      wraps: draft.wraps || '0',
      wrapRemainder: draft.wrapRemainder || '0',
      pegDistance: draft.pegDistance || String(getDefaultPegDistanceMeters()),
      depth: draft.depth === '' ? '0' : draft.depth,
      name: draft.name || 'preview'
    });

    if (!parsed.success) {
      return null;
    }

    return {
      coords: geoService.calculateDestination(anchor, parsed.data.distance, parsed.data.azimuth),
      distance: parsed.data.distance,
      azimuth: parsed.data.azimuth,
      depth: parsed.data.depth,
      structure: parsed.data.structure
    };
  }, [anchor, draft]);
}
