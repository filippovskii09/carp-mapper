import { useCallback, useState } from 'react';
import { uk } from '@/config/i18n/uk';
import type { Location } from '@/types/domain';

interface GeolocationState {
  location: Location | null;
  error: string | null;
  isLoading: boolean;
  getCurrentLocation: () => Promise<Location>;
}

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

export function useGeolocation(): GeolocationState {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentLocation = useCallback(async (): Promise<Location> => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      const message = uk.anchor.errors.unsupported;
      setError(message);
      setIsLoading(false);
      throw new Error(message);
    }

    return new Promise<Location>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          setLocation(loc);
          setIsLoading(false);
          resolve(loc);
        },
        (geoError) => {
          const message = mapGeolocationError(geoError);
          setError(message);
          setIsLoading(false);
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15_000
        }
      );
    });
  }, []);

  return { location, error, isLoading, getCurrentLocation };
}
