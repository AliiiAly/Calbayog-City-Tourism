// src/utils/itineraryUtils.ts
// Travel-time, scheduling and route helpers for the ItineraryPlanner.
// Everything is computed from attraction coordinates (location_lat / location_lng).
// No paid map API is used.

import { Destination } from "../types";

export interface Coords {
  lat: number;
  lng: number;
}

/* ---------- TUNABLE ASSUMPTIONS ---------- */

// Roads are never straight lines; this scales the straight-line distance.
export const ROAD_FACTOR = 1.4;
// Minimum minutes counted for any hop (loading, waiting, parking).
export const MIN_TRAVEL_MIN = 5;
// A day longer than this gets a "long day" warning.
export const MAX_COMFORTABLE_DAY_MIN = 10 * 60;

// Average real-world speeds (km/h) per way of getting around.
export const TRANSPORT_MODES = [
  { value: "tricycle", label: "Tricycle / Jeepney", speed: 25 },
  { value: "motorcycle", label: "Motorcycle", speed: 35 },
  { value: "car", label: "Car / Van", speed: 40 },
];

export const getSpeed = (mode: string) =>
  (TRANSPORT_MODES.find((m) => m.value === mode) || TRANSPORT_MODES[0]).speed;

/* ---------- TIME SPENT AT EACH ATTRACTION (minutes) ---------- */

const VISIT_BY_TYPE: Record<string, number> = {
  Waterfalls: 120,
  Beaches: 120,
  Caves: 120,
  "Hot Springs": 120,
  Rivers: 90,
  "Dive Sites": 150,
  Churches: 45,
  Museums: 60,
  "Historic Buildings": 45,
  Monuments: 30,
  Parks: 60,
  Factories: 75,
  Farms: 90,
  "Production Sites": 75,
  Markets: 60,
  Malls: 90,
  "Local Craft Centers": 45,
};

const VISIT_BY_CATEGORY: Record<string, number> = {
  Nature: 90,
  "History and Culture": 60,
  "Industrial Tourism": 75,
  Shopping: 60,
  Other: 60,
};

/* ---------- WHAT KIND OF PLACE IS IT? ---------- */

// Restaurants and accommodations live in the same table as attractions.
// They are recognised by their category / attraction type name.
export type StopKind = "attraction" | "food" | "stay";

const FOOD_RE =
  /food|dining|restaurant|cafe|café|eatery|eateries|carinderia|bakery|coffee/;
const STAY_RE =
  /accommodation|hotel|resort|\binns?\b|lodge|lodging|homestay|hostel|pension|guest ?house|bnb/;

export const getStopKind = (dest: any): StopKind => {
  if (dest?.__kind === "food" || dest?.__kind === "stay") return dest.__kind;

  const text = [dest?.category, dest?.attraction_type]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (STAY_RE.test(text)) return "stay";
  if (FOOD_RE.test(text)) return "food";
  return "attraction";
};

export const getVisitMinutes = (dest: Destination) => {
  const kind = getStopKind(dest);
  if (kind === "food") return 60; // a meal
  if (kind === "stay") return 30; // check-in / drop bags

  const d: any = dest;
  return (
    VISIT_BY_TYPE[d?.attraction_type] ?? VISIT_BY_CATEGORY[d?.category] ?? 60
  );
};

/* ---------- COORDINATES ---------- */

const toNum = (v: unknown) =>
  v === null || v === undefined || v === "" ? NaN : Number(v);

export const getCoords = (dest: any): Coords | null => {
  const lat = toNum(dest?.location_lat ?? dest?.latitude ?? dest?.lat);
  const lng = toNum(dest?.location_lng ?? dest?.longitude ?? dest?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
};

const toRad = (deg: number) => (deg * Math.PI) / 180;

export const haversineKm = (a: Coords, b: Coords) => {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/* ---------- TRAVEL BETWEEN TWO STOPS ---------- */

export interface TravelLeg {
  km: number;
  minutes: number;
}

export const getTravelLeg = (
  a: Destination,
  b: Destination,
  speedKmh: number,
): TravelLeg | null => {
  const ca = getCoords(a);
  const cb = getCoords(b);
  if (!ca || !cb) return null;

  const km = haversineKm(ca, cb) * ROAD_FACTOR;
  const minutes = Math.max(MIN_TRAVEL_MIN, Math.round((km / speedKmh) * 60));
  return { km: Math.round(km * 10) / 10, minutes };
};

/* ---------- FORMATTING ---------- */

export const formatDuration = (minutes: number) => {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  if (r === 0) return `${h} hr`;
  return `${h} hr ${r} min`;
};

export const formatClock = (minutesFromMidnight: number) => {
  const total = Math.round(minutesFromMidnight) % (24 * 60);
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
};

// "08:00" -> 480
export const timeToMinutes = (value: string) => {
  const [h, m] = String(value || "").split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 8 * 60;
  return h * 60 + m;
};

/* ---------- DAY SCHEDULE ---------- */

export interface ScheduledStop {
  dest: Destination;
  arrive: number;
  depart: number;
  visitMin: number;
  travelFromPrev: TravelLeg | null;
}

export interface DaySchedule {
  stops: ScheduledStop[];
  totalTravelMin: number;
  totalVisitMin: number;
  totalKm: number;
  endTime: number;
  isTooLong: boolean;
  missingCoords: boolean;
}

export const buildDaySchedule = (
  destinations: Destination[],
  startMinutes: number,
  speedKmh: number,
): DaySchedule => {
  const stops: ScheduledStop[] = [];
  let clock = startMinutes;
  let totalTravelMin = 0;
  let totalVisitMin = 0;
  let totalKm = 0;
  let missingCoords = false;

  destinations.forEach((dest, index) => {
    let leg: TravelLeg | null = null;

    if (index > 0) {
      leg = getTravelLeg(destinations[index - 1], dest, speedKmh);
      if (leg) {
        clock += leg.minutes;
        totalTravelMin += leg.minutes;
        totalKm += leg.km;
      } else {
        missingCoords = true;
      }
    }

    const visitMin = getVisitMinutes(dest);
    stops.push({
      dest,
      arrive: clock,
      depart: clock + visitMin,
      visitMin,
      travelFromPrev: leg,
    });
    clock += visitMin;
    totalVisitMin += visitMin;
  });

  return {
    stops,
    totalTravelMin,
    totalVisitMin,
    totalKm: Math.round(totalKm * 10) / 10,
    endTime: clock,
    isTooLong: clock - startMinutes > MAX_COMFORTABLE_DAY_MIN,
    missingCoords,
  };
};

/* ---------- ROUTE ORDERING ---------- */

// Nearest-neighbour: keeps the first stop, then always goes to the closest next one.
// Stops without coordinates stay at the end in their original order.
export const optimizeRoute = (destinations: Destination[]): Destination[] => {
  const withCoords = destinations.filter((d) => getCoords(d));
  const withoutCoords = destinations.filter((d) => !getCoords(d));

  if (withCoords.length <= 2) return destinations;

  const remaining = [...withCoords];
  const ordered: Destination[] = [remaining.shift() as Destination];

  while (remaining.length) {
    const last = getCoords(ordered[ordered.length - 1]) as Coords;
    let bestIndex = 0;
    let bestDistance = Infinity;

    remaining.forEach((candidate, i) => {
      const d = haversineKm(last, getCoords(candidate) as Coords);
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = i;
      }
    });

    ordered.push(remaining.splice(bestIndex, 1)[0]);
  }

  return [...ordered, ...withoutCoords];
};

// Orders all chosen attractions along one geographic path, then cuts it into days,
// so each day's stops are close together instead of scattered across the city.
export const splitIntoDays = (
  destinations: Destination[],
  perDay: number,
  tripDays: number,
): Destination[][] => {
  const ordered = optimizeRoute(destinations);
  const days: Destination[][] = [];
  for (let i = 0; i < tripDays; i++) {
    days.push(ordered.slice(i * perDay, i * perDay + perDay));
  }
  return days;
};

/* ---------- NEAREST PLACE (for lunch / stay suggestions) ---------- */

export const nearestOf = (
  anchor: Destination,
  candidates: Destination[],
  exclude: Set<string>,
  maxKm: number,
): Destination | null => {
  const a = getCoords(anchor);
  if (!a) return null;

  let best: Destination | null = null;
  let bestKm = Infinity;

  for (const candidate of candidates) {
    if (exclude.has(candidate.id)) continue;
    const c = getCoords(candidate);
    if (!c) continue;

    const km = haversineKm(a, c) * ROAD_FACTOR;
    if (km < bestKm) {
      bestKm = km;
      best = candidate;
    }
  }

  return best && bestKm <= maxKm ? best : null;
};
