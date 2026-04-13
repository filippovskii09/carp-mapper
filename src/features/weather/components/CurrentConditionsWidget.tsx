import { useEffect } from 'react';
import { useWeather } from '@/features/weather/hooks/useWeather';
import { useMapStore } from '@/store';
import type { PressureTrend } from '@/types/domain';

function getTrendArrow(trend: PressureTrend): string {
  if (trend === 'falling') {
    return '↓';
  }

  if (trend === 'rising') {
    return '↑';
  }

  return '→';
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
            {weather.windDirection} · {weather.windSpeedKmh} км/г · хмари {weather.cloudCoverPercent}%
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {weather.moonPhaseIcon} {weather.moonPhaseLabel}
          </p>
          <p className="mt-2 rounded-md bg-muted/60 px-2 py-1 text-xs font-semibold text-foreground">
            {weather.activityBadge}
          </p>
        </>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          {error ? 'Погода недоступна офлайн.' : 'Очікую базову точку.'}
        </p>
      )}
    </section>
  );
}
