import { useEffect, useState } from 'react';
import { fetchWeatherSnapshot } from '@/features/weather/weatherService';
import type { WeatherSnapshot } from '@/types/domain';

interface UseWeatherResult {
  weather: WeatherSnapshot | null;
  error: string | null;
  isLoading: boolean;
}

export function useWeather(lat: number | null | undefined, lng: number | null | undefined): UseWeatherResult {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      setWeather(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetchWeatherSnapshot(lat, lng, controller.signal)
      .then((result) => {
        setWeather(result.snapshot);
      })
      .catch((weatherError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setWeather(null);
        setError(weatherError instanceof Error ? weatherError.message : 'Weather fetch failed');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [lat, lng]);

  return { weather, error, isLoading };
}
