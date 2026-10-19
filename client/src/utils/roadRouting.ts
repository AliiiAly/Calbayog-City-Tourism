import { Destination } from "../types";
import { getCoords } from "./itineraryUtils";

/* =========================================================
   ROAD ROUTING
   Real driving distances and road geometry (not straight lines).

   Uses an OSRM routing server. The public demo server is used by
   default. For production, host your own and set VITE_OSRM_URL.
========================================================= */

const OSRM_URL: string = (
  (import.meta as any).env?.VITE_OSRM_URL || "https://router.project-osrm.org"
).replace(/\/$/, "");

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RoadLeg {
  /** distance in kilometers */
  km: number;
  /** driving time in minutes (OSRM estimate) */
  durationMin: number;
  /** road geometry as [lat, lng] pairs */
  geometry: [number, number][];
  /** true when the routing server was unreachable and the value is estimated */
  estimated: boolean;
}

/* =========================================================
   POINTS
   Reads the exact pin saved in the database for a place.
========================================================= */

export const getStopPoint = (dest: Destination | null | undefined): LatLng | null => {
  if (!dest) return null;

  const d: any = dest;

  const lat = Number(d?.location_lat ?? d?.latitude ?? d?.lat);
  const lng = Number(d?.location_lng ?? d?.longitude ?? d?.lng);

  if (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  ) {
    return { lat, lng };
  }

  const c: any = getCoords(dest);

  if (!c) return null;

  if (Array.isArray(c)) {
    const a = Number(c[0]);
    const b = Number(c[1]);
    return Number.isFinite(a) && Number.isFinite(b) ? { lat: a, lng: b } : null;
  }

  const a = Number(c.lat ?? c.latitude);
  const b = Number(c.lng ?? c.lon ?? c.longitude);

  return Number.isFinite(a) && Number.isFinite(b) ? { lat: a, lng: b } : null;
};

const round5 = (value: number) => value.toFixed(5);

export const legKey = (a: LatLng, b: LatLng) =>
  `${round5(a.lat)},${round5(a.lng)}>${round5(b.lat)},${round5(b.lng)}`;

export const haversineKm = (a: LatLng, b: LatLng) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earth = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
};

/* =========================================================
   REQUEST QUEUE (be gentle with the routing server)
========================================================= */

const MAX_PARALLEL = 3;
let active = 0;
const queue: Array<() => void> = [];

const enqueue = <T>(task: () => Promise<T>): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const start = () => {
      active += 1;
      task()
        .then(resolve, reject)
        .finally(() => {
          active -= 1;
          const next = queue.shift();
          if (next) next();
        });
    };

    if (active < MAX_PARALLEL) start();
    else queue.push(start);
  });

const fetchJson = async (url: string, timeoutMs = 9000) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Routing failed (${response.status})`);
    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
};

/* =========================================================
   LEG CACHE (memory + this device)
========================================================= */

const STORAGE_PREFIX = "calbayog_road_leg:";
const ESTIMATE_RETRY_MS = 2 * 60 * 1000;

interface CacheEntry {
  leg: RoadLeg;
  at: number;
}

const memory = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<RoadLeg>>();

const readStored = (key: string): RoadLeg | null => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.km === "number" &&
      Array.isArray(parsed.geometry) &&
      parsed.geometry.length > 1
    ) {
      return { ...parsed, estimated: false } as RoadLeg;
    }
  } catch {
    /* ignore */
  }
  return null;
};

const writeStored = (key: string, leg: RoadLeg) => {
  try {
    const raw = JSON.stringify(leg);
    if (raw.length < 60000) localStorage.setItem(STORAGE_PREFIX + key, raw);
  } catch {
    /* storage full or unavailable */
  }
};

const estimateLeg = (a: LatLng, b: LatLng): RoadLeg => {
  const km = Math.round(haversineKm(a, b) * 1.35 * 100) / 100;

  return {
    km,
    durationMin: Math.round((km / 30) * 60),
    geometry: [
      [a.lat, a.lng],
      [b.lat, b.lng],
    ],
    estimated: true,
  };
};

export const getCachedLeg = (a: LatLng, b: LatLng): RoadLeg | null => {
  const entry = memory.get(legKey(a, b));
  return entry ? entry.leg : null;
};

export const fetchRoadLeg = (a: LatLng, b: LatLng): Promise<RoadLeg> => {
  const key = legKey(a, b);

  const cached = memory.get(key);

  if (cached && (!cached.leg.estimated || Date.now() - cached.at < ESTIMATE_RETRY_MS)) {
    return Promise.resolve(cached.leg);
  }

  const stored = readStored(key);

  if (stored) {
    memory.set(key, { leg: stored, at: Date.now() });
    return Promise.resolve(stored);
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = enqueue(async () => {
    try {
      const data = await fetchJson(
        `${OSRM_URL}/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`,
      );

      const route = data?.routes?.[0];

      if (data?.code !== "Ok" || !route) {
        throw new Error("No route found");
      }

      const geometry: [number, number][] = Array.isArray(route.geometry?.coordinates)
        ? route.geometry.coordinates.map(
            (pair: number[]) => [pair[1], pair[0]] as [number, number],
          )
        : [];

      const leg: RoadLeg = {
        km: Math.round((route.distance / 1000) * 100) / 100,
        durationMin: Math.round(route.duration / 60),
        geometry:
          geometry.length > 1
            ? geometry
            : [
                [a.lat, a.lng],
                [b.lat, b.lng],
              ],
        estimated: false,
      };

      memory.set(key, { leg, at: Date.now() });
      writeStored(key, leg);

      return leg;
    } catch (error) {
      console.error("Road route unavailable, using an estimate:", error);

      const leg = estimateLeg(a, b);
      memory.set(key, { leg, at: Date.now() });
      return leg;
    }
  }).finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);

  return promise;
};

/* =========================================================
   ROAD DISTANCES FROM ONE PLACE TO MANY (for the picker)
   Returns kilometers, or null when a place is not reachable.
========================================================= */

const TABLE_CHUNK = 60;

export const fetchRoadDistances = async (
  origin: LatLng,
  targets: LatLng[],
): Promise<Array<number | null>> => {
  const result: Array<number | null> = new Array(targets.length).fill(null);

  for (let start = 0; start < targets.length; start += TABLE_CHUNK) {
    const chunk = targets.slice(start, start + TABLE_CHUNK);

    const coordinates = [origin, ...chunk]
      .map((point) => `${point.lng},${point.lat}`)
      .join(";");

    try {
      const data = await enqueue(() =>
        fetchJson(
          `${OSRM_URL}/table/v1/driving/${coordinates}?sources=0&annotations=distance`,
          12000,
        ),
      );

      const row: Array<number | null> | undefined = data?.distances?.[0];

      if (data?.code === "Ok" && Array.isArray(row)) {
        chunk.forEach((_, index) => {
          const meters = row[index + 1];

          result[start + index] =
            typeof meters === "number" && Number.isFinite(meters)
              ? Math.round((meters / 1000) * 100) / 100
              : null;
        });
      }
    } catch (error) {
      console.error("Road distances unavailable:", error);
    }
  }

  return result;
};
