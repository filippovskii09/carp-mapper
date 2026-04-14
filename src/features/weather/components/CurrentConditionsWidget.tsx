import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { WeatherDetailsPanel } from '@/features/weather/components/WeatherDetailsPanel';
import { useWeather } from '@/features/weather/hooks/useWeather';
import { getRatingLabel } from '@/features/weather/weatherDisplay';
import { useMapStore } from '@/store';

export function CurrentConditionsWidget() {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const anchor = useMapStore((state) => state.anchor);
  const setWeatherSnapshot = useMapStore((state) => state.setWeatherSnapshot);
  const { weather, error, isLoading } = useWeather(anchor?.lat, anchor?.lng);

  useEffect(() => {
    setWeatherSnapshot(weather);
  }, [setWeatherSnapshot, weather]);

  if (!anchor) {
    return null;
  }

  if (isHidden) {
    return (
      <button className="weather-widget weather-widget-hidden" type="button" onClick={() => setIsHidden(false)}>
        Погода
      </button>
    );
  }

  return (
    <>
      <section className="weather-widget weather-widget-compact" aria-label="Поточні погодні умови">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Погода</span>
          <div className="flex items-center gap-1">
            {isLoading ? <span className="text-xs text-primary">синхр</span> : null}
            <button className="weather-mini-button" type="button" onClick={() => setIsHidden(true)}>
              Сховати
            </button>
          </div>
        </div>

        {weather ? (
          <button className="weather-summary-button" type="button" onClick={() => setIsDetailsOpen(true)}>
            <div
              className="activity-score-ring"
              style={{ '--activity-score': `${weather.activityReport.score}%` } as CSSProperties}
              aria-label={`Активність коропа ${weather.activityReport.score}%`}
            >
              <span>{weather.activityReport.score}%</span>
            </div>
            <div className="min-w-0 text-left">
              <p className="text-sm font-bold">{getRatingLabel(weather.activityReport.rating)}</p>
              <p className="truncate text-xs text-muted-foreground">{weather.activityBadge}</p>
              <p className="truncate text-xs text-muted-foreground">
                WTP {weather.waterTempProxyC}° · {weather.windDirection} {weather.windSpeedKmh} км/г
              </p>
              <p className="truncate text-[0.68rem] font-semibold text-primary">
                Розрахунок для водойми в цілому
              </p>
            </div>
          </button>
        ) : (
          <button className="weather-empty-button" type="button" onClick={() => setIsDetailsOpen(true)}>
            {error ? 'Погода офлайн' : 'Відкрити погоду'}
          </button>
        )}
      </section>

      {isDetailsOpen ? (
        <WeatherDetailsPanel
          error={error}
          isLoading={isLoading}
          weather={weather}
          onClose={() => setIsDetailsOpen(false)}
        />
      ) : null}
    </>
  );
}
