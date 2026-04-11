import type { Feature, FeatureCollection, LineString, Point, Polygon } from 'geojson';
import { STRUCTURE_LABELS } from '@/config/constants';
import { uk } from '@/config/i18n/uk';
import { geoService } from '@/services/GeoService';
import type { FishingMarker, Location, MarkerPreview } from '@/types/domain';

type MarkerPointProperties = {
  id: string;
  name: string;
  structure: string;
  depth: number;
  distance: number;
  label: string;
};

type RayProperties = {
  id: string;
  structure: string;
};

export function createAnchorSource(anchor: Location | null): FeatureCollection<Point> {
  const features: Feature<Point>[] = anchor
    ? [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [anchor.lng, anchor.lat]
          },
          properties: {}
        }
      ]
    : [];

  return {
    type: 'FeatureCollection',
    features
  };
}

export function createAnchorAccuracySource(
  anchor: Location | null,
  accuracyMeters: number | null
): FeatureCollection<Polygon> {
  if (!anchor || !accuracyMeters || accuracyMeters <= 0) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  const coordinates: [number, number][] = [];

  for (let bearing = 0; bearing <= 360; bearing += 10) {
    coordinates.push(geoService.calculateDestination(anchor, accuracyMeters, bearing));
  }

  const feature: Feature<Polygon> = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates]
    },
    properties: {}
  };

  return {
    type: 'FeatureCollection',
    features: [feature]
  };
}

export function createMarkerSource(markers: FishingMarker[]): FeatureCollection<Point, MarkerPointProperties> {
  return {
    type: 'FeatureCollection',
    features: markers.map((marker) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: marker.coords
      },
      properties: {
        id: marker.id,
        name: marker.name,
        structure: marker.structure,
        depth: marker.depth,
        distance: marker.distance,
        label: uk.map.markerLabel(marker.depth, STRUCTURE_LABELS[marker.structure])
      }
    }))
  };
}

export function createRaySource(
  anchor: Location | null,
  markers: FishingMarker[]
): FeatureCollection<LineString, RayProperties> {
  if (!anchor) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  const anchorCoords: [number, number] = [anchor.lng, anchor.lat];

  return {
    type: 'FeatureCollection',
    features: markers.map((marker) => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [anchorCoords, marker.coords]
      },
      properties: {
        id: marker.id,
        structure: marker.structure
      }
    }))
  };
}

export function createPreviewMarkerSource(
  preview: MarkerPreview | null
): FeatureCollection<Point, MarkerPointProperties> {
  return {
    type: 'FeatureCollection',
    features: preview
      ? [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: preview.coords
            },
            properties: {
              id: 'preview',
              name: 'preview',
              structure: preview.structure,
              depth: preview.depth,
              distance: preview.distance,
              label: uk.map.markerLabel(preview.depth, STRUCTURE_LABELS[preview.structure])
            }
          }
        ]
      : []
  };
}

export function createPreviewRaySource(
  anchor: Location | null,
  preview: MarkerPreview | null
): FeatureCollection<LineString, RayProperties> {
  if (!anchor || !preview) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [[anchor.lng, anchor.lat], preview.coords]
        },
        properties: {
          id: 'preview',
          structure: preview.structure
        }
      }
    ]
  };
}
