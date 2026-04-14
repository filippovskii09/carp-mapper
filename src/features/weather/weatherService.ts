import { calculateCarpActivity, getActivityBadge } from '@/features/weather/CarpActivityEngine';
import { calculateSolunarWindows, getActiveSolunarPeriod } from '@/features/weather/solunarService';
import type { PressureTrend, Season, WaterStatus, WeatherSnapshot } from '@/types/domain';

interface OpenMeteoResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
    pressure_msl?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    cloud_cover?: number;
    precipitation?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
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

function getFiniteHourlyValues(values: number[] | undefined): number[] {
  return values?.filter((value) => Number.isFinite(value)) ?? [];
}

export function getPressureTrend(delta24h: number, delta48h: number): PressureTrend {
  if (delta24h < -3) {
    return 'falling';
  }

  if (delta24h > 3) {
    return 'rising';
  }

  if (Math.abs(delta48h) < 2) {
    return 'steady';
  }

  return delta48h < 0 ? 'falling' : 'rising';
}

export function getCardinalWindDirection(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % CARDINAL_DIRECTIONS.length;

  return CARDINAL_DIRECTIONS[index];
}

export function getMoonPhase(
  timestamp: number
): Pick<WeatherSnapshot, 'moonPhaseIcon' | 'moonPhaseLabel' | 'moonPhaseAgeDays'> {
  const daysSinceKnownNewMoon = (timestamp - KNOWN_NEW_MOON_UTC) / 86_400_000;
  const phase = ((daysSinceKnownNewMoon % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  const phaseRatio = phase / SYNODIC_MONTH_DAYS;
  const moonPhaseAgeDays = round(phase);

  if (phaseRatio < 0.0625 || phaseRatio >= 0.9375) {
    return { moonPhaseIcon: '🌑', moonPhaseLabel: 'Новий місяць', moonPhaseAgeDays };
  }

  if (phaseRatio < 0.1875) {
    return { moonPhaseIcon: '🌒', moonPhaseLabel: 'Молодий місяць', moonPhaseAgeDays };
  }

  if (phaseRatio < 0.3125) {
    return { moonPhaseIcon: '🌓', moonPhaseLabel: 'Перша чверть', moonPhaseAgeDays };
  }

  if (phaseRatio < 0.4375) {
    return { moonPhaseIcon: '🌔', moonPhaseLabel: 'Зростаючий місяць', moonPhaseAgeDays };
  }

  if (phaseRatio < 0.5625) {
    return { moonPhaseIcon: '🌕', moonPhaseLabel: 'Повня', moonPhaseAgeDays };
  }

  if (phaseRatio < 0.6875) {
    return { moonPhaseIcon: '🌖', moonPhaseLabel: 'Спадний місяць', moonPhaseAgeDays };
  }

  if (phaseRatio < 0.8125) {
    return { moonPhaseIcon: '🌗', moonPhaseLabel: 'Остання чверть', moonPhaseAgeDays };
  }

  return { moonPhaseIcon: '🌘', moonPhaseLabel: 'Старий місяць', moonPhaseAgeDays };
}

export function getSeason(timestamp: number): Season {
  const month = new Date(timestamp).getMonth() + 1;

  if (month >= 3 && month <= 5) {
    return 'spring';
  }

  if (month >= 6 && month <= 8) {
    return 'summer';
  }

  if (month >= 9 && month <= 11) {
    return 'autumn';
  }

  return 'winter';
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

export function calculateWaterTempProxy(hourlyTemperatures: number[]): number {
  const temperatures = getFiniteHourlyValues(hourlyTemperatures).slice(-72);

  if (temperatures.length === 0) {
    return 0;
  }

  const recent24h = temperatures.slice(-24);
  const previous48h = temperatures.slice(0, Math.max(0, temperatures.length - 24));
  const recentAverage = recent24h.reduce((sum, value) => sum + value, 0) / recent24h.length;

  if (previous48h.length === 0) {
    return round(recentAverage);
  }

  const previousAverage = previous48h.reduce((sum, value) => sum + value, 0) / previous48h.length;

  return round(recentAverage * 0.65 + previousAverage * 0.35);
}

function calculateWaterTempDelta24h(hourlyTemperatures: number[]): number {
  const temperatures = getFiniteHourlyValues(hourlyTemperatures).slice(-72);

  if (temperatures.length < 48) {
    return 0;
  }

  const currentProxy = calculateWaterTempProxy(temperatures);
  const previousProxy = calculateWaterTempProxy(temperatures.slice(0, -24));

  return round(currentProxy - previousProxy);
}

function getWaterStatus(waterTempProxyC: number, waterTempDelta24h: number): WaterStatus {
  if (waterTempProxyC > 25) {
    return 'overheated';
  }

  if (waterTempDelta24h > 0.8) {
    return 'warming';
  }

  if (waterTempDelta24h < -0.8) {
    return 'cooling';
  }

  return 'stable';
}

async function fetchKpIndex(signal?: AbortSignal): Promise<number> {
  try {
    const response = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json', {
      signal
    });

    if (!response.ok) {
      return 2;
    }

    const data = (await response.json()) as unknown;

    if (!Array.isArray(data)) {
      return 2;
    }

    const latest = data
      .filter((row): row is unknown[] => Array.isArray(row))
      .slice(1)
      .at(-1);
    const rawKp = latest?.[1];
    const kpIndex = Number.parseFloat(String(rawKp));

    return Number.isFinite(kpIndex) ? round(kpIndex) : 2;
  } catch {
    return 2;
  }
}

export async function fetchWeatherSnapshot(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<WeatherFetchResult> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'temperature_2m,pressure_msl,wind_speed_10m,wind_direction_10m,cloud_cover,precipitation',
    hourly: 'temperature_2m,pressure_msl',
    daily: 'sunrise,sunset',
    past_days: '3',
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
  const pastPressure24h = getHistoricalPressure(data, timestamp, 24);
  const pastPressure48h = getHistoricalPressure(data, timestamp, 48);
  const pressureDelta24h = round(current.pressure_msl - pastPressure24h);
  const pressureDelta48h = round(current.pressure_msl - pastPressure48h);
  const pressureTrend = getPressureTrend(pressureDelta24h, pressureDelta48h);
  const windDirection = getCardinalWindDirection(current.wind_direction_10m ?? 0);
  const moonPhase = getMoonPhase(timestamp);
  const season = getSeason(timestamp);
  const temperatureC = round(current.temperature_2m);
  const pressureHpa = round(current.pressure_msl);
  const windSpeedKmh = round(current.wind_speed_10m ?? 0);
  const cloudCoverPercent = Math.round(current.cloud_cover ?? 0);
  const precipitationMm = round(current.precipitation ?? 0);
  const waterTempProxyC = calculateWaterTempProxy(data.hourly?.temperature_2m ?? [temperatureC]);
  const waterTempDelta24h = calculateWaterTempDelta24h(data.hourly?.temperature_2m ?? []);
  const waterStatus = getWaterStatus(waterTempProxyC, waterTempDelta24h);
  const solunarWindows = calculateSolunarWindows(timestamp, moonPhase.moonPhaseAgeDays);
  const activeSolunarPeriod = getActiveSolunarPeriod(solunarWindows);
  const kpIndex = await fetchKpIndex(signal);
  const windDirectionDegrees = Math.round(current.wind_direction_10m ?? 0);
  const sunrise = data.daily?.sunrise?.[0] ?? null;
  const sunset = data.daily?.sunset?.[0] ?? null;
  const activityReport = calculateCarpActivity({
    temperatureC,
    waterTempProxyC,
    waterTempDelta24h,
    pressureHpa,
    pressureTrend,
    pressureDelta24h,
    pressureDelta48h,
    windDirection,
    windDirectionDegrees,
    windSpeedKmh,
    cloudCoverPercent,
    precipitationMm,
    moonPhaseAgeDays: moonPhase.moonPhaseAgeDays,
    season,
    activeSolunarPeriod,
    kpIndex,
    currentHour: new Date(timestamp).getHours(),
    currentTimestamp: timestamp,
    sunrise,
    sunset
  });

  return {
    snapshot: {
      temperatureC,
      waterTempProxyC,
      waterTempDelta24h,
      waterStatus,
      pressureHpa,
      pressureTrend,
      pressureDelta24h,
      pressureDelta48h,
      windSpeedKmh,
      windDirectionDegrees,
      windDirection,
      cloudCoverPercent,
      precipitationMm,
      ...moonPhase,
      season,
      kpIndex,
      solunarWindows,
      activeSolunarPeriod,
      sunrise,
      sunset,
      activityBadge: getActivityBadge(activityReport),
      activityReport,
      timestamp
    }
  };
}
