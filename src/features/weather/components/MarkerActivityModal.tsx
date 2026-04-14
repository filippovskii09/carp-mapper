import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { calculateMarkerActivity, getActivityBadge } from '@/features/weather/CarpActivityEngine';
import { getImpactIcon, getRatingLabel } from '@/features/weather/weatherDisplay';
import { useMapStore } from '@/store';

interface MarkerActivityModalProps {
  markerId: string | null;
  onClose: () => void;
}

export function MarkerActivityModal({ markerId, onClose }: MarkerActivityModalProps) {
  const marker = useMapStore((state) => (markerId ? state.markersById[markerId] : null));
  const weather = useMapStore((state) => state.currentWeather);
  const report = useMemo(() => {
    if (!weather || !marker) {
      return null;
    }

    return calculateMarkerActivity(weather, marker);
  }, [marker, weather]);

  if (!markerId || !marker) {
    return null;
  }

  return (
    <section className="weather-details-overlay" aria-label="Активність конкретної мітки">
      <div className="weather-details-panel marker-activity-panel">
        <header className="weather-details-header">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Просторовий розрахунок v5</p>
            <h2 className="text-xl font-bold">{marker.name}</h2>
            <p className="text-xs text-muted-foreground">
              Азимут {Math.round(marker.azimuth)}° · глибина {marker.depth} м · дистанція {Math.round(marker.distance)} м
            </p>
          </div>
          <button className="weather-icon-button" type="button" onClick={onClose} aria-label="Закрити активність мітки">
            ×
          </button>
        </header>

        <div className="weather-details-content">
          {weather && report ? (
            <>
              <section className="weather-details-hero">
                <div
                  className="activity-score-ring activity-score-ring-large"
                  style={{ '--activity-score': `${report.score}%` } as CSSProperties}
                  aria-label={`Активність точки ${report.score}%`}
                >
                  <span>{report.score}%</span>
                </div>
                <div>
                  <p className="text-lg font-bold">{getRatingLabel(report.rating)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{getActivityBadge(report)}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{report.recommendation}</p>
                  <p className="mt-2 rounded-md bg-primary/12 px-3 py-2 text-xs font-semibold text-foreground">
                    Вітер {weather.windDirection} {weather.windDirectionDegrees}° · закид {Math.round(marker.azimuth)}°
                  </p>
                </div>
              </section>

              <section className="weather-details-section">
                <h3>Статус точки</h3>
                <p>
                  Глибина {marker.depth} м · азимут {Math.round(marker.azimuth)}° · WTP {weather.waterTempProxyC}° ·{' '}
                  {weather.waterTempDelta24h > 0 ? '+' : ''}
                  {weather.waterTempDelta24h}°/24г
                </p>
                <p>
                  Вітер {weather.windDirection} {weather.windDirectionDegrees}° · {weather.windSpeedKmh} км/г · Kp{' '}
                  {weather.kpIndex}
                </p>
              </section>

              <section className="weather-details-section">
                <h3>Чому саме ця точка</h3>
                <ul className="space-y-2">
                  {report.insights.map((insight) => (
                    <li key={`${insight.factor}-${insight.message}`} className="flex gap-2 text-sm text-muted-foreground">
                      <span aria-hidden="true">{getImpactIcon(insight.impact)}</span>
                      <span>
                        <strong className="text-foreground">{insight.factor}:</strong> {insight.message}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : (
            <p className="rounded-md bg-muted/45 p-4 text-sm text-muted-foreground">
              Погода ще не синхронізована. Просторовий розрахунок стане доступним після оновлення умов.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
