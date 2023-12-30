import { useEffect, useState } from "react";
import type { PartialDeep } from "type-fest";

type Geolocation =
  | {
      loading: boolean;
      position?: PartialDeep<GeolocationPosition>;
      error?: GeolocationPositionError;
    }
  | undefined;
export function useGeolocation(initialCoord?: {
  lat: number;
  lng: number;
}): Geolocation {
  const [geolocation, setGeolocation] = useState<Geolocation>({
    loading: true,
    position: {
      coords: {
        latitude: initialCoord?.lat,
        longitude: initialCoord?.lng,
      },
    },
  });
  useEffect(() => {
    const onSuccess: PositionCallback = ({ coords, timestamp }) => {
      setGeolocation({
        loading: false,
        position: {
          coords,
          timestamp,
        },
      });
    };

    const onError: PositionErrorCallback = (error) => {
      setGeolocation((prev) => ({
        ...prev,
        loading: false,
        error,
      }));
    };

    const option: PositionOptions = {
      maximumAge: 1000,
      timeout: 1000,
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, option);

    const id = navigator.geolocation.watchPosition(onSuccess, onError, option);
    return () => {
      navigator.geolocation.clearWatch(id);
    };
  }, []);

  return geolocation;
}
