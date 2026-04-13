import type { PressureTrend, WeatherSnapshot } from '@/types/domain';

interface OpenMeteoResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
    surface_pressure?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    cloud_cover?: number;
  };
  hourly?: {
    time?: string[];
    surface_pressure?: number[];
  };
}

export interface WeatherFetchResult {
  snapshot: WeatherSnapshot;
}

const CARDINAL_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

function round(value: number, precision = 1): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function getPressureTrend(currentPressure: number, pastPressure: number): PressureTrend {
  const delta = currentPressure - pastPressure;

  if (Math.abs(delta) < 0.5) {
    return 'steady';
  }

  return delta < 0 ? 'falling' : 'rising';
}

export function getCardinalWindDirection(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % CARDINAL_DIRECTIONS.length;

  return CARDINAL_DIRECTIONS[index];
}

export function calculateFishingConditions(
  pressure: number,
  trend: PressureTrend,
  windDir: string
): string {
  if (pressure < 1012 && trend === 'falling') {
    return '🔥 High Activity (Bottom Feeding)';
  }

  if (pressure > 1020 && trend === 'rising') {
    return '⚠️ Low Activity (Try Zig-Rigs)';
  }

  if (windDir.includes('S') || windDir === 'SW') {
    return '💨 Good Wind Direction';
  }

  return 'Stable Conditions';
}

function getPastPressure(response: OpenMeteoResponse): number {
  const pressures = response.hourly?.surface_pressure?.filter((value) => Number.isFinite(value));

  if (!pressures || pressures.length === 0) {
    return response.current?.surface_pressure ?? 0;
  }

  return pressures[0];
}

export async function fetchWeatherSnapshot(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<WeatherFetchResult> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'temperature_2m,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover',
    hourly: 'surface_pressure',
    past_hours: '12',
    forecast_hours: '1',
    timezone: 'auto'
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
    signal
  });

  if (!response.ok) {
    throw new Error(`Weather request failed with ${response.status}`);
  }

  const data = (await response.json()) as OpenMeteoResponse;
  const current = data.current;

  if (!current?.surface_pressure || current.temperature_2m === undefined) {
    throw new Error('Weather response is missing current conditions.');
  }

  const pastPressure = getPastPressure(data);
  const pressureTrend = getPressureTrend(current.surface_pressure, pastPressure);
  const windDirection = getCardinalWindDirection(current.wind_direction_10m ?? 0);

  return {
    snapshot: {
      temperatureC: round(current.temperature_2m),
      pressureHpa: round(current.surface_pressure),
      pressureTrend,
      windSpeedKmh: round(current.wind_speed_10m ?? 0),
      windDirectionDegrees: Math.round(current.wind_direction_10m ?? 0),
      windDirection,
      cloudCoverPercent: Math.round(current.cloud_cover ?? 0),
      activityBadge: calculateFishingConditions(current.surface_pressure, pressureTrend, windDirection),
      timestamp: current.time ? Date.parse(current.time) : Date.now()
    }
  };
}
