import type { DistanceRecommendation, WrapDistance } from '@/types/domain';

const DEFAULT_PEG_DISTANCE_METERS = 3.6;
const DEPTH_COMPENSATION_RATIO = 0.3;
const MAX_COMPENSATION_WRAP_FRACTION = 1;

function round(value: number, precision = 2): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function getDefaultPegDistanceMeters(): number {
  return DEFAULT_PEG_DISTANCE_METERS;
}

export function calculateDistanceFromWraps(wrapDistance: WrapDistance): number {
  return round(
    wrapDistance.wraps * wrapDistance.pegDistanceMeters + wrapDistance.remainderMeters,
    2
  );
}

export function calculateWrapsFromDistance(distanceMeters: number, pegDistanceMeters: number): number {
  if (pegDistanceMeters <= 0) {
    return 0;
  }

  return round(distanceMeters / pegDistanceMeters, 2);
}

export function calculateDepthCompensationMeters(
  depthMeters: number,
  pegDistanceMeters: number
): number {
  const practicalCompensation = depthMeters * DEPTH_COMPENSATION_RATIO;
  const maxCompensation = pegDistanceMeters * MAX_COMPENSATION_WRAP_FRACTION;

  return round(Math.min(practicalCompensation, maxCompensation), 2);
}

export function createDistanceRecommendation(
  markerDistanceMeters: number,
  depthMeters: number,
  pegDistanceMeters: number
): DistanceRecommendation {
  const compensationMeters = calculateDepthCompensationMeters(depthMeters, pegDistanceMeters);
  const workRodDistanceMeters = round(markerDistanceMeters + compensationMeters, 2);

  return {
    markerDistanceMeters: round(markerDistanceMeters, 2),
    markerWraps: calculateWrapsFromDistance(markerDistanceMeters, pegDistanceMeters),
    workRodDistanceMeters,
    workRodWraps: calculateWrapsFromDistance(workRodDistanceMeters, pegDistanceMeters),
    compensationMeters
  };
}
