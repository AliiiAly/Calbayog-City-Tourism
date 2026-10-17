import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Alert,
} from "react-bootstrap";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  CalendarDays,
  BedDouble,
  Car,
  Check,
  CirclePlus,
  Clock,
  Compass,
  Download,
  FileDown,
  GripVertical,
  Heart,
  Leaf,
  Map as MapIcon,
  MapPin,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Users,
  Utensils,
  WalletCards,
  X,
  Zap,
} from "lucide-react";

import { getAccommodations, getAttractions } from "../services/api";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import { Destination, ItineraryDay } from "../types";
import DayRouteMap from "../components/DayRouteMap";
import {
  TRANSPORT_MODES,
  buildDaySchedule,
  formatClock,
  formatDuration,
  getSpeed,
  getTravelLeg,
  getCoords,
  getStopKind,
  nearestOf,
  splitIntoDays,
  timeToMinutes,
} from "../utils/itineraryUtils";

/* =========================================================
   BRAND
========================================================= */

const CALBAYOG_BLUE = "#2D3195";
const SOFT_BLUE = "#EEF0FF";

/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY = "calbayog_itinerary";
const PREFERENCES_STORAGE_KEY = "calbayog_itinerary_preferences";
const SETTINGS_STORAGE_KEY = "calbayog_itinerary_settings";

const API_URL =
  (import.meta as any).env?.VITE_API_URL ||
  "https://calbayog-city-tourism.onrender.com/api";

/* =========================================================
   COLORS (by attraction type first, then category)
========================================================= */

const categoryColors: Record<string, string> = {
  Nature: "#1A7A4A",
  Waterfalls: "#0077B6",
  Beaches: "#00A8CC",
  Beach: "#00A8CC",
  Caves: "#6D4C41",
  "Hot Springs": "#C73545",
  Rivers: "#0077B6",
  "Dive Sites": "#00A8CC",
  "History and Culture": "#765548",
  Churches: "#B56A00",
  Museums: "#765548",
  "Historic Buildings": "#6D4C41",
  Monuments: "#6D4C41",
  Parks: "#1A7A4A",
  "Industrial Tourism": "#536878",
  Shopping: "#B56A00",
  Markets: "#B56A00",
  "Food and Dining": "#C2410C",
  Accommodation: "#2563EB",
  Other: "#68736D",
};

type StopKind = ReturnType<typeof getStopKind>;

const KIND_COLORS: Record<StopKind, string> = {
  attraction: CALBAYOG_BLUE,
  food: "#C2410C",
  stay: "#2563EB",
};

const KIND_LABELS: Record<StopKind, string> = {
  attraction: "Attraction",
  food: "Restaurant",
  stay: "Stay",
};

const KIND_TAB_LABELS: Record<StopKind, string> = {
  attraction: "Attractions",
  food: "Food & Dining",
  stay: "Where to Stay",
};

// Lunch is only suggested if a restaurant is within this many km (estimated road distance).
const MAX_MEAL_KM = 15;
const MAX_STAY_KM = 25;

const getDestColor = (dest: Destination) => {
  const kind = getStopKind(dest);
  if (kind !== "attraction") return KIND_COLORS[kind];

  const d: any = dest;
  return (
    categoryColors[d?.attraction_type] ||
    categoryColors[d?.category] ||
    CALBAYOG_BLUE
  );
};

const KindIcon: React.FC<{ kind: StopKind; size?: number }> = ({ kind, size = 16 }) =>
  kind === "food" ? (
    <Utensils size={size} strokeWidth={1.8} />
  ) : kind === "stay" ? (
    <BedDouble size={size} strokeWidth={1.8} />
  ) : (
    <MapPin size={size} strokeWidth={1.8} />
  );

// Where a new stop goes: lunch right after the 2nd stop, everything else at the end.
const insertStop = (stops: Destination[], dest: Destination) => {
  const next = [...stops];
  const kind = getStopKind(dest);
  const hasFood = stops.some((item) => getStopKind(item) === "food");

  if (kind === "food" && !hasFood && stops.length >= 2) {
    next.splice(2, 0, dest);
  } else {
    next.push(dest);
  }
  return next;
};

const tint = (color: string) =>
  color === CALBAYOG_BLUE ? SOFT_BLUE : `${color}14`;

/* =========================================================
   INTEREST OPTIONS
   Matched against the real database fields:
   category (Nature, History and Culture...) and
   attraction_type (Waterfalls, Beaches, Churches...).
========================================================= */

interface InterestOption {
  value: string;
  label: string;
  icon: React.ElementType;
  categories?: string[];
  types?: string[];
  keywords: string[];
}

const interestOptions: InterestOption[] = [
  {
    value: "Nature",
    label: "Nature",
    icon: Leaf,
    categories: ["Nature"],
    keywords: ["nature", "forest", "park", "river", "lake"],
  },
  {
    value: "Waterfalls",
    label: "Waterfalls",
    icon: Compass,
    types: ["Waterfalls"],
    keywords: ["waterfall", "falls", "cascade"],
  },
  {
    value: "Beach",
    label: "Beaches",
    icon: MapPin,
    types: ["Beaches"],
    keywords: ["beach", "coast", "sea", "island", "marine"],
  },
  {
    value: "History and Culture",
    label: "History & Culture",
    icon: Compass,
    categories: ["History and Culture"],
    keywords: ["history", "historical", "culture", "heritage", "museum"],
  },
  {
    value: "Religious",
    label: "Churches & Faith",
    icon: Compass,
    types: ["Churches"],
    keywords: ["religious", "church", "faith", "shrine", "cathedral"],
  },
  {
    value: "Adventure",
    label: "Adventure",
    icon: Compass,
    types: ["Caves", "Dive Sites", "Hot Springs"],
    keywords: ["adventure", "hiking", "trek", "climb", "cave", "diving"],
  },
  {
    value: "Shopping",
    label: "Shopping",
    icon: WalletCards,
    categories: ["Shopping"],
    keywords: ["shopping", "market", "souvenir", "craft"],
  },
  {
    value: "Industrial Tourism",
    label: "Industrial Tourism",
    icon: Compass,
    categories: ["Industrial Tourism"],
    keywords: ["industrial", "factory", "production", "farm"],
  },
];

/* =========================================================
   OPTIONS
========================================================= */

const travelerTypes = [
  { value: "Solo", label: "Solo", description: "Just me" },
  { value: "Couple", label: "Couple", description: "Two travelers" },
  { value: "Family", label: "Family", description: "Family trip" },
  { value: "Friends", label: "Friends", description: "Friends together" },
  { value: "Group", label: "Group", description: "Larger group" },
];

const paceOptions = [
  { value: "Relaxed", label: "Relaxed", description: "More time, fewer stops", stopsPerDay: 2 },
  { value: "Balanced", label: "Balanced", description: "Comfortable sightseeing", stopsPerDay: 3 },
  { value: "Packed", label: "Packed", description: "See as much as possible", stopsPerDay: 4 },
];

const budgetOptions = [
  { value: "Budget-friendly", label: "Budget-friendly", description: "Prefers free or low-cost places" },
  { value: "Moderate", label: "Moderate", description: "A comfortable balance" },
  { value: "Flexible", label: "Flexible", description: "Cost is less important" },
];

/* =========================================================
   TYPES
========================================================= */

interface ItineraryPreferences {
  travelDateStart: string;
  travelDateEnd: string;
  groupSize: number;
  groupType: string;
  selectedInterests: string[];
  travelPace: string;
  budget: string;
  specialRequests: string;
}

const defaultPreferences: ItineraryPreferences = {
  travelDateStart: "",
  travelDateEnd: "",
  groupSize: 1,
  groupType: "Solo",
  selectedInterests: [],
  travelPace: "Balanced",
  budget: "Moderate",
  specialRequests: "",
};

interface PlannerSettings {
  dayStart: string;
  transport: string;
}

const defaultSettings: PlannerSettings = {
  dayStart: "08:00",
  transport: "tricycle",
};

type SyncState = "idle" | "saving" | "saved" | "error";

/* =========================================================
   HELPERS
========================================================= */

// Local-time date helpers. (toISOString shifts the date by a day in the
// Philippines because it converts local midnight to UTC.)
const toLocalISO = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const todayISO = () => toLocalISO(new Date());

const addDaysISO = (iso: string, amount: number) => {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toLocalISO(date);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getTripDays = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
};

const getDateForDay = (startDate: string, dayNumber: number) => {
  if (!startDate) return undefined;
  const date = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return addDaysISO(startDate, dayNumber - 1);
};

const normalize = (value: unknown) => String(value ?? "").toLowerCase().trim();

/* =========================================================
   ACCOMMODATIONS + RESTAURANTS -> PLANNER PLACES
   They live in their own tables, so they are converted into the
   same shape the planner already uses for attractions.
========================================================= */

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toImageList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeAccommodation = (row: any): Destination =>
  ({
    id: `accommodation-${row?.id ?? row?._id}`,
    name: String(row?.name ?? "").trim(),
    category: "Accommodation",
    attraction_type: "Hotels & Resorts",
    description: row?.description || "",
    short_description: row?.description || "",
    location_address: row?.address || "",
    location_lat: toNumber(row?.latitude),
    location_lng: toNumber(row?.longitude),
    images: toImageList(row?.images),
    entrance_fee: row?.price_range || "",
    contact_number: row?.contact_number || "",
    __kind: "stay",
  }) as unknown as Destination;

const normalizeRestaurant = (row: any): Destination =>
  ({
    id: `restaurant-${row?.id}`,
    name: String(row?.name ?? "").trim(),
    category: "Food and Dining",
    attraction_type: String(row?.cuisine_type ?? "").trim() || "Restaurant",
    description: row?.description || "",
    short_description: row?.short_description || "",
    location_address: row?.location_address || "",
    location_lat: toNumber(row?.location_lat ?? row?.latitude),
    location_lng: toNumber(row?.location_lng ?? row?.longitude),
    images: toImageList(row?.images),
    entrance_fee: row?.price_range || "",
    opening_hours: row?.opening_hours || "",
    featured: Boolean(row?.featured),
    is_active: row?.is_active !== false,
    __kind: "food",
  }) as unknown as Destination;

const flat = (value: unknown) =>
  Array.isArray(value) ? value.join(" ") : String(value ?? "");

const getDestinationSearchText = (dest: Destination) => {
  const d: any = dest;
  return [
    d.name,
    d.category,
    d.attraction_type,
    d.other_attraction_type,
    d.description,
    d.short_description,
    d.location_address,
    d.things_to_do,
    d.attractions,
    d.tags,
    d.tips,
  ]
    .map(flat)
    .join(" ")
    .toLowerCase();
};

// How well a destination matches the chosen interests (0 = no match).
const getInterestMatch = (dest: Destination, selectedInterests: string[]) => {
  if (selectedInterests.length === 0) return 0;

  const d: any = dest;
  const category = normalize(d.category);
  const type = normalize(d.attraction_type);
  const text = getDestinationSearchText(dest);

  let score = 0;

  selectedInterests.forEach((interest) => {
    const option = interestOptions.find((item) => item.value === interest);
    if (!option) return;

    if (option.categories?.some((c) => normalize(c) === category)) score += 10;
    if (option.types?.some((t) => normalize(t) === type)) score += 12;
    option.keywords.forEach((keyword) => {
      if (text.includes(keyword)) score += 3;
    });
  });

  return score;
};

const isLowCost = (dest: Destination) => {
  const fee = normalize((dest as any).entrance_fee);
  return !fee || fee.includes("free") || fee.includes("not stated");
};

/* =========================================================
   GENERATE CUSTOMIZED ITINERARY
========================================================= */

const generateCustomizedDays = (
  destinations: Destination[],
  preferences: ItineraryPreferences,
): ItineraryDay[] => {
  const tripDays = getTripDays(preferences.travelDateStart, preferences.travelDateEnd);
  if (tripDays <= 0 || destinations.length === 0) return [];

  const pace =
    paceOptions.find((option) => option.value === preferences.travelPace) ||
    paceOptions[1];
  const perDay = pace.stopsPerDay;
  const wanted = tripDays * perDay;

  const scored = destinations
    .filter(
      (dest) => (dest as any).is_active !== false && getStopKind(dest) === "attraction",
    )
    .map((dest) => {
      const match = getInterestMatch(dest, preferences.selectedInterests);
      const bonus =
        (dest.featured ? 1 : 0) +
        (preferences.budget === "Budget-friendly" && isLowCost(dest) ? 2 : 0);
      return { dest, match, total: match + bonus };
    })
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.dest.name.localeCompare(b.dest.name);
    });

  // Only attractions that really match the chosen interests come first.
  const matched =
    preferences.selectedInterests.length > 0
      ? scored.filter((item) => item.match > 0)
      : scored;

  const selected: Destination[] = [];
  const ids = new Set<string>();

  const take = (list: typeof scored) => {
    for (const item of list) {
      if (selected.length >= wanted) break;
      if (ids.has(item.dest.id)) continue;
      selected.push(item.dest);
      ids.add(item.dest.id);
    }
  };

  take(matched);
  take(scored); // fill the remaining slots with featured / other places

  // Group by location so each day's stops are close together.
  const grouped = splitIntoDays(selected, perDay, tripDays);

  // Add one lunch stop per day, at the restaurant nearest to the 2nd stop.
  const restaurants = destinations.filter(
    (dest) => (dest as any).is_active !== false && getStopKind(dest) === "food",
  );
  const usedRestaurants = new Set<string>();

  return grouped.map((dayDestinations, index) => {
    const stops = [...dayDestinations];
    let hasLunch = false;

    if (stops.length >= 2) {
      const lunch = nearestOf(stops[1], restaurants, usedRestaurants, MAX_MEAL_KM);
      if (lunch) {
        stops.splice(2, 0, lunch);
        usedRestaurants.add(lunch.id);
        hasLunch = true;
      }
    }

    const baseNote =
      preferences.travelPace === "Relaxed"
        ? "A relaxed day with more time to enjoy each attraction."
        : preferences.travelPace === "Packed"
          ? "A fuller sightseeing day. Adjust the order or remove stops if needed."
          : "A balanced sightseeing day.";

    return {
      id: `day-${Date.now()}-${index}`,
      day: index + 1,
      date: getDateForDay(preferences.travelDateStart, index + 1),
      destinations: stops,
      notes: hasLunch ? `${baseNote} Lunch is suggested near your second stop.` : baseNote,
    };
  });
};

/* =========================================================
   SORTABLE ITINERARY ITEM
========================================================= */

const SortableItem: React.FC<{
  id: string;
  dest: Destination;
  index: number;
  arrive?: string;
  otherDays: { id: string; label: string }[];
  onMove: (toDayId: string) => void;
  onRemove: () => void;
}> = ({ id, dest, index, arrive, otherDays, onMove, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const d: any = dest;
  const color = getDestColor(dest);
  const kind = getStopKind(dest);
  const typeLabel =
    d.attraction_type === "Other"
      ? d.other_attraction_type || "Other"
      : d.attraction_type || dest.category;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        background: "#fff",
        borderRadius: 14,
        border: isDragging ? `1.5px solid ${CALBAYOG_BLUE}` : "1px solid #e9ecef",
        boxShadow: isDragging
          ? "0 12px 30px rgba(45,49,149,0.14)"
          : "0 2px 8px rgba(20,30,24,0.045)",
        opacity: isDragging ? 0.94 : 1,
        position: "relative",
        zIndex: isDragging ? 10 : 1,
      }}
      className="planner-sortable-item"
      {...attributes}
    >
      <button
        {...listeners}
        type="button"
        aria-label={`Reorder ${dest.name}`}
        title="Drag to reorder"
        className="planner-drag-button"
      >
        <GripVertical size={17} strokeWidth={1.8} />
      </button>

      <div className="planner-stop-number" style={{ color, background: tint(color) }}>
        {index + 1}
      </div>

      {dest.images?.[0] ? (
        <img src={dest.images[0]} alt={dest.name} className="planner-stop-image" />
      ) : (
        <div className="planner-stop-image planner-stop-placeholder">
          <KindIcon kind={kind} size={20} />
        </div>
      )}

      <div className="planner-stop-content">
        <p className="planner-stop-name">{dest.name}</p>

        <div className="planner-stop-meta">
          <span
            className="planner-category-tag"
            style={{ color, background: tint(color), gap: 3 }}
          >
            {kind !== "attraction" && <KindIcon kind={kind} size={10} />}
            {typeLabel}
          </span>
          {arrive && (
            <span className="planner-stop-time">
              <Clock size={11} strokeWidth={2} /> {arrive}
            </span>
          )}
          {d.entrance_fee && <span className="planner-stop-fee">{d.entrance_fee}</span>}
        </div>

        {otherDays.length > 0 && (
          <select
            className="planner-move-select"
            value=""
            aria-label={`Move ${dest.name} to another day`}
            onChange={(event) => {
              if (event.target.value) onMove(event.target.value);
            }}
          >
            <option value="">Move to…</option>
            {otherDays.map((day) => (
              <option key={day.id} value={day.id}>
                {day.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${dest.name}`}
        title="Remove attraction"
        className="planner-remove-button"
      >
        <X size={16} strokeWidth={1.9} />
      </button>
    </div>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const ItineraryPlanner: React.FC = () => {
  const { user, userToken, loading: authLoading } = useAuth();
  const isLoggedIn = Boolean(user && userToken);

  const [itineraryId, setItineraryId] = useState<string | null>(null);
  const [itineraryLoading, setItineraryLoading] = useState(true);

  const [days, setDays] = useState<ItineraryDay[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed)
        ? parsed.map((day: ItineraryDay, index: number) => ({
            ...day,
            day: index + 1,
            destinations: Array.isArray(day.destinations) ? day.destinations : [],
          }))
        : [];
    } catch {
      return [];
    }
  });

  const [preferences, setPreferences] = useState<ItineraryPreferences>(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (!stored) return defaultPreferences;
      const parsed = JSON.parse(stored);
      return {
        ...defaultPreferences,
        ...parsed,
        selectedInterests: Array.isArray(parsed?.selectedInterests)
          ? parsed.selectedInterests
          : [],
      };
    } catch {
      return defaultPreferences;
    }
  });

  const [settings, setSettings] = useState<PlannerSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [openMapDayId, setOpenMapDayId] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);
  const [customizationSaved, setCustomizationSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [nearestFirst, setNearestFirst] = useState(true);
  const [pickerKind, setPickerKind] = useState<StopKind>("attraction");
  const [justAdded, setJustAdded] = useState("");
  const [customizerError, setCustomizerError] = useState("");
  const [pageNotice, setPageNotice] = useState("");
  const [syncState, setSyncState] = useState<SyncState>("idle");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const speedKmh = getSpeed(settings.transport);
  const dayStartMinutes = timeToMinutes(settings.dayStart);

  /* =====================================================
     REFS FOR SAVING
  ===================================================== */

  const itineraryIdRef = useRef<string | null>(null);
  const syncingRef = useRef(false);
  const queuedRef = useRef<{ d: ItineraryDay[]; p: ItineraryPreferences } | null>(null);
  const skipAutosaveRef = useRef(false);
  const preferencesRef = useRef(preferences);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    itineraryIdRef.current = itineraryId;
  }, [itineraryId]);

  /* =====================================================
     SAVE TO DEVICE (works for guests too)
  ===================================================== */

  useEffect(() => {
    if (itineraryLoading) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
    } catch {
      /* storage full or unavailable */
    }
  }, [days, itineraryLoading]);

  useEffect(() => {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      /* ignore */
    }
  }, [preferences]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  /* =====================================================
     SAVE TO ACCOUNT
  ===================================================== */

  const syncToServer = useCallback(
    async (d: ItineraryDay[], p: ItineraryPreferences): Promise<boolean> => {
      if (!user || !userToken) return false;

      if (syncingRef.current) {
        queuedRef.current = { d, p };
        return true;
      }

      syncingRef.current = true;
      setSyncState("saving");

      try {
        const id = itineraryIdRef.current;

        const response = await fetch(
          id ? `${API_URL}/itineraries/${id}` : `${API_URL}/itineraries`,
          {
            method: id ? "PUT" : "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${userToken}`,
            },
            body: JSON.stringify({
              travel_date_start: p.travelDateStart,
              travel_date_end: p.travelDateEnd,
              group_size: p.groupSize,
              group_type: p.groupType,
              selected_interests: p.selectedInterests,
              travel_pace: p.travelPace,
              budget: p.budget,
              special_requests: p.specialRequests,
              days: d,
            }),
          },
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || "Unable to save your itinerary.");
        }

        if (data?.itinerary?.id) {
          itineraryIdRef.current = data.itinerary.id;
          setItineraryId(data.itinerary.id);
        }

        setSyncState("saved");
        return true;
      } catch (error) {
        console.error("Unable to save itinerary:", error);
        setSyncState("error");
        return false;
      } finally {
        syncingRef.current = false;
        const queued = queuedRef.current;
        if (queued) {
          queuedRef.current = null;
          void syncToServer(queued.d, queued.p);
        }
      }
    },
    [user, userToken],
  );

  /* =====================================================
     LOAD SAVED ITINERARY FROM ACCOUNT
  ===================================================== */

  useEffect(() => {
    if (authLoading) return;

    if (!user || !userToken) {
      setItineraryId(null);
      setItineraryLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setItineraryLoading(true);

      try {
        const response = await fetch(`${API_URL}/itineraries`, {
          method: "GET",
          headers: { Authorization: `Bearer ${userToken}` },
        });

        if (!response.ok) {
          throw new Error(`Failed to load itinerary (${response.status})`);
        }

        const data = await response.json();
        const savedItinerary = data?.itinerary;

        if (cancelled) return;

        if (savedItinerary) {
          setItineraryId(savedItinerary.id || null);

          if (Array.isArray(savedItinerary.days)) {
            const normalized = savedItinerary.days.map(
              (day: ItineraryDay, index: number) => ({
                ...day,
                day: index + 1,
                destinations: Array.isArray(day.destinations) ? day.destinations : [],
              }),
            );

            skipAutosaveRef.current = true;
            setDays(normalized);
            setGenerated(normalized.length > 0);
          }

          setPreferences({
            ...defaultPreferences,
            travelDateStart: savedItinerary.travel_date_start || "",
            travelDateEnd: savedItinerary.travel_date_end || "",
            groupSize: Number(savedItinerary.group_size) || 1,
            groupType: savedItinerary.group_type || "Solo",
            selectedInterests: Array.isArray(savedItinerary.selected_interests)
              ? savedItinerary.selected_interests
              : [],
            travelPace: savedItinerary.travel_pace || "Balanced",
            budget: savedItinerary.budget || "Moderate",
            specialRequests: savedItinerary.special_requests || "",
          });
        }
        // No saved itinerary on the account: keep whatever was planned on this device.
      } catch (error) {
        console.error("Unable to load saved itinerary:", error);
      } finally {
        if (!cancelled) setItineraryLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, userToken]);

  /* =====================================================
     AUTOSAVE (logged-in users, after changes to the plan)
  ===================================================== */

  useEffect(() => {
    if (itineraryLoading || !isLoggedIn) return;

    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return;
    }

    if (days.length === 0) return;

    const timer = window.setTimeout(() => {
      void syncToServer(days, preferencesRef.current);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [days, itineraryLoading, isLoggedIn, syncToServer]);

  /* =====================================================
     LOAD ATTRACTIONS
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadPlaces = async () => {
      const [attractionResult, accommodationResult, restaurantResult] =
        await Promise.allSettled([
          getAttractions(),
          getAccommodations(),
          supabase.from("restaurants").select("*"),
        ]);

      if (cancelled) return;

      [attractionResult, accommodationResult, restaurantResult].forEach((result) => {
        if (result.status === "rejected") {
          console.error("Failed to load some places:", result.reason);
        }
      });

      const attractions: Destination[] =
        attractionResult.status === "fulfilled" &&
        Array.isArray((attractionResult.value as any)?.data)
          ? (attractionResult.value as any).data
          : [];

      const accommodations: Destination[] =
        accommodationResult.status === "fulfilled" &&
        Array.isArray((accommodationResult.value as any)?.data)
          ? (accommodationResult.value as any).data
              .map(normalizeAccommodation)
              .filter((item: Destination) => item.name)
          : [];

      const restaurantValue: any =
        restaurantResult.status === "fulfilled" ? restaurantResult.value : null;

      const restaurants: Destination[] =
        restaurantValue && !restaurantValue.error && Array.isArray(restaurantValue.data)
          ? restaurantValue.data
              .filter((row: any) => row?.is_active !== false)
              .map(normalizeRestaurant)
              .filter((item: Destination) => item.name)
          : [];

      // Only places with a saved map pin can be planned, so the rest never appear here.
      setDestinations(
        [...attractions, ...accommodations, ...restaurants].filter(
          (dest) => getCoords(dest) !== null,
        ),
      );
    };

    void loadPlaces();

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep stops up to date with the latest attraction data (new photos, fixed pins).
  useEffect(() => {
    if (destinations.length === 0 || itineraryLoading) return;

    setDays((previous) => {
      let changed = false;

      const next = previous.map((day) => ({
        ...day,
        destinations: day.destinations.map((stop) => {
          const fresh = destinations.find((item) => item.id === stop.id);
          if (fresh && JSON.stringify(fresh) !== JSON.stringify(stop)) {
            changed = true;
            return fresh;
          }
          return stop;
        }),
      }));

      if (changed) skipAutosaveRef.current = true;
      return changed ? next : previous;
    });
  }, [destinations, itineraryLoading]);

  /* =====================================================
     DERIVED DATA
  ===================================================== */

  const availableKinds = useMemo(
    () =>
      (["attraction", "food", "stay"] as StopKind[]).filter((kind) =>
        destinations.some((dest) => getStopKind(dest) === kind),
      ),
    [destinations],
  );

  const foodPlaces = useMemo(
    () =>
      destinations.filter(
        (dest) => (dest as any).is_active !== false && getStopKind(dest) === "food",
      ),
    [destinations],
  );

  const stayPlaces = useMemo(
    () =>
      destinations.filter(
        (dest) => (dest as any).is_active !== false && getStopKind(dest) === "stay",
      ),
    [destinations],
  );

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        destinations
          .filter((destination) => getStopKind(destination) === pickerKind)
          .map((destination) => destination.category)
          .filter(Boolean),
      ),
    );
    return ["All", ...unique];
  }, [destinations, pickerKind]);

  const schedules = useMemo(
    () => days.map((day) => buildDaySchedule(day.destinations, dayStartMinutes, speedKmh)),
    [days, dayStartMinutes, speedKmh],
  );

  const totalDests = days.reduce((sum, day) => sum + day.destinations.length, 0);
  const totalDays = days.length;
  const totalTravelMin = schedules.reduce((sum, s) => sum + s.totalTravelMin, 0);
  const tripDays = getTripDays(preferences.travelDateStart, preferences.travelDateEnd);

  const usedDestinationIds = useMemo(
    () => new Set(days.flatMap((day) => day.destinations.map((dest) => dest.id))),
    [days],
  );

  const activeDay = days.find((day) => day.id === activeDayId) || null;
  const lastStop = activeDay?.destinations[activeDay.destinations.length - 1] || null;

  const filteredDestinations = useMemo(() => {
    const query = search.trim().toLowerCase();

    const list = destinations.filter((dest) => {
      if (getStopKind(dest) !== pickerKind) return false;

      const d: any = dest;
      const matchesSearch =
        !query ||
        dest.name?.toLowerCase().includes(query) ||
        dest.category?.toLowerCase().includes(query) ||
        String(d.attraction_type || "").toLowerCase().includes(query) ||
        dest.location_address?.toLowerCase().includes(query);

      const matchesCategory = category === "All" || dest.category === category;
      return matchesSearch && matchesCategory;
    });

    if (!nearestFirst || !lastStop) return list;

    // Nearest to the last stop of the day first; unknown distances go last.
    return [...list].sort((a, b) => {
      const la = getTravelLeg(lastStop, a, speedKmh)?.minutes ?? Infinity;
      const lb = getTravelLeg(lastStop, b, speedKmh)?.minutes ?? Infinity;
      return la - lb;
    });
  }, [destinations, search, category, nearestFirst, lastStop, speedKmh, pickerKind]);

  /* =====================================================
     DAY ACTIONS
  ===================================================== */

  const addDay = () => {
    setDays((previous) => [
      ...previous,
      {
        id: `day-${Date.now()}`,
        day: previous.length + 1,
        date: preferences.travelDateStart
          ? getDateForDay(preferences.travelDateStart, previous.length + 1)
          : undefined,
        destinations: [],
      },
    ]);
  };

  const removeDay = (dayId: string) => {
    setDays((previous) =>
      previous
        .filter((day) => day.id !== dayId)
        .map((day, index) => ({
          ...day,
          day: index + 1,
          date: preferences.travelDateStart
            ? getDateForDay(preferences.travelDateStart, index + 1)
            : day.date,
        })),
    );
  };

  const openPicker = (dayId: string, kind: StopKind = "attraction") => {
    setActiveDayId(dayId);
    setPickerKind(kind);
    setSearch("");
    setCategory("All");
    setNearestFirst(true);
    setJustAdded("");
    setShowPicker(true);
  };

  const addDestToDay = (dest: Destination) => {
    if (!activeDayId) return;

    setDays((previous) =>
      previous.map((day) =>
        day.id === activeDayId && !day.destinations.some((item) => item.id === dest.id)
          ? { ...day, destinations: insertStop(day.destinations, dest) }
          : day,
      ),
    );

    setJustAdded(dest.name);
    window.setTimeout(() => setJustAdded(""), 1800);
  };

  const removeDestFromDay = (dayId: string, destId: string) => {
    setDays((previous) =>
      previous.map((day) =>
        day.id === dayId
          ? { ...day, destinations: day.destinations.filter((item) => item.id !== destId) }
          : day,
      ),
    );
  };

  const moveDest = (fromDayId: string, destId: string, toDayId: string) => {
    setDays((previous) => {
      const from = previous.find((day) => day.id === fromDayId);
      const dest = from?.destinations.find((item) => item.id === destId);
      if (!from || !dest) return previous;

      return previous.map((day) => {
        if (day.id === fromDayId) {
          return { ...day, destinations: day.destinations.filter((item) => item.id !== destId) };
        }
        if (day.id === toDayId) {
          return { ...day, destinations: [...day.destinations, dest] };
        }
        return day;
      });
    });
  };

  // One-tap add of a suggested lunch spot or place to stay.
  const addSuggested = (dayId: string, dest: Destination) => {
    setDays((previous) =>
      previous.map((day) =>
        day.id === dayId && !day.destinations.some((item) => item.id === dest.id)
          ? { ...day, destinations: insertStop(day.destinations, dest) }
          : day,
      ),
    );
  };

  const handleDragEnd = (event: DragEndEvent, dayId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDays((previous) =>
      previous.map((day) => {
        if (day.id !== dayId) return day;

        const oldIndex = day.destinations.findIndex((item) => item.id === active.id);
        const newIndex = day.destinations.findIndex((item) => item.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return day;

        return { ...day, destinations: arrayMove(day.destinations, oldIndex, newIndex) };
      }),
    );
  };

  /* =====================================================
     PREFERENCES
  ===================================================== */

  const updatePreference = <K extends keyof ItineraryPreferences>(
    key: K,
    value: ItineraryPreferences[K],
  ) => {
    setPreferences((previous) => ({ ...previous, [key]: value }));
    setCustomizerError("");
  };

  const toggleInterest = (interest: string) => {
    setPreferences((previous) => {
      const exists = previous.selectedInterests.includes(interest);
      return {
        ...previous,
        selectedInterests: exists
          ? previous.selectedInterests.filter((item) => item !== interest)
          : [...previous.selectedInterests, interest],
      };
    });
    setCustomizerError("");
  };

  // Interests are optional: skipping them gives featured places.
  const validatePreferences = (p: ItineraryPreferences) => {
    if (!p.travelDateStart || !p.travelDateEnd) return "Please choose your travel dates.";
    if (p.travelDateEnd < p.travelDateStart) {
      return "Your end date must be on or after your start date.";
    }
    if (getTripDays(p.travelDateStart, p.travelDateEnd) > 14) {
      return "Trips are limited to 14 days. Please shorten your dates.";
    }
    if (!p.groupSize || p.groupSize < 1) return "Please enter at least 1 traveler.";
    return "";
  };

  const savePreferences = async () => {
    const validationError = validatePreferences(preferences);
    if (validationError) {
      setCustomizerError(validationError);
      return;
    }

    // Preferences are always kept on this device; sync them to the account if logged in.
    if (isLoggedIn && days.length > 0) {
      await syncToServer(days, preferences);
    }

    setCustomizationSaved(true);
    window.setTimeout(() => setCustomizationSaved(false), 2000);
  };

  /* =====================================================
     GENERATE
  ===================================================== */

  const generateItinerary = async (custom?: ItineraryPreferences) => {
    const p = custom || preferences;

    const validationError = validatePreferences(p);
    if (validationError) {
      setCustomizerError(validationError);
      return;
    }

    if (destinations.length === 0) {
      setCustomizerError("No attractions are available yet. Please try again in a moment.");
      return;
    }

    if (
      totalDests > 0 &&
      !window.confirm("This will replace your current itinerary. Continue?")
    ) {
      return;
    }

    const generatedDays = generateCustomizedDays(destinations, p);

    if (generatedDays.length === 0) {
      setCustomizerError("We couldn't build an itinerary from the available attractions.");
      return;
    }

    setPreferences(p);
    skipAutosaveRef.current = true;
    setDays(generatedDays);
    setGenerated(true);
    setCustomizerError("");
    setShowCustomizer(false);
    setOpenMapDayId(null);

    if (isLoggedIn) void syncToServer(generatedDays, p);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // One-tap plan: starts from the saved start date (if it is still ahead) or today.
  const quickPlan = (numberOfDays: number) => {
    const start =
      preferences.travelDateStart && preferences.travelDateStart >= todayISO()
        ? preferences.travelDateStart
        : todayISO();

    void generateItinerary({
      ...preferences,
      travelDateStart: start,
      travelDateEnd: addDaysISO(start, numberOfDays - 1),
    });
  };

  const openCustomizer = () => {
    setCustomizerError("");

    // Pre-fill dates so people don't have to start from a blank form.
    setPreferences((previous) => {
      if (previous.travelDateStart && previous.travelDateEnd) return previous;
      const start = previous.travelDateStart || todayISO();
      return {
        ...previous,
        travelDateStart: start,
        travelDateEnd: previous.travelDateEnd || addDaysISO(start, 1),
      };
    });

    setShowCustomizer(true);
  };

  /* =====================================================
     CLEAR
  ===================================================== */

  const clearItinerary = async () => {
    try {
      if (isLoggedIn && itineraryId) {
        const response = await fetch(`${API_URL}/itineraries/${itineraryId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${userToken}` },
        });

        if (!response.ok && response.status !== 404) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.message || "Unable to clear itinerary.");
        }
      }

      itineraryIdRef.current = null;
      setItineraryId(null);
      setDays([]);
      setGenerated(false);
      setOpenMapDayId(null);
      setSyncState("idle");
      setShowClearModal(false);
    } catch (error) {
      console.error("Unable to clear itinerary:", error);
      setShowClearModal(false);
      setPageNotice(
        error instanceof Error ? error.message : "We couldn't clear your itinerary.",
      );
    }
  };

  /* =====================================================
     EXPORT PDF
  ===================================================== */

  const exportPDF = () => {
    if (totalDests === 0) return;

    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("My Calbayog City Itinerary", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      14,
      28,
    );

    let y = 34;

    if (preferences.travelDateStart && preferences.travelDateEnd) {
      doc.text(
        `Travel dates: ${formatDate(preferences.travelDateStart)} - ${formatDate(
          preferences.travelDateEnd,
        )}`,
        14,
        y,
      );
      y += 6;
      doc.text(
        `${preferences.groupSize} traveler${preferences.groupSize !== 1 ? "s" : ""} • ${
          preferences.groupType
        } • ${preferences.travelPace} pace`,
        14,
        y,
      );
      y += 6;
    }

    doc.text(
      `${totalDays} day${totalDays !== 1 ? "s" : ""} • ${totalDests} stop${
        totalDests !== 1 ? "s" : ""
      } • about ${formatDuration(totalTravelMin)} of travel`,
      14,
      y,
    );
    y += 10;

    days.forEach((day, dayIndex) => {
      if (y > 255) {
        doc.addPage();
        y = 20;
      }

      const schedule = schedules[dayIndex];

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(`Day ${day.day}${day.date ? ` • ${formatDate(day.date)}` : ""}`, 14, y);
      y += 5;

      if (day.destinations.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.text("No attractions added", 14, y + 3);
        y += 12;
        return;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        `${formatClock(dayStartMinutes)} - ${formatClock(schedule.endTime)}  |  Travel: ${formatDuration(
          schedule.totalTravelMin,
        )} (${schedule.totalKm} km)`,
        14,
        y + 2,
      );
      y += 5;

      autoTable(doc, {
        startY: y,
        head: [["#", "Time", "Place", "Getting there", "Address"]],
        body: schedule.stops.map((stop, index) => {
          const d: any = stop.dest;
          return [
            String(index + 1),
            formatClock(stop.arrive),
            `${stop.dest.name}${
              getStopKind(stop.dest) !== "attraction"
                ? ` (${KIND_LABELS[getStopKind(stop.dest)]})`
                : ""
            }${d.entrance_fee ? `\nFee: ${d.entrance_fee}` : ""}`,
            stop.travelFromPrev
              ? `~${formatDuration(stop.travelFromPrev.minutes)} (${stop.travelFromPrev.km} km)`
              : index === 0
                ? "Start"
                : "-",
            stop.dest.location_address || "",
          ];
        }),
        theme: "striped",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [45, 49, 149] },
        margin: { left: 14, right: 14 },
      });

      y = ((doc as any).lastAutoTable?.finalY || y) + 12;
    });

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text(
      "Travel times and visit lengths are estimates. Check opening hours before you go.",
      14,
      Math.min(y, 285),
    );

    doc.save("calbayog_itinerary.pdf");
  };

  /* =====================================================
     SELECTED PACE (kept for future use in UI)
  ===================================================== */

  const syncLabel =
    syncState === "saving"
      ? "Saving…"
      : syncState === "saved"
        ? "Saved to your account"
        : syncState === "error"
          ? "Couldn't save. Will retry on your next change."
          : isLoggedIn
            ? "Changes save automatically"
            : "Saved on this device";

  /* =====================================================
     RENDER
  ===================================================== */

  if (authLoading || itineraryLoading) {
    return (
      <Container className="itinerary-container py-5">
        <div className="text-center py-5">
          <p className="mb-0">Loading your itinerary...</p>
        </div>
      </Container>
    );
  }

  return (
    <div className="page-enter itinerary-page">
      {/* HEADER */}

      <section className="itinerary-header">
        <div className="itinerary-header-inner">
          <h1 className="itinerary-title">PLAN YOUR TRIP</h1>
          <p className="itinerary-subtitle">
            Build a day-by-day itinerary with travel times between stops, and see
            your route on the map.
          </p>
        </div>
      </section>

      <Container className="itinerary-container">
        {/* PAGE NOTICE */}

        {pageNotice && (
          <Alert
            variant="info"
            dismissible
            onClose={() => setPageNotice("")}
            className="planner-error mb-3"
          >
            {pageNotice}
          </Alert>
        )}

        {/* INTRO (only before a plan exists) */}

        {days.length === 0 && (
          <section className="planner-intro">
            <div className="planner-intro-content">
              <div className="planner-intro-icon">
                <Sparkles size={22} strokeWidth={1.8} />
              </div>
              <div>
                <div className="planner-eyebrow">PERSONALIZED PLANNING</div>
                <h2 className="planner-intro-title">Build your Calbayog adventure</h2>
                <p className="planner-intro-text">
                  Pick how many days you have and we'll suggest nearby stops grouped
                  by location. No account needed to start.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* TRIP PROFILE */}

        {days.length > 0 &&
          (preferences.travelDateStart || preferences.selectedInterests.length > 0) && (
            <section className="preference-section">
              <div className="preference-main">
                <div className="planner-eyebrow">YOUR TRIP PROFILE</div>

                <h2 className="preference-title">
                  {preferences.travelDateStart && preferences.travelDateEnd
                    ? `${formatDate(preferences.travelDateStart)} – ${formatDate(
                        preferences.travelDateEnd,
                      )}`
                    : "Trip details"}
                </h2>

                <div className="preference-tags">
                  <span className="preference-tag">
                    <Users size={13} strokeWidth={1.8} />
                    {preferences.groupSize} traveler{preferences.groupSize !== 1 ? "s" : ""}
                  </span>
                  <span className="preference-tag">{preferences.groupType}</span>
                  <span className="preference-tag">{preferences.travelPace} pace</span>
                  <span className="preference-tag">{preferences.budget}</span>
                </div>

                {preferences.selectedInterests.length > 0 && (
                  <div className="interest-summary">
                    {preferences.selectedInterests.map((interest) => (
                      <span key={interest} className="interest-summary-item">
                        {interestOptions.find((item) => item.value === interest)?.label ||
                          interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Button
                variant="outline-primary"
                onClick={openCustomizer}
                className="planner-secondary-button"
              >
                <Pencil size={14} strokeWidth={1.9} />
                Edit Preferences
              </Button>
            </section>
          )}

        {generated && days.length > 0 && (
          <div className="planner-success-message">
            <div className="planner-success-icon">
              <Check size={18} strokeWidth={2} />
            </div>
            <div>
              <strong>Your itinerary is ready!</strong>
              <span>
                Stops are grouped by location to keep travel short. Drag to reorder,
                or move a stop to another day.
              </span>
            </div>
          </div>
        )}

        {/* RESULTS BAR */}

        {days.length > 0 && (
          <div className="planner-results-bar">
            <div className="planner-results-left">
              <div className="planner-results-icon">
                <CalendarDays size={18} strokeWidth={1.8} />
              </div>
              <div>
                <div className="planner-results-label">YOUR ITINERARY</div>
                <div className="planner-results-count">
                  <strong>{totalDays}</strong> day{totalDays !== 1 ? "s" : ""} ·{" "}
                  <strong>{totalDests}</strong> stop{totalDests !== 1 ? "s" : ""} ·{" "}
                  <strong>~{formatDuration(totalTravelMin)}</strong> travel
                </div>
              </div>
            </div>

            <div className="planner-results-right">
              <span className={`planner-sync planner-sync-${syncState}`}>{syncLabel}</span>

              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowClearModal(true)}
                className="planner-clear-button"
              >
                <Trash2 size={13} strokeWidth={1.8} />
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* ACTIONS */}

        <div className="planner-actions">
          <Button onClick={openCustomizer} className="planner-action-primary">
            <Sparkles size={15} strokeWidth={2} />
            Customize Trip
          </Button>

          <Button onClick={addDay} variant="outline-primary" className="planner-action-button">
            <Plus size={15} strokeWidth={2} />
            Add Day
          </Button>

          <Button
            variant="outline-primary"
            onClick={exportPDF}
            disabled={totalDests === 0}
            className="planner-action-button"
          >
            <FileDown size={15} strokeWidth={1.9} />
            Export PDF
          </Button>
        </div>

        {/* TRAVEL SETTINGS */}

        {days.length > 0 && (
          <div className="planner-settings">
            <div className="planner-setting">
              <label htmlFor="planner-start-time">
                <Clock size={13} strokeWidth={2} /> Start each day at
              </label>
              <input
                id="planner-start-time"
                type="time"
                value={settings.dayStart}
                onChange={(event) =>
                  setSettings((previous) => ({
                    ...previous,
                    dayStart: event.target.value || "08:00",
                  }))
                }
              />
            </div>

            <div className="planner-setting">
              <label htmlFor="planner-transport">
                <Car size={13} strokeWidth={2} /> Getting around by
              </label>
              <select
                id="planner-transport"
                value={settings.transport}
                onChange={(event) =>
                  setSettings((previous) => ({ ...previous, transport: event.target.value }))
                }
              >
                {TRANSPORT_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}

        {days.length === 0 ? (
          <section className="planner-empty-state">
            <div className="planner-empty-icon">
              <CalendarDays size={32} strokeWidth={1.5} />
            </div>

            <div className="planner-empty-eyebrow">YOUR TRIP STARTS HERE</div>
            <h2>How many days will you stay?</h2>
            <p>
              Tap a length for an instant plan. You can change anything afterwards,
              or customize your interests, pace, and dates first.
            </p>

            <div className="planner-quick-grid">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="planner-quick-button"
                  onClick={() => quickPlan(n)}
                  disabled={destinations.length === 0}
                >
                  <Zap size={15} strokeWidth={2} />
                  <strong>{n}</strong>
                  <span>day{n !== 1 ? "s" : ""}</span>
                </button>
              ))}
            </div>

            <div className="planner-empty-actions">
              <Button onClick={openCustomizer} className="planner-action-primary">
                <Sparkles size={15} />
                Customize My Trip
              </Button>

              <Button
                variant="outline-primary"
                onClick={addDay}
                className="planner-action-button"
              >
                <Plus size={15} />
                Create Manually
              </Button>
            </div>
          </section>
        ) : (
          /* DAY CARDS */

          <Row className="planner-days-grid">
            {days.map((day, dayIndex) => {
              const schedule = schedules[dayIndex];
              const dayColor =
                day.destinations.length > 0 ? getDestColor(day.destinations[0]) : CALBAYOG_BLUE;
              const otherDays = days
                .filter((item) => item.id !== day.id)
                .map((item) => ({
                  id: item.id,
                  label: `Day ${item.day}${item.date ? ` · ${formatDate(item.date)}` : ""}`,
                }));

              // Smart suggestions: lunch near the 2nd stop, a place to stay near the last stop.
              const dayKinds = day.destinations.map((stop) => getStopKind(stop));
              const lunchAnchor = day.destinations[1] || day.destinations[0];
              const lunchSuggestion =
                lunchAnchor && !dayKinds.includes("food")
                  ? nearestOf(lunchAnchor, foodPlaces, usedDestinationIds, MAX_MEAL_KM)
                  : null;
              const stayAnchor = day.destinations[day.destinations.length - 1];
              const staySuggestion =
                stayAnchor &&
                day.destinations.length > 1 &&
                dayIndex < days.length - 1 &&
                !dayKinds.includes("stay")
                  ? nearestOf(stayAnchor, stayPlaces, usedDestinationIds, MAX_STAY_KM)
                  : null;
              const lunchKm = lunchSuggestion
                ? getTravelLeg(lunchAnchor, lunchSuggestion, speedKmh)?.km
                : undefined;
              const stayKm = staySuggestion
                ? getTravelLeg(stayAnchor, staySuggestion, speedKmh)?.km
                : undefined;

              return (
                <Col xs={12} md={6} lg={4} key={day.id} className="planner-day-col">
                  <Card className="planner-day-card">
                    <div className="planner-day-header" style={{ borderTopColor: dayColor }}>
                      <div>
                        <div className="planner-day-eyebrow">ITINERARY</div>
                        <h3>Day {day.day}</h3>
                        {day.date && (
                          <div className="planner-day-date">
                            <CalendarDays size={12} strokeWidth={1.8} />
                            {formatDate(day.date)}
                          </div>
                        )}
                      </div>

                      <div className="planner-day-header-actions">
                        <span className="planner-stop-count">
                          {day.destinations.length} stop
                          {day.destinations.length !== 1 ? "s" : ""}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeDay(day.id)}
                          title="Remove this day"
                          aria-label={`Remove day ${day.day}`}
                          className="planner-day-delete"
                        >
                          <Trash2 size={14} strokeWidth={1.8} />
                        </button>
                      </div>
                    </div>

                    <Card.Body className="planner-day-body">
                      {day.destinations.length > 0 && (
                        <div className="planner-day-summary">
                          <span>
                            <Clock size={12} strokeWidth={2} />
                            {formatClock(dayStartMinutes)} – {formatClock(schedule.endTime)}
                          </span>
                          <span>
                            <Car size={12} strokeWidth={2} />
                            {formatDuration(schedule.totalTravelMin)} travel
                            {schedule.totalKm > 0 ? ` · ${schedule.totalKm} km` : ""}
                          </span>
                          {schedule.isTooLong && (
                            <span className="planner-warning">
                              Long day. Consider removing a stop or splitting it.
                            </span>
                          )}
                        </div>
                      )}

                      {day.destinations.length > 0 ? (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => handleDragEnd(event, day.id)}
                        >
                          <SortableContext
                            items={day.destinations.map((destination) => destination.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {schedule.stops.map((stop, index) => (
                              <React.Fragment key={stop.dest.id}>
                                {index > 0 && stop.travelFromPrev && (
                                  <div className="planner-travel-leg">
                                    <Car size={11} strokeWidth={2} />~
                                    {formatDuration(stop.travelFromPrev.minutes)} ·{" "}
                                    {stop.travelFromPrev.km} km
                                  </div>
                                )}

                                <SortableItem
                                  id={stop.dest.id}
                                  dest={stop.dest}
                                  index={index}
                                  arrive={formatClock(stop.arrive)}
                                  otherDays={otherDays}
                                  onMove={(toDayId) => moveDest(day.id, stop.dest.id, toDayId)}
                                  onRemove={() => removeDestFromDay(day.id, stop.dest.id)}
                                />
                              </React.Fragment>
                            ))}
                          </SortableContext>
                        </DndContext>
                      ) : (
                        <div className="planner-no-stops">
                          <div className="planner-no-stops-icon">
                            <MapPin size={22} strokeWidth={1.6} />
                          </div>
                          <strong>No attractions yet</strong>
                          <span>Add places you want to visit</span>
                        </div>
                      )}

                      {day.notes && (
                        <div className="planner-day-note">
                          <span className="planner-day-note-icon">
                            <SlidersHorizontal size={13} strokeWidth={1.8} />
                          </span>
                          <span>{day.notes}</span>
                        </div>
                      )}

                      {(lunchSuggestion || staySuggestion) && (
                        <div className="planner-suggest">
                          {lunchSuggestion && (
                            <button
                              type="button"
                              className="planner-suggest-item planner-suggest-food"
                              onClick={() => addSuggested(day.id, lunchSuggestion)}
                            >
                              <Utensils size={14} strokeWidth={2} />
                              <span>
                                <small>Lunch nearby</small>
                                <strong>{lunchSuggestion.name}</strong>
                                {lunchKm !== undefined && <em>{lunchKm} km away</em>}
                              </span>
                              <Plus size={15} strokeWidth={2} />
                            </button>
                          )}

                          {staySuggestion && (
                            <button
                              type="button"
                              className="planner-suggest-item planner-suggest-stay"
                              onClick={() => addSuggested(day.id, staySuggestion)}
                            >
                              <BedDouble size={14} strokeWidth={2} />
                              <span>
                                <small>Stay overnight nearby</small>
                                <strong>{staySuggestion.name}</strong>
                                {stayKm !== undefined && <em>{stayKm} km away</em>}
                              </span>
                              <Plus size={15} strokeWidth={2} />
                            </button>
                          )}
                        </div>
                      )}

                      <Button
                        variant="outline-primary"
                        className="planner-add-attraction"
                        onClick={() => openPicker(day.id)}
                      >
                        <CirclePlus size={15} strokeWidth={1.9} />
                        Add Place
                      </Button>

                      {day.destinations.length > 0 && (
                        <div className="planner-day-tools">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMapDayId(openMapDayId === day.id ? null : day.id)
                            }
                          >
                            <MapIcon size={13} strokeWidth={2} />
                            {openMapDayId === day.id ? "Hide Map" : "View Map"}
                          </button>
                        </div>
                      )}

                      {openMapDayId === day.id && (
                        <div className="mt-2">
                          <DayRouteMap destinations={day.destinations} />
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        {/* TIPS */}

        {days.length > 0 && (
          <div className="planner-tip">
            <div className="planner-tip-icon">
              <GripVertical size={16} strokeWidth={1.8} />
            </div>
            <div>
              <strong>Planning tips</strong>
              <span>
                Drag the handle to reorder stops. Travel times are estimates based on
                distance and the transport you choose, so allow extra time on rainy
                days or rough roads. {!isLoggedIn && "Log in to save this plan to your account."}
              </span>
            </div>
          </div>
        )}
      </Container>

      {/* =====================================================
          CUSTOMIZER MODAL
      ===================================================== */}

      <Modal
        show={showCustomizer}
        onHide={() => setShowCustomizer(false)}
        centered
        scrollable
        size="lg"
        className="planner-modal"
      >
        <Modal.Header closeButton className="planner-modal-header">
          <div>
            <div className="planner-modal-eyebrow">TRIP CUSTOMIZER</div>
            <Modal.Title className="planner-modal-title">Customize Your Trip</Modal.Title>
            <p className="planner-modal-subtitle">
              Tell us what kind of Calbayog experience you want.
            </p>
          </div>
        </Modal.Header>

        <Modal.Body className="planner-modal-body">
          {customizerError && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setCustomizerError("")}
              className="planner-error"
            >
              {customizerError}
            </Alert>
          )}

          {/* DATES */}

          <section className="customizer-section">
            <div className="customizer-section-heading">
              <div className="customizer-section-icon">
                <CalendarDays size={17} strokeWidth={1.8} />
              </div>
              <div>
                <h4>When are you traveling?</h4>
                <p>Choose the dates you'd like to explore Calbayog.</p>
              </div>
            </div>

            <Row className="g-3">
              <Col xs={12} md={6}>
                <Form.Label className="planner-form-label">Start date</Form.Label>
                <Form.Control
                  type="date"
                  value={preferences.travelDateStart}
                  onChange={(event) => {
                    const start = event.target.value;
                    updatePreference("travelDateStart", start);
                    // keep the end date valid
                    if (start && preferences.travelDateEnd && preferences.travelDateEnd < start) {
                      updatePreference("travelDateEnd", start);
                    }
                  }}
                  className="planner-form-control"
                />
              </Col>

              <Col xs={12} md={6}>
                <Form.Label className="planner-form-label">End date</Form.Label>
                <Form.Control
                  type="date"
                  min={preferences.travelDateStart || undefined}
                  value={preferences.travelDateEnd}
                  onChange={(event) => updatePreference("travelDateEnd", event.target.value)}
                  className="planner-form-control"
                />
              </Col>
            </Row>

            {tripDays > 0 && (
              <div className="planner-info-strip">
                <CalendarDays size={14} strokeWidth={1.8} />
                That's a <strong>{tripDays}-day</strong> trip.
              </div>
            )}
          </section>

          {/* TRAVELERS */}

          <section className="customizer-section">
            <div className="customizer-section-heading">
              <div className="customizer-section-icon">
                <Users size={17} strokeWidth={1.8} />
              </div>
              <div>
                <h4>Who's traveling?</h4>
                <p>This helps us keep the plan appropriate for your group.</p>
              </div>
            </div>

            <Row className="g-2 mb-3">
              {travelerTypes.map((type) => {
                const selected = preferences.groupType === type.value;
                return (
                  <Col xs={6} md={4} key={type.value}>
                    <button
                      type="button"
                      onClick={() => updatePreference("groupType", type.value)}
                      className={`planner-option-card ${selected ? "planner-option-card-active" : ""}`}
                    >
                      <span className="planner-option-title">{type.label}</span>
                      <small>{type.description}</small>
                      {selected && (
                        <span className="planner-option-check">
                          <Check size={12} />
                        </span>
                      )}
                    </button>
                  </Col>
                );
              })}
            </Row>

            <Form.Label className="planner-form-label">Number of travelers</Form.Label>
            <Form.Control
              type="number"
              min={1}
              max={50}
              value={preferences.groupSize}
              onChange={(event) =>
                updatePreference("groupSize", Math.max(1, Number(event.target.value) || 1))
              }
              className="planner-form-control planner-number-control"
            />
          </section>

          {/* INTERESTS */}

          <section className="customizer-section">
            <div className="customizer-section-heading">
              <div className="customizer-section-icon">
                <Heart size={17} strokeWidth={1.8} />
              </div>
              <div>
                <h4>What are you interested in?</h4>
                <p>Optional. Skip this to get our most popular places.</p>
              </div>
            </div>

            <div className="planner-interest-grid">
              {interestOptions.map((interest) => {
                const selected = preferences.selectedInterests.includes(interest.value);
                const Icon = interest.icon;

                return (
                  <button
                    type="button"
                    key={interest.value}
                    onClick={() => toggleInterest(interest.value)}
                    className={`planner-interest-option ${
                      selected ? "planner-interest-option-active" : ""
                    }`}
                  >
                    <Icon size={15} strokeWidth={1.8} />
                    <span>{interest.label}</span>
                    {selected && <Check size={13} strokeWidth={2} />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* PACE */}

          <section className="customizer-section">
            <div className="customizer-section-heading">
              <div className="customizer-section-icon">
                <Compass size={17} strokeWidth={1.8} />
              </div>
              <div>
                <h4>What's your travel pace?</h4>
                <p>We'll use this to decide how many stops to suggest each day.</p>
              </div>
            </div>

            <Row className="g-2">
              {paceOptions.map((pace) => {
                const selected = preferences.travelPace === pace.value;
                return (
                  <Col xs={12} md={4} key={pace.value}>
                    <button
                      type="button"
                      onClick={() => updatePreference("travelPace", pace.value)}
                      className={`planner-option-card planner-pace-option ${
                        selected ? "planner-option-card-active" : ""
                      }`}
                    >
                      <span className="planner-option-title">{pace.label}</span>
                      <small>{pace.description}</small>
                      <span className="planner-option-stops">{pace.stopsPerDay} stops/day</span>
                      {selected && (
                        <span className="planner-option-check">
                          <Check size={12} />
                        </span>
                      )}
                    </button>
                  </Col>
                );
              })}
            </Row>
          </section>

          {/* BUDGET */}

          <section className="customizer-section">
            <div className="customizer-section-heading">
              <div className="customizer-section-icon">
                <WalletCards size={17} strokeWidth={1.8} />
              </div>
              <div>
                <h4>What's your budget preference?</h4>
                <p>"Budget-friendly" favors free or low-cost attractions.</p>
              </div>
            </div>

            <Row className="g-2">
              {budgetOptions.map((budget) => {
                const selected = preferences.budget === budget.value;
                return (
                  <Col xs={12} md={4} key={budget.value}>
                    <button
                      type="button"
                      onClick={() => updatePreference("budget", budget.value)}
                      className={`planner-option-card ${selected ? "planner-option-card-active" : ""}`}
                    >
                      <span className="planner-option-title">{budget.label}</span>
                      <small>{budget.description}</small>
                      {selected && (
                        <span className="planner-option-check">
                          <Check size={12} />
                        </span>
                      )}
                    </button>
                  </Col>
                );
              })}
            </Row>
          </section>

          {/* SPECIAL REQUESTS */}

          <section className="customizer-section">
            <div className="customizer-section-heading">
              <div className="customizer-section-icon">
                <Pencil size={17} strokeWidth={1.8} />
              </div>
              <div>
                <h4>Anything else?</h4>
                <p>Optional notes saved with your trip (not used to pick places yet).</p>
              </div>
            </div>

            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Example: We are traveling with children, or we'd like more time for photos..."
              value={preferences.specialRequests}
              onChange={(event) => updatePreference("specialRequests", event.target.value)}
              className="planner-textarea"
            />
          </section>

          <div className="planner-generator-info">
            <Sparkles size={15} strokeWidth={1.8} />
            <span>
              Your itinerary is built from the attractions in the Calbayog tourism
              database and grouped by location. You can edit it afterwards.
            </span>
          </div>
        </Modal.Body>

        <Modal.Footer className="planner-modal-footer">
          <Button
            variant="outline-secondary"
            onClick={() => setShowCustomizer(false)}
            className="planner-modal-cancel"
          >
            Cancel
          </Button>

          <Button
            variant="outline-primary"
            onClick={savePreferences}
            className="planner-modal-save"
          >
            {customizationSaved ? (
              <>
                <Check size={15} />
                Saved
              </>
            ) : (
              <>
                <Download size={15} />
                Save Preferences
              </>
            )}
          </Button>

          <Button
            onClick={() => generateItinerary()}
            disabled={destinations.length === 0}
            className="planner-modal-generate"
          >
            <Sparkles size={15} strokeWidth={2} />
            Generate My Itinerary
          </Button>
        </Modal.Footer>
      </Modal>

      {/* =====================================================
          ATTRACTION PICKER
      ===================================================== */}

      <Modal
        show={showPicker}
        onHide={() => setShowPicker(false)}
        centered
        scrollable
        size="lg"
        className="planner-modal"
      >
        <Modal.Header closeButton className="planner-modal-header">
          <div>
            <div className="planner-modal-eyebrow">
              ADD A STOP{activeDay ? ` · DAY ${activeDay.day}` : ""}
            </div>
            <Modal.Title className="planner-modal-title">Add a Place</Modal.Title>
            <p className="planner-modal-subtitle">
              {lastStop
                ? `Showing distance from ${lastStop.name}, your last stop that day.`
                : "Choose a place to add to your itinerary."}
            </p>
          </div>
        </Modal.Header>

        <Modal.Body className="planner-picker-body">
          {availableKinds.length > 1 && (
            <div className="planner-kind-tabs">
              {availableKinds.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className={pickerKind === kind ? "active" : ""}
                  onClick={() => {
                    setPickerKind(kind);
                    setCategory("All");
                    setSearch("");
                  }}
                >
                  <KindIcon kind={kind} size={14} />
                  {KIND_TAB_LABELS[kind]}
                </button>
              ))}
            </div>
          )}

          <div className="planner-picker-toolbar">
            <div className="planner-search-wrapper">
              <Search size={16} strokeWidth={1.8} />
              <Form.Control
                type="search"
                placeholder={`Search ${KIND_TAB_LABELS[pickerKind].toLowerCase()}...`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="planner-search-input"
              />
            </div>

            <div
              className="planner-category-scroll"
              style={categories.length <= 2 ? { display: "none" } : undefined}
            >
              {categories.map((cat) => {
                const active = category === cat;
                const color = categoryColors[cat] || CALBAYOG_BLUE;

                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`planner-picker-category ${
                      active ? "planner-picker-category-active" : ""
                    }`}
                    style={
                      active
                        ? { borderColor: color, color, background: tint(color) }
                        : undefined
                    }
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="planner-picker-results">
            <span>
              <strong>{filteredDestinations.length}</strong> place
              {filteredDestinations.length !== 1 ? "s" : ""} found
            </span>

            {lastStop && (
              <label className="planner-picker-sort">
                <input
                  type="checkbox"
                  checked={nearestFirst}
                  onChange={(event) => setNearestFirst(event.target.checked)}
                />
                Nearest first
              </label>
            )}

            {justAdded && (
              <span className="planner-picker-added">
                <Check size={12} /> Added {justAdded}
              </span>
            )}
          </div>

          {filteredDestinations.length === 0 ? (
            <div className="planner-picker-empty">
              <div className="planner-picker-empty-icon">
                <Search size={26} strokeWidth={1.5} />
              </div>
              <h4>No places found</h4>
              <p>Try another search term or category.</p>
            </div>
          ) : (
            <Row className="g-3">
              {filteredDestinations.map((dest) => {
                const d: any = dest;
                const alreadyUsed = usedDestinationIds.has(dest.id);
                const color = getDestColor(dest);
                const leg = lastStop ? getTravelLeg(lastStop, dest, speedKmh) : null;
                const typeLabel =
                  d.attraction_type === "Other"
                    ? d.other_attraction_type || "Other"
                    : d.attraction_type || dest.category;

                return (
                  <Col xs={12} md={6} key={dest.id}>
                    <button
                      type="button"
                      disabled={alreadyUsed}
                      onClick={() => {
                        if (!alreadyUsed) addDestToDay(dest);
                      }}
                      className={`planner-picker-card ${
                        alreadyUsed ? "planner-picker-card-used" : ""
                      }`}
                    >
                      {dest.images?.[0] ? (
                        <img
                          src={dest.images[0]}
                          alt={dest.name}
                          className="planner-picker-image"
                        />
                      ) : (
                        <div className="planner-picker-image planner-picker-placeholder">
                          <KindIcon kind={getStopKind(dest)} size={21} />
                        </div>
                      )}

                      <div className="planner-picker-content">
                        <strong>{dest.name}</strong>

                        <span
                          className="planner-picker-tag"
                          style={{ color, background: tint(color) }}
                        >
                          {typeLabel}
                        </span>

                        {leg && (
                          <span className="planner-picker-travel">
                            <Car size={11} strokeWidth={2} />~{formatDuration(leg.minutes)} ·{" "}
                            {leg.km} km away
                          </span>
                        )}

                        {dest.location_address && (
                          <span className="planner-picker-location">
                            <MapPin size={11} strokeWidth={1.8} />
                            {dest.location_address}
                          </span>
                        )}
                      </div>

                      <span
                        className={`planner-picker-add ${
                          alreadyUsed ? "planner-picker-add-used" : ""
                        }`}
                      >
                        {alreadyUsed ? <Check size={16} /> : <Plus size={17} />}
                      </span>
                    </button>

                    {alreadyUsed && (
                      <div className="planner-already-used">Already in itinerary</div>
                    )}
                  </Col>
                );
              })}
            </Row>
          )}
        </Modal.Body>

        <Modal.Footer className="planner-modal-footer">
          <Button onClick={() => setShowPicker(false)} className="planner-modal-generate">
            <Check size={15} />
            Done
          </Button>
        </Modal.Footer>
      </Modal>

      {/* =====================================================
          CLEAR CONFIRMATION
      ===================================================== */}

      <Modal
        show={showClearModal}
        onHide={() => setShowClearModal(false)}
        centered
        className="planner-modal"
      >
        <Modal.Header closeButton className="planner-modal-header">
          <div>
            <div className="planner-modal-eyebrow">ITINERARY</div>
            <Modal.Title className="planner-modal-title">Clear Itinerary?</Modal.Title>
          </div>
        </Modal.Header>

        <Modal.Body className="planner-confirm-body">
          <div className="planner-confirm-icon">
            <Trash2 size={24} strokeWidth={1.6} />
          </div>
          <h4>Remove your entire itinerary?</h4>
          <p>
            This will remove <strong>{totalDays}</strong> day{totalDays !== 1 ? "s" : ""} and{" "}
            <strong>{totalDests}</strong> attraction{totalDests !== 1 ? "s" : ""} from your
            current plan.
          </p>
        </Modal.Body>

        <Modal.Footer className="planner-modal-footer">
          <Button
            variant="outline-secondary"
            onClick={() => setShowClearModal(false)}
            className="planner-modal-cancel"
          >
            Cancel
          </Button>

          <Button variant="danger" onClick={clearItinerary} className="planner-delete-confirm">
            <Trash2 size={15} />
            Yes, Clear Itinerary
          </Button>
        </Modal.Footer>
      </Modal>

      {/* =====================================================
          STYLES
      ===================================================== */}

      <style>{`
        @font-face {
          font-family: "Barabara";
          src: url("/fonts/BARABARA-final.otf") format("opentype");
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        .itinerary-page { min-height: 100vh; background: #fff; color: #171a18; }
        .itinerary-header { width: 100%; background: #fff; padding: 30px 20px 18px; }
        .itinerary-header-inner { width: 100%; max-width: 1240px; margin: 0 auto; }
        .itinerary-title {
          margin: 0; font-family: "Barabara", sans-serif !important;
          font-size: clamp(1.65rem, 2.8vw, 2.4rem); font-weight: 400;
          line-height: 0.95; letter-spacing: 0.015em; color: ${CALBAYOG_BLUE};
        }
        .itinerary-subtitle {
          max-width: 590px; margin: 7px 0 0;
          font-family: "Nunito", "Poppins", "Segoe UI", sans-serif;
          font-size: 0.81rem; line-height: 1.55; font-weight: 500; color: #737b76;
        }
        .itinerary-container { width: 100%; max-width: 1240px !important; padding: 0 0 60px; margin: 0 auto; }

        /* INTRO */
        .planner-intro {
          display: flex; align-items: center; justify-content: space-between; gap: 25px;
          padding: 20px 22px; margin: 5px 0 24px; border: 1px solid #edf0ee;
          border-radius: 18px; background: #fff; box-shadow: 0 4px 18px rgba(20,30,24,.045);
        }
        .planner-intro-content { display: flex; align-items: flex-start; gap: 14px; min-width: 0; }
        .planner-intro-icon {
          width: 46px; height: 46px; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; border-radius: 14px; color: ${CALBAYOG_BLUE}; background: ${SOFT_BLUE};
        }
        .planner-eyebrow {
          margin-bottom: 4px; font-family: "Nunito", sans-serif; font-size: .61rem; line-height: 1.2;
          font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: #929a95;
        }
        .planner-intro-title { margin: 0; font-family: "Poppins", sans-serif; font-size: 1.02rem; font-weight: 700; color: #202521; }
        .planner-intro-text { max-width: 650px; margin: 5px 0 0; font-family: "Nunito", sans-serif; font-size: .75rem; line-height: 1.55; color: #7c8580; }

        /* PREFERENCES */
        .preference-section {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 20px;
          padding: 17px 20px; margin-bottom: 23px; border: 1px solid #edf0ee; border-radius: 16px; background: #fafbfb;
        }
        .preference-title { margin: 2px 0 9px; font-family: "Poppins", sans-serif; font-size: .95rem; font-weight: 700; color: #242a26; }
        .preference-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .preference-tag {
          display: inline-flex; align-items: center; gap: 5px; min-height: 27px; padding: 5px 9px;
          border: 1px solid #e5e9e6; border-radius: 999px; background: #fff;
          font-family: "Nunito", sans-serif; font-size: .65rem; font-weight: 700; color: #626b65;
        }
        .interest-summary { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .interest-summary-item { font-family: "Nunito", sans-serif; font-size: .65rem; font-weight: 700; color: ${CALBAYOG_BLUE}; }
        .interest-summary-item:not(:last-child)::after { content: "•"; margin-left: 8px; color: #b2b8b4; }
        .planner-secondary-button {
          display: inline-flex !important; align-items: center; gap: 6px; flex-shrink: 0;
          border-radius: 999px !important; padding: 7px 12px !important; border-color: #dfe3e1 !important;
          color: ${CALBAYOG_BLUE} !important; background: #fff !important;
          font-family: "Nunito", sans-serif; font-size: .66rem !important; font-weight: 800 !important;
        }
        .planner-secondary-button:hover { border-color: ${CALBAYOG_BLUE} !important; background: ${SOFT_BLUE} !important; }

        /* SUCCESS */
        .planner-success-message {
          display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; margin-bottom: 21px;
          border: 1px solid #dfeee5; border-radius: 13px; background: #f7fbf8;
        }
        .planner-success-icon {
          width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; border-radius: 9px; color: #1a7a4a; background: #e8f5ee;
        }
        .planner-success-message strong, .planner-success-message span { display: block; font-family: "Nunito", sans-serif; }
        .planner-success-message strong { margin-bottom: 2px; font-size: .72rem; color: #28302b; }
        .planner-success-message span { font-size: .68rem; line-height: 1.45; color: #78817b; }

        /* RESULTS BAR */
        .planner-results-bar {
          display: flex; align-items: center; justify-content: space-between; gap: 15px; flex-wrap: wrap;
          margin-bottom: 16px; padding: 11px 2px; border-top: 1px solid #f0f2f0; border-bottom: 1px solid #f0f2f0;
        }
        .planner-results-left { display: flex; align-items: center; gap: 10px; }
        .planner-results-icon {
          width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
          border-radius: 10px; color: ${CALBAYOG_BLUE}; background: ${SOFT_BLUE};
        }
        .planner-results-label { font-family: "Nunito", sans-serif; font-size: .61rem; font-weight: 800; letter-spacing: .07em; color: #929a95; }
        .planner-results-count { margin-top: 2px; font-family: "Poppins", sans-serif; font-size: .73rem; font-weight: 600; color: #252b27; }
        .planner-results-right { display: flex; align-items: center; gap: 10px; }
        .planner-sync { font-family: "Nunito", sans-serif; font-size: .64rem; font-weight: 700; color: #858d88; }
        .planner-sync-saved { color: #1a7a4a; }
        .planner-sync-error { color: #c64a4a; }
        .planner-clear-button {
          display: inline-flex !important; align-items: center; gap: 5px; border-radius: 999px !important;
          padding: 5px 10px !important; font-family: "Nunito", sans-serif; font-size: .64rem !important; font-weight: 800 !important;
        }

        /* ACTIONS */
        .planner-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; margin-bottom: 18px; }
        .planner-action-primary, .planner-action-button, .planner-action-link {
          display: inline-flex !important; align-items: center; justify-content: center; gap: 6px;
          min-height: 35px; border-radius: 999px !important; padding: 7px 13px !important;
          font-family: "Nunito", sans-serif; font-size: .67rem !important; font-weight: 800 !important;
          text-decoration: none !important;
          transition: color .2s ease, background .2s ease, border-color .2s ease, box-shadow .2s ease;
        }
        .planner-action-primary { border: 1px solid ${CALBAYOG_BLUE} !important; color: #fff !important; background: ${CALBAYOG_BLUE} !important; }
        .planner-action-primary:hover { background: #252982 !important; }
        .planner-action-button { border-color: #dfe3e1 !important; color: #626b65 !important; background: #fff !important; }
        .planner-action-button:hover:not(:disabled) { border-color: ${CALBAYOG_BLUE} !important; color: ${CALBAYOG_BLUE} !important; background: ${SOFT_BLUE} !important; }
        .planner-action-link { border: 1px solid #dfe3e1; color: #626b65; background: #fff; }
        .planner-action-link:hover { border-color: ${CALBAYOG_BLUE}; color: ${CALBAYOG_BLUE}; background: ${SOFT_BLUE}; }

        /* SETTINGS */
        .planner-settings {
          display: flex; flex-wrap: wrap; gap: 10px 18px; margin-bottom: 22px; padding: 11px 14px;
          border: 1px solid #edf0ee; border-radius: 14px; background: #fafbfb;
        }
        .planner-setting { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .planner-setting label {
          display: inline-flex; align-items: center; gap: 5px; margin: 0;
          font-family: "Nunito", sans-serif; font-size: .66rem; font-weight: 800; color: #616a64;
        }
        .planner-setting input, .planner-setting select {
          min-height: 32px; padding: 4px 9px; border: 1px solid #dfe4e1; border-radius: 9px; background: #fff;
          font-family: "Nunito", sans-serif; font-size: .7rem; font-weight: 700; color: #333a35;
        }
        .planner-setting input:focus, .planner-setting select:focus {
          outline: none; border-color: ${CALBAYOG_BLUE}; box-shadow: 0 0 0 3px rgba(45,49,149,.08);
        }

        /* EMPTY STATE */
        .planner-empty-state { padding: 52px 25px; text-align: center; border: 1px solid #edf1ee; border-radius: 20px; background: #fafcfb; }
        .planner-empty-icon {
          width: 68px; height: 68px; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 15px; border-radius: 20px; color: ${CALBAYOG_BLUE}; background: ${SOFT_BLUE};
        }
        .planner-empty-eyebrow { margin-bottom: 5px; font-family: "Nunito", sans-serif; font-size: .61rem; font-weight: 800; letter-spacing: .1em; color: #929a95; }
        .planner-empty-state h2 { margin: 0 0 7px; font-family: "Poppins", sans-serif; font-size: 1.05rem; font-weight: 700; color: #202521; }
        .planner-empty-state p { max-width: 500px; margin: 0 auto 19px; font-family: "Nunito", sans-serif; font-size: .75rem; line-height: 1.55; color: #7e8781; }
        .planner-quick-grid { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
        .planner-quick-button {
          display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 88px; padding: 12px 14px;
          border: 1px solid #dfe3e1; border-radius: 16px; background: #fff; color: ${CALBAYOG_BLUE}; cursor: pointer;
          font-family: "Nunito", sans-serif; transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
        }
        .planner-quick-button strong { font-family: "Poppins", sans-serif; font-size: 1.25rem; line-height: 1; }
        .planner-quick-button span { font-size: .64rem; font-weight: 700; color: #7c8580; }
        .planner-quick-button:hover:not(:disabled) { transform: translateY(-2px); border-color: ${CALBAYOG_BLUE}; box-shadow: 0 8px 20px rgba(45,49,149,.12); }
        .planner-quick-button:disabled { opacity: .55; cursor: wait; }
        .planner-empty-actions { display: flex; justify-content: center; flex-wrap: wrap; gap: 7px; }

        /* DAY GRID */
        .planner-days-grid { row-gap: 24px !important; }
        .planner-day-col { display: flex; }
        .planner-day-card {
          width: 100%; border: 1px solid #edf0ee !important; border-radius: 18px !important; background: #fff !important;
          overflow: hidden; box-shadow: 0 4px 16px rgba(20,30,24,.055) !important;
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .planner-day-card:hover { transform: translateY(-2px); box-shadow: 0 9px 25px rgba(20,30,24,.09) !important; }
        .planner-day-header {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; min-height: 92px;
          padding: 15px 16px 13px; border-top: 3px solid ${CALBAYOG_BLUE}; border-bottom: 1px solid #f0f2f0; background: #fff;
        }
        .planner-day-eyebrow { margin-bottom: 3px; font-family: "Nunito", sans-serif; font-size: .59rem; font-weight: 800; letter-spacing: .09em; color: #929a95; }
        .planner-day-header h3 { margin: 0; font-family: "Poppins", sans-serif; font-size: 1rem; font-weight: 700; color: #242a26; }
        .planner-day-date { display: flex; align-items: center; gap: 4px; margin-top: 4px; font-family: "Nunito", sans-serif; font-size: .65rem; color: #858d88; }
        .planner-day-header-actions { display: flex; align-items: center; gap: 7px; }
        .planner-stop-count {
          display: inline-flex; align-items: center; min-height: 25px; padding: 5px 8px; border: 1px solid #e5e9e6;
          border-radius: 999px; background: #fafbfb; font-family: "Nunito", sans-serif; font-size: .62rem; font-weight: 800; color: #737b76; white-space: nowrap;
        }
        .planner-day-delete {
          width: 29px; height: 29px; display: flex; align-items: center; justify-content: center; border: 1px solid #eceeed;
          border-radius: 9px; color: #8b938e; background: #fff; cursor: pointer; transition: color .2s ease, background .2s ease, border-color .2s ease;
        }
        .planner-day-delete:hover { border-color: #e4baba; color: #c64a4a; background: #fff7f7; }
        .planner-day-body { padding: 14px !important; }

        /* DAY SUMMARY + TRAVEL LEG */
        .planner-day-summary {
          display: flex; flex-wrap: wrap; gap: 4px 12px; margin-bottom: 11px; padding: 8px 10px; border-radius: 10px;
          background: ${SOFT_BLUE}; font-family: "Nunito", sans-serif; font-size: .63rem; font-weight: 800; color: ${CALBAYOG_BLUE};
        }
        .planner-day-summary > span { display: inline-flex; align-items: center; gap: 5px; }
        .planner-day-summary .planner-warning { flex-basis: 100%; color: #b3541e; font-weight: 700; }
        .planner-travel-leg {
          display: flex; align-items: center; gap: 5px; width: fit-content; margin: 0 0 7px 40px; padding: 3px 9px;
          border: 1px dashed #d9dede; border-radius: 999px; background: #fafbfb;
          font-family: "Nunito", sans-serif; font-size: .6rem; font-weight: 800; color: #737b76;
        }

        /* SORTABLE ITEM */
        .planner-sortable-item { display: flex; align-items: center; gap: 8px; padding: 8px; margin-bottom: 7px; }
        .planner-sortable-item:last-child { margin-bottom: 0; }
        .planner-drag-button {
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 3px; border: none;
          color: #b0b6b2; background: transparent; cursor: grab; touch-action: none;
        }
        .planner-drag-button:active { cursor: grabbing; }
        .planner-stop-number {
          width: 27px; height: 27px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          border-radius: 9px; font-family: "Poppins", sans-serif; font-size: .65rem; font-weight: 700;
        }
        .planner-stop-image { width: 47px; height: 47px; flex-shrink: 0; object-fit: cover; border-radius: 11px; }
        .planner-stop-placeholder { display: flex; align-items: center; justify-content: center; color: ${CALBAYOG_BLUE}; background: ${SOFT_BLUE}; }
        .planner-stop-content { flex: 1; min-width: 0; }
        .planner-stop-name {
          margin: 0 0 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          font-family: "Nunito", sans-serif; font-size: .75rem; font-weight: 800; color: #252b27;
        }
        .planner-stop-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 6px; min-width: 0; }
        .planner-category-tag {
          display: inline-flex; align-items: center; max-width: 115px; overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; padding: 3px 6px; border-radius: 999px; font-family: "Nunito", sans-serif; font-size: .57rem; font-weight: 800;
        }
        .planner-stop-time { display: inline-flex; align-items: center; gap: 3px; font-family: "Nunito", sans-serif; font-size: .6rem; font-weight: 800; color: ${CALBAYOG_BLUE}; }
        .planner-stop-fee { font-family: "Nunito", sans-serif; font-size: .58rem; font-weight: 700; color: #8a928d; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .planner-move-select {
          margin-top: 5px; max-width: 120px; padding: 2px 5px; border: 1px solid #e5e9e6; border-radius: 7px; background: #fff;
          font-family: "Nunito", sans-serif; font-size: .58rem; font-weight: 700; color: #737b76; cursor: pointer;
        }
        .planner-remove-button {
          width: 29px; height: 29px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          border: none; border-radius: 9px; color: #a1a8a4; background: transparent; cursor: pointer; transition: color .2s ease, background .2s ease;
        }
        .planner-remove-button:hover { color: #c64a4a; background: #fff4f4; }

        /* EMPTY DAY */
        .planner-no-stops {
          display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 150px; margin-bottom: 12px;
          border: 1px dashed #dfe5e1; border-radius: 14px; background: #fafcfb; text-align: center;
        }
        .planner-no-stops-icon {
          width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; margin-bottom: 7px;
          border-radius: 13px; color: ${CALBAYOG_BLUE}; background: ${SOFT_BLUE};
        }
        .planner-no-stops strong { font-family: "Nunito", sans-serif; font-size: .72rem; color: #3d4540; }
        .planner-no-stops span { margin-top: 2px; font-family: "Nunito", sans-serif; font-size: .64rem; color: #929a95; }

        /* DAY NOTE + TOOLS */
        .planner-day-note {
          display: flex; align-items: flex-start; gap: 7px; padding: 8px 9px; margin: 10px 0; border-radius: 10px;
          background: #fafbfb; color: #777f7a; font-family: "Nunito", sans-serif; font-size: .62rem; line-height: 1.45;
        }
        .planner-day-note-icon { display: flex; flex-shrink: 0; margin-top: 1px; color: ${CALBAYOG_BLUE}; }
        .planner-add-attraction {
          display: flex !important; align-items: center; justify-content: center; gap: 6px; width: 100%; min-height: 35px;
          border-radius: 999px !important; border-width: 1px !important; border-color: #dfe3e1 !important;
          color: ${CALBAYOG_BLUE} !important; background: #fff !important; font-family: "Nunito", sans-serif; font-size: .67rem !important; font-weight: 800 !important;
        }
        .planner-add-attraction:hover { border-color: ${CALBAYOG_BLUE} !important; background: ${SOFT_BLUE} !important; }
        .planner-day-tools { display: flex; gap: 6px; margin-top: 8px; }
        .planner-day-tools button {
          flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-height: 32px;
          border: 1px solid #e5e9e6; border-radius: 999px; background: #fafbfb; color: #626b65; cursor: pointer;
          font-family: "Nunito", sans-serif; font-size: .62rem; font-weight: 800; transition: color .2s ease, border-color .2s ease, background .2s ease;
        }
        .planner-day-tools button:hover { border-color: ${CALBAYOG_BLUE}; color: ${CALBAYOG_BLUE}; background: ${SOFT_BLUE}; }

        /* SUGGESTIONS + KIND TABS */
        .planner-suggest { display: flex; flex-direction: column; gap: 6px; margin: 10px 0 8px; }
        .planner-suggest-item {
          display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 10px; text-align: left;
          border: 1px dashed #d4d9e6; border-radius: 12px; background: #fafbff; cursor: pointer;
          transition: border-color .2s ease, background .2s ease;
        }
        .planner-suggest-item > span { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .planner-suggest-item small { font-family: "Nunito", sans-serif; font-size: .56rem; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; color: #8a928d; }
        .planner-suggest-item strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: "Nunito", sans-serif; font-size: .72rem; font-weight: 800; color: #252b27; }
        .planner-suggest-item em { font-style: normal; font-family: "Nunito", sans-serif; font-size: .58rem; font-weight: 700; color: #737b76; }
        .planner-suggest-food { color: #C2410C; }
        .planner-suggest-food:hover { border-color: #C2410C; background: #fff7f2; }
        .planner-suggest-stay { color: #2563EB; }
        .planner-suggest-stay:hover { border-color: #2563EB; background: #f3f7ff; }
        .planner-kind-tabs { display: flex; gap: 6px; margin-bottom: 12px; padding: 4px; border: 1px solid #edf0ee; border-radius: 999px; background: #fff; }
        .planner-kind-tabs button {
          flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 34px; padding: 6px 10px;
          border: none; border-radius: 999px; background: transparent; color: #707974; cursor: pointer;
          font-family: "Nunito", sans-serif; font-size: .66rem; font-weight: 800; transition: background .2s ease, color .2s ease;
        }
        .planner-kind-tabs button.active { background: ${CALBAYOG_BLUE}; color: #fff; }

        /* MAP */
        .planner-map-wrap { position: relative; border: 1px solid #edf0ee; border-radius: 14px; overflow: hidden; }
        .planner-map-layers { position: absolute; z-index: 1000; top: 8px; right: 8px; display: flex; gap: 4px; }
        .planner-map-layers button {
          padding: 4px 8px; border: 1px solid #dfe3e1; border-radius: 8px; background: rgba(255,255,255,.95);
          font-family: "Nunito", sans-serif; font-size: .58rem; font-weight: 800; color: #626b65; cursor: pointer;
        }
        .planner-map-layers button.active { border-color: ${CALBAYOG_BLUE}; color: ${CALBAYOG_BLUE}; background: ${SOFT_BLUE}; }
        .planner-map-note { padding: 6px 10px; background: #fafbfb; font-family: "Nunito", sans-serif; font-size: .58rem; color: #8a928d; }

        /* TIP */
        .planner-tip {
          display: flex; align-items: flex-start; gap: 9px; margin-top: 22px; padding: 11px 13px;
          border: 1px solid #edf0ee; border-radius: 12px; background: #fafbfb;
        }
        .planner-tip-icon {
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 27px; height: 27px;
          border-radius: 8px; color: ${CALBAYOG_BLUE}; background: ${SOFT_BLUE};
        }
        .planner-tip strong, .planner-tip span { display: block; font-family: "Nunito", sans-serif; }
        .planner-tip strong { margin-bottom: 1px; font-size: .67rem; color: #3b433e; }
        .planner-tip span { font-size: .64rem; line-height: 1.45; color: #8a928d; }

        /* MODALS */
        .planner-modal .modal-content { border: none; border-radius: 18px; overflow: hidden; box-shadow: 0 20px 55px rgba(25,30,45,.18); }
        .planner-modal-header { padding: 18px 20px 14px !important; border-bottom: 1px solid #f0f2f0 !important; background: #fff; }
        .planner-modal-eyebrow { margin-bottom: 3px; font-family: "Nunito", sans-serif; font-size: .59rem; font-weight: 800; letter-spacing: .1em; color: #929a95; }
        .planner-modal-title { margin: 0 !important; font-family: "Poppins", sans-serif !important; font-size: 1.08rem !important; font-weight: 700 !important; color: #242a26; }
        .planner-modal-subtitle { margin: 3px 0 0; font-family: "Nunito", sans-serif; font-size: .68rem; color: #858d88; }
        .planner-modal-body { padding: 16px !important; background: #fafbfb !important; }
        .planner-picker-body { max-height: 68vh; padding: 16px !important; background: #fafbfb !important; }
        .planner-modal-footer { gap: 7px !important; padding: 12px 16px !important; border-top: 1px solid #edf0ee !important; background: #fff !important; }
        .planner-modal-cancel, .planner-modal-save, .planner-modal-generate, .planner-delete-confirm {
          display: inline-flex !important; align-items: center; justify-content: center; gap: 6px; border-radius: 999px !important;
          padding: 8px 13px !important; font-family: "Nunito", sans-serif; font-size: .67rem !important; font-weight: 800 !important;
        }
        .planner-modal-save { border-color: #dfe3e1 !important; color: ${CALBAYOG_BLUE} !important; }
        .planner-modal-save:hover { background: ${SOFT_BLUE} !important; border-color: ${CALBAYOG_BLUE} !important; }
        .planner-modal-generate { border: none !important; background: ${CALBAYOG_BLUE} !important; }
        .planner-modal-generate:hover { background: #252982 !important; }
        .planner-delete-confirm { border: none !important; }
        .planner-error { border: 1px solid #f0d5d5 !important; border-radius: 12px !important; font-family: "Nunito", sans-serif; font-size: .72rem; }

        /* CUSTOMIZER */
        .customizer-section { margin-bottom: 12px; padding: 15px; border: 1px solid #edf0ee; border-radius: 15px; background: #fff; }
        .customizer-section:last-of-type { margin-bottom: 0; }
        .customizer-section-heading { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 13px; }
        .customizer-section-icon {
          width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          border-radius: 10px; color: ${CALBAYOG_BLUE}; background: ${SOFT_BLUE};
        }
        .customizer-section-heading h4 { margin: 1px 0 2px; font-family: "Poppins", sans-serif; font-size: .79rem; font-weight: 700; color: #2a302c; }
        .customizer-section-heading p { margin: 0; font-family: "Nunito", sans-serif; font-size: .64rem; line-height: 1.45; color: #89918c; }
        .planner-form-label { margin-bottom: 5px !important; font-family: "Nunito", sans-serif; font-size: .65rem !important; font-weight: 800 !important; color: #616a64; }
        .planner-form-control {
          min-height: 39px !important; border: 1px solid #dfe4e1 !important; border-radius: 10px !important; padding: 8px 10px !important;
          font-family: "Nunito", sans-serif !important; font-size: .71rem !important; color: #333a35 !important; box-shadow: none !important;
        }
        .planner-form-control:focus { border-color: ${CALBAYOG_BLUE} !important; box-shadow: 0 0 0 3px rgba(45,49,149,.08) !important; }
        .planner-number-control { max-width: 180px; }
        .planner-info-strip {
          display: flex; align-items: center; gap: 6px; margin-top: 11px; padding: 8px 10px; border-radius: 9px;
          color: ${CALBAYOG_BLUE}; background: ${SOFT_BLUE}; font-family: "Nunito", sans-serif; font-size: .65rem;
        }

        /* OPTION CARDS */
        .planner-option-card {
          position: relative; width: 100%; min-height: 72px; padding: 10px; text-align: left; border: 1px solid #e0e5e2;
          border-radius: 11px; background: #fff; cursor: pointer; transition: border-color .2s ease, background .2s ease, box-shadow .2s ease;
        }
        .planner-option-card:hover { border-color: #bdc4c0; background: #fbfcfb; }
        .planner-option-card-active { border-color: ${CALBAYOG_BLUE} !important; background: ${SOFT_BLUE} !important; box-shadow: 0 3px 12px rgba(45,49,149,.08); }
        .planner-option-title { display: block; margin-bottom: 2px; font-family: "Nunito", sans-serif; font-size: .71rem; font-weight: 800; color: #303731; }
        .planner-option-card small { display: block; max-width: 92%; font-family: "Nunito", sans-serif; font-size: .61rem; line-height: 1.4; color: #8a928d; }
        .planner-option-check {
          position: absolute; top: 8px; right: 8px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
          border-radius: 50%; color: #fff; background: ${CALBAYOG_BLUE};
        }
        .planner-option-stops {
          display: inline-flex; margin-top: 7px; padding: 3px 6px; border-radius: 999px; color: ${CALBAYOG_BLUE};
          background: rgba(45,49,149,.07); font-family: "Nunito", sans-serif; font-size: .56rem; font-weight: 800;
        }

        /* INTERESTS */
        .planner-interest-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .planner-interest-option {
          display: inline-flex; align-items: center; gap: 6px; min-height: 34px; padding: 7px 10px; border: 1px solid #e0e5e2;
          border-radius: 999px; color: #68716c; background: #fff; font-family: "Nunito", sans-serif; font-size: .64rem; font-weight: 800;
          cursor: pointer; transition: color .2s ease, border-color .2s ease, background .2s ease;
        }
        .planner-interest-option:hover { border-color: #c9cecb; }
        .planner-interest-option-active { border-color: ${CALBAYOG_BLUE}; color: ${CALBAYOG_BLUE}; background: ${SOFT_BLUE}; }
        .planner-textarea {
          border: 1px solid #dfe4e1 !important; border-radius: 10px !important; padding: 10px !important; resize: vertical;
          font-family: "Nunito", sans-serif !important; font-size: .7rem !important; box-shadow: none !important;
        }
        .planner-textarea:focus { border-color: ${CALBAYOG_BLUE} !important; box-shadow: 0 0 0 3px rgba(45,49,149,.08) !important; }
        .planner-generator-info {
          display: flex; align-items: flex-start; gap: 8px; margin-top: 12px; padding: 10px 11px; border-radius: 10px;
          color: #7d8680; background: #f6f8f7; font-family: "Nunito", sans-serif; font-size: .62rem; line-height: 1.45;
        }
        .planner-generator-info svg { flex-shrink: 0; margin-top: 1px; color: ${CALBAYOG_BLUE}; }

        /* PICKER */
        .planner-picker-toolbar { padding: 12px; margin-bottom: 12px; border: 1px solid #edf0ee; border-radius: 14px; background: #fff; }
        .planner-search-wrapper {
          display: flex; align-items: center; gap: 8px; padding: 0 10px; border: 1px solid #dfe4e1; border-radius: 10px; color: #8c948f; background: #fff;
        }
        .planner-search-input {
          min-height: 37px !important; padding: 7px 0 !important; border: none !important; box-shadow: none !important;
          font-family: "Nunito", sans-serif !important; font-size: .7rem !important;
        }
        .planner-category-scroll { display: flex; gap: 6px; overflow-x: auto; padding: 9px 1px 2px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .planner-category-scroll::-webkit-scrollbar { display: none; }
        .planner-picker-category {
          flex: 0 0 auto; min-height: 29px; padding: 5px 9px; border: 1px solid #e2e6e3; border-radius: 999px; color: #707974; background: #fff;
          font-family: "Nunito", sans-serif; font-size: .61rem; font-weight: 800; cursor: pointer; white-space: nowrap;
        }
        .planner-picker-results {
          display: flex; align-items: center; flex-wrap: wrap; gap: 6px 14px; margin-bottom: 9px; padding: 0 2px;
          font-family: "Nunito", sans-serif; font-size: .63rem; color: #8a928d;
        }
        .planner-picker-results strong { color: #444c47; }
        .planner-picker-sort { display: inline-flex; align-items: center; gap: 5px; margin: 0; font-weight: 800; color: ${CALBAYOG_BLUE}; cursor: pointer; }
        .planner-picker-added { display: inline-flex; align-items: center; gap: 4px; margin-left: auto; font-weight: 800; color: #1a7a4a; }
        .planner-picker-card {
          position: relative; width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px; text-align: left;
          border: 1px solid #e4e8e5; border-radius: 14px; background: #fff; cursor: pointer;
          transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
        }
        .planner-picker-card:not(:disabled):hover { transform: translateY(-2px); border-color: ${CALBAYOG_BLUE}; box-shadow: 0 6px 18px rgba(20,30,24,.07); }
        .planner-picker-card-used { cursor: default; opacity: .6; background: #f7f8f7; }
        .planner-picker-image { width: 58px; height: 58px; flex-shrink: 0; object-fit: cover; border-radius: 11px; }
        .planner-picker-placeholder { display: flex; align-items: center; justify-content: center; color: ${CALBAYOG_BLUE}; background: ${SOFT_BLUE}; }
        .planner-picker-content { flex: 1; min-width: 0; }
        .planner-picker-content strong {
          display: block; margin-bottom: 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          font-family: "Nunito", sans-serif; font-size: .73rem; font-weight: 800; color: #2a302c;
        }
        .planner-picker-tag {
          display: inline-flex; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          padding: 3px 6px; border-radius: 999px; font-family: "Nunito", sans-serif; font-size: .56rem; font-weight: 800;
        }
        .planner-picker-travel {
          display: flex; align-items: center; gap: 4px; margin-top: 5px; font-family: "Nunito", sans-serif; font-size: .6rem; font-weight: 800; color: ${CALBAYOG_BLUE};
        }
        .planner-picker-location {
          display: flex; align-items: center; gap: 3px; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          color: #929a95; font-family: "Nunito", sans-serif; font-size: .59rem;
        }
        .planner-picker-add {
          width: 29px; height: 29px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          border-radius: 9px; color: ${CALBAYOG_BLUE}; background: ${SOFT_BLUE};
        }
        .planner-picker-add-used { color: #8b938e; background: #e9ecea; }
        .planner-already-used { margin: 4px 10px 0; text-align: right; font-family: "Nunito", sans-serif; font-size: .57rem; color: #999f9b; }
        .planner-picker-empty { padding: 55px 20px; text-align: center; }
        .planner-picker-empty-icon {
          width: 58px; height: 58px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;
          border-radius: 17px; color: ${CALBAYOG_BLUE}; background: ${SOFT_BLUE};
        }
        .planner-picker-empty h4 { margin: 0 0 4px; font-family: "Poppins", sans-serif; font-size: .86rem; font-weight: 700; color: #303631; }
        .planner-picker-empty p { margin: 0; font-family: "Nunito", sans-serif; font-size: .68rem; color: #8a928d; }

        /* CONFIRM */
        .planner-confirm-body { padding: 30px 20px !important; text-align: center; background: #fff !important; }
        .planner-confirm-icon {
          width: 58px; height: 58px; display: flex; align-items: center; justify-content: center; margin: 0 auto 13px;
          border-radius: 18px; color: #b64d4d; background: #fff1f1;
        }
        .planner-confirm-body h4 { margin: 0 0 6px; font-family: "Poppins", sans-serif; font-size: .95rem; font-weight: 700; color: #303631; }
        .planner-confirm-body p { max-width: 400px; margin: 0 auto; font-family: "Nunito", sans-serif; font-size: .7rem; line-height: 1.5; color: #858d88; }

        /* RESPONSIVE */
        @media (max-width: 991.98px) {
          .itinerary-header { padding: 28px 20px 18px; }
          .itinerary-title { font-size: clamp(1.65rem, 4.5vw, 2.25rem); }
          .planner-intro { align-items: flex-start; }
        }

        @media (max-width: 767.98px) {
          .itinerary-header { padding: 25px 17px 16px; }
          .itinerary-title { font-size: 1.9rem; }
          .itinerary-subtitle { margin-top: 6px; font-size: .78rem; }
          .itinerary-container { padding-left: 17px; padding-right: 17px; }
          .planner-intro { flex-direction: column; align-items: stretch; gap: 15px; padding: 16px; }
          .planner-intro-text { font-size: .71rem; }
          .preference-section { flex-direction: column; align-items: stretch; }
          .planner-secondary-button { align-self: flex-start; }
          .planner-results-bar { align-items: flex-start; }
          .planner-results-right { width: 100%; justify-content: space-between; }
          .planner-actions { gap: 6px; }
          .planner-action-primary, .planner-action-button, .planner-action-link { flex: 1 1 auto; }
          .planner-day-header { min-height: 86px; }
          .planner-sortable-item { gap: 6px; }
          .planner-stop-image { width: 44px; height: 44px; }
          .planner-stop-number { width: 25px; height: 25px; }
          .planner-modal-footer { flex-wrap: wrap; }
          .planner-modal-cancel, .planner-modal-save, .planner-modal-generate { flex: 1 1 auto; }
        }

        @media (max-width: 479.98px) {
          .itinerary-title { font-size: 1.8rem; }
          .itinerary-subtitle { font-size: .77rem; }
          .planner-intro-content { gap: 10px; }
          .planner-intro-icon { width: 40px; height: 40px; border-radius: 12px; }
          .planner-intro-title { font-size: .91rem; }
          .planner-actions { display: grid; grid-template-columns: 1fr 1fr; }
          .planner-action-primary, .planner-action-button, .planner-action-link { width: 100%; }
          .planner-action-primary, .planner-action-link { grid-column: span 2; }
          .planner-settings { flex-direction: column; align-items: stretch; }
          .planner-day-header { padding: 13px; }
          .planner-day-body { padding: 11px !important; }
          .planner-stop-name { font-size: .71rem; }
          .planner-category-tag { max-width: 95px; }
          .planner-modal-body, .planner-picker-body { padding: 12px !important; }
          .customizer-section { padding: 12px; }
          .planner-option-card { min-height: 67px; }
          .planner-travel-leg { margin-left: 30px; }
        }
      `}</style>
    </div>
  );
};

export default ItineraryPlanner;
