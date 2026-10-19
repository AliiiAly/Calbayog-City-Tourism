
import type { Destination } from "../types";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RoadLeg {
  km: number;
  estimated: boolean;
  geometry: [number, number][];
}

const OSRM_BASE_URL = "https://router.project-osrm.org";

const isValidCoordinate = (lat: number, lng: number): boolean =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

const toCoordinate = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

/**
 * Extracts a saved map pin from a destination.
 * Returns null if its coordinates are missing or invalid.
 */
export const getStopPoint = (
  destination?: Destination | null,
): LatLng | null => {
  if (!destination) return null;

  const place = destination as Destination & {
    latitude?: number | string | null;
    longitude?: number | string | null;
    lat?: number | string | null;
    lng?: number | string | null;
    location?: {
      lat?: number | string | null;
      lng?: number | string | null;
      latitude?: number | string | null;
      longitude?: number | string | null;
    } | null;
  };

  const lat =
    toCoordinate(place.location_lat) ??
    toCoordinate(place.latitude) ??
    toCoordinate(place.lat) ??
    toCoordinate(place.location?.lat) ??
    toCoordinate(place.location?.latitude);

  const lng =
    toCoordinate(place.location_lng) ??
    toCoordinate(place.longitude) ??
    toCoordinate(place.lng) ??
    toCoordinate(place.location?.lng) ??
    toCoordinate(place.location?.longitude);

  if (lat === null || lng === null || !isValidCoordinate(lat, lng)) {
    return null;
  }

  return { lat, lng };
};

/**
 * Creates a stable, direction-independent key for a pair of map pins.
 */
export const legKey = (a: LatLng, b: LatLng): string => {
  const pointKey = (point: LatLng) =>
    `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;

  const first = pointKey(a);
  const second = pointKey(b);

  return first < second
    ? `${first}|${second}`
    : `${second}|${first}`;
};

const haversineKm = (a: LatLng, b: LatLng): number => {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const latitudeDifference = toRadians(b.lat - a.lat);
  const longitudeDifference = toRadians(b.lng - a.lng);

  const value =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return (
    2 *
    earthRadiusKm *
    Math.asin(Math.sqrt(Math.min(1, Math.max(0, value))))
  );
};

/**
 * Approximate fallback used when road routing is unavailable.
 * This is explicitly marked as estimated, not a confirmed road distance.
 */
const createEstimatedLeg = (a: LatLng, b: LatLng): RoadLeg => ({
  km: Math.round(haversineKm(a, b) * 1.3 * 10) / 10,
  estimated: true,
  geometry: [
    [a.lat, a.lng],
    [b.lat, b.lng],
  ],
});

interface OsrmRouteResponse {
  code?: string;
  routes?: Array<{
    distance?: number;
    geometry?: {
      coordinates?: number[][];
    };
  }>;
}

/**
 * Fetches a driving route between two saved map pins.
 * OSRM coordinates arrive as [longitude, latitude] and are converted
 * to [latitude, longitude] for the map component.
 */
export const fetchRoadLeg = async (
  a: LatLng,
  b: LatLng,
): Promise<RoadLeg> => {
  const fallback = createEstimatedLeg(a, b);

  try {
    const url =
      `${OSRM_BASE_URL}/route/v1/driving/` +
      `${a.lng},${a.lat};${b.lng},${b.lat}` +
      "?overview=full&geometries=geojson";

    const response = await fetch(url);

    if (!response.ok) return fallback;

    const data = (await response.json()) as OsrmRouteResponse;
    const route = data.routes?.[0];

    if (
      data.code !== "Ok" ||
      !route ||
      typeof route.distance !== "number" ||
      !Number.isFinite(route.distance) ||
      route.distance < 0
    ) {
      return fallback;
    }

    const coordinates = route.geometry?.coordinates ?? [];

    const geometry: [number, number][] = coordinates
      .filter(
        (coordinate): coordinate is [number, number] =>
          Array.isArray(coordinate) &&
          coordinate.length >= 2 &&
          Number.isFinite(coordinate[0]) &&
          Number.isFinite(coordinate[1]),
      )
      .map(([lng, lat]) => [lat, lng]);

    return {
      km: Math.round((route.distance / 1000) * 10) / 10,
      estimated: false,
      geometry:
        geometry.length >= 2
          ? geometry
          : fallback.geometry,
    };
  } catch (error) {
    console.warn("Road routing unavailable; using estimated distance.", error);
    return fallback;
  }
};

interface OsrmTableResponse {
  code?: string;
  distances?: Array<Array<number | null>>;
}

/**
 * Fetches driving distances from one origin to multiple destinations.
 * The returned array preserves the same order as the supplied points.
 * Null means no road distance was returned for that destination.
 */
export const fetchRoadDistances = async (
  origin: LatLng,
  targets: LatLng[],
): Promise<Array<number | null>> => {
  if (targets.length === 0) return [];

  const fallback = targets.map(() => null);

  try {
    const coordinates = [origin, ...targets]
      .map((point) => `${point.lng},${point.lat}`)
      .join(";");

    const destinationIndexes = targets
      .map((_, index) => index + 1)
      .join(";");

    const url =
      `${OSRM_BASE_URL}/table/v1/driving/${coordinates}` +
      `?sources=0&destinations=${destinationIndexes}&annotations=distance`;

    const response = await fetch(url);

    if (!response.ok) return fallback;

    const data = (await response.json()) as OsrmTableResponse;
    const distances = data.distances?.[0];

    if (data.code !== "Ok" || !distances) return fallback;

    return targets.map((_, index) => {
      const meters = distances[index];

      if (
        typeof meters !== "number" ||
        !Number.isFinite(meters) ||
        meters < 0
      ) {
        return null;
      }

      return Math.round((meters / 1000) * 10) / 10;
    });
  } catch (error) {
    console.warn("Unable to fetch road distances.", error);
    return fallback;
  }
};
