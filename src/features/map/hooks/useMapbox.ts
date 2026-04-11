import { useEffect, useRef, type RefObject } from 'react';
import mapboxgl, { type GeoJSONSource } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, MAPBOX_STYLE } from '@/config/constants';
import { mapboxToken } from '@/config/env';
import {
  anchorAccuracyLayer,
  anchorLayer,
  markerLabelLayer,
  markerLayer,
  previewMarkerLabelLayer,
  previewMarkerLayer,
  previewRayLayer,
  rayLayer
} from '@/features/map/mapLayers';
import {
  createAnchorAccuracySource,
  createAnchorSource,
  createMarkerSource,
  createPreviewMarkerSource,
  createPreviewRaySource,
  createRaySource
} from '@/features/map/mapSources';
import type { FishingMarker, Location, MarkerPreview } from '@/types/domain';

interface UseMapboxParams {
  containerRef: RefObject<HTMLDivElement>;
  anchor: Location | null;
  anchorAccuracy: number | null;
  isPlacingAnchorManually: boolean;
  markers: FishingMarker[];
  preview: MarkerPreview | null;
  onAnchorChange: (loc: Location) => void;
  onAnchorDragStateChange: (isDragging: boolean) => void;
  onDraftMarkerPlace: (loc: Location) => void;
  onMissingAnchorTap: () => void;
  onMarkerSelect: (id: string) => void;
}

function setSourceData(map: mapboxgl.Map, sourceId: string, data: GeoJSON.FeatureCollection): void {
  const source = map.getSource(sourceId) as GeoJSONSource | undefined;

  source?.setData(data);
}

function applyUkrainianMapLabels(map: mapboxgl.Map): void {
  const mapWithLanguage = map as mapboxgl.Map & { setLanguage?: (language: string) => void };
  mapWithLanguage.setLanguage?.('uk');

  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type !== 'symbol' || !layer.layout?.['text-field']) {
      continue;
    }

    map.setLayoutProperty(layer.id, 'text-field', [
      'coalesce',
      ['get', 'name_uk'],
      ['get', 'name:uk'],
      ['get', 'name']
    ]);
  }
}

function addMapSourcesAndLayers(map: mapboxgl.Map): void {
  if (!map.getSource('anchor-source')) {
    map.addSource('anchor-source', { type: 'geojson', data: createAnchorSource(null) });
  }

  if (!map.getSource('anchor-accuracy-source')) {
    map.addSource('anchor-accuracy-source', {
      type: 'geojson',
      data: createAnchorAccuracySource(null, null)
    });
  }

  if (!map.getSource('marker-source')) {
    map.addSource('marker-source', { type: 'geojson', data: createMarkerSource([]) });
  }

  if (!map.getSource('ray-source')) {
    map.addSource('ray-source', { type: 'geojson', data: createRaySource(null, []) });
  }

  if (!map.getSource('preview-marker-source')) {
    map.addSource('preview-marker-source', { type: 'geojson', data: createPreviewMarkerSource(null) });
  }

  if (!map.getSource('preview-ray-source')) {
    map.addSource('preview-ray-source', { type: 'geojson', data: createPreviewRaySource(null, null) });
  }

  if (!map.getLayer('ray-layer')) {
    map.addLayer(rayLayer);
  }

  if (!map.getLayer('preview-ray-layer')) {
    map.addLayer(previewRayLayer);
  }

  if (!map.getLayer('anchor-accuracy-layer')) {
    map.addLayer(anchorAccuracyLayer);
  }

  if (!map.getLayer('anchor-layer')) {
    map.addLayer(anchorLayer);
  }

  if (!map.getLayer('marker-layer')) {
    map.addLayer(markerLayer);
  }

  if (!map.getLayer('preview-marker-layer')) {
    map.addLayer(previewMarkerLayer);
  }

  if (!map.getLayer('marker-label-layer')) {
    map.addLayer(markerLabelLayer);
  }

  if (!map.getLayer('preview-marker-label-layer')) {
    map.addLayer(previewMarkerLabelLayer);
  }
}

export function useMapbox({
  containerRef,
  anchor,
  anchorAccuracy,
  isPlacingAnchorManually,
  markers,
  preview,
  onAnchorChange,
  onAnchorDragStateChange,
  onDraftMarkerPlace,
  onMissingAnchorTap,
  onMarkerSelect
}: UseMapboxParams): void {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const hasLoadedRef = useRef(false);
  const latestDataRef = useRef({ anchor, anchorAccuracy, isPlacingAnchorManually, markers, preview });
  const callbacksRef = useRef({
    onAnchorChange,
    onAnchorDragStateChange,
    onDraftMarkerPlace,
    onMissingAnchorTap,
    onMarkerSelect
  });
  const isDraggingAnchorRef = useRef(false);
  const lastDragLocationRef = useRef<Location | null>(null);
  const previousAnchorRef = useRef<Location | null>(anchor);

  useEffect(() => {
    latestDataRef.current = { anchor, anchorAccuracy, isPlacingAnchorManually, markers, preview };
  }, [anchor, anchorAccuracy, isPlacingAnchorManually, markers, preview]);

  useEffect(() => {
    callbacksRef.current = {
      onAnchorChange,
      onAnchorDragStateChange,
      onDraftMarkerPlace,
      onMissingAnchorTap,
      onMarkerSelect
    };
  }, [
    onAnchorChange,
    onAnchorDragStateChange,
    onDraftMarkerPlace,
    onMissingAnchorTap,
    onMarkerSelect
  ]);

  useEffect(() => {
    if (!containerRef.current || !mapboxToken || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    const initialAnchor = latestDataRef.current.anchor;
    const center: [number, number] = initialAnchor
      ? [initialAnchor.lng, initialAnchor.lat]
      : DEFAULT_MAP_CENTER;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center,
      zoom: DEFAULT_MAP_ZOOM,
      attributionControl: true,
      locale: {
        'NavigationControl.ZoomIn': 'Збільшити',
        'NavigationControl.ZoomOut': 'Зменшити',
        'NavigationControl.ResetBearing': 'Скинути напрямок'
      }
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.addControl(new mapboxgl.GeolocateControl({ showUserLocation: true }), 'bottom-right');

    map.on('load', () => {
      applyUkrainianMapLabels(map);
      addMapSourcesAndLayers(map);
      hasLoadedRef.current = true;
      setSourceData(map, 'anchor-source', createAnchorSource(latestDataRef.current.anchor));
      setSourceData(
        map,
        'anchor-accuracy-source',
        createAnchorAccuracySource(
          latestDataRef.current.anchor,
          latestDataRef.current.anchorAccuracy
        )
      );
      setSourceData(map, 'marker-source', createMarkerSource(latestDataRef.current.markers));
      setSourceData(
        map,
        'ray-source',
        createRaySource(latestDataRef.current.anchor, latestDataRef.current.markers)
      );
      setSourceData(
        map,
        'preview-marker-source',
        createPreviewMarkerSource(latestDataRef.current.preview)
      );
      setSourceData(
        map,
        'preview-ray-source',
        createPreviewRaySource(latestDataRef.current.anchor, latestDataRef.current.preview)
      );
      map.on('mousedown', 'anchor-layer', startAnchorDrag);
      map.on('touchstart', 'anchor-layer', startAnchorDrag);
      map.on('mousemove', moveAnchor);
      map.on('touchmove', moveAnchor);
      map.on('mouseup', finishAnchorDrag);
      map.on('touchend', finishAnchorDrag);
      map.on('mouseenter', 'anchor-layer', () => {
        map.getCanvas().style.cursor = 'grab';
      });
      map.on('mouseleave', 'anchor-layer', () => {
        if (!isDraggingAnchorRef.current) {
          map.getCanvas().style.cursor = '';
        }
      });
      map.on('click', 'marker-layer', (event) => {
        if (latestDataRef.current.isPlacingAnchorManually) {
          return;
        }

        const markerId = event.features?.[0]?.properties?.id;

        if (typeof markerId === 'string') {
          callbacksRef.current.onMarkerSelect(markerId);
        }
      });
      map.on('click', (event) => {
        if (!latestDataRef.current.isPlacingAnchorManually) {
          const markerFeatures = map.queryRenderedFeatures(event.point, {
            layers: ['marker-layer', 'anchor-layer']
          });

          if (markerFeatures.length > 0) {
            return;
          }

          if (!latestDataRef.current.anchor) {
            callbacksRef.current.onMissingAnchorTap();
            return;
          }

          callbacksRef.current.onDraftMarkerPlace({
            lng: event.lngLat.lng,
            lat: event.lngLat.lat
          });
          return;
        }

        callbacksRef.current.onAnchorChange({ lng: event.lngLat.lng, lat: event.lngLat.lat });
      });
    });

    const startAnchorDrag = (event: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent): void => {
      event.preventDefault();
      isDraggingAnchorRef.current = true;
      lastDragLocationRef.current = { lng: event.lngLat.lng, lat: event.lngLat.lat };
      callbacksRef.current.onAnchorDragStateChange(true);
      map.getCanvas().style.cursor = 'grabbing';
      map.dragPan.disable();
    };

    const moveAnchor = (event: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent): void => {
      if (!isDraggingAnchorRef.current) {
        return;
      }

      const nextLocation: Location = { lng: event.lngLat.lng, lat: event.lngLat.lat };
      lastDragLocationRef.current = nextLocation;
      setSourceData(map, 'anchor-source', createAnchorSource(nextLocation));
    };

    const finishAnchorDrag = (): void => {
      if (!isDraggingAnchorRef.current) {
        return;
      }

      isDraggingAnchorRef.current = false;
      callbacksRef.current.onAnchorDragStateChange(false);
      map.getCanvas().style.cursor = '';
      map.dragPan.enable();

      if (lastDragLocationRef.current) {
        callbacksRef.current.onAnchorChange(lastDragLocationRef.current);
      }
    };

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      hasLoadedRef.current = false;
    };
  }, [containerRef]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !hasLoadedRef.current) {
      return;
    }

    setSourceData(map, 'anchor-source', createAnchorSource(anchor));
    setSourceData(map, 'anchor-accuracy-source', createAnchorAccuracySource(anchor, anchorAccuracy));
    setSourceData(map, 'marker-source', createMarkerSource(markers));
    setSourceData(map, 'ray-source', createRaySource(anchor, markers));
    setSourceData(map, 'preview-marker-source', createPreviewMarkerSource(preview));
    setSourceData(map, 'preview-ray-source', createPreviewRaySource(anchor, preview));
    map.getCanvas().style.cursor = isPlacingAnchorManually ? 'crosshair' : '';

    const anchorChanged =
      anchor?.lat !== previousAnchorRef.current?.lat || anchor?.lng !== previousAnchorRef.current?.lng;

    if (anchor && anchorChanged && !isDraggingAnchorRef.current) {
      map.easeTo({ center: [anchor.lng, anchor.lat], duration: 500 });
    }

    previousAnchorRef.current = anchor;
  }, [anchor, anchorAccuracy, isPlacingAnchorManually, markers, preview]);
}
