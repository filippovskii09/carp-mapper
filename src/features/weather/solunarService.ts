import type { SolunarPeriodType, SolunarWindow } from '@/types/domain';

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;
const SYNODIC_MONTH_DAYS = 29.530588853;

function getDayStart(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('uk-UA', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
}

function buildWindow(
  type: SolunarPeriodType,
  label: string,
  peak: number,
  radiusMs: number,
  currentTimestamp: number
): SolunarWindow {
  const start = peak - radiusMs;
  const end = peak + radiusMs;

  return {
    type,
    label,
    start: formatTime(start),
    end: formatTime(end),
    peak: formatTime(peak),
    isActive: currentTimestamp >= start && currentTimestamp <= end
  };
}

function normalizeToToday(timestamp: number, dayStart: number): number {
  const dayOffset = ((timestamp - dayStart) % DAY_MS + DAY_MS) % DAY_MS;
  return dayStart + dayOffset;
}

export function calculateSolunarWindows(timestamp: number, moonPhaseAgeDays: number): SolunarWindow[] {
  const dayStart = getDayStart(timestamp);
  const moonTransitHour = (12 + moonPhaseAgeDays * (24 / SYNODIC_MONTH_DAYS)) % 24;
  const moonOverhead = dayStart + moonTransitHour * HOUR_MS;
  const moonUnderfoot = normalizeToToday(moonOverhead + 12 * HOUR_MS, dayStart);
  const moonrise = normalizeToToday(moonOverhead - 6 * HOUR_MS, dayStart);
  const moonset = normalizeToToday(moonOverhead + 6 * HOUR_MS, dayStart);

  return [
    buildWindow('major', 'Major: місяць над головою', moonOverhead, 90 * MINUTE_MS, timestamp),
    buildWindow('major', 'Major: місяць під ногами', moonUnderfoot, 90 * MINUTE_MS, timestamp),
    buildWindow('minor', 'Minor: схід місяця', moonrise, 45 * MINUTE_MS, timestamp),
    buildWindow('minor', 'Minor: захід місяця', moonset, 45 * MINUTE_MS, timestamp)
  ].sort((left, right) => left.start.localeCompare(right.start));
}

export function getActiveSolunarPeriod(windows: SolunarWindow[]): SolunarPeriodType | null {
  if (windows.some((window) => window.type === 'major' && window.isActive)) {
    return 'major';
  }

  if (windows.some((window) => window.type === 'minor' && window.isActive)) {
    return 'minor';
  }

  return null;
}
