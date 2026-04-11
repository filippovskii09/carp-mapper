import { useMemo } from 'react';
import { markerSchema } from '@/features/markers/markerSchema';
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
