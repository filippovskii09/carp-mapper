import { useMemo } from 'react';
import { geoService } from '@/services/GeoService';
import { useMapStore } from '@/store';
import type { FishingMarker, Location } from '@/types/domain';

interface MarkerMetric {
  marker: FishingMarker;
  measuredDistance: number;
}

export function useMarkerMetrics(markers: FishingMarker[]): MarkerMetric[] {
  const anchor = useMapStore((state) => state.anchor);

  return useMemo(() => {
    if (!anchor) {
      return markers.map((marker) => ({ marker, measuredDistance: marker.distance }));
    }

    return markers.map((marker) => {
      const target: Location = { lng: marker.coords[0], lat: marker.coords[1] };

      return {
        marker,
        measuredDistance: geoService.calculateHaversineDistance(anchor, target)
      };
    });
  }, [anchor, markers]);
}
