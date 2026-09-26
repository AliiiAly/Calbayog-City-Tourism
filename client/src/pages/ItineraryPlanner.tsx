import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Badge,
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
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { arrayMove } from "@dnd-kit/sortable";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getAttractions } from "../services/api";
import { Destination, ItineraryDay } from "../types";

const STORAGE_KEY = "calbayog_itinerary";
const PREFERENCES_STORAGE_KEY = "calbayog_itinerary_preferences";

const categoryColors: Record<string, string> = {
  Waterfalls: "#0077B6",
  Nature: "#1A7A4A",
  Beach: "#00A8CC",
  Cultural: "#8B5E34",
  Historical: "#6D4C41",
  Religious: "#F4A226",
  Adventure: "#E63946",
  Food: "#7B2D8B",
  Other: "#6C757D",
};

const interestOptions = [
  {
    value: "Nature",
    label: "🌿 Nature",
    keywords: ["nature", "eco", "forest", "park", "river", "lake"],
  },
  {
    value: "Waterfalls",
    label: "💦 Waterfalls",
    keywords: ["waterfall", "falls", "cascade"],
  },
  {
    value: "Beach",
    label: "🏖️ Beach",
    keywords: ["beach", "coast", "sea", "island", "marine"],
  },
  {
    value: "History and Culture",
    label: "🏛️ History & Culture",
    keywords: [
      "history",
      "historical",
      "culture",
      "cultural",
      "heritage",
      "museum",
    ],
  },
  {
    value: "Religious",
    label: "🙏 Heritage & Religion",
    keywords: ["religious", "church", "religion", "faith", "shrine"],
  },
  {
    value: "Adventure",
    label: "🥾 Adventure",
    keywords: [
      "adventure",
      "hiking",
      "trek",
      "trekking",
      "climb",
      "outdoor",
    ],
  },
  {
    value: "Food",
    label: "🍴 Food",
    keywords: ["food", "restaurant", "dining", "eat", "culinary"],
  },
  {
    value: "Shopping",
    label: "🛍️ Shopping",
    keywords: ["shopping", "market", "souvenir", "shop"],
  },
  {
    value: "Industrial Tourism",
    label: "🏭 Industrial Tourism",
    keywords: ["industrial", "industry", "factory", "production"],
  },
];

const travelerTypes = [
  {
    value: "Solo",
    label: "🧍 Solo",
    description: "Just me",
  },
  {
    value: "Couple",
    label: "💑 Couple",
    description: "Two travelers",
  },
  {
    value: "Family",
    label: "👨‍👩‍👧 Family",
    description: "Family trip",
  },
  {
    value: "Friends",
    label: "👯 Friends",
    description: "Friends together",
  },
  {
    value: "Group",
    label: "👥 Group",
    description: "Larger group",
  },
];

const paceOptions = [
  {
    value: "Relaxed",
    label: "🐢 Relaxed",
    description: "More time, fewer stops",
    stopsPerDay: 2,
  },
  {
    value: "Balanced",
    label: "⚖️ Balanced",
    description: "Comfortable sightseeing",
    stopsPerDay: 3,
  },
  {
    value: "Packed",
    label: "🚀 Packed",
    description: "See as much as possible",
    stopsPerDay: 4,
  },
];

const budgetOptions = [
  {
    value: "Budget-friendly",
    label: "💚 Budget-friendly",
    description: "Keep costs practical",
  },
  {
    value: "Moderate",
    label: "💛 Moderate",
    description: "A comfortable balance",
  },
  {
    value: "Flexible",
    label: "💙 Flexible",
    description: "Cost is less important",
  },
];

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

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return 0;
  }

  const difference =
    Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  return difference;
};

const getDateForDay = (startDate: string, dayNumber: number) => {
  if (!startDate) return undefined;

  const date = new Date(`${startDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) return undefined;

  date.setDate(date.getDate() + dayNumber - 1);

  return date.toISOString().split("T")[0];
};

const getDestinationSearchText = (dest: Destination) => {
  return [
    dest.name,
    dest.category,
    dest.description,
    dest.short_description,
    dest.location_address,
    dest.getting_there,
    dest.entrance_fee,
    ...(dest.tags || []),
    ...(dest.tips || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

const getInterestScore = (
  dest: Destination,
  selectedInterests: string[],
) => {
  if (selectedInterests.length === 0) return 0;

  const category = (dest.category || "").toLowerCase();
  const searchText = getDestinationSearchText(dest);

  let score = 0;

  selectedInterests.forEach((interest) => {
    const option = interestOptions.find(
      (item) => item.value === interest,
    );

    if (!option) return;

    if (category === interest.toLowerCase()) {
      score += 10;
    }

    option.keywords.forEach((keyword) => {
      if (searchText.includes(keyword.toLowerCase())) {
        score += 3;
      }
    });
  });

  if (dest.featured) {
    score += 1;
  }

  return score;
};

const generateCustomizedDays = (
  destinations: Destination[],
  preferences: ItineraryPreferences,
): ItineraryDay[] => {
  const tripDays = getTripDays(
    preferences.travelDateStart,
    preferences.travelDateEnd,
  );

  if (tripDays <= 0 || destinations.length === 0) {
    return [];
  }

  const pace =
    paceOptions.find(
      (option) => option.value === preferences.travelPace,
    ) || paceOptions[1];

  const stopsPerDay = pace.stopsPerDay;

  const scoredDestinations = destinations
    .filter((dest) => dest.is_active !== false)
    .map((dest) => ({
      dest,
      score: getInterestScore(
        dest,
        preferences.selectedInterests,
      ),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (Boolean(b.dest.featured) !== Boolean(a.dest.featured)) {
        return b.dest.featured ? 1 : -1;
      }

      return a.dest.name.localeCompare(b.dest.name);
    });

  let candidates = scoredDestinations;

  /*
   * If the visitor selected interests but none of the available
   * attractions matched them, we still create a useful itinerary
   * from the available attractions instead of showing an empty plan.
   */
  const hasInterestMatches = scoredDestinations.some(
    (item) => item.score > 0,
  );

  if (preferences.selectedInterests.length > 0 && hasInterestMatches) {
    candidates = scoredDestinations.filter(
      (item) => item.score > 0,
    );
  }

  const selected: Destination[] = [];
  const selectedIds = new Set<string>();

  for (const item of candidates) {
    if (selectedIds.has(item.dest.id)) continue;

    selected.push(item.dest);
    selectedIds.add(item.dest.id);

    if (selected.length >= tripDays * stopsPerDay) {
      break;
    }
  }

  /*
   * If there are not enough interest matches, fill remaining
   * spaces with other active attractions so the generated
   * itinerary remains practical.
   */
  if (selected.length < tripDays * stopsPerDay) {
    for (const item of scoredDestinations) {
      if (selectedIds.has(item.dest.id)) continue;

      selected.push(item.dest);
      selectedIds.add(item.dest.id);

      if (selected.length >= tripDays * stopsPerDay) {
        break;
      }
    }
  }

  const generatedDays: ItineraryDay[] = [];

  for (let index = 0; index < tripDays; index++) {
    const start = index * stopsPerDay;
    const end = start + stopsPerDay;

    const dayDestinations = selected.slice(start, end);

    generatedDays.push({
      id: `day-${Date.now()}-${index}`,
      day: index + 1,
      date: getDateForDay(
        preferences.travelDateStart,
        index + 1,
      ),
      destinations: dayDestinations,
      notes:
        preferences.travelPace === "Relaxed"
          ? "A relaxed day with more time to enjoy each attraction."
          : preferences.travelPace === "Packed"
            ? "A fuller sightseeing day. Adjust the order or remove stops if needed."
            : "A balanced sightseeing day.",
    });
  }

  return generatedDays;
};

const SortableItem: React.FC<{
  id: string;
  dest: Destination;
  index: number;
  onRemove: () => void;
}> = ({ id, dest, index, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: "#fff",
        borderRadius: "14px",
        border: isDragging
          ? "2px solid var(--tropical-green)"
          : "1px solid #e9ecef",
        boxShadow: isDragging
          ? "0 10px 30px rgba(0,0,0,0.15)"
          : "0 2px 8px rgba(0,0,0,0.06)",
        opacity: isDragging ? 0.9 : 1,
        position: "relative",
        zIndex: isDragging ? 10 : 1,
      }}
      className="d-flex align-items-center gap-2 gap-md-3 p-2 p-md-3 mb-2"
      {...attributes}
    >
      <button
        {...listeners}
        aria-label={`Reorder ${dest.name}`}
        title="Drag to reorder"
        style={{
          cursor: "grab",
          border: "none",
          background: "transparent",
          color: "#9aa0a6",
          fontSize: "1.15rem",
          padding: "4px",
          flexShrink: 0,
          touchAction: "none",
        }}
      >
        ⋮⋮
      </button>

      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "var(--tropical-green-light)",
          color: "var(--tropical-green)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "0.75rem",
          flexShrink: 0,
        }}
      >
        {index + 1}
      </div>

      {dest.images?.[0] ? (
        <img
          src={dest.images[0]}
          alt={dest.name}
          style={{
            width: 52,
            height: 52,
            objectFit: "cover",
            borderRadius: 10,
            border: "2px solid var(--tropical-green-light)",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 52,
            height: 52,
            background:
              "linear-gradient(135deg, var(--tropical-green-light), var(--tropical-green))",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.35rem",
            flexShrink: 0,
          }}
        >
          🌿
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          className="mb-1 fw-semibold"
          style={{
            fontSize: "0.88rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "#212529",
          }}
        >
          {dest.name}
        </p>

        <div className="d-flex gap-1 flex-wrap align-items-center">
          <Badge
            style={{
              background:
                categoryColors[dest.category] ||
                "var(--tropical-green)",
              fontSize: "0.6rem",
              padding: "3px 6px",
            }}
          >
            {dest.category}
          </Badge>

          {dest.location_address && (
            <small
              className="text-muted d-none d-md-inline"
              style={{
                fontSize: "0.68rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              📍 {dest.location_address}
            </small>
          )}
        </div>
      </div>

      <button
        onClick={onRemove}
        aria-label={`Remove ${dest.name}`}
        title="Remove attraction"
        style={{
          border: "none",
          background: "transparent",
          color: "#dc3545",
          fontSize: "1rem",
          cursor: "pointer",
          padding: "6px 8px",
          borderRadius: "8px",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#fee2e2";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        ✕
      </button>
    </div>
  );
};

const ItineraryPlanner: React.FC = () => {
  const [days, setDays] = useState<ItineraryDay[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];

      return Array.isArray(parsed)
        ? parsed.map((day: ItineraryDay, index: number) => ({
            ...day,
            day: index + 1,
            destinations: Array.isArray(day.destinations)
              ? day.destinations
              : [],
          }))
        : [];
    } catch {
      return [];
    }
  });

  const [preferences, setPreferences] =
    useState<ItineraryPreferences>(() => {
      try {
        const stored = localStorage.getItem(
          PREFERENCES_STORAGE_KEY,
        );

        if (!stored) {
          return defaultPreferences;
        }

        const parsed = JSON.parse(stored);

        return {
          ...defaultPreferences,
          ...parsed,
          selectedInterests: Array.isArray(
            parsed?.selectedInterests,
          )
            ? parsed.selectedInterests
            : [],
        };
      } catch {
        return defaultPreferences;
      }
    });

  const [destinations, setDestinations] = useState<Destination[]>(
    [],
  );

  const [showPicker, setShowPicker] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [activeDayId, setActiveDayId] = useState<string | null>(
    null,
  );

  const [saved, setSaved] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [customizationSaved, setCustomizationSaved] =
    useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [customizerError, setCustomizerError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    getAttractions()
      .then((r) => {
        setDestinations(Array.isArray(r.data) ? r.data : []);
      })
      .catch((err) => {
        console.error("Failed to load attractions:", err);
        setDestinations([]);
      });
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        destinations
          .map((d) => d.category)
          .filter(Boolean),
      ),
    );

    return ["All", ...unique];
  }, [destinations]);

  const filteredDestinations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return destinations.filter((dest) => {
      const matchesSearch =
        !query ||
        dest.name?.toLowerCase().includes(query) ||
        dest.category?.toLowerCase().includes(query) ||
        dest.location_address
          ?.toLowerCase()
          .includes(query);

      const matchesCategory =
        category === "All" || dest.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [destinations, search, category]);

  const totalDests = days.reduce(
    (sum, d) =>
      sum +
      (Array.isArray(d.destinations)
        ? d.destinations.length
        : 0),
    0,
  );

  const totalDays = days.length;

  const tripDays = getTripDays(
    preferences.travelDateStart,
    preferences.travelDateEnd,
  );

  const usedDestinationIds = useMemo(() => {
    return new Set(
      days.flatMap((day) =>
        Array.isArray(day.destinations)
          ? day.destinations.map((dest) => dest.id)
          : [],
      ),
    );
  }, [days]);

  const addDay = () => {
    const newDay: ItineraryDay = {
      id: `day-${Date.now()}`,
      day: days.length + 1,
      date: preferences.travelDateStart
        ? getDateForDay(
            preferences.travelDateStart,
            days.length + 1,
          )
        : undefined,
      destinations: [],
    };

    setDays((prev) => [...prev, newDay]);
  };

  const removeDay = (dayId: string) => {
    setDays((prev) =>
      prev
        .filter((d) => d.id !== dayId)
        .map((d, i) => ({
          ...d,
          day: i + 1,
          date: preferences.travelDateStart
            ? getDateForDay(
                preferences.travelDateStart,
                i + 1,
              )
            : d.date,
        })),
    );
  };

  const openPicker = (dayId: string) => {
    setActiveDayId(dayId);
    setSearch("");
    setCategory("All");
    setShowPicker(true);
  };

  const addDestToDay = (dest: Destination) => {
    if (!activeDayId) return;

    setDays((prev) =>
      prev.map((d) =>
        d.id === activeDayId &&
        !d.destinations.some((x) => x.id === dest.id)
          ? {
              ...d,
              destinations: [...d.destinations, dest],
            }
          : d,
      ),
    );
  };

  const removeDestFromDay = (
    dayId: string,
    destId: string,
  ) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? {
              ...d,
              destinations: Array.isArray(d.destinations)
                ? d.destinations.filter(
                    (x) => x.id !== destId,
                  )
                : [],
            }
          : d,
      ),
    );
  };

  const handleDragEnd = (
    event: DragEndEvent,
    dayId: string,
  ) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;

        const oldIdx = d.destinations.findIndex(
          (x) => x.id === active.id,
        );

        const newIdx = d.destinations.findIndex(
          (x) => x.id === over.id,
        );

        if (oldIdx < 0 || newIdx < 0) return d;

        return {
          ...d,
          destinations: arrayMove(
            d.destinations,
            oldIdx,
            newIdx,
          ),
        };
      }),
    );
  };

  const updatePreference = <
    K extends keyof ItineraryPreferences,
  >(
    key: K,
    value: ItineraryPreferences[K],
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));

    setCustomizerError("");
  };

  const toggleInterest = (interest: string) => {
    setPreferences((prev) => {
      const exists = prev.selectedInterests.includes(interest);

      return {
        ...prev,
        selectedInterests: exists
          ? prev.selectedInterests.filter(
              (item) => item !== interest,
            )
          : [...prev.selectedInterests, interest],
      };
    });

    setCustomizerError("");
  };

  const validatePreferences = () => {
    if (
      !preferences.travelDateStart ||
      !preferences.travelDateEnd
    ) {
      return "Please choose your travel dates.";
    }

    if (preferences.travelDateEnd < preferences.travelDateStart) {
      return "Your end date must be on or after your start date.";
    }

    if (
      !preferences.groupSize ||
      preferences.groupSize < 1
    ) {
      return "Please enter at least 1 traveler.";
    }

    if (preferences.selectedInterests.length === 0) {
      return "Choose at least one interest so we can personalize your itinerary.";
    }

    return "";
  };

  const savePreferences = () => {
    const validationError = validatePreferences();

    if (validationError) {
      setCustomizerError(validationError);
      return false;
    }

    try {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify(preferences),
      );

      setCustomizationSaved(true);

      window.setTimeout(() => {
        setCustomizationSaved(false);
      }, 2000);

      return true;
    } catch (error) {
      console.error(
        "Unable to save itinerary preferences:",
        error,
      );

      setCustomizerError(
        "We couldn't save your trip preferences. Please try again.",
      );

      return false;
    }
  };

  const generateItinerary = () => {
    const validationError = validatePreferences();

    if (validationError) {
      setCustomizerError(validationError);
      return;
    }

    if (destinations.length === 0) {
      setCustomizerError(
        "No attractions are currently available. Please try again in a moment.",
      );
      return;
    }

    const generatedDays = generateCustomizedDays(
      destinations,
      preferences,
    );

    if (generatedDays.length === 0) {
      setCustomizerError(
        "We couldn't build an itinerary from the available attractions.",
      );
      return;
    }

    try {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify(preferences),
      );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(generatedDays),
      );
    } catch (error) {
      console.error(
        "Unable to save generated itinerary:",
        error,
      );
    }

    setDays(generatedDays);
    setGenerated(true);
    setShowCustomizer(false);
    setCustomizerError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const saveItinerary = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(days),
      );

      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify(preferences),
      );

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (err) {
      console.error("Unable to save itinerary:", err);
    }
  };

  const clearItinerary = () => {
    localStorage.removeItem(STORAGE_KEY);
    setDays([]);
    setGenerated(false);
    setShowClearModal(false);
  };

  const exportPDF = () => {
    if (totalDests === 0) return;

    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("My Calbayog City Itinerary", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(
      `Generated: ${new Date().toLocaleDateString(
        "en-PH",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      )}`,
      14,
      28,
    );

    if (
      preferences.travelDateStart &&
      preferences.travelDateEnd
    ) {
      doc.text(
        `Travel dates: ${formatDate(
          preferences.travelDateStart,
        )} - ${formatDate(preferences.travelDateEnd)}`,
        14,
        34,
      );

      doc.text(
        `${preferences.groupSize} traveler${
          preferences.groupSize !== 1 ? "s" : ""
        } • ${preferences.groupType} • ${
          preferences.travelPace
        } pace`,
        14,
        40,
      );
    }

    doc.text(
      `${totalDays} day${
        totalDays !== 1 ? "s" : ""
      } • ${totalDests} attraction${
        totalDests !== 1 ? "s" : ""
      }`,
      14,
      preferences.travelDateStart ? 46 : 34,
    );

    let y = preferences.travelDateStart ? 56 : 44;

    days.forEach((day) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);

      const dateLabel = day.date
        ? ` • ${formatDate(day.date)}`
        : "";

      doc.text(
        `Day ${day.day}${dateLabel}`,
        14,
        y,
      );

      y += 6;

      if (
        !day.destinations ||
        day.destinations.length === 0
      ) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.text("No attractions added", 14, y);
        y += 10;
      } else {
        autoTable(doc, {
          startY: y,
          head: [["#", "Attraction", "Category", "Address"]],
          body: day.destinations.map((d, index) => [
            String(index + 1),
            d.name,
            d.category,
            d.location_address || "",
          ]),
          theme: "striped",
          headStyles: {
            fillColor: [26, 122, 74],
          },
          margin: {
            left: 14,
            right: 14,
          },
        });

        y =
          ((doc as any).lastAutoTable?.finalY || y) +
          12;
      }
    });

    doc.save("calbayog_itinerary.pdf");
  };

  const openCustomizer = () => {
    setCustomizerError("");
    setShowCustomizer(true);
  };

  const selectedPace =
    paceOptions.find(
      (option) =>
        option.value === preferences.travelPace,
    ) || paceOptions[1];

  return (
    <div className="page-enter">
      {/* HERO */}
      <div
        className="hero-section py-4 py-md-5 px-3 text-center"
        style={{ minHeight: 180 }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              fontSize: "2rem",
              marginBottom: "0.25rem",
            }}
          >
            🗺️
          </div>

          <h1
            className="fs-3 fs-md-2 fw-bold mb-1"
            style={{ fontFamily: "Poppins, serif" }}
          >
            Plan Your Calbayog Adventure
          </h1>

          <p
            style={{
              opacity: 0.88,
              fontSize: "0.9rem",
              margin: 0,
            }}
          >
            A personalized itinerary built around your trip
          </p>
        </div>
      </div>

      <Container
        className="py-3 py-md-4"
        style={{ maxWidth: "1400px" }}
      >
        {/* CUSTOMIZED TRIP INTRO */}
        <Card
          className="border-0 mb-4"
          style={{
            borderRadius: 18,
            background:
              "linear-gradient(135deg, #f0fff6, #ffffff)",
            boxShadow: "0 4px 18px rgba(0,0,0,0.07)",
            overflow: "hidden",
          }}
        >
          <Card.Body className="p-3 p-md-4">
            <Row className="align-items-center g-3">
              <Col md={8}>
                <div className="d-flex gap-3 align-items-start">
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 15,
                      background:
                        "var(--tropical-green-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.6rem",
                      flexShrink: 0,
                    }}
                  >
                    ✨
                  </div>

                  <div>
                    <h4
                      className="fw-bold mb-1"
                      style={{
                        fontFamily: "Poppins, serif",
                      }}
                    >
                      Make your trip your own
                    </h4>

                    <p
                      className="text-muted mb-0"
                      style={{
                        fontSize: "0.86rem",
                        lineHeight: 1.6,
                      }}
                    >
                      Tell us your dates, interests, group,
                      pace, and budget. We'll create a
                      starting itinerary using available
                      Calbayog attractions.
                    </p>
                  </div>
                </div>
              </Col>

              <Col md={4}>
                <Button
                  onClick={openCustomizer}
                  className="w-100"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--tropical-green), #11998e)",
                    border: "none",
                    borderRadius: 12,
                    padding: "11px 18px",
                    fontWeight: 700,
                  }}
                >
                  ✨ Customize My Trip
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* GENERATED / PREFERENCE SUMMARY */}
        {(preferences.travelDateStart ||
          preferences.selectedInterests.length > 0) && (
          <Card
            className="border-0 mb-4"
            style={{
              borderRadius: 16,
              boxShadow: "0 3px 14px rgba(0,0,0,0.07)",
            }}
          >
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                  <small
                    className="text-muted"
                    style={{
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: 700,
                      fontSize: "0.65rem",
                    }}
                  >
                    Your trip preferences
                  </small>

                  <h5
                    className="fw-bold mb-2 mt-1"
                    style={{
                      fontFamily: "Poppins, serif",
                    }}
                  >
                    {preferences.travelDateStart &&
                    preferences.travelDateEnd
                      ? `${formatDate(
                          preferences.travelDateStart,
                        )} - ${formatDate(
                          preferences.travelDateEnd,
                        )}`
                      : "Trip details"}
                  </h5>

                  <div className="d-flex flex-wrap gap-2">
                    {preferences.groupSize > 0 && (
                      <Badge
                        bg="light"
                        className="text-dark"
                        style={{
                          padding: "7px 9px",
                          borderRadius: 20,
                        }}
                      >
                        👥 {preferences.groupSize} traveler
                        {preferences.groupSize !== 1
                          ? "s"
                          : ""}
                      </Badge>
                    )}

                    {preferences.groupType && (
                      <Badge
                        bg="light"
                        className="text-dark"
                        style={{
                          padding: "7px 9px",
                          borderRadius: 20,
                        }}
                      >
                        {preferences.groupType}
                      </Badge>
                    )}

                    {preferences.travelPace && (
                      <Badge
                        bg="light"
                        className="text-dark"
                        style={{
                          padding: "7px 9px",
                          borderRadius: 20,
                        }}
                      >
                        {preferences.travelPace} pace
                      </Badge>
                    )}

                    {preferences.budget && (
                      <Badge
                        bg="light"
                        className="text-dark"
                        style={{
                          padding: "7px 9px",
                          borderRadius: 20,
                        }}
                      >
                        {preferences.budget}
                      </Badge>
                    )}
                  </div>

                  {preferences.selectedInterests.length >
                    0 && (
                    <div className="d-flex flex-wrap gap-1 mt-2">
                      {preferences.selectedInterests.map(
                        (interest) => {
                          const option =
                            interestOptions.find(
                              (item) =>
                                item.value === interest,
                            );

                          return (
                            <span
                              key={interest}
                              style={{
                                fontSize: "0.72rem",
                                color:
                                  "var(--tropical-green)",
                                fontWeight: 600,
                              }}
                            >
                              {option?.label || interest}
                            </span>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline-success"
                  onClick={openCustomizer}
                  style={{
                    borderRadius: 10,
                    fontWeight: 600,
                  }}
                >
                  ✏️ Edit Preferences
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* GENERATED MESSAGE */}
        {generated && (
          <Alert
            className="border-0 mb-4"
            style={{
              background:
                "linear-gradient(135deg, #e9fff2, #f7fffa)",
              borderRadius: 14,
              fontSize: "0.84rem",
            }}
          >
            <strong>✨ Your personalized itinerary is ready!</strong>
            <br />
            <span className="text-muted">
              We selected attractions from the available
              Calbayog tourism data based on your
              preferences. You can add, remove, or reorder
              any stop below.
            </span>
          </Alert>
        )}

        {/* SUMMARY */}
        <Row className="g-2 g-md-3 mb-3">
          <Col xs={4}>
            <Card
              className="border-0 h-100"
              style={{
                borderRadius: 14,
                boxShadow:
                  "0 2px 10px rgba(0,0,0,0.07)",
              }}
            >
              <Card.Body className="p-2 p-md-3 text-center">
                <div
                  style={{
                    fontSize: "1.35rem",
                    color: "var(--tropical-green)",
                  }}
                >
                  📅
                </div>

                <div className="fw-bold">
                  {totalDays}
                </div>

                <small className="text-muted">
                  Day{totalDays !== 1 ? "s" : ""}
                </small>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={4}>
            <Card
              className="border-0 h-100"
              style={{
                borderRadius: 14,
                boxShadow:
                  "0 2px 10px rgba(0,0,0,0.07)",
              }}
            >
              <Card.Body className="p-2 p-md-3 text-center">
                <div
                  style={{
                    fontSize: "1.35rem",
                    color: "var(--tropical-green)",
                  }}
                >
                  📍
                </div>

                <div className="fw-bold">
                  {totalDests}
                </div>

                <small className="text-muted">
                  Stop{totalDests !== 1 ? "s" : ""}
                </small>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={4}>
            <Card
              className="border-0 h-100"
              style={{
                borderRadius: 14,
                boxShadow:
                  "0 2px 10px rgba(0,0,0,0.07)",
              }}
            >
              <Card.Body className="p-2 p-md-3 text-center">
                <div style={{ fontSize: "1.35rem" }}>
                  🌴
                </div>

                <div className="fw-bold">
                  {destinations.length}
                </div>

                <small className="text-muted">
                  Places
                </small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* ACTION BAR */}
        <Card
          className="border-0 mb-4"
          style={{
            borderRadius: 16,
            boxShadow:
              "0 3px 14px rgba(0,0,0,0.08)",
          }}
        >
          <Card.Body className="p-3">
            <div className="d-flex flex-wrap gap-2">
              <Button
                onClick={openCustomizer}
                style={{
                  background:
                    "linear-gradient(135deg, var(--tropical-green), #11998e)",
                  border: "none",
                  padding: "8px 18px",
                  fontWeight: 600,
                  borderRadius: 10,
                }}
              >
                ✨ Customize Trip
              </Button>

              <Button
                onClick={addDay}
                variant="outline-success"
                style={{
                  padding: "8px 18px",
                  fontWeight: 600,
                  borderRadius: 10,
                }}
              >
                ➕ Add Day
              </Button>

              <Button
                variant="outline-success"
                onClick={saveItinerary}
                disabled={days.length === 0}
                style={{
                  padding: "8px 18px",
                  fontWeight: 600,
                  borderRadius: 10,
                }}
              >
                {saved ? "✅ Saved!" : "💾 Save"}
              </Button>

              <Button
                variant="outline-warning"
                onClick={exportPDF}
                disabled={totalDests === 0}
                style={{
                  padding: "8px 18px",
                  fontWeight: 600,
                  borderRadius: 10,
                }}
              >
                📄 Export PDF
              </Button>

              {days.length > 0 && (
                <Button
                  variant="outline-danger"
                  onClick={() => setShowClearModal(true)}
                  style={{
                    padding: "8px 18px",
                    fontWeight: 600,
                    borderRadius: 10,
                  }}
                >
                  🗑️ Clear
                </Button>
              )}

              <Link
                to="/request-itinerary"
                className="btn btn-outline-primary"
                style={{
                  padding: "8px 18px",
                  fontWeight: 600,
                  borderRadius: 10,
                }}
              >
                🧭 Request Guided Tour
              </Link>
            </div>
          </Card.Body>
        </Card>

        {/* EMPTY STATE */}
        {days.length === 0 ? (
          <Card
            className="border-0 text-center"
            style={{
              borderRadius: 20,
              background:
                "linear-gradient(135deg, var(--tropical-green-light), #ffffff)",
              boxShadow:
                "0 4px 18px rgba(0,0,0,0.07)",
            }}
          >
            <Card.Body className="py-5 px-3">
              <div
                style={{
                  fontSize: "4rem",
                  marginBottom: "0.75rem",
                }}
              >
                🗓️
              </div>

              <h4
                className="fw-bold mb-2"
                style={{
                  fontFamily: "Poppins, serif",
                }}
              >
                Start With Your Travel Style
              </h4>

              <p
                className="text-muted mx-auto mb-4"
                style={{
                  maxWidth: 560,
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                }}
              >
                Choose your dates, interests, group, pace,
                and budget. Your itinerary will be built
                using available Calbayog attractions.
              </p>

              <div className="d-flex justify-content-center flex-wrap gap-2">
                <Button
                  onClick={openCustomizer}
                  style={{
                    background:
                      "linear-gradient(135deg, var(--tropical-green), #11998e)",
                    border: "none",
                    borderRadius: 12,
                    padding: "10px 24px",
                    fontWeight: 600,
                  }}
                >
                  ✨ Build My Itinerary
                </Button>

                <Button
                  variant="outline-success"
                  onClick={addDay}
                  style={{
                    borderRadius: 12,
                    padding: "10px 24px",
                    fontWeight: 600,
                  }}
                >
                  Create Manually
                </Button>
              </div>
            </Card.Body>
          </Card>
        ) : (
          <Row className="g-3 g-md-4">
            {days.map((day) => (
              <Col xs={12} md={6} lg={4} key={day.id}>
                <Card
                  className="h-100 border-0"
                  style={{
                    borderRadius: 18,
                    boxShadow:
                      "0 4px 16px rgba(0,0,0,0.08)",
                    overflow: "hidden",
                    transition:
                      "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-3px)";

                    e.currentTarget.style.boxShadow =
                      "0 9px 26px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(0)";

                    e.currentTarget.style.boxShadow =
                      "0 4px 16px rgba(0,0,0,0.08)";
                  }}
                >
                  {/* DAY HEADER */}
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, var(--tropical-green), #11998e)",
                      color: "#fff",
                      padding: "14px 16px",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <small
                          style={{
                            opacity: 0.8,
                            fontSize: "0.7rem",
                            textTransform:
                              "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          Your itinerary
                        </small>

                        <h5
                          className="fw-bold mb-0"
                          style={{
                            fontFamily:
                              "Poppins, serif",
                          }}
                        >
                          Day {day.day}
                        </h5>

                        {day.date && (
                          <small
                            style={{
                              opacity: 0.9,
                              fontSize: "0.72rem",
                            }}
                          >
                            {formatDate(day.date)}
                          </small>
                        )}
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <Badge
                          bg="light"
                          className="text-dark"
                          style={{
                            borderRadius: 20,
                            padding: "6px 10px",
                            fontSize: "0.7rem",
                          }}
                        >
                          {day.destinations.length} stop
                          {day.destinations.length !==
                          1
                            ? "s"
                            : ""}
                        </Badge>

                        <button
                          onClick={() =>
                            removeDay(day.id)
                          }
                          title="Remove this day"
                          style={{
                            border: "none",
                            background:
                              "rgba(255,255,255,0.15)",
                            color: "#fff",
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            cursor: "pointer",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>

                  <Card.Body className="p-3">
                    {day.destinations.length > 0 ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={
                          closestCenter
                        }
                        onDragEnd={(e) =>
                          handleDragEnd(
                            e,
                            day.id,
                          )
                        }
                      >
                        <SortableContext
                          items={day.destinations.map(
                            (d) => d.id,
                          )}
                          strategy={
                            verticalListSortingStrategy
                          }
                        >
                          {day.destinations.map(
                            (dest, index) => (
                              <SortableItem
                                key={dest.id}
                                id={dest.id}
                                dest={dest}
                                index={index}
                                onRemove={() =>
                                  removeDestFromDay(
                                    day.id,
                                    dest.id,
                                  )
                                }
                              />
                            ),
                          )}
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <div
                        className="text-center py-4 mb-3"
                        style={{
                          background:
                            "var(--tropical-green-light)",
                          border:
                            "2px dashed var(--tropical-green)",
                          borderRadius: 14,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "2rem",
                          }}
                        >
                          📍
                        </div>

                        <p
                          className="mb-1 fw-semibold"
                          style={{
                            color:
                              "var(--tropical-green)",
                            fontSize: "0.85rem",
                          }}
                        >
                          No attractions yet
                        </p>

                        <small className="text-muted">
                          Add places you want to
                          visit
                        </small>
                      </div>
                    )}

                    {day.notes && (
                      <div
                        className="mb-3"
                        style={{
                          background: "#f8f9fa",
                          borderRadius: 10,
                          padding: "9px 11px",
                          fontSize: "0.72rem",
                          color: "#6c757d",
                        }}
                      >
                        💡 {day.notes}
                      </div>
                    )}

                    <Button
                      variant="outline-success"
                      className="w-100"
                      onClick={() =>
                        openPicker(day.id)
                      }
                      style={{
                        padding: "10px",
                        fontWeight: 600,
                        borderRadius: 11,
                        borderWidth: 2,
                      }}
                    >
                      ➕ Add Attraction
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Helpful tip */}
        {days.length > 0 && (
          <Alert
            className="mt-4 border-0"
            style={{
              background: "#f8f9fa",
              borderRadius: 14,
              fontSize: "0.82rem",
            }}
          >
            💡 <strong>Planning tip:</strong> Drag the
            ⋮⋮ handle to change the order of your stops.
            You can also remove attractions or add more
            places anytime. Your itinerary is stored
            locally in your browser.
          </Alert>
        )}
      </Container>

      {/* CUSTOMIZER MODAL */}
      <Modal
        show={showCustomizer}
        onHide={() => setShowCustomizer(false)}
        centered
        scrollable
        size="lg"
      >
        <Modal.Header
          closeButton
          style={{
            border: "none",
            paddingBottom: 8,
          }}
        >
          <div>
            <Modal.Title
              style={{
                fontFamily: "Poppins, serif",
                fontSize: "1.3rem",
                fontWeight: 700,
              }}
            >
              ✨ Customize Your Trip
            </Modal.Title>

            <small className="text-muted">
              Tell us what kind of Calbayog experience
              you want.
            </small>
          </div>
        </Modal.Header>

        <Modal.Body
          style={{
            background: "#fafafa",
          }}
        >
          {customizerError && (
            <Alert
              variant="danger"
              dismissible
              onClose={() =>
                setCustomizerError("")
              }
              style={{
                borderRadius: 12,
                fontSize: "0.82rem",
              }}
            >
              {customizerError}
            </Alert>
          )}

          {/* DATES */}
          <Card
            className="border-0 mb-3"
            style={{
              borderRadius: 15,
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Card.Body className="p-3">
              <h6 className="fw-bold mb-1">
                📅 When are you traveling?
              </h6>

              <small className="text-muted d-block mb-3">
                Choose the dates you'd like to explore
                Calbayog.
              </small>

              <Row className="g-3">
                <Col xs={12} md={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.78rem" }}
                  >
                    Start date
                  </Form.Label>

                  <Form.Control
                    type="date"
                    value={
                      preferences.travelDateStart
                    }
                    onChange={(e) =>
                      updatePreference(
                        "travelDateStart",
                        e.target.value,
                      )
                    }
                    style={{
                      borderRadius: 10,
                      padding: "10px 12px",
                    }}
                  />
                </Col>

                <Col xs={12} md={6}>
                  <Form.Label
                    className="fw-semibold"
                    style={{ fontSize: "0.78rem" }}
                  >
                    End date
                  </Form.Label>

                  <Form.Control
                    type="date"
                    min={
                      preferences.travelDateStart ||
                      undefined
                    }
                    value={
                      preferences.travelDateEnd
                    }
                    onChange={(e) =>
                      updatePreference(
                        "travelDateEnd",
                        e.target.value,
                      )
                    }
                    style={{
                      borderRadius: 10,
                      padding: "10px 12px",
                    }}
                  />
                </Col>
              </Row>

              {tripDays > 0 && (
                <div
                  className="mt-3"
                  style={{
                    background:
                      "var(--tropical-green-light)",
                    color:
                      "var(--tropical-green)",
                    borderRadius: 10,
                    padding: "9px 12px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                  }}
                >
                  🗓️ That's a {tripDays}-day trip.
                </div>
              )}
            </Card.Body>
          </Card>

          {/* TRAVELERS */}
          <Card
            className="border-0 mb-3"
            style={{
              borderRadius: 15,
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Card.Body className="p-3">
              <h6 className="fw-bold mb-1">
                👥 Who's traveling?
              </h6>

              <small className="text-muted d-block mb-3">
                This helps us keep the plan appropriate
                for your group.
              </small>

              <Row className="g-2 mb-3">
                {travelerTypes.map((type) => {
                  const selected =
                    preferences.groupType ===
                    type.value;

                  return (
                    <Col xs={6} md={3} key={type.value}>
                      <button
                        type="button"
                        onClick={() =>
                          updatePreference(
                            "groupType",
                            type.value,
                          )
                        }
                        style={{
                          width: "100%",
                          textAlign: "left",
                          border: selected
                            ? "2px solid var(--tropical-green)"
                            : "1px solid #dee2e6",
                          background: selected
                            ? "#effcf4"
                            : "#fff",
                          borderRadius: 11,
                          padding: "10px",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            color: "#212529",
                          }}
                        >
                          {type.label}
                        </div>

                        <small
                          className="text-muted"
                          style={{
                            fontSize: "0.68rem",
                          }}
                        >
                          {type.description}
                        </small>
                      </button>
                    </Col>
                  );
                })}
              </Row>

              <Form.Label
                className="fw-semibold"
                style={{ fontSize: "0.78rem" }}
              >
                Number of travelers
              </Form.Label>

              <Form.Control
                type="number"
                min={1}
                max={50}
                value={preferences.groupSize}
                onChange={(e) =>
                  updatePreference(
                    "groupSize",
                    Math.max(
                      1,
                      Number(e.target.value) || 1,
                    ),
                  )
                }
                style={{
                  maxWidth: 180,
                  borderRadius: 10,
                }}
              />
            </Card.Body>
          </Card>

          {/* INTERESTS */}
          <Card
            className="border-0 mb-3"
            style={{
              borderRadius: 15,
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Card.Body className="p-3">
              <h6 className="fw-bold mb-1">
                ❤️ What are you interested in?
              </h6>

              <small className="text-muted d-block mb-3">
                Pick one or more. We'll use these to
                personalize your attractions.
              </small>

              <div className="d-flex flex-wrap gap-2">
                {interestOptions.map((interest) => {
                  const selected =
                    preferences.selectedInterests.includes(
                      interest.value,
                    );

                  return (
                    <button
                      type="button"
                      key={interest.value}
                      onClick={() =>
                        toggleInterest(
                          interest.value,
                        )
                      }
                      style={{
                        border: selected
                          ? "2px solid var(--tropical-green)"
                          : "1px solid #dee2e6",
                        background: selected
                          ? "var(--tropical-green-light)"
                          : "#fff",
                        color: selected
                          ? "var(--tropical-green)"
                          : "#495057",
                        borderRadius: 22,
                        padding: "8px 12px",
                        fontSize: "0.76rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {interest.label}
                      {selected && " ✓"}
                    </button>
                  );
                })}
              </div>
            </Card.Body>
          </Card>

          {/* PACE */}
          <Card
            className="border-0 mb-3"
            style={{
              borderRadius: 15,
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Card.Body className="p-3">
              <h6 className="fw-bold mb-1">
                🧭 What's your travel pace?
              </h6>

              <small className="text-muted d-block mb-3">
                We'll use this to decide how many stops
                to suggest each day.
              </small>

              <Row className="g-2">
                {paceOptions.map((pace) => {
                  const selected =
                    preferences.travelPace ===
                    pace.value;

                  return (
                    <Col xs={12} md={4} key={pace.value}>
                      <button
                        type="button"
                        onClick={() =>
                          updatePreference(
                            "travelPace",
                            pace.value,
                          )
                        }
                        style={{
                          width: "100%",
                          textAlign: "left",
                          border: selected
                            ? "2px solid var(--tropical-green)"
                            : "1px solid #dee2e6",
                          background: selected
                            ? "#effcf4"
                            : "#fff",
                          borderRadius: 11,
                          padding: "11px",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "0.82rem",
                          }}
                        >
                          {pace.label}
                        </div>

                        <small
                          className="text-muted"
                          style={{
                            fontSize: "0.68rem",
                          }}
                        >
                          {pace.description}
                        </small>
                      </button>
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>

          {/* BUDGET */}
          <Card
            className="border-0 mb-3"
            style={{
              borderRadius: 15,
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Card.Body className="p-3">
              <h6 className="fw-bold mb-1">
                💰 What's your budget preference?
              </h6>

              <small className="text-muted d-block mb-3">
                This preference is saved with your trip
                and can guide future planning features.
              </small>

              <Row className="g-2">
                {budgetOptions.map((budget) => {
                  const selected =
                    preferences.budget ===
                    budget.value;

                  return (
                    <Col xs={12} md={4} key={budget.value}>
                      <button
                        type="button"
                        onClick={() =>
                          updatePreference(
                            "budget",
                            budget.value,
                          )
                        }
                        style={{
                          width: "100%",
                          textAlign: "left",
                          border: selected
                            ? "2px solid var(--tropical-green)"
                            : "1px solid #dee2e6",
                          background: selected
                            ? "#effcf4"
                            : "#fff",
                          borderRadius: 11,
                          padding: "11px",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "0.82rem",
                          }}
                        >
                          {budget.label}
                        </div>

                        <small
                          className="text-muted"
                          style={{
                            fontSize: "0.68rem",
                          }}
                        >
                          {budget.description}
                        </small>
                      </button>
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>

          {/* SPECIAL REQUESTS */}
          <Card
            className="border-0"
            style={{
              borderRadius: 15,
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Card.Body className="p-3">
              <h6 className="fw-bold mb-1">
                📝 Anything else?
              </h6>

              <small className="text-muted d-block mb-3">
                Optional. Add anything you'd like us to
                consider.
              </small>

              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Example: We are traveling with children, we'd like more time for photos, or we'd like to focus on nature..."
                value={preferences.specialRequests}
                onChange={(e) =>
                  updatePreference(
                    "specialRequests",
                    e.target.value,
                  )
                }
                style={{
                  borderRadius: 11,
                  resize: "vertical",
                }}
              />
            </Card.Body>
          </Card>

          {/* GENERATOR INFO */}
          <div
            className="mt-3"
            style={{
              background: "#f8f9fa",
              borderRadius: 12,
              padding: "11px 13px",
              fontSize: "0.72rem",
              color: "#6c757d",
            }}
          >
            💡 Your itinerary is created from the
            attractions currently available in the Calbayog
            tourism database. You can edit the generated
            plan afterward.
          </div>
        </Modal.Body>

        <Modal.Footer
          style={{
            borderTop: "1px solid #eee",
            background: "#fff",
          }}
        >
          <Button
            variant="outline-secondary"
            onClick={() => setShowCustomizer(false)}
            style={{
              borderRadius: 10,
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="outline-success"
            onClick={savePreferences}
            style={{
              borderRadius: 10,
              fontWeight: 600,
            }}
          >
            {customizationSaved
              ? "✅ Saved"
              : "💾 Save Preferences"}
          </Button>

          <Button
            onClick={generateItinerary}
            disabled={destinations.length === 0}
            style={{
              background:
                "linear-gradient(135deg, var(--tropical-green), #11998e)",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              padding: "9px 18px",
            }}
          >
            ✨ Generate My Itinerary
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ATTRACTION PICKER */}
      <Modal
        show={showPicker}
        onHide={() => setShowPicker(false)}
        centered
        scrollable
        size="lg"
      >
        <Modal.Header
          closeButton
          style={{
            border: "none",
            paddingBottom: "8px",
          }}
        >
          <div>
            <Modal.Title
              style={{
                fontFamily: "Poppins, serif",
                fontSize: "1.25rem",
              }}
            >
              🌟 Pick an Attraction
            </Modal.Title>

            <small className="text-muted">
              Choose a place to add to your itinerary
            </small>
          </div>
        </Modal.Header>

        <Modal.Body
          style={{
            maxHeight: "65vh",
            background: "#fafafa",
          }}
        >
          <div
            className="p-3 mb-3"
            style={{
              background: "#fff",
              borderRadius: 14,
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Form.Control
              type="search"
              placeholder="🔎 Search attractions..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              style={{
                borderRadius: 10,
                padding: "10px 12px",
              }}
            />

            <div
              className="d-flex gap-2 mt-2"
              style={{
                overflowX: "auto",
                whiteSpace: "nowrap",
                paddingBottom: 2,
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    border:
                      category === cat
                        ? "2px solid var(--tropical-green)"
                        : "1px solid #dee2e6",
                    background:
                      category === cat
                        ? "var(--tropical-green)"
                        : "#fff",
                    color:
                      category === cat
                        ? "#fff"
                        : "#495057",
                    borderRadius: 20,
                    padding: "5px 11px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <small className="text-muted">
              {filteredDestinations.length} attraction
              {filteredDestinations.length !== 1
                ? "s"
                : ""}{" "}
              found
            </small>
          </div>

          {filteredDestinations.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: "3rem" }}>
                🔎
              </div>

              <p className="text-muted mt-2 mb-0">
                No attractions match your search.
              </p>
            </div>
          ) : (
            <Row className="g-3">
              {filteredDestinations.map((dest) => {
                const alreadyUsed =
                  usedDestinationIds.has(dest.id);

                return (
                  <Col
                    xs={12}
                    md={6}
                    key={dest.id}
                  >
                    <div
                      onClick={() => {
                        if (!alreadyUsed) {
                          addDestToDay(dest);
                        }
                      }}
                      style={{
                        border: alreadyUsed
                          ? "1px solid #e9ecef"
                          : "2px solid #e9ecef",
                        borderRadius: 14,
                        background: alreadyUsed
                          ? "#f5f5f5"
                          : "#fff",
                        padding: 12,
                        cursor: alreadyUsed
                          ? "default"
                          : "pointer",
                        opacity: alreadyUsed ? 0.65 : 1,
                        transition:
                          "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!alreadyUsed) {
                          e.currentTarget.style.borderColor =
                            "var(--tropical-green)";

                          e.currentTarget.style.transform =
                            "translateY(-2px)";

                          e.currentTarget.style.boxShadow =
                            "0 5px 15px rgba(0,0,0,0.08)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!alreadyUsed) {
                          e.currentTarget.style.borderColor =
                            "#e9ecef";

                          e.currentTarget.style.transform =
                            "translateY(0)";

                          e.currentTarget.style.boxShadow =
                            "none";
                        }
                      }}
                    >
                      <div className="d-flex gap-3 align-items-center">
                        {dest.images?.[0] ? (
                          <img
                            src={dest.images[0]}
                            alt={dest.name}
                            style={{
                              width: 65,
                              height: 65,
                              objectFit: "cover",
                              borderRadius: 12,
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 65,
                              height: 65,
                              background:
                                "linear-gradient(135deg, var(--tropical-green-light), var(--tropical-green))",
                              borderRadius: 12,
                              display: "flex",
                              alignItems: "center",
                              justifyContent:
                                "center",
                              fontSize: "1.7rem",
                              flexShrink: 0,
                            }}
                          >
                            🌿
                          </div>
                        )}

                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <p
                            className="mb-1 fw-bold"
                            style={{
                              fontSize: "0.9rem",
                              color: "#212529",
                            }}
                          >
                            {dest.name}
                          </p>

                          <Badge
                            style={{
                              background:
                                categoryColors[
                                  dest.category
                                ] ||
                                "var(--tropical-green)",
                              fontSize: "0.62rem",
                            }}
                          >
                            {dest.category}
                          </Badge>

                          {dest.location_address && (
                            <small
                              className="text-muted d-block mt-1"
                              style={{
                                fontSize: "0.68rem",
                                overflow: "hidden",
                                textOverflow:
                                  "ellipsis",
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              📍{" "}
                              {dest.location_address}
                            </small>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: "1.3rem",
                            color: alreadyUsed
                              ? "#adb5bd"
                              : "var(--tropical-green)",
                          }}
                        >
                          {alreadyUsed ? "✓" : "＋"}
                        </div>
                      </div>

                      {alreadyUsed && (
                        <small
                          className="text-muted d-block mt-2"
                          style={{
                            fontSize: "0.65rem",
                            textAlign: "right",
                          }}
                        >
                          Already in itinerary
                        </small>
                      )}
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </Modal.Body>
      </Modal>

      {/* CLEAR CONFIRMATION */}
      <Modal
        show={showClearModal}
        onHide={() => setShowClearModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title
            style={{
              fontFamily: "Poppins, serif",
              fontSize: "1.1rem",
            }}
          >
            🗑️ Clear Itinerary?
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p className="mb-2">
            Are you sure you want to remove your entire
            itinerary?
          </p>

          <small className="text-muted">
            This will remove {totalDays} day
            {totalDays !== 1 ? "s" : ""} and{" "}
            {totalDests} attraction
            {totalDests !== 1 ? "s" : ""}.
          </small>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowClearModal(false)}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            onClick={clearItinerary}
          >
            Yes, Clear Itinerary
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ItineraryPlanner;
