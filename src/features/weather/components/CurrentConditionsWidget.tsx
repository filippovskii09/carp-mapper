import { useEffect } from 'react';
import { useWeather } from '@/features/weather/hooks/useWeather';
import { useMapStore } from '@/store';
import type { CSSProperties } from 'react';
import type { ActivityImpact, PressureTrend } from '@/types/domain';

function getTrendArrow(trend: PressureTrend): string {
  if (trend === 'falling') {
    return '↓';
  }

  if (trend === 'rising') {
    return '↑';
  }

  return '→';
}

function getImpactIcon(impact: ActivityImpact): string {
  if (impact === 'positive') {
    return '🟢';
  }

  if (impact === 'negative') {
    return '🔴';
  }

  return '🟡';
}

function getRatingLabel(rating: string): string {
  if (rating === 'Excellent') {
    return 'Відмінно';
  }

  if (rating === 'Good') {
    return 'Добре';
  }

  if (rating === 'Fair') {
    return 'Середньо';
  }

  return 'Важко';
}

export function CurrentConditionsWidget() {
  const anchor = useMapStore((state) => state.anchor);
  const setWeatherSnapshot = useMapStore((state) => state.setWeatherSnapshot);
  const { weather, error, isLoading } = useWeather(anchor?.lat, anchor?.lng);

  useEffect(() => {
    setWeatherSnapshot(weather);
  }, [setWeatherSnapshot, weather]);

  if (!anchor) {
    return null;
  }

  return (
    <section className="weather-widget" aria-label="Поточні погодні умови">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">Погода</span>
        {isLoading ? <span className="text-xs text-primary">синхр</span> : null}
      </div>

      {weather ? (
        <>
          <div className="mt-2 flex items-center gap-3">
            <div
              className="activity-score-ring"
              style={{ '--activity-score': `${weather.activityReport.score}%` } as CSSProperties}
              aria-label={`Активність коропа ${weather.activityReport.score}%`}
            >
              <span>{weather.activityReport.score}%</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold">{getRatingLabel(weather.activityReport.rating)}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{weather.activityReport.recommendation}</p>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Темп</p>
              <p className="text-sm font-bold">{weather.temperatureC}°</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Тиск</p>
              <p className="text-sm font-bold">{weather.pressureHpa}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Тренд</p>
              <p className="text-sm font-bold">{getTrendArrow(weather.pressureTrend)}</p>
            </div>
          </div>
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {weather.windDirection} · {weather.windSpeedKmh} км/г · хмари {weather.cloudCoverPercent}% · дощ{' '}
            {weather.rainMm} мм/г
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {weather.moonPhaseIcon} {weather.moonPhaseLabel}
          </p>
          <p className="mt-2 rounded-md bg-muted/60 px-2 py-1 text-xs font-semibold text-foreground">
            {weather.activityBadge}
          </p>

          <details className="activity-breakdown mt-2">
            <summary>Розбір активності</summary>
            <ul className="mt-2 space-y-1">
              {weather.activityReport.insights.map((insight) => (
                <li key={insight.factor} className="flex gap-2 text-xs text-muted-foreground">
                  <span aria-hidden="true">{getImpactIcon(insight.impact)}</span>
                  <span>
                    <strong className="text-foreground">{insight.factor}:</strong> {insight.message}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          {error ? 'Погода недоступна офлайн.' : 'Очікую базову точку.'}
        </p>
      )}
    </section>
  );
}
