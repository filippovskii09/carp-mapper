import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { STRUCTURE_COLORS, STRUCTURE_LABELS } from '@/config/constants';
import { useI18n } from '@/config/i18n';
import { useMarkerMetrics } from '@/features/markers/hooks/useMarkerMetrics';
import { selectMarkers, useMapStore } from '@/store';

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  }).format(timestamp);
}

export const MarkerList = memo(function MarkerList() {
  const t = useI18n();
  const markers = useMapStore(useShallow(selectMarkers));
  const deleteMarker = useMapStore((state) => state.deleteMarker);
  const metrics = useMarkerMetrics(markers);

  return (
    <section className="rounded-md border border-border bg-background/88 p-4 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{t.markers.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t.markers.savedPoints(markers.length)}</p>
        </div>
      </div>

      <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto pr-1">
        {metrics.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            {t.markers.empty}
          </p>
        ) : (
          metrics.map(({ marker, measuredDistance }) => (
            <article key={marker.id} className="rounded-md border border-border bg-muted/52 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: STRUCTURE_COLORS[marker.structure] }}
                      aria-hidden="true"
                    />
                    <p className="truncate text-sm font-medium">{marker.name}</p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {Math.round(measuredDistance)} m at {marker.azimuth}° · {marker.depth} m ·{' '}
                    {STRUCTURE_LABELS[marker.structure]}
                  </p>
                  {marker.wrapDistance ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.markers.wrapsLine(
                        marker.wrapDistance.wraps,
                        marker.wrapDistance.pegDistanceMeters,
                        marker.workRodWraps
                      )}
                    </p>
                  ) : null}
                  {marker.horizonMarker ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {marker.horizonMarker}
                    </p>
                  ) : null}
                  {marker.weather ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {marker.weather.temperatureC}° · {marker.weather.pressureHpa} hPa ·{' '}
                      {marker.weather.windDirection}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">{formatTime(marker.timestamp)}</p>
                </div>
                <Button
                  aria-label={t.markers.deleteLabel(marker.name)}
                  size="icon"
                  type="button"
                  variant="ghost"
                  onClick={() => deleteMarker(marker.id)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
});
