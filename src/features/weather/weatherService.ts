import { calculateCarpActivity, getActivityBadge } from '@/features/weather/CarpActivityEngine';
import type { PressureTrend, WeatherSnapshot } from '@/types/domain';

interface OpenMeteoResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
    pressure_msl?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    cloud_cover?: number;
    rain?: number;
  };
  hourly?: {
    time?: string[];
    pressure_msl?: number[];
  };
  daily?: {
    sunrise?: string[];
    sunset?: string[];
  };
}

export interface WeatherFetchResult {
  snapshot: WeatherSnapshot;
}

const CARDINAL_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
const SYNODIC_MONTH_DAYS = 29.530588853;
const KNOWN_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14);

function round(value: number, precision = 1): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function getPressureTrend(currentPressure: number, pastPressure: number): PressureTrend {
  const delta = currentPressure - pastPressure;

  if (Math.abs(delta) <= 2) {
    return 'steady';
  }

  return delta < 0 ? 'falling' : 'rising';
}

export function getCardinalWindDirection(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % CARDINAL_DIRECTIONS.length;

  return CARDINAL_DIRECTIONS[index];
}

export function getMoonPhase(timestamp: number): Pick<WeatherSnapshot, 'moonPhaseIcon' | 'moonPhaseLabel'> {
  const daysSinceKnownNewMoon = (timestamp - KNOWN_NEW_MOON_UTC) / 86_400_000;
  const phase = ((daysSinceKnownNewMoon % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  const phaseRatio = phase / SYNODIC_MONTH_DAYS;

  if (phaseRatio < 0.0625 || phaseRatio >= 0.9375) {
    return { moonPhaseIcon: '🌑', moonPhaseLabel: 'Новий місяць' };
  }

  if (phaseRatio < 0.1875) {
    return { moonPhaseIcon: '🌒', moonPhaseLabel: 'Молодий місяць' };
  }

  if (phaseRatio < 0.3125) {
    return { moonPhaseIcon: '🌓', moonPhaseLabel: 'Перша чверть' };
  }

  if (phaseRatio < 0.4375) {
    return { moonPhaseIcon: '🌔', moonPhaseLabel: 'Зростаючий місяць' };
  }

  if (phaseRatio < 0.5625) {
    return { moonPhaseIcon: '🌕', moonPhaseLabel: 'Повня' };
  }

  if (phaseRatio < 0.6875) {
    return { moonPhaseIcon: '🌖', moonPhaseLabel: 'Спадний місяць' };
  }

  if (phaseRatio < 0.8125) {
    return { moonPhaseIcon: '🌗', moonPhaseLabel: 'Остання чверть' };
  }

  return { moonPhaseIcon: '🌘', moonPhaseLabel: 'Старий місяць' };
}

function getHistoricalPressure(response: OpenMeteoResponse, currentTimestamp: number, lookbackHours: number): number {
  const times = response.hourly?.time;
  const pressures = response.hourly?.pressure_msl;

  if (!times || !pressures || times.length === 0 || pressures.length === 0) {
    return response.current?.pressure_msl ?? 0;
  }

  const targetTimestamp = currentTimestamp - lookbackHours * 3_600_000;
  let closestPressure = response.current?.pressure_msl ?? pressures[0] ?? 0;
  let smallestDistance = Number.POSITIVE_INFINITY;

  times.forEach((time, index) => {
    const pressure = pressures[index];

    if (!Number.isFinite(pressure)) {
      return;
    }

    const distance = Math.abs(Date.parse(time) - targetTimestamp);

    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestPressure = pressure;
    }
  });

  return closestPressure;
}

export async function fetchWeatherSnapshot(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<WeatherFetchResult> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'temperature_2m,pressure_msl,wind_speed_10m,wind_direction_10m,cloud_cover,rain',
    hourly: 'pressure_msl',
    daily: 'sunrise,sunset',
    past_hours: '24',
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

  if (current?.pressure_msl === undefined || current.temperature_2m === undefined) {
    throw new Error('Weather response is missing current conditions.');
  }

  const timestamp = current.time ? Date.parse(current.time) : Date.now();
  const pastPressure = getHistoricalPressure(data, timestamp, 12);
  const pressureDelta12h = round(current.pressure_msl - pastPressure);
  const pressureTrend = getPressureTrend(current.pressure_msl, pastPressure);
  const windDirection = getCardinalWindDirection(current.wind_direction_10m ?? 0);
  const moonPhase = getMoonPhase(timestamp);
  const temperatureC = round(current.temperature_2m);
  const pressureHpa = round(current.pressure_msl);
  const windSpeedKmh = round(current.wind_speed_10m ?? 0);
  const cloudCoverPercent = Math.round(current.cloud_cover ?? 0);
  const rainMm = round(current.rain ?? 0);
  const activityReport = calculateCarpActivity({
    temperatureC,
    pressureHpa,
    pressureTrend,
    pressureDelta12h,
    windDirection,
    windSpeedKmh,
    cloudCoverPercent,
    rainMm
  });

  return {
    snapshot: {
      temperatureC,
      pressureHpa,
      pressureTrend,
      pressureDelta12h,
      windSpeedKmh,
      windDirectionDegrees: Math.round(current.wind_direction_10m ?? 0),
      windDirection,
      cloudCoverPercent,
      rainMm,
      ...moonPhase,
      sunrise: data.daily?.sunrise?.[0] ?? null,
      sunset: data.daily?.sunset?.[0] ?? null,
      activityBadge: getActivityBadge(activityReport),
      activityReport,
      timestamp
    }
  };
}
