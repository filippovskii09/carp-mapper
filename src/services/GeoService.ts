import { bearing } from '@turf/bearing';
import { destination } from '@turf/destination';
import { distance } from '@turf/distance';
import { point } from '@turf/helpers';
import type { Location } from '@/types/domain';

const EARTH_RADIUS_METERS = 6_371_008.8;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number): number {
  return (value * 180) / Math.PI;
}

function normalizeLongitude(lng: number): number {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

export class GeoService {
  private static instance: GeoService | null = null;

  private constructor() {}

  static getInstance(): GeoService {
    if (!GeoService.instance) {
      GeoService.instance = new GeoService();
    }

    return GeoService.instance;
  }

  calculateDestination(anchor: Location, distanceMeters: number, azimuthDegrees: number): [number, number] {
    const distanceKilometers = distanceMeters / 1000;
    const origin = point([anchor.lng, anchor.lat]);
    const result = destination(origin, distanceKilometers, azimuthDegrees, { units: 'kilometers' });
    const [lng, lat] = result.geometry.coordinates;

    return [lng, lat];
  }

  calculateBearing(anchor: Location, target: Location): number {
    const origin = point([anchor.lng, anchor.lat]);
    const destinationPoint = point([target.lng, target.lat]);
    const calculatedBearing = bearing(origin, destinationPoint);

    return (calculatedBearing + 360) % 360;
  }

  calculateDistance(anchor: Location, target: Location): number {
    const origin = point([anchor.lng, anchor.lat]);
    const destinationPoint = point([target.lng, target.lat]);

    return distance(origin, destinationPoint, { units: 'meters' });
  }

  calculateDestinationByFormula(anchor: Location, distanceMeters: number, azimuthDegrees: number): [number, number] {
    const lat1 = toRadians(anchor.lat);
    const lng1 = toRadians(anchor.lng);
    const bearing = toRadians(azimuthDegrees);
    const angularDistance = distanceMeters / EARTH_RADIUS_METERS;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDistance) +
        Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
    );
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
        Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
      );

    return [normalizeLongitude(toDegrees(lng2)), toDegrees(lat2)];
  }

  calculateHaversineDistance(start: Location, end: Location): number {
    const lat1 = toRadians(start.lat);
    const lat2 = toRadians(end.lat);
    const latDelta = toRadians(end.lat - start.lat);
    const lngDelta = toRadians(end.lng - start.lng);

    const halfChordLength =
      Math.sin(latDelta / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) ** 2;
    const angularDistance =
      2 * Math.atan2(Math.sqrt(halfChordLength), Math.sqrt(1 - halfChordLength));

    return EARTH_RADIUS_METERS * angularDistance;
  }
}

export const geoService = GeoService.getInstance();
