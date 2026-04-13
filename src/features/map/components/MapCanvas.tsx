import { memo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { mapboxToken } from '@/config/env';
import { useI18n } from '@/config/i18n';
import { AzimuthCompass } from '@/features/map/components/AzimuthCompass';
import { useMapbox } from '@/features/map/hooks/useMapbox';
import { useMarkerPreview } from '@/features/markers/hooks/useMarkerPreview';
import { selectMarkers, useMapStore } from '@/store';
import { useToastStore } from '@/store/toastStore';

export const MapCanvas = memo(function MapCanvas() {
  const t = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const anchor = useMapStore((state) => state.anchor);
  const anchorAccuracy = useMapStore((state) => state.anchorAccuracy);
  const isPlacingAnchorManually = useMapStore((state) => state.isPlacingAnchorManually);
  const markers = useMapStore(useShallow(selectMarkers));
  const setAnchor = useMapStore((state) => state.setAnchor);
  const setAnchorCalibrationState = useMapStore((state) => state.setAnchorCalibrationState);
  const selectMarkerForEditing = useMapStore((state) => state.selectMarkerForEditing);
  const placeDraftMarker = useMapStore((state) => state.placeDraftMarker);
  const showToast = useToastStore((state) => state.showToast);
  const preview = useMarkerPreview();

  useMapbox({
    containerRef,
    anchor,
    anchorAccuracy,
    isPlacingAnchorManually,
    markers,
    preview,
    onAnchorChange: setAnchor,
    onAnchorDragStateChange: setAnchorCalibrationState,
    onDraftMarkerPlace: placeDraftMarker,
    onMissingAnchorTap: () => showToast(t.toast.anchorRequired),
    onMarkerSelect: selectMarkerForEditing
  });

  return (
    <section className="absolute inset-0" aria-label={t.map.ariaLabel}>
      <div ref={containerRef} className="h-full w-full" />
      <AzimuthCompass />
      {!mapboxToken ? (
        <div className="absolute inset-x-4 top-4 rounded-md border border-border bg-background/92 p-4 text-sm shadow-xl backdrop-blur md:left-auto md:w-[26rem]">
          <p className="font-medium">{t.map.tokenRequiredTitle}</p>
          <p className="mt-1 text-muted-foreground">{t.map.tokenRequiredDescription}</p>
        </div>
      ) : null}
    </section>
  );
});
