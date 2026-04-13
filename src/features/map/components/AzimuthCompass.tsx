import type { PointerEvent } from 'react';
import { useI18n } from '@/config/i18n';
import { useMapStore } from '@/store';

function normalizeAzimuth(value: number): number {
  return Math.round((value + 360) % 360);
}

function getAzimuthFromPointer(event: PointerEvent<HTMLButtonElement>): number {
  const rect = event.currentTarget.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  const degrees = (Math.atan2(dx, -dy) * 180) / Math.PI;

  return normalizeAzimuth(degrees);
}

export function AzimuthCompass() {
  const t = useI18n();
  const azimuth = useMapStore((state) => Number(state.markerDraft.azimuth || 0));
  const setMarkerDraftField = useMapStore((state) => state.setMarkerDraftField);
  const normalizedAzimuth = normalizeAzimuth(Number.isFinite(azimuth) ? azimuth : 0);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setMarkerDraftField('azimuth', String(getAzimuthFromPointer(event)));
  };

  return (
    <div className="azimuth-compass" aria-label={t.map.compass.title}>
      <button
        className="azimuth-compass-face"
        type="button"
        onPointerDown={handlePointerDown}
        aria-label={t.map.compass.hint}
      >
        <span className="azimuth-compass-cardinal azimuth-compass-n">N</span>
        <span className="azimuth-compass-cardinal azimuth-compass-e">E</span>
        <span className="azimuth-compass-cardinal azimuth-compass-s">S</span>
        <span className="azimuth-compass-cardinal azimuth-compass-w">W</span>
        <span
          className="azimuth-compass-needle"
          style={{ transform: `translateX(-50%) rotate(${normalizedAzimuth}deg)` }}
          aria-hidden="true"
        />
        <span className="azimuth-compass-center" aria-hidden="true" />
      </button>
      <div className="azimuth-compass-readout">
        <span>{t.map.compass.title}</span>
        <strong>{t.map.compass.azimuth(normalizedAzimuth)}</strong>
      </div>
    </div>
  );
}
