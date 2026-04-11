import { useCallback, useState } from 'react';
import { uk } from '@/config/i18n/uk';
import type { Location } from '@/types/domain';

interface LocationFix {
  location: Location;
  accuracy: number;
}

interface GeolocationState {
  location: Location | null;
  accuracy: number | null;
  error: string | null;
  isLoading: boolean;
  getCurrentLocation: () => Promise<LocationFix>;
}

const DESIRED_ACCURACY_METERS = 12;
const MAX_ACCURACY_WAIT_MS = 12_000;

function mapGeolocationError(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return uk.anchor.errors.permissionDenied;
    case error.POSITION_UNAVAILABLE:
      return uk.anchor.errors.unavailable;
    case error.TIMEOUT:
      return uk.anchor.errors.timeout;
    default:
      return uk.anchor.errors.unknown;
  }
}

function createLocationFix(position: GeolocationPosition): LocationFix {
  return {
    location: {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    },
    accuracy: position.coords.accuracy
  };
}

export function useGeolocation(): GeolocationState {
  const [location, setLocation] = useState<Location | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentLocation = useCallback(async (): Promise<LocationFix> => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      const message = uk.anchor.errors.unsupported;
      setError(message);
      setIsLoading(false);
      throw new Error(message);
    }

    return new Promise<LocationFix>((resolve, reject) => {
      let bestFix: LocationFix | null = null;
      let watchId: number | null = null;

      const finish = (fix: LocationFix | null, message?: string): void => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
        }

        window.clearTimeout(timeoutId);
        setIsLoading(false);

        if (fix) {
          setLocation(fix.location);
          setAccuracy(fix.accuracy);
          resolve(fix);
          return;
        }

        const errorMessage = message ?? uk.anchor.errors.unknown;
        setError(errorMessage);
        reject(new Error(errorMessage));
      };

      const timeoutId = window.setTimeout(() => {
        finish(bestFix);
      }, MAX_ACCURACY_WAIT_MS);

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const fix = createLocationFix(position);

          if (!bestFix || fix.accuracy < bestFix.accuracy) {
            bestFix = fix;
            setLocation(fix.location);
            setAccuracy(fix.accuracy);
          }

          if (fix.accuracy <= DESIRED_ACCURACY_METERS) {
            finish(fix);
          }
        },
        (geoError) => {
          finish(bestFix, mapGeolocationError(geoError));
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: MAX_ACCURACY_WAIT_MS
        }
      );
    });
  }, []);

  return { location, accuracy, error, isLoading, getCurrentLocation };
}
