import type { CSSProperties } from 'react';
import { getImpactIcon, getRatingLabel, getTrendArrow, getWaterStatusLabel } from '@/features/weather/weatherDisplay';
import type { WeatherSnapshot } from '@/types/domain';

interface WeatherDetailsPanelProps {
  error: string | null;
  isLoading: boolean;
  onClose: () => void;
  weather: WeatherSnapshot | null;
}

export function WeatherDetailsPanel({ error, isLoading, onClose, weather }: WeatherDetailsPanelProps) {
  return (
    <section className="weather-details-overlay" aria-label="Детальна погодна аналітика">
      <div className="weather-details-panel">
        <header className="weather-details-header">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Аналітика водойми</p>
            <h2 className="text-xl font-bold">Погода і активність</h2>
          </div>
          <button className="weather-icon-button" type="button" onClick={onClose} aria-label="Закрити погоду">
            ×
          </button>
        </header>

        <div className="weather-details-content">
          {weather ? (
            <>
              <section className="weather-details-hero">
                <div
                  className="activity-score-ring activity-score-ring-large"
                  style={{ '--activity-score': `${weather.activityReport.score}%` } as CSSProperties}
                  aria-label={`Активність коропа ${weather.activityReport.score}%`}
                >
                  <span>{weather.activityReport.score}%</span>
                </div>
                <div>
                  <p className="text-lg font-bold">{getRatingLabel(weather.activityReport.rating)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{weather.activityReport.recommendation}</p>
                  {weather.activityReport.blocker ? (
                    <p className="mt-2 rounded-md bg-destructive/18 px-3 py-2 text-xs font-bold text-foreground">
                      Активний біологічний блокер
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="weather-details-grid" aria-label="Поточні умови">
                <div>
                  <p>Темп</p>
                  <strong>{weather.temperatureC}°</strong>
                </div>
                <div>
                  <p>WTP</p>
                  <strong>{weather.waterTempProxyC}°</strong>
                </div>
                <div>
                  <p>Тиск</p>
                  <strong>{weather.pressureHpa}</strong>
                </div>
                <div>
                  <p>Тренд</p>
                  <strong>{getTrendArrow(weather.pressureTrend)}</strong>
                </div>
                <div>
                  <p>Вітер</p>
                  <strong>
                    {weather.windDirection} · {weather.windSpeedKmh}
                  </strong>
                </div>
                <div>
                  <p>Хмари</p>
                  <strong>{weather.cloudCoverPercent}%</strong>
                </div>
              </section>

              <section className="weather-details-section">
                <h3>Статус водойми</h3>
                <p>
                  {getWaterStatusLabel(weather.waterStatus)} · WTP {weather.waterTempProxyC}° ·{' '}
                  {weather.waterTempDelta24h > 0 ? '+' : ''}
                  {weather.waterTempDelta24h}°/24г · Kp {weather.kpIndex}
                </p>
                <p>
                  {weather.moonPhaseIcon} {weather.moonPhaseLabel} · опади {weather.precipitationMm} мм/г
                </p>
              </section>

              <section className="weather-details-section">
                <h3>Тактичні вікна (Solunar)</h3>
                <ul className="space-y-2">
                  {weather.solunarWindows.map((window) => (
                    <li
                      key={`${window.type}-${window.peak}`}
                      className={window.isActive ? 'weather-solunar-active' : 'text-muted-foreground'}
                    >
                      🎣 {window.label}: {window.start} - {window.end}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="weather-details-section">
                <h3>Розбір активності</h3>
                <ul className="space-y-2">
                  {weather.activityReport.insights.map((insight) => (
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
              {error ? 'Погода недоступна офлайн. Мітки можна зберігати без погодного snapshot.' : null}
              {isLoading ? 'Синхронізую погодні дані...' : null}
              {!error && !isLoading ? 'Очікую базову точку.' : null}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
