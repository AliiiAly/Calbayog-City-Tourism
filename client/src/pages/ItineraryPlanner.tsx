import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
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

import {
  CalendarDays,
  Check,
  ChevronRight,
  CirclePlus,
  Compass,
  Download,
  FileDown,
  GripVertical,
  Heart,
  Leaf,
  MapPin,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import { getAttractions } from "../services/api";
import {
  Destination,
  ItineraryDay,
} from "../types";

/* =========================================================
   BRAND
========================================================= */

const CALBAYOG_BLUE = "#2D3195";
const SOFT_BLUE = "#EEF0FF";

/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY = "calbayog_itinerary";
const PREFERENCES_STORAGE_KEY =
  "calbayog_itinerary_preferences";

/* =========================================================
   CATEGORY COLORS
========================================================= */

const categoryColors: Record<
  string,
  string
> = {
  Nature: "#1A7A4A",
  Waterfalls: "#0077B6",
  Beach: "#00A8CC",
  Beaches: "#00A8CC",
  "History and Culture": "#765548",
  Cultural: "#765548",
  Historical: "#6D4C41",
  Religious: "#B56A00",
  "Industrial Tourism": "#536878",
  Shopping: "#B56A00",
  Food: "#7B2D8B",
  Adventure: "#C73545",
  Other: "#68736D",
};

/* =========================================================
   INTEREST OPTIONS
========================================================= */

const interestOptions = [
  {
    value: "Nature",
    label: "Nature",
    icon: Leaf,
    keywords: [
      "nature",
      "eco",
      "forest",
      "park",
      "river",
      "lake",
    ],
  },
  {
    value: "Waterfalls",
    label: "Waterfalls",
    icon: Compass,
    keywords: [
      "waterfall",
      "falls",
      "cascade",
    ],
  },
  {
    value: "Beach",
    label: "Beach",
    icon: MapPin,
    keywords: [
      "beach",
      "coast",
      "sea",
      "island",
      "marine",
    ],
  },
  {
    value: "History and Culture",
    label: "History & Culture",
    icon: Compass,
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
    label: "Heritage & Religion",
    icon: Compass,
    keywords: [
      "religious",
      "church",
      "religion",
      "faith",
      "shrine",
    ],
  },
  {
    value: "Adventure",
    label: "Adventure",
    icon: Compass,
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
    label: "Food",
    icon: WalletCards,
    keywords: [
      "food",
      "restaurant",
      "dining",
      "eat",
      "culinary",
    ],
  },
  {
    value: "Shopping",
    label: "Shopping",
    icon: WalletCards,
    keywords: [
      "shopping",
      "market",
      "souvenir",
      "shop",
    ],
  },
  {
    value: "Industrial Tourism",
    label: "Industrial Tourism",
    icon: Compass,
    keywords: [
      "industrial",
      "industry",
      "factory",
      "production",
    ],
  },
];

/* =========================================================
   TRAVELER TYPES
========================================================= */

const travelerTypes = [
  {
    value: "Solo",
    label: "Solo",
    description: "Just me",
  },
  {
    value: "Couple",
    label: "Couple",
    description: "Two travelers",
  },
  {
    value: "Family",
    label: "Family",
    description: "Family trip",
  },
  {
    value: "Friends",
    label: "Friends",
    description: "Friends together",
  },
  {
    value: "Group",
    label: "Group",
    description: "Larger group",
  },
];

/* =========================================================
   PACE OPTIONS
========================================================= */

const paceOptions = [
  {
    value: "Relaxed",
    label: "Relaxed",
    description: "More time, fewer stops",
    stopsPerDay: 2,
  },
  {
    value: "Balanced",
    label: "Balanced",
    description: "Comfortable sightseeing",
    stopsPerDay: 3,
  },
  {
    value: "Packed",
    label: "Packed",
    description: "See as much as possible",
    stopsPerDay: 4,
  },
];

/* =========================================================
   BUDGET OPTIONS
========================================================= */

const budgetOptions = [
  {
    value: "Budget-friendly",
    label: "Budget-friendly",
    description: "Keep costs practical",
  },
  {
    value: "Moderate",
    label: "Moderate",
    description: "A comfortable balance",
  },
  {
    value: "Flexible",
    label: "Flexible",
    description: "Cost is less important",
  },
];

/* =========================================================
   PREFERENCES
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

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (
  dateString?: string,
) => {
  if (!dateString) return "";

  const date = new Date(
    `${dateString}T00:00:00`,
  );

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
};

const getTripDays = (
  startDate: string,
  endDate: string,
) => {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(
    `${startDate}T00:00:00`,
  );

  const end = new Date(
    `${endDate}T00:00:00`,
  );

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return 0;
  }

  return (
    Math.floor(
      (end.getTime() -
        start.getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1
  );
};

const getDateForDay = (
  startDate: string,
  dayNumber: number,
) => {
  if (!startDate) {
    return undefined;
  }

  const date = new Date(
    `${startDate}T00:00:00`,
  );

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  date.setDate(
    date.getDate() + dayNumber - 1,
  );

  return date
    .toISOString()
    .split("T")[0];
};

const getDestinationSearchText = (
  dest: Destination,
) => {
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
  if (
    selectedInterests.length === 0
  ) {
    return 0;
  }

  const category = (
    dest.category || ""
  ).toLowerCase();

  const searchText =
    getDestinationSearchText(dest);

  let score = 0;

  selectedInterests.forEach(
    (interest) => {
      const option =
        interestOptions.find(
          (item) =>
            item.value === interest,
        );

      if (!option) return;

      if (
        category ===
        interest.toLowerCase()
      ) {
        score += 10;
      }

      option.keywords.forEach(
        (keyword) => {
          if (
            searchText.includes(
              keyword.toLowerCase(),
            )
          ) {
            score += 3;
          }
        },
      );
    },
  );

  if (dest.featured) {
    score += 1;
  }

  return score;
};

/* =========================================================
   GENERATE CUSTOMIZED ITINERARY
========================================================= */

const generateCustomizedDays = (
  destinations: Destination[],
  preferences: ItineraryPreferences,
): ItineraryDay[] => {
  const tripDays = getTripDays(
    preferences.travelDateStart,
    preferences.travelDateEnd,
  );

  if (
    tripDays <= 0 ||
    destinations.length === 0
  ) {
    return [];
  }

  const pace =
    paceOptions.find(
      (option) =>
        option.value ===
        preferences.travelPace,
    ) || paceOptions[1];

  const stopsPerDay =
    pace.stopsPerDay;

  const scoredDestinations =
    destinations
      .filter(
        (dest) =>
          dest.is_active !== false,
      )
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

        if (
          Boolean(b.dest.featured) !==
          Boolean(a.dest.featured)
        ) {
          return b.dest.featured
            ? 1
            : -1;
        }

        return a.dest.name.localeCompare(
          b.dest.name,
        );
      });

  let candidates =
    scoredDestinations;

  const hasInterestMatches =
    scoredDestinations.some(
      (item) => item.score > 0,
    );

  if (
    preferences.selectedInterests
      .length > 0 &&
    hasInterestMatches
  ) {
    candidates =
      scoredDestinations.filter(
        (item) => item.score > 0,
      );
  }

  const selected: Destination[] =
    [];

  const selectedIds =
    new Set<string>();

  for (const item of candidates) {
    if (
      selectedIds.has(item.dest.id)
    ) {
      continue;
    }

    selected.push(item.dest);
    selectedIds.add(item.dest.id);

    if (
      selected.length >=
      tripDays * stopsPerDay
    ) {
      break;
    }
  }

  if (
    selected.length <
    tripDays * stopsPerDay
  ) {
    for (
      const item of scoredDestinations
    ) {
      if (
        selectedIds.has(item.dest.id)
      ) {
        continue;
      }

      selected.push(item.dest);
      selectedIds.add(item.dest.id);

      if (
        selected.length >=
        tripDays * stopsPerDay
      ) {
        break;
      }
    }
  }

  const generatedDays:
    ItineraryDay[] = [];

  for (
    let index = 0;
    index < tripDays;
    index++
  ) {
    const start =
      index * stopsPerDay;

    const end =
      start + stopsPerDay;

    const dayDestinations =
      selected.slice(start, end);

    generatedDays.push({
      id: `day-${Date.now()}-${index}`,
      day: index + 1,
      date: getDateForDay(
        preferences.travelDateStart,
        index + 1,
      ),
      destinations:
        dayDestinations,
      notes:
        preferences.travelPace ===
        "Relaxed"
          ? "A relaxed day with more time to enjoy each attraction."
          : preferences.travelPace ===
            "Packed"
            ? "A fuller sightseeing day. Adjust the order or remove stops if needed."
            : "A balanced sightseeing day.",
    });
  }

  return generatedDays;
};

/* =========================================================
   SORTABLE ITINERARY ITEM
========================================================= */

const SortableItem: React.FC<{
  id: string;
  dest: Destination;
  index: number;
  onRemove: () => void;
}> = ({
  id,
  dest,
  index,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform:
      CSS.Transform.toString(
        transform,
      ),
    transition,
  };

  const categoryColor =
    categoryColors[
      dest.category
    ] || CALBAYOG_BLUE;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: "#fff",
        borderRadius: 14,
        border: isDragging
          ? `1.5px solid ${CALBAYOG_BLUE}`
          : "1px solid #e9ecef",
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
        <GripVertical
          size={17}
          strokeWidth={1.8}
        />
      </button>

      <div
        className="planner-stop-number"
        style={{
          color: categoryColor,
          background:
            categoryColor ===
            CALBAYOG_BLUE
              ? SOFT_BLUE
              : `${categoryColor}12`,
        }}
      >
        {index + 1}
      </div>

      {dest.images?.[0] ? (
        <img
          src={dest.images[0]}
          alt={dest.name}
          className="planner-stop-image"
        />
      ) : (
        <div
          className="planner-stop-image planner-stop-placeholder"
        >
          <MapPin
            size={20}
            strokeWidth={1.7}
          />
        </div>
      )}

      <div className="planner-stop-content">
        <p className="planner-stop-name">
          {dest.name}
        </p>

        <div className="planner-stop-meta">
          <span
            className="planner-category-tag"
            style={{
              color: categoryColor,
              background:
                categoryColor ===
                CALBAYOG_BLUE
                  ? SOFT_BLUE
                  : `${categoryColor}12`,
            }}
          >
            {dest.category}
          </span>

          {dest.location_address && (
            <span className="planner-stop-location">
              <MapPin
                size={12}
                strokeWidth={1.8}
              />
              <span>
                {dest.location_address}
              </span>
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${dest.name}`}
        title="Remove attraction"
        className="planner-remove-button"
      >
        <X
          size={16}
          strokeWidth={1.9}
        />
      </button>
    </div>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const ItineraryPlanner: React.FC =
  () => {
    const [days, setDays] =
      useState<ItineraryDay[]>(() => {
        try {
          const stored =
            localStorage.getItem(
              STORAGE_KEY,
            );

          const parsed = stored
            ? JSON.parse(stored)
            : [];

          return Array.isArray(parsed)
            ? parsed.map(
                (
                  day: ItineraryDay,
                  index: number,
                ) => ({
                  ...day,
                  day: index + 1,
                  destinations:
                    Array.isArray(
                      day.destinations,
                    )
                      ? day.destinations
                      : [],
                }),
              )
            : [];
        } catch {
          return [];
        }
      });

    const [
      preferences,
      setPreferences,
    ] =
      useState<ItineraryPreferences>(
        () => {
          try {
            const stored =
              localStorage.getItem(
                PREFERENCES_STORAGE_KEY,
              );

            if (!stored) {
              return defaultPreferences;
            }

            const parsed =
              JSON.parse(stored);

            return {
              ...defaultPreferences,
              ...parsed,
              selectedInterests:
                Array.isArray(
                  parsed?.selectedInterests,
                )
                  ? parsed.selectedInterests
                  : [],
            };
          } catch {
            return defaultPreferences;
          }
        },
      );

    const [
      destinations,
      setDestinations,
    ] = useState<Destination[]>([]);

    const [
      showPicker,
      setShowPicker,
    ] = useState(false);

    const [
      showClearModal,
      setShowClearModal,
    ] = useState(false);

    const [
      showCustomizer,
      setShowCustomizer,
    ] = useState(false);

    const [
      activeDayId,
      setActiveDayId,
    ] = useState<string | null>(
      null,
    );

    const [
      saved,
      setSaved,
    ] = useState(false);

    const [
      generated,
      setGenerated,
    ] = useState(false);

    const [
      customizationSaved,
      setCustomizationSaved,
    ] = useState(false);

    const [
      search,
      setSearch,
    ] = useState("");

    const [
      category,
      setCategory,
    ] = useState("All");

    const [
      customizerError,
      setCustomizerError,
    ] = useState("");

    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter:
          sortableKeyboardCoordinates,
      }),
    );

    /* =====================================================
       LOAD ATTRACTIONS
    ===================================================== */

    useEffect(() => {
      getAttractions()
        .then((response) => {
          setDestinations(
            Array.isArray(
              response.data,
            )
              ? response.data
              : [],
          );
        })
        .catch((error) => {
          console.error(
            "Failed to load attractions:",
            error,
          );

          setDestinations([]);
        });
    }, []);

    /* =====================================================
       CATEGORY LIST
    ===================================================== */

    const categories = useMemo(() => {
      const unique =
        Array.from(
          new Set(
            destinations
              .map(
                (destination) =>
                  destination.category,
              )
              .filter(Boolean),
          ),
        );

      return [
        "All",
        ...unique,
      ];
    }, [destinations]);

    /* =====================================================
       FILTERED ATTRACTIONS
    ===================================================== */

    const filteredDestinations =
      useMemo(() => {
        const query =
          search
            .trim()
            .toLowerCase();

        return destinations.filter(
          (dest) => {
            const matchesSearch =
              !query ||
              dest.name
                ?.toLowerCase()
                .includes(query) ||
              dest.category
                ?.toLowerCase()
                .includes(query) ||
              dest.location_address
                ?.toLowerCase()
                .includes(query);

            const matchesCategory =
              category === "All" ||
              dest.category ===
                category;

            return (
              matchesSearch &&
              matchesCategory
            );
          },
        );
      }, [
        destinations,
        search,
        category,
      ]);

    /* =====================================================
       TOTALS
    ===================================================== */

    const totalDests =
      days.reduce(
        (sum, day) =>
          sum +
          (Array.isArray(
            day.destinations,
          )
            ? day.destinations.length
            : 0),
        0,
      );

    const totalDays =
      days.length;

    const tripDays =
      getTripDays(
        preferences.travelDateStart,
        preferences.travelDateEnd,
      );

    /* =====================================================
       USED DESTINATIONS
    ===================================================== */

    const usedDestinationIds =
      useMemo(() => {
        return new Set(
          days.flatMap((day) =>
            Array.isArray(
              day.destinations,
            )
              ? day.destinations.map(
                  (dest) =>
                    dest.id,
                )
              : [],
          ),
        );
      }, [days]);

    /* =====================================================
       ADD DAY
    ===================================================== */

    const addDay = () => {
      const newDay: ItineraryDay =
        {
          id: `day-${Date.now()}`,
          day: days.length + 1,
          date:
            preferences.travelDateStart
              ? getDateForDay(
                  preferences.travelDateStart,
                  days.length + 1,
                )
              : undefined,
          destinations: [],
        };

      setDays((previous) => [
        ...previous,
        newDay,
      ]);
    };

    /* =====================================================
       REMOVE DAY
    ===================================================== */

    const removeDay = (
      dayId: string,
    ) => {
      setDays((previous) =>
        previous
          .filter(
            (day) =>
              day.id !== dayId,
          )
          .map(
            (day, index) => ({
              ...day,
              day: index + 1,
              date:
                preferences.travelDateStart
                  ? getDateForDay(
                      preferences.travelDateStart,
                      index + 1,
                    )
                  : day.date,
            }),
          ),
      );
    };

    /* =====================================================
       OPEN ATTRACTION PICKER
    ===================================================== */

    const openPicker = (
      dayId: string,
    ) => {
      setActiveDayId(dayId);
      setSearch("");
      setCategory("All");
      setShowPicker(true);
    };

    /* =====================================================
       ADD DESTINATION
    ===================================================== */

    const addDestToDay = (
      dest: Destination,
    ) => {
      if (!activeDayId) {
        return;
      }

      setDays((previous) =>
        previous.map((day) =>
          day.id === activeDayId &&
          !day.destinations.some(
            (item) =>
              item.id === dest.id,
          )
            ? {
                ...day,
                destinations: [
                  ...day.destinations,
                  dest,
                ],
              }
            : day,
        ),
      );
    };

    /* =====================================================
       REMOVE DESTINATION
    ===================================================== */

    const removeDestFromDay = (
      dayId: string,
      destId: string,
    ) => {
      setDays((previous) =>
        previous.map((day) =>
          day.id === dayId
            ? {
                ...day,
                destinations:
                  Array.isArray(
                    day.destinations,
                  )
                    ? day.destinations.filter(
                        (item) =>
                          item.id !==
                          destId,
                      )
                    : [],
              }
            : day,
        ),
      );
    };

    /* =====================================================
       DRAG & DROP
    ===================================================== */

    const handleDragEnd = (
      event: DragEndEvent,
      dayId: string,
    ) => {
      const {
        active,
        over,
      } = event;

      if (
        !over ||
        active.id === over.id
      ) {
        return;
      }

      setDays((previous) =>
        previous.map((day) => {
          if (day.id !== dayId) {
            return day;
          }

          const oldIndex =
            day.destinations.findIndex(
              (destination) =>
                destination.id ===
                active.id,
            );

          const newIndex =
            day.destinations.findIndex(
              (destination) =>
                destination.id ===
                over.id,
            );

          if (
            oldIndex < 0 ||
            newIndex < 0
          ) {
            return day;
          }

          return {
            ...day,
            destinations:
              arrayMove(
                day.destinations,
                oldIndex,
                newIndex,
              ),
          };
        }),
      );
    };

    /* =====================================================
       UPDATE PREFERENCE
    ===================================================== */

    const updatePreference = <
      K extends keyof ItineraryPreferences,
    >(
      key: K,
      value: ItineraryPreferences[K],
    ) => {
      setPreferences(
        (previous) => ({
          ...previous,
          [key]: value,
        }),
      );

      setCustomizerError("");
    };

    /* =====================================================
       TOGGLE INTEREST
    ===================================================== */

    const toggleInterest = (
      interest: string,
    ) => {
      setPreferences(
        (previous) => {
          const exists =
            previous.selectedInterests.includes(
              interest,
            );

          return {
            ...previous,
            selectedInterests:
              exists
                ? previous.selectedInterests.filter(
                    (item) =>
                      item !== interest,
                  )
                : [
                    ...previous.selectedInterests,
                    interest,
                  ],
          };
        },
      );

      setCustomizerError("");
    };

    /* =====================================================
       VALIDATE
    ===================================================== */

    const validatePreferences =
      () => {
        if (
          !preferences.travelDateStart ||
          !preferences.travelDateEnd
        ) {
          return "Please choose your travel dates.";
        }

        if (
          preferences.travelDateEnd <
          preferences.travelDateStart
        ) {
          return "Your end date must be on or after your start date.";
        }

        if (
          !preferences.groupSize ||
          preferences.groupSize < 1
        ) {
          return "Please enter at least 1 traveler.";
        }

        if (
          preferences
            .selectedInterests.length ===
          0
        ) {
          return "Choose at least one interest so we can personalize your itinerary.";
        }

        return "";
      };

    /* =====================================================
       SAVE PREFERENCES
    ===================================================== */

    const savePreferences =
      () => {
        const validationError =
          validatePreferences();

        if (validationError) {
          setCustomizerError(
            validationError,
          );
          return false;
        }

        try {
          localStorage.setItem(
            PREFERENCES_STORAGE_KEY,
            JSON.stringify(
              preferences,
            ),
          );

          setCustomizationSaved(
            true,
          );

          window.setTimeout(
            () => {
              setCustomizationSaved(
                false,
              );
            },
            2000,
          );

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

    /* =====================================================
       GENERATE ITINERARY
    ===================================================== */

    const generateItinerary =
      () => {
        const validationError =
          validatePreferences();

        if (validationError) {
          setCustomizerError(
            validationError,
          );
          return;
        }

        if (
          destinations.length ===
          0
        ) {
          setCustomizerError(
            "No attractions are currently available. Please try again in a moment.",
          );
          return;
        }

        const generatedDays =
          generateCustomizedDays(
            destinations,
            preferences,
          );

        if (
          generatedDays.length ===
          0
        ) {
          setCustomizerError(
            "We couldn't build an itinerary from the available attractions.",
          );
          return;
        }

        try {
          localStorage.setItem(
            PREFERENCES_STORAGE_KEY,
            JSON.stringify(
              preferences,
            ),
          );

          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
              generatedDays,
            ),
          );
        } catch (error) {
          console.error(
            "Unable to save generated itinerary:",
            error,
          );
        }

        setDays(
          generatedDays,
        );

        setGenerated(true);
        setShowCustomizer(false);
        setCustomizerError("");

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      };

    /* =====================================================
       SAVE ITINERARY
    ===================================================== */

    const saveItinerary = () => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(days),
        );

        localStorage.setItem(
          PREFERENCES_STORAGE_KEY,
          JSON.stringify(
            preferences,
          ),
        );

        setSaved(true);

        window.setTimeout(
          () => {
            setSaved(false);
          },
          2000,
        );
      } catch (error) {
        console.error(
          "Unable to save itinerary:",
          error,
        );
      }
    };

    /* =====================================================
       CLEAR ITINERARY
    ===================================================== */

    const clearItinerary = () => {
      localStorage.removeItem(
        STORAGE_KEY,
      );

      setDays([]);
      setGenerated(false);
      setShowClearModal(false);
    };

    /* =====================================================
       EXPORT PDF
    ===================================================== */

    const exportPDF = () => {
      if (totalDests === 0) {
        return;
      }

      const doc = new jsPDF();

      doc.setFont(
        "helvetica",
        "bold",
      );

      doc.setFontSize(18);

      doc.text(
        "My Calbayog City Itinerary",
        14,
        20,
      );

      doc.setFont(
        "helvetica",
        "normal",
      );

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
          )} - ${formatDate(
            preferences.travelDateEnd,
          )}`,
          14,
          34,
        );

        doc.text(
          `${preferences.groupSize} traveler${
            preferences.groupSize !== 1
              ? "s"
              : ""
          } • ${
            preferences.groupType
          } • ${
            preferences.travelPace
          } pace`,
          14,
          40,
        );
      }

      doc.text(
        `${totalDays} day${
          totalDays !== 1
            ? "s"
            : ""
        } • ${totalDests} attraction${
          totalDests !== 1
            ? "s"
            : ""
        }`,
        14,
        preferences.travelDateStart
          ? 46
          : 34,
      );

      let y =
        preferences.travelDateStart
          ? 56
          : 44;

      days.forEach((day) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        doc.setFont(
          "helvetica",
          "bold",
        );

        doc.setFontSize(13);

        const dateLabel =
          day.date
            ? ` • ${formatDate(
                day.date,
              )}`
            : "";

        doc.text(
          `Day ${day.day}${dateLabel}`,
          14,
          y,
        );

        y += 6;

        if (
          !day.destinations ||
          day.destinations.length ===
            0
        ) {
          doc.setFont(
            "helvetica",
            "italic",
          );

          doc.setFontSize(10);

          doc.text(
            "No attractions added",
            14,
            y,
          );

          y += 10;
        } else {
          autoTable(doc, {
            startY: y,
            head: [[
              "#",
              "Attraction",
              "Category",
              "Address",
            ]],
            body:
              day.destinations.map(
                (
                  destination,
                  index,
                ) => [
                  String(index + 1),
                  destination.name,
                  destination.category,
                  destination.location_address ||
                    "",
                ],
              ),
            theme: "striped",
            headStyles: {
              fillColor: [
                45,
                49,
                149,
              ],
            },
            margin: {
              left: 14,
              right: 14,
            },
          });

          y =
            (
              doc as any
            ).lastAutoTable
              ?.finalY ||
            y;

          y += 12;
        }
      });

      doc.save(
        "calbayog_itinerary.pdf",
      );
    };

    /* =====================================================
       OPEN CUSTOMIZER
    ===================================================== */

    const openCustomizer = () => {
      setCustomizerError("");
      setShowCustomizer(true);
    };

    /* =====================================================
       SELECTED PACE
    ===================================================== */

    const selectedPace =
      paceOptions.find(
        (option) =>
          option.value ===
          preferences.travelPace,
      ) || paceOptions[1];

    /* =====================================================
       RENDER
    ===================================================== */

    return (
      <div className="page-enter itinerary-page">
        {/* ===================================================
            PAGE HEADER — MATCHES ATTRACTIONS
        =================================================== */}

        <section className="itinerary-header">
          <div className="itinerary-header-inner">
            <h1 className="itinerary-title">
              PLAN YOUR TRIP
            </h1>

            <p className="itinerary-subtitle">
              Create a personalized
              itinerary and discover
              the places you want to
              experience in Calbayog
              City.
            </p>
          </div>
        </section>

        <Container className="itinerary-container">
          {/* =================================================
              PLANNER INTRO
          ================================================= */}

          <section className="planner-intro">
            <div className="planner-intro-content">
              <div className="planner-intro-icon">
                <Sparkles
                  size={22}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <div className="planner-eyebrow">
                  PERSONALIZED PLANNING
                </div>

                <h2 className="planner-intro-title">
                  Build your Calbayog
                  adventure
                </h2>

                <p className="planner-intro-text">
                  Choose your travel
                  dates, interests,
                  group, pace, and
                  budget. We'll create
                  a starting itinerary
                  using the available
                  Calbayog attractions.
                </p>
              </div>
            </div>

            <Button
              onClick={
                openCustomizer
              }
              className="planner-primary-button"
            >
              <Sparkles
                size={16}
                strokeWidth={2}
              />
              Customize My Trip
            </Button>
          </section>

          {/* =================================================
              PREFERENCE SUMMARY
          ================================================= */}

          {(preferences
            .travelDateStart ||
            preferences
              .selectedInterests
              .length > 0) && (
            <section className="preference-section">
              <div className="preference-main">
                <div className="planner-eyebrow">
                  YOUR TRIP PROFILE
                </div>

                <h2 className="preference-title">
                  {preferences.travelDateStart &&
                  preferences.travelDateEnd
                    ? `${formatDate(
                        preferences.travelDateStart,
                      )} – ${formatDate(
                        preferences.travelDateEnd,
                      )}`
                    : "Trip details"}
                </h2>

                <div className="preference-tags">
                  {preferences.groupSize >
                    0 && (
                    <span className="preference-tag">
                      <Users
                        size={13}
                        strokeWidth={
                          1.8
                        }
                      />
                      {
                        preferences.groupSize
                      }{" "}
                      traveler
                      {preferences.groupSize !==
                      1
                        ? "s"
                        : ""}
                    </span>
                  )}

                  {preferences.groupType && (
                    <span className="preference-tag">
                      {
                        preferences.groupType
                      }
                    </span>
                  )}

                  {preferences.travelPace && (
                    <span className="preference-tag">
                      {
                        preferences.travelPace
                      }{" "}
                      pace
                    </span>
                  )}

                  {preferences.budget && (
                    <span className="preference-tag">
                      {
                        preferences.budget
                      }
                    </span>
                  )}
                </div>

                {preferences
                  .selectedInterests
                  .length > 0 && (
                  <div className="interest-summary">
                    {preferences.selectedInterests.map(
                      (interest) => {
                        const option =
                          interestOptions.find(
                            (item) =>
                              item.value ===
                              interest,
                          );

                        return (
                          <span
                            key={
                              interest
                            }
                            className="interest-summary-item"
                          >
                            {option?.label ||
                              interest}
                          </span>
                        );
                      },
                    )}
                  </div>
                )}
              </div>

              <Button
                variant="outline-primary"
                onClick={
                  openCustomizer
                }
                className="planner-secondary-button"
              >
                <Pencil
                  size={14}
                  strokeWidth={1.9}
                />
                Edit Preferences
              </Button>
            </section>
          )}

          {/* =================================================
              GENERATED NOTICE
          ================================================= */}

          {generated && (
            <div className="planner-success-message">
              <div className="planner-success-icon">
                <Check
                  size={18}
                  strokeWidth={2}
                />
              </div>

              <div>
                <strong>
                  Your personalized
                  itinerary is ready!
                </strong>

                <span>
                  We selected
                  attractions from
                  the available
                  Calbayog tourism
                  data based on your
                  preferences. You
                  can edit the plan
                  below.
                </span>
              </div>
            </div>
          )}

          {/* =================================================
              RESULTS / SUMMARY BAR
          ================================================= */}

          <div className="planner-results-bar">
            <div className="planner-results-left">
              <div className="planner-results-icon">
                <CalendarDays
                  size={18}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <div className="planner-results-label">
                  YOUR ITINERARY
                </div>

                <div className="planner-results-count">
                  <strong>
                    {totalDays}
                  </strong>{" "}
                  day
                  {totalDays !== 1
                    ? "s"
                    : ""}{" "}
                  ·{" "}
                  <strong>
                    {totalDests}
                  </strong>{" "}
                  stop
                  {totalDests !== 1
                    ? "s"
                    : ""}
                </div>
              </div>
            </div>

            <div className="planner-results-right">
              <span className="planner-results-description">
                {destinations.length}{" "}
                attractions available
              </span>

              {days.length >
                0 && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() =>
                    setShowClearModal(
                      true,
                    )
                  }
                  className="planner-clear-button"
                >
                  <Trash2
                    size={13}
                    strokeWidth={
                      1.8
                    }
                  />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="planner-actions">
            <Button
              onClick={
                openCustomizer
              }
              className="planner-action-primary"
            >
              <Sparkles
                size={15}
                strokeWidth={2}
              />
              Customize Trip
            </Button>

            <Button
              onClick={addDay}
              variant="outline-primary"
              className="planner-action-button"
            >
              <Plus
                size={15}
                strokeWidth={2}
              />
              Add Day
            </Button>

            <Button
              variant="outline-primary"
              onClick={
                saveItinerary
              }
              disabled={
                days.length === 0
              }
              className="planner-action-button"
            >
              {saved ? (
                <>
                  <Check
                    size={15}
                  />
                  Saved
                </>
              ) : (
                <>
                  <Download
                    size={15}
                  />
                  Save
                </>
              )}
            </Button>

            <Button
              variant="outline-primary"
              onClick={
                exportPDF
              }
              disabled={
                totalDests === 0
              }
              className="planner-action-button"
            >
              <FileDown
                size={15}
                strokeWidth={1.9}
              />
              Export PDF
            </Button>

            <Link
              to="/request-itinerary"
              className="planner-action-link"
            >
              <Compass
                size={15}
                strokeWidth={1.9}
              />
              Request Guided Tour
            </Link>
          </div>

          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {days.length === 0 ? (
            <section className="planner-empty-state">
              <div className="planner-empty-icon">
                <CalendarDays
                  size={32}
                  strokeWidth={1.5}
                />
              </div>

              <div className="planner-empty-eyebrow">
                YOUR TRIP STARTS HERE
              </div>

              <h2>
                Start planning your
                Calbayog adventure
              </h2>

              <p>
                Choose your dates,
                interests, group,
                pace, and budget.
                Your itinerary will
                be built using
                available Calbayog
                attractions.
              </p>

              <div className="planner-empty-actions">
                <Button
                  onClick={
                    openCustomizer
                  }
                  className="planner-action-primary"
                >
                  <Sparkles
                    size={15}
                  />
                  Build My Itinerary
                </Button>

                <Button
                  variant="outline-primary"
                  onClick={addDay}
                  className="planner-action-button"
                >
                  <Plus
                    size={15}
                  />
                  Create Manually
                </Button>
              </div>
            </section>
          ) : (
            /* =================================================
               DAY CARDS
            ================================================= */

            <Row className="planner-days-grid">
              {days.map((day) => {
                const dayColor =
                  day.destinations
                    .length > 0
                    ? categoryColors[
                        day
                          .destinations[0]
                          ?.category
                      ] ||
                      CALBAYOG_BLUE
                    : CALBAYOG_BLUE;

                return (
                  <Col
                    xs={12}
                    md={6}
                    lg={4}
                    key={day.id}
                    className="planner-day-col"
                  >
                    <Card className="planner-day-card">
                      {/* DAY HEADER */}

                      <div
                        className="planner-day-header"
                        style={{
                          borderTopColor:
                            dayColor,
                        }}
                      >
                        <div>
                          <div className="planner-day-eyebrow">
                            ITINERARY
                          </div>

                          <h3>
                            Day {day.day}
                          </h3>

                          {day.date && (
                            <div className="planner-day-date">
                              <CalendarDays
                                size={12}
                                strokeWidth={
                                  1.8
                                }
                              />
                              {formatDate(
                                day.date,
                              )}
                            </div>
                          )}
                        </div>

                        <div className="planner-day-header-actions">
                          <span className="planner-stop-count">
                            {
                              day
                                .destinations
                                .length
                            }{" "}
                            stop
                            {day
                              .destinations
                              .length !==
                            1
                              ? "s"
                              : ""}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              removeDay(
                                day.id,
                              )
                            }
                            title="Remove this day"
                            className="planner-day-delete"
                          >
                            <Trash2
                              size={14}
                              strokeWidth={
                                1.8
                              }
                            />
                          </button>
                        </div>
                      </div>

                      <Card.Body className="planner-day-body">
                        {day.destinations
                          .length >
                        0 ? (
                          <DndContext
                            sensors={
                              sensors
                            }
                            collisionDetection={
                              closestCenter
                            }
                            onDragEnd={(
                              event,
                            ) =>
                              handleDragEnd(
                                event,
                                day.id,
                              )
                            }
                          >
                            <SortableContext
                              items={day.destinations.map(
                                (
                                  destination,
                                ) =>
                                  destination.id,
                              )}
                              strategy={
                                verticalListSortingStrategy
                              }
                            >
                              {day.destinations.map(
                                (
                                  destination,
                                  index,
                                ) => (
                                  <SortableItem
                                    key={
                                      destination.id
                                    }
                                    id={
                                      destination.id
                                    }
                                    dest={
                                      destination
                                    }
                                    index={
                                      index
                                    }
                                    onRemove={() =>
                                      removeDestFromDay(
                                        day.id,
                                        destination.id,
                                      )
                                    }
                                  />
                                ),
                              )}
                            </SortableContext>
                          </DndContext>
                        ) : (
                          <div className="planner-no-stops">
                            <div className="planner-no-stops-icon">
                              <MapPin
                                size={22}
                                strokeWidth={
                                  1.6
                                }
                              />
                            </div>

                            <strong>
                              No attractions
                              yet
                            </strong>

                            <span>
                              Add places
                              you want
                              to visit
                            </span>
                          </div>
                        )}

                        {day.notes && (
                          <div className="planner-day-note">
                            <span className="planner-day-note-icon">
                              <SlidersHorizontal
                                size={
                                  13
                                }
                                strokeWidth={
                                  1.8
                                }
                              />
                            </span>

                            <span>
                              {
                                day.notes
                              }
                            </span>
                          </div>
                        )}

                        <Button
                          variant="outline-primary"
                          className="planner-add-attraction"
                          onClick={() =>
                            openPicker(
                              day.id,
                            )
                          }
                        >
                          <CirclePlus
                            size={15}
                            strokeWidth={
                              1.9
                            }
                          />
                          Add Attraction
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}

          {/* =================================================
              PLANNING TIP
          ================================================= */}

          {days.length > 0 && (
            <div className="planner-tip">
              <div className="planner-tip-icon">
                <GripVertical
                  size={16}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <strong>
                  Planning tip
                </strong>

                <span>
                  Drag the handle beside
                  each attraction to
                  change the order of
                  your stops. You can
                  also remove attractions
                  or add more places
                  anytime.
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
          onHide={() =>
            setShowCustomizer(false)
          }
          centered
          scrollable
          size="lg"
          className="planner-modal"
        >
          <Modal.Header
            closeButton
            className="planner-modal-header"
          >
            <div>
              <div className="planner-modal-eyebrow">
                TRIP CUSTOMIZER
              </div>

              <Modal.Title className="planner-modal-title">
                Customize Your Trip
              </Modal.Title>

              <p className="planner-modal-subtitle">
                Tell us what kind of
                Calbayog experience
                you want.
              </p>
            </div>
          </Modal.Header>

          <Modal.Body className="planner-modal-body">
            {customizerError && (
              <Alert
                variant="danger"
                dismissible
                onClose={() =>
                  setCustomizerError(
                    "",
                  )
                }
                className="planner-error"
              >
                {customizerError}
              </Alert>
            )}

            {/* DATES */}

            <section className="customizer-section">
              <div className="customizer-section-heading">
                <div className="customizer-section-icon">
                  <CalendarDays
                    size={17}
                    strokeWidth={
                      1.8
                    }
                  />
                </div>

                <div>
                  <h4>
                    When are you
                    traveling?
                  </h4>

                  <p>
                    Choose the dates
                    you'd like to
                    explore Calbayog.
                  </p>
                </div>
              </div>

              <Row className="g-3">
                <Col xs={12} md={6}>
                  <Form.Label className="planner-form-label">
                    Start date
                  </Form.Label>

                  <Form.Control
                    type="date"
                    value={
                      preferences.travelDateStart
                    }
                    onChange={(event) =>
                      updatePreference(
                        "travelDateStart",
                        event.target
                          .value,
                      )
                    }
                    className="planner-form-control"
                  />
                </Col>

                <Col xs={12} md={6}>
                  <Form.Label className="planner-form-label">
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
                    onChange={(event) =>
                      updatePreference(
                        "travelDateEnd",
                        event.target
                          .value,
                      )
                    }
                    className="planner-form-control"
                  />
                </Col>
              </Row>

              {tripDays > 0 && (
                <div className="planner-info-strip">
                  <CalendarDays
                    size={14}
                    strokeWidth={
                      1.8
                    }
                  />
                  That's a{" "}
                  <strong>
                    {tripDays}-day
                  </strong>{" "}
                  trip.
                </div>
              )}
            </section>

            {/* TRAVELERS */}

            <section className="customizer-section">
              <div className="customizer-section-heading">
                <div className="customizer-section-icon">
                  <Users
                    size={17}
                    strokeWidth={
                      1.8
                    }
                  />
                </div>

                <div>
                  <h4>
                    Who's traveling?
                  </h4>

                  <p>
                    This helps us keep
                    the plan appropriate
                    for your group.
                  </p>
                </div>
              </div>

              <Row className="g-2 mb-3">
                {travelerTypes.map(
                  (type) => {
                    const selected =
                      preferences.groupType ===
                      type.value;

                    return (
                      <Col
                        xs={6}
                        md={4}
                        key={
                          type.value
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            updatePreference(
                              "groupType",
                              type.value,
                            )
                          }
                          className={`planner-option-card ${
                            selected
                              ? "planner-option-card-active"
                              : ""
                          }`}
                        >
                          <span className="planner-option-title">
                            {
                              type.label
                            }
                          </span>

                          <small>
                            {
                              type.description
                            }
                          </small>

                          {selected && (
                            <span className="planner-option-check">
                              <Check
                                size={
                                  12
                                }
                              />
                            </span>
                          )}
                        </button>
                      </Col>
                    );
                  },
                )}
              </Row>

              <Form.Label className="planner-form-label">
                Number of travelers
              </Form.Label>

              <Form.Control
                type="number"
                min={1}
                max={50}
                value={
                  preferences.groupSize
                }
                onChange={(event) =>
                  updatePreference(
                    "groupSize",
                    Math.max(
                      1,
                      Number(
                        event.target
                          .value,
                      ) || 1,
                    ),
                  )
                }
                className="planner-form-control planner-number-control"
              />
            </section>

            {/* INTERESTS */}

            <section className="customizer-section">
              <div className="customizer-section-heading">
                <div className="customizer-section-icon">
                  <Heart
                    size={17}
                    strokeWidth={
                      1.8
                    }
                  />
                </div>

                <div>
                  <h4>
                    What are you
                    interested in?
                  </h4>

                  <p>
                    Pick one or more
                    interests to
                    personalize your
                    attractions.
                  </p>
                </div>
              </div>

              <div className="planner-interest-grid">
                {interestOptions.map(
                  (interest) => {
                    const selected =
                      preferences.selectedInterests.includes(
                        interest.value,
                      );

                    const Icon =
                      interest.icon;

                    return (
                      <button
                        type="button"
                        key={
                          interest.value
                        }
                        onClick={() =>
                          toggleInterest(
                            interest.value,
                          )
                        }
                        className={`planner-interest-option ${
                          selected
                            ? "planner-interest-option-active"
                            : ""
                        }`}
                      >
                        <Icon
                          size={15}
                          strokeWidth={
                            1.8
                          }
                        />

                        <span>
                          {
                            interest.label
                          }
                        </span>

                        {selected && (
                          <Check
                            size={13}
                            strokeWidth={
                              2
                            }
                          />
                        )}
                      </button>
                    );
                  },
                )}
              </div>
            </section>

            {/* PACE */}

            <section className="customizer-section">
              <div className="customizer-section-heading">
                <div className="customizer-section-icon">
                  <Compass
                    size={17}
                    strokeWidth={
                      1.8
                    }
                  />
                </div>

                <div>
                  <h4>
                    What's your
                    travel pace?
                  </h4>

                  <p>
                    We'll use this to
                    decide how many
                    stops to suggest
                    each day.
                  </p>
                </div>
              </div>

              <Row className="g-2">
                {paceOptions.map(
                  (pace) => {
                    const selected =
                      preferences.travelPace ===
                      pace.value;

                    return (
                      <Col
                        xs={12}
                        md={4}
                        key={
                          pace.value
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            updatePreference(
                              "travelPace",
                              pace.value,
                            )
                          }
                          className={`planner-option-card planner-pace-option ${
                            selected
                              ? "planner-option-card-active"
                              : ""
                          }`}
                        >
                          <span className="planner-option-title">
                            {
                              pace.label
                            }
                          </span>

                          <small>
                            {
                              pace.description
                            }
                          </small>

                          <span className="planner-option-stops">
                            {
                              pace.stopsPerDay
                            }{" "}
                            stops/day
                          </span>

                          {selected && (
                            <span className="planner-option-check">
                              <Check
                                size={
                                  12
                                }
                              />
                            </span>
                          )}
                        </button>
                      </Col>
                    );
                  },
                )}
              </Row>
            </section>

            {/* BUDGET */}

            <section className="customizer-section">
              <div className="customizer-section-heading">
                <div className="customizer-section-icon">
                  <WalletCards
                    size={17}
                    strokeWidth={
                      1.8
                    }
                  />
                </div>

                <div>
                  <h4>
                    What's your
                    budget preference?
                  </h4>

                  <p>
                    This preference is
                    saved with your
                    trip and can guide
                    future planning
                    features.
                  </p>
                </div>
              </div>

              <Row className="g-2">
                {budgetOptions.map(
                  (budget) => {
                    const selected =
                      preferences.budget ===
                      budget.value;

                    return (
                      <Col
                        xs={12}
                        md={4}
                        key={
                          budget.value
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            updatePreference(
                              "budget",
                              budget.value,
                            )
                          }
                          className={`planner-option-card ${
                            selected
                              ? "planner-option-card-active"
                              : ""
                          }`}
                        >
                          <span className="planner-option-title">
                            {
                              budget.label
                            }
                          </span>

                          <small>
                            {
                              budget.description
                            }
                          </small>

                          {selected && (
                            <span className="planner-option-check">
                              <Check
                                size={
                                  12
                                }
                              />
                            </span>
                          )}
                        </button>
                      </Col>
                    );
                  },
                )}
              </Row>
            </section>

            {/* SPECIAL REQUESTS */}

            <section className="customizer-section">
              <div className="customizer-section-heading">
                <div className="customizer-section-icon">
                  <Pencil
                    size={17}
                    strokeWidth={
                      1.8
                    }
                  />
                </div>

                <div>
                  <h4>
                    Anything else?
                  </h4>

                  <p>
                    Optional. Add
                    anything you'd
                    like us to consider.
                  </p>
                </div>
              </div>

              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Example: We are traveling with children, we'd like more time for photos, or we'd like to focus on nature..."
                value={
                  preferences.specialRequests
                }
                onChange={(event) =>
                  updatePreference(
                    "specialRequests",
                    event.target
                      .value,
                  )
                }
                className="planner-textarea"
              />
            </section>

            {/* GENERATOR INFO */}

            <div className="planner-generator-info">
              <Sparkles
                size={15}
                strokeWidth={1.8}
              />

              <span>
                Your itinerary is
                created from the
                attractions currently
                available in the
                Calbayog tourism
                database. You can
                edit the generated
                plan afterward.
              </span>
            </div>
          </Modal.Body>

          <Modal.Footer className="planner-modal-footer">
            <Button
              variant="outline-secondary"
              onClick={() =>
                setShowCustomizer(false)
              }
              className="planner-modal-cancel"
            >
              Cancel
            </Button>

            <Button
              variant="outline-primary"
              onClick={
                savePreferences
              }
              className="planner-modal-save"
            >
              {customizationSaved ? (
                <>
                  <Check
                    size={15}
                  />
                  Saved
                </>
              ) : (
                <>
                  <Download
                    size={15}
                  />
                  Save Preferences
                </>
              )}
            </Button>

            <Button
              onClick={
                generateItinerary
              }
              disabled={
                destinations.length ===
                0
              }
              className="planner-modal-generate"
            >
              <Sparkles
                size={15}
                strokeWidth={2}
              />
              Generate My
              Itinerary
            </Button>
          </Modal.Footer>
        </Modal>

        {/* =====================================================
            ATTRACTION PICKER
        ===================================================== */}

        <Modal
          show={showPicker}
          onHide={() =>
            setShowPicker(false)
          }
          centered
          scrollable
          size="lg"
          className="planner-modal"
        >
          <Modal.Header
            closeButton
            className="planner-modal-header"
          >
            <div>
              <div className="planner-modal-eyebrow">
                ADD A STOP
              </div>

              <Modal.Title className="planner-modal-title">
                Pick an Attraction
              </Modal.Title>

              <p className="planner-modal-subtitle">
                Choose a place to add
                to your itinerary.
              </p>
            </div>
          </Modal.Header>

          <Modal.Body className="planner-picker-body">
            {/* SEARCH */}

            <div className="planner-picker-toolbar">
              <div className="planner-search-wrapper">
                <Search
                  size={16}
                  strokeWidth={1.8}
                />

                <Form.Control
                  type="search"
                  placeholder="Search attractions..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                  className="planner-search-input"
                />
              </div>

              <div className="planner-category-scroll">
                {categories.map(
                  (cat) => {
                    const active =
                      category === cat;

                    const color =
                      categoryColors[
                        cat
                      ] ||
                      CALBAYOG_BLUE;

                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() =>
                          setCategory(
                            cat,
                          )
                        }
                        className={`planner-picker-category ${
                          active
                            ? "planner-picker-category-active"
                            : ""
                        }`}
                        style={
                          active
                            ? {
                                borderColor:
                                  color,
                                color:
                                  color,
                                background:
                                  color ===
                                  CALBAYOG_BLUE
                                    ? SOFT_BLUE
                                    : `${color}12`,
                              }
                            : undefined
                        }
                      >
                        {cat}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="planner-picker-results">
              <span>
                <strong>
                  {
                    filteredDestinations.length
                  }
                </strong>{" "}
                attraction
                {filteredDestinations.length !==
                1
                  ? "s"
                  : ""}{" "}
                found
              </span>
            </div>

            {filteredDestinations.length ===
            0 ? (
              <div className="planner-picker-empty">
                <div className="planner-picker-empty-icon">
                  <Search
                    size={26}
                    strokeWidth={
                      1.5
                    }
                  />
                </div>

                <h4>
                  No attractions
                  found
                </h4>

                <p>
                  Try another search
                  term or category.
                </p>
              </div>
            ) : (
              <Row className="g-3">
                {filteredDestinations.map(
                  (dest) => {
                    const alreadyUsed =
                      usedDestinationIds.has(
                        dest.id,
                      );

                    const color =
                      categoryColors[
                        dest.category
                      ] ||
                      CALBAYOG_BLUE;

                    return (
                      <Col
                        xs={12}
                        md={6}
                        key={dest.id}
                      >
                        <button
                          type="button"
                          disabled={
                            alreadyUsed
                          }
                          onClick={() => {
                            if (
                              !alreadyUsed
                            ) {
                              addDestToDay(
                                dest,
                              );
                            }
                          }}
                          className={`planner-picker-card ${
                            alreadyUsed
                              ? "planner-picker-card-used"
                              : ""
                          }`}
                        >
                          {dest.images?.[0] ? (
                            <img
                              src={
                                dest
                                  .images[0]
                              }
                              alt={
                                dest.name
                              }
                              className="planner-picker-image"
                            />
                          ) : (
                            <div className="planner-picker-image planner-picker-placeholder">
                              <MapPin
                                size={
                                  21
                                }
                                strokeWidth={
                                  1.6
                                }
                              />
                            </div>
                          )}

                          <div className="planner-picker-content">
                            <strong>
                              {
                                dest.name
                              }
                            </strong>

                            <span
                              className="planner-picker-tag"
                              style={{
                                color,
                                background:
                                  color ===
                                  CALBAYOG_BLUE
                                    ? SOFT_BLUE
                                    : `${color}12`,
                              }}
                            >
                              {
                                dest.category
                              }
                            </span>

                            {dest.location_address && (
                              <span className="planner-picker-location">
                                <MapPin
                                  size={
                                    11
                                  }
                                  strokeWidth={
                                    1.8
                                  }
                                />
                                {
                                  dest.location_address
                                }
                              </span>
                            )}
                          </div>

                          <span
                            className={`planner-picker-add ${
                              alreadyUsed
                                ? "planner-picker-add-used"
                                : ""
                            }`}
                          >
                            {alreadyUsed ? (
                              <Check
                                size={
                                  16
                                }
                              />
                            ) : (
                              <Plus
                                size={
                                  17
                                }
                              />
                            )}
                          </span>
                        </button>

                        {alreadyUsed && (
                          <div className="planner-already-used">
                            Already in
                            itinerary
                          </div>
                        )}
                      </Col>
                    );
                  },
                )}
              </Row>
            )}
          </Modal.Body>
        </Modal>

        {/* =====================================================
            CLEAR CONFIRMATION
        ===================================================== */}

        <Modal
          show={showClearModal}
          onHide={() =>
            setShowClearModal(
              false,
            )
          }
          centered
          className="planner-modal"
        >
          <Modal.Header
            closeButton
            className="planner-modal-header planner-confirm-header"
          >
            <div>
              <div className="planner-modal-eyebrow">
                ITINERARY
              </div>

              <Modal.Title className="planner-modal-title">
                Clear Itinerary?
              </Modal.Title>
            </div>
          </Modal.Header>

          <Modal.Body className="planner-confirm-body">
            <div className="planner-confirm-icon">
              <Trash2
                size={24}
                strokeWidth={1.6}
              />
            </div>

            <h4>
              Remove your entire
              itinerary?
            </h4>

            <p>
              This will remove{" "}
              <strong>
                {totalDays}
              </strong>{" "}
              day
              {totalDays !== 1
                ? "s"
                : ""}{" "}
              and{" "}
              <strong>
                {totalDests}
              </strong>{" "}
              attraction
              {totalDests !== 1
                ? "s"
                : ""}{" "}
              from your current
              plan.
            </p>
          </Modal.Body>

          <Modal.Footer className="planner-modal-footer">
            <Button
              variant="outline-secondary"
              onClick={() =>
                setShowClearModal(
                  false,
                )
              }
              className="planner-modal-cancel"
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              onClick={
                clearItinerary
              }
              className="planner-delete-confirm"
            >
              <Trash2
                size={15}
              />
              Yes, Clear Itinerary
            </Button>
          </Modal.Footer>
        </Modal>

        {/* =====================================================
            PAGE STYLES
        ===================================================== */}

        <style>{`
          @font-face {
            font-family: "Barabara";
            src: url("/fonts/BARABARA-final.otf")
              format("opentype");
            font-weight: 400;
            font-style: normal;
            font-display: swap;
          }

          .itinerary-page {
            min-height: 100vh;
            background: #ffffff;
            color: #171a18;
          }

          /* =====================================================
             PAGE HEADER
          ===================================================== */

          .itinerary-header {
            width: 100%;
            background: #ffffff;
            padding: 30px 20px 18px;
          }

          .itinerary-header-inner {
            width: 100%;
            max-width: 1240px;
            margin: 0 auto;
          }

          .itinerary-title {
            margin: 0;
            font-family: "Barabara", sans-serif !important;
            font-size: clamp(
              1.65rem,
              2.8vw,
              2.4rem
            );
            font-weight: 400;
            line-height: 0.95;
            letter-spacing: 0.015em;
            color: ${CALBAYOG_BLUE};
          }

          .itinerary-subtitle {
            max-width: 590px;
            margin: 7px 0 0;
            font-family:
              "Nunito",
              "Poppins",
              "Segoe UI",
              sans-serif;
            font-size: 0.81rem;
            line-height: 1.55;
            font-weight: 500;
            color: #737b76;
          }

          .itinerary-container {
            width: 100%;
            max-width: 1240px !important;
            padding: 0 0 60px;
            margin: 0 auto;
          }

          /* =====================================================
             INTRO
          ===================================================== */

          .planner-intro {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 25px;
            padding: 20px 22px;
            margin: 5px 0 24px;
            border: 1px solid #edf0ee;
            border-radius: 18px;
            background: #ffffff;
            box-shadow:
              0 4px 18px rgba(20, 30, 24, 0.045);
          }

          .planner-intro-content {
            display: flex;
            align-items: flex-start;
            gap: 14px;
            min-width: 0;
          }

          .planner-intro-icon {
            width: 46px;
            height: 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border-radius: 14px;
            color: ${CALBAYOG_BLUE};
            background: ${SOFT_BLUE};
          }

          .planner-eyebrow {
            margin-bottom: 4px;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.61rem;
            line-height: 1.2;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #929a95;
          }

          .planner-intro-title {
            margin: 0;
            font-family:
              "Poppins",
              sans-serif;
            font-size: 1.02rem;
            font-weight: 700;
            color: #202521;
          }

          .planner-intro-text {
            max-width: 650px;
            margin: 5px 0 0;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.75rem;
            line-height: 1.55;
            color: #7c8580;
          }

          .planner-primary-button {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            gap: 7px;
            flex-shrink: 0;
            border: none !important;
            border-radius: 999px !important;
            padding: 10px 17px !important;
            background: ${CALBAYOG_BLUE} !important;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.72rem !important;
            font-weight: 800 !important;
            box-shadow:
              0 6px 18px rgba(45, 49, 149, 0.16);
          }

          .planner-primary-button:hover {
            background: #252982 !important;
          }

          /* =====================================================
             PREFERENCES
          ===================================================== */

          .preference-section {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            padding: 17px 20px;
            margin-bottom: 23px;
            border: 1px solid #edf0ee;
            border-radius: 16px;
            background: #fafbfb;
          }

          .preference-title {
            margin: 2px 0 9px;
            font-family:
              "Poppins",
              sans-serif;
            font-size: 0.95rem;
            font-weight: 700;
            color: #242a26;
          }

          .preference-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .preference-tag {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            min-height: 27px;
            padding: 5px 9px;
            border: 1px solid #e5e9e6;
            border-radius: 999px;
            background: #ffffff;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.65rem;
            font-weight: 700;
            color: #626b65;
          }

          .interest-summary {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
          }

          .interest-summary-item {
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.65rem;
            font-weight: 700;
            color: ${CALBAYOG_BLUE};
          }

          .interest-summary-item:not(:last-child)::after {
            content: "•";
            margin-left: 8px;
            color: #b2b8b4;
          }

          .planner-secondary-button {
            display: inline-flex !important;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;
            border-radius: 999px !important;
            padding: 7px 12px !important;
            border-color: #dfe3e1 !important;
            color: ${CALBAYOG_BLUE} !important;
            background: #ffffff !important;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.66rem !important;
            font-weight: 800 !important;
          }

          .planner-secondary-button:hover {
            border-color: ${CALBAYOG_BLUE} !important;
            background: ${SOFT_BLUE} !important;
          }

          /* =====================================================
             SUCCESS
          ===================================================== */

          .planner-success-message {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 12px 14px;
            margin-bottom: 21px;
            border: 1px solid #dfeee5;
            border-radius: 13px;
            background: #f7fbf8;
          }

          .planner-success-icon {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border-radius: 9px;
            color: #1a7a4a;
            background: #e8f5ee;
          }

          .planner-success-message strong,
          .planner-success-message span {
            display: block;
            font-family:
              "Nunito",
              sans-serif;
          }

          .planner-success-message strong {
            margin-bottom: 2px;
            font-size: 0.72rem;
            color: #28302b;
          }

          .planner-success-message span {
            font-size: 0.68rem;
            line-height: 1.45;
            color: #78817b;
          }

          /* =====================================================
             RESULTS BAR
          ===================================================== */

          .planner-results-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            flex-wrap: wrap;
            margin-bottom: 16px;
            padding: 11px 2px;
            border-top: 1px solid #f0f2f0;
            border-bottom: 1px solid #f0f2f0;
          }

          .planner-results-left {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .planner-results-icon {
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            color: ${CALBAYOG_BLUE};
            background: ${SOFT_BLUE};
          }

          .planner-results-label {
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.61rem;
            font-weight: 800;
            letter-spacing: 0.07em;
            color: #929a95;
          }

          .planner-results-count {
            margin-top: 2px;
            font-family:
              "Poppins",
              sans-serif;
            font-size: 0.73rem;
            font-weight: 600;
            color: #252b27;
          }

          .planner-results-right {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .planner-results-description {
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.67rem;
            font-weight: 700;
            color: #858d88;
          }

          .planner-clear-button {
            display: inline-flex !important;
            align-items: center;
            gap: 5px;
            border-radius: 999px !important;
            padding: 5px 10px !important;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.64rem !important;
            font-weight: 800 !important;
          }

          /* =====================================================
             ACTIONS
          ===================================================== */

          .planner-actions {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 7px;
            margin-bottom: 25px;
          }

          .planner-action-primary,
          .planner-action-button,
          .planner-action-link {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            gap: 6px;
            min-height: 35px;
            border-radius: 999px !important;
            padding: 7px 13px !important;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.67rem !important;
            font-weight: 800 !important;
            text-decoration: none !important;
            transition:
              color 0.2s ease,
              background 0.2s ease,
              border-color 0.2s ease,
              box-shadow 0.2s ease;
          }

          .planner-action-primary {
            border: 1px solid ${CALBAYOG_BLUE} !important;
            color: #ffffff !important;
            background: ${CALBAYOG_BLUE} !important;
          }

          .planner-action-primary:hover {
            background: #252982 !important;
          }

          .planner-action-button {
            border-color: #dfe3e1 !important;
            color: #626b65 !important;
            background: #ffffff !important;
          }

          .planner-action-button:hover {
            border-color: ${CALBAYOG_BLUE} !important;
            color: ${CALBAYOG_BLUE} !important;
            background: ${SOFT_BLUE} !important;
          }

          .planner-action-link {
            border: 1px solid #dfe3e1;
            color: #626b65;
            background: #ffffff;
          }

          .planner-action-link:hover {
            border-color: ${CALBAYOG_BLUE};
            color: ${CALBAYOG_BLUE};
            background: ${SOFT_BLUE};
          }

          /* =====================================================
             EMPTY STATE
          ===================================================== */

          .planner-empty-state {
            padding: 60px 25px;
            text-align: center;
            border: 1px solid #edf1ee;
            border-radius: 20px;
            background: #fafcfb;
          }

          .planner-empty-icon {
            width: 68px;
            height: 68px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            border-radius: 20px;
            color: ${CALBAYOG_BLUE};
            background: ${SOFT_BLUE};
          }

          .planner-empty-eyebrow {
            margin-bottom: 5px;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.61rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            color: #929a95;
          }

          .planner-empty-state h2 {
            margin: 0 0 7px;
            font-family:
              "Poppins",
              sans-serif;
            font-size: 1.05rem;
            font-weight: 700;
            color: #202521;
          }

          .planner-empty-state p {
            max-width: 500px;
            margin: 0 auto 19px;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.75rem;
            line-height: 1.55;
            color: #7e8781;
          }

          .planner-empty-actions {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 7px;
          }

          /* =====================================================
             DAY GRID
          ===================================================== */

          .planner-days-grid {
            row-gap: 24px !important;
          }

          .planner-day-col {
            display: flex;
          }

          .planner-day-card {
            width: 100%;
            border: 1px solid #edf0ee !important;
            border-radius: 18px !important;
            background: #ffffff !important;
            overflow: hidden;
            box-shadow:
              0 4px 16px rgba(20, 30, 24, 0.055) !important;
            transition:
              transform 0.2s ease,
              box-shadow 0.2s ease;
          }

          .planner-day-card:hover {
            transform: translateY(-2px);
            box-shadow:
              0 9px 25px rgba(20, 30, 24, 0.09) !important;
          }

          .planner-day-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            min-height: 92px;
            padding: 15px 16px 13px;
            border-top: 3px solid ${CALBAYOG_BLUE};
            border-bottom: 1px solid #f0f2f0;
            background: #ffffff;
          }

          .planner-day-eyebrow {
            margin-bottom: 3px;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.59rem;
            font-weight: 800;
            letter-spacing: 0.09em;
            color: #929a95;
          }

          .planner-day-header h3 {
            margin: 0;
            font-family:
              "Poppins",
              sans-serif;
            font-size: 1rem;
            font-weight: 700;
            color: #242a26;
          }

          .planner-day-date {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-top: 4px;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.65rem;
            color: #858d88;
          }

          .planner-day-header-actions {
            display: flex;
            align-items: center;
            gap: 7px;
          }

          .planner-stop-count {
            display: inline-flex;
            align-items: center;
            min-height: 25px;
            padding: 5px 8px;
            border: 1px solid #e5e9e6;
            border-radius: 999px;
            background: #fafbfb;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.62rem;
            font-weight: 800;
            color: #737b76;
            white-space: nowrap;
          }

          .planner-day-delete {
            width: 29px;
            height: 29px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #eceeed;
            border-radius: 9px;
            color: #8b938e;
            background: #ffffff;
            cursor: pointer;
            transition:
              color 0.2s ease,
              background 0.2s ease,
              border-color 0.2s ease;
          }

          .planner-day-delete:hover {
            border-color: #e4baba;
            color: #c64a4a;
            background: #fff7f7;
          }

          .planner-day-body {
            padding: 14px !important;
          }

          /* =====================================================
             SORTABLE ITEM
          ===================================================== */

          .planner-sortable-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            margin-bottom: 7px;
          }

          .planner-sortable-item:last-child {
            margin-bottom: 0;
          }

          .planner-drag-button {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            padding: 3px;
            border: none;
            color: #b0b6b2;
            background: transparent;
            cursor: grab;
            touch-action: none;
          }

          .planner-drag-button:active {
            cursor: grabbing;
          }

          .planner-stop-number {
            width: 27px;
            height: 27px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border-radius: 9px;
            font-family:
              "Poppins",
              sans-serif;
            font-size: 0.65rem;
            font-weight: 700;
          }

          .planner-stop-image {
            width: 47px;
            height: 47px;
            flex-shrink: 0;
            object-fit: cover;
            border-radius: 11px;
          }

          .planner-stop-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${CALBAYOG_BLUE};
            background: ${SOFT_BLUE};
          }

          .planner-stop-content {
            flex: 1;
            min-width: 0;
          }

          .planner-stop-name {
            margin: 0 0 5px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.75rem;
            font-weight: 800;
            color: #252b27;
          }

          .planner-stop-meta {
            display: flex;
            align-items: center;
            gap: 5px;
            min-width: 0;
          }

          .planner-category-tag {
            display: inline-flex;
            align-items: center;
            max-width: 115px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            padding: 3px 6px;
            border-radius: 999px;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.57rem;
            font-weight: 800;
          }

          .planner-stop-location {
            display: flex;
            align-items: center;
            gap: 3px;
            min-width: 0;
            overflow: hidden;
            color: #939b96;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.59rem;
          }

          .planner-stop-location span {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .planner-remove-button {
            width: 29px;
            height: 29px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border: none;
            border-radius: 9px;
            color: #a1a8a4;
            background: transparent;
            cursor: pointer;
            transition:
              color 0.2s ease,
              background 0.2s ease;
          }

          .planner-remove-button:hover {
            color: #c64a4a;
            background: #fff4f4;
          }

          /* =====================================================
             EMPTY DAY
          ===================================================== */

          .planner-no-stops {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 150px;
            margin-bottom: 12px;
            border: 1px dashed #dfe5e1;
            border-radius: 14px;
            background: #fafcfb;
            text-align: center;
          }

          .planner-no-stops-icon {
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 7px;
            border-radius: 13px;
            color: ${CALBAYOG_BLUE};
            background: ${SOFT_BLUE};
          }

          .planner-no-stops strong {
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.72rem;
            color: #3d4540;
          }

          .planner-no-stops span {
            margin-top: 2px;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.64rem;
            color: #929a95;
          }

          /* =====================================================
             DAY NOTE
          ===================================================== */

          .planner-day-note {
            display: flex;
            align-items: flex-start;
            gap: 7px;
            padding: 8px 9px;
            margin: 10px 0;
            border-radius: 10px;
            background: #fafbfb;
            color: #777f7a;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.62rem;
            line-height: 1.45;
          }

          .planner-day-note-icon {
            display: flex;
            flex-shrink: 0;
            margin-top: 1px;
            color: ${CALBAYOG_BLUE};
          }

          .planner-add-attraction {
            display: flex !important;
            align-items: center;
            justify-content: center;
            gap: 6px;
            width: 100%;
            min-height: 35px;
            border-radius: 999px !important;
            border-width: 1px !important;
            border-color: #dfe3e1 !important;
            color: ${CALBAYOG_BLUE} !important;
            background: #ffffff !important;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.67rem !important;
            font-weight: 800 !important;
          }

          .planner-add-attraction:hover {
            border-color: ${CALBAYOG_BLUE} !important;
            background: ${SOFT_BLUE} !important;
          }

          /* =====================================================
             TIP
          ===================================================== */

          .planner-tip {
            display: flex;
            align-items: flex-start;
            gap: 9px;
            margin-top: 22px;
            padding: 11px 13px;
            border: 1px solid #edf0ee;
            border-radius: 12px;
            background: #fafbfb;
          }

          .planner-tip-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            width: 27px;
            height: 27px;
            border-radius: 8px;
            color: ${CALBAYOG_BLUE};
            background: ${SOFT_BLUE};
          }

          .planner-tip strong,
          .planner-tip span {
            display: block;
            font-family:
              "Nunito",
              sans-serif;
          }

          .planner-tip strong {
            margin-bottom: 1px;
            font-size: 0.67rem;
            color: #3b433e;
          }

          .planner-tip span {
            font-size: 0.64rem;
            line-height: 1.45;
            color: #8a928d;
          }

          /* =====================================================
             MODALS
          ===================================================== */

          .planner-modal .modal-content {
            border: none;
            border-radius: 18px;
            overflow: hidden;
            box-shadow:
              0 20px 55px rgba(25, 30, 45, 0.18);
          }

          .planner-modal-header {
            padding: 18px 20px 14px !important;
            border-bottom: 1px solid #f0f2f0 !important;
            background: #ffffff;
          }

          .planner-modal-eyebrow {
            margin-bottom: 3px;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.59rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            color: #929a95;
          }

          .planner-modal-title {
            margin: 0 !important;
            font-family:
              "Poppins",
              sans-serif !important;
            font-size: 1.08rem !important;
            font-weight: 700 !important;
            color: #242a26;
          }

          .planner-modal-subtitle {
            margin: 3px 0 0;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.68rem;
            color: #858d88;
          }

          .planner-modal-body {
            padding: 16px !important;
            background: #fafbfb !important;
          }

          .planner-picker-body {
            max-height: 68vh;
            padding: 16px !important;
            background: #fafbfb !important;
          }

          .planner-modal-footer {
            gap: 7px !important;
            padding: 12px 16px !important;
            border-top: 1px solid #edf0ee !important;
            background: #ffffff !important;
          }

          .planner-modal-cancel,
          .planner-modal-save,
          .planner-modal-generate,
          .planner-delete-confirm {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            gap: 6px;
            border-radius: 999px !important;
            padding: 8px 13px !important;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.67rem !important;
            font-weight: 800 !important;
          }

          .planner-modal-save {
            border-color: #dfe3e1 !important;
            color: ${CALBAYOG_BLUE} !important;
          }

          .planner-modal-save:hover {
            background: ${SOFT_BLUE} !important;
            border-color: ${CALBAYOG_BLUE} !important;
          }

          .planner-modal-generate {
            border: none !important;
            background: ${CALBAYOG_BLUE} !important;
          }

          .planner-modal-generate:hover {
            background: #252982 !important;
          }

          .planner-delete-confirm {
            border: none !important;
          }

          .planner-error {
            border: 1px solid #f0d5d5 !important;
            border-radius: 12px !important;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.72rem;
          }

          /* =====================================================
             CUSTOMIZER SECTIONS
          ===================================================== */

          .customizer-section {
            margin-bottom: 12px;
            padding: 15px;
            border: 1px solid #edf0ee;
            border-radius: 15px;
            background: #ffffff;
          }

          .customizer-section:last-of-type {
            margin-bottom: 0;
          }

          .customizer-section-heading {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 13px;
          }

          .customizer-section-icon {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border-radius: 10px;
            color: ${CALBAYOG_BLUE};
            background: ${SOFT_BLUE};
          }

          .customizer-section-heading h4 {
            margin: 1px 0 2px;
            font-family:
              "Poppins",
              sans-serif;
            font-size: 0.79rem;
            font-weight: 700;
            color: #2a302c;
          }

          .customizer-section-heading p {
            margin: 0;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.64rem;
            line-height: 1.45;
            color: #89918c;
          }

          .planner-form-label {
            margin-bottom: 5px !important;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.65rem !important;
            font-weight: 800 !important;
            color: #616a64;
          }

          .planner-form-control {
            min-height: 39px !important;
            border: 1px solid #dfe4e1 !important;
            border-radius: 10px !important;
            padding: 8px 10px !important;
            font-family:
              "Nunito",
              sans-serif !important;
            font-size: 0.71rem !important;
            color: #333a35 !important;
            box-shadow: none !important;
          }

          .planner-form-control:focus {
            border-color: ${CALBAYOG_BLUE} !important;
            box-shadow:
              0 0 0 3px rgba(45, 49, 149, 0.08) !important;
          }

          .planner-number-control {
            max-width: 180px;
          }

          .planner-info-strip {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 11px;
            padding: 8px 10px;
            border-radius: 9px;
            color: ${CALBAYOG_BLUE};
            background: ${SOFT_BLUE};
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.65rem;
          }

          /* =====================================================
             OPTION CARDS
          ===================================================== */

          .planner-option-card {
            position: relative;
            width: 100%;
            min-height: 72px;
            padding: 10px;
            text-align: left;
            border: 1px solid #e0e5e2;
            border-radius: 11px;
            background: #ffffff;
            cursor: pointer;
            transition:
              border-color 0.2s ease,
              background 0.2s ease,
              box-shadow 0.2s ease;
          }

          .planner-option-card:hover {
            border-color: #bdc4c0;
            background: #fbfcfb;
          }

          .planner-option-card-active {
            border-color: ${CALBAYOG_BLUE} !important;
            background: ${SOFT_BLUE} !important;
            box-shadow:
              0 3px 12px rgba(45, 49, 149, 0.08);
          }

          .planner-option-title {
            display: block;
            margin-bottom: 2px;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.71rem;
            font-weight: 800;
            color: #303731;
          }

          .planner-option-card small {
            display: block;
            max-width: 92%;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.61rem;
            line-height: 1.4;
            color: #8a928d;
          }

          .planner-option-check {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            color: #ffffff;
            background: ${CALBAYOG_BLUE};
          }

          .planner-option-stops {
            display: inline-flex;
            margin-top: 7px;
            padding: 3px 6px;
            border-radius: 999px;
            color: ${CALBAYOG_BLUE};
            background: rgba(45, 49, 149, 0.07);
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.56rem;
            font-weight: 800;
          }

          /* =====================================================
             INTERESTS
          ===================================================== */

          .planner-interest-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .planner-interest-option {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            min-height: 34px;
            padding: 7px 10px;
            border: 1px solid #e0e5e2;
            border-radius: 999px;
            color: #68716c;
            background: #ffffff;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.64rem;
            font-weight: 800;
            cursor: pointer;
            transition:
              color 0.2s ease,
              border-color 0.2s ease,
              background 0.2s ease;
          }

          .planner-interest-option:hover {
            border-color: #c9cecb;
          }

          .planner-interest-option-active {
            border-color: ${CALBAYOG_BLUE};
            color: ${CALBAYOG_BLUE};
            background: ${SOFT_BLUE};
          }

          .planner-textarea {
            border: 1px solid #dfe4e1 !important;
            border-radius: 10px !important;
            padding: 10px !important;
            resize: vertical;
            font-family:
              "Nunito",
              sans-serif !important;
            font-size: 0.7rem !important;
            box-shadow: none !important;
          }

          .planner-textarea:focus {
            border-color: ${CALBAYOG_BLUE} !important;
            box-shadow:
              0 0 0 3px rgba(45, 49, 149, 0.08) !important;
          }

          .planner-generator-info {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-top: 12px;
            padding: 10px 11px;
            border-radius: 10px;
            color: #7d8680;
            background: #f6f8f7;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.62rem;
            line-height: 1.45;
          }

          .planner-generator-info svg {
            flex-shrink: 0;
            margin-top: 1px;
            color: ${CALBAYOG_BLUE};
          }

          /* =====================================================
             PICKER
          ===================================================== */

          .planner-picker-toolbar {
            padding: 12px;
            margin-bottom: 12px;
            border: 1px solid #edf0ee;
            border-radius: 14px;
            background: #ffffff;
          }

          .planner-search-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 0 10px;
            border: 1px solid #dfe4e1;
            border-radius: 10px;
            color: #8c948f;
            background: #ffffff;
          }

          .planner-search-input {
            min-height: 37px !important;
            padding: 7px 0 !important;
            border: none !important;
            box-shadow: none !important;
            font-family:
              "Nunito",
              sans-serif !important;
            font-size: 0.7rem !important;
          }

          .planner-category-scroll {
            display: flex;
            gap: 6px;
            overflow-x: auto;
            padding: 9px 1px 2px;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }

          .planner-category-scroll::-webkit-scrollbar {
            display: none;
          }

          .planner-picker-category {
            flex: 0 0 auto;
            min-height: 29px;
            padding: 5px 9px;
            border: 1px solid #e2e6e3;
            border-radius: 999px;
            color: #707974;
            background: #ffffff;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.61rem;
            font-weight: 800;
            cursor: pointer;
            white-space: nowrap;
          }

          .planner-picker-results {
            margin-bottom: 9px;
            padding: 0 2px;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.63rem;
            color: #8a928d;
          }

          .planner-picker-results strong {
            color: #444c47;
          }

          .planner-picker-card {
            position: relative;
            width: 100%;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            text-align: left;
            border: 1px solid #e4e8e5;
            border-radius: 14px;
            background: #ffffff;
            cursor: pointer;
            transition:
              transform 0.2s ease,
              border-color 0.2s ease,
              box-shadow 0.2s ease;
          }

          .planner-picker-card:not(:disabled):hover {
            transform: translateY(-2px);
            border-color: ${CALBAYOG_BLUE};
            box-shadow:
              0 6px 18px rgba(20, 30, 24, 0.07);
          }

          .planner-picker-card-used {
            cursor: default;
            opacity: 0.6;
            background: #f7f8f7;
          }

          .planner-picker-image {
            width: 58px;
            height: 58px;
            flex-shrink: 0;
            object-fit: cover;
            border-radius: 11px;
          }

          .planner-picker-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${CALBAYOG_BLUE};
            background: ${SOFT_BLUE};
          }

          .planner-picker-content {
            flex: 1;
            min-width: 0;
          }

          .planner-picker-content strong {
            display: block;
            margin-bottom: 5px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.73rem;
            font-weight: 800;
            color: #2a302c;
          }

          .planner-picker-tag {
            display: inline-flex;
            max-width: 130px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            padding: 3px 6px;
            border-radius: 999px;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.56rem;
            font-weight: 800;
          }

          .planner-picker-location {
            display: flex;
            align-items: center;
            gap: 3px;
            margin-top: 5px;
            overflow: hidden;
            color: #929a95;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.59rem;
          }

          .planner-picker-location {
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .planner-picker-add {
            width: 29px;
            height: 29px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border-radius: 9px;
            color: ${CALBAYOG_BLUE};
            background: ${SOFT_BLUE};
          }

          .planner-picker-add-used {
            color: #8b938e;
            background: #e9ecea;
          }

          .planner-already-used {
            margin: 4px 10px 0;
            text-align: right;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.57rem;
            color: #999f9b;
          }

          .planner-picker-empty {
            padding: 55px 20px;
            text-align: center;
          }

          .planner-picker-empty-icon {
            width: 58px;
            height: 58px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 10px;
            border-radius: 17px;
            color: ${CALBAYOG_BLUE};
            background: ${SOFT_BLUE};
          }

          .planner-picker-empty h4 {
            margin: 0 0 4px;
            font-family:
              "Poppins",
              sans-serif;
            font-size: 0.86rem;
            font-weight: 700;
            color: #303631;
          }

          .planner-picker-empty p {
            margin: 0;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.68rem;
            color: #8a928d;
          }

          /* =====================================================
             CONFIRM MODAL
          ===================================================== */

          .planner-confirm-body {
            padding: 30px 20px !important;
            text-align: center;
            background: #ffffff !important;
          }

          .planner-confirm-icon {
            width: 58px;
            height: 58px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 13px;
            border-radius: 18px;
            color: #b64d4d;
            background: #fff1f1;
          }

          .planner-confirm-body h4 {
            margin: 0 0 6px;
            font-family:
              "Poppins",
              sans-serif;
            font-size: 0.95rem;
            font-weight: 700;
            color: #303631;
          }

          .planner-confirm-body p {
            max-width: 400px;
            margin: 0 auto;
            font-family:
              "Nunito",
              sans-serif;
            font-size: 0.7rem;
            line-height: 1.5;
            color: #858d88;
          }

          /* =====================================================
             RESPONSIVE
          ===================================================== */

          @media (max-width: 991.98px) {
            .itinerary-header {
              padding: 28px 20px 18px;
            }

            .itinerary-title {
              font-size: clamp(
                1.65rem,
                4.5vw,
                2.25rem
              );
            }

            .planner-intro {
              align-items: flex-start;
            }
          }

          @media (max-width: 767.98px) {
            .itinerary-header {
              padding: 25px 17px 16px;
            }

            .itinerary-title {
              font-size: 1.9rem;
            }

            .itinerary-subtitle {
              margin-top: 6px;
              font-size: 0.78rem;
            }

            .itinerary-container {
              padding-left: 17px;
              padding-right: 17px;
            }

            .planner-intro {
              flex-direction: column;
              align-items: stretch;
              gap: 15px;
              padding: 16px;
            }

            .planner-intro-text {
              font-size: 0.71rem;
            }

            .planner-primary-button {
              width: 100%;
            }

            .preference-section {
              flex-direction: column;
              align-items: stretch;
            }

            .planner-secondary-button {
              align-self: flex-start;
            }

            .planner-results-bar {
              align-items: flex-start;
            }

            .planner-results-right {
              width: 100%;
              justify-content: space-between;
            }

            .planner-actions {
              gap: 6px;
            }

            .planner-action-primary,
            .planner-action-button,
            .planner-action-link {
              flex: 1 1 auto;
            }

            .planner-day-header {
              min-height: 86px;
            }

            .planner-sortable-item {
              gap: 6px;
            }

            .planner-stop-image {
              width: 44px;
              height: 44px;
            }

            .planner-stop-location {
              display: none;
            }

            .planner-stop-number {
              width: 25px;
              height: 25px;
            }

            .planner-modal-footer {
              flex-wrap: wrap;
            }

            .planner-modal-cancel,
            .planner-modal-save,
            .planner-modal-generate {
              flex: 1 1 auto;
            }
          }

          @media (max-width: 479.98px) {
            .itinerary-title {
              font-size: 1.8rem;
            }

            .itinerary-subtitle {
              font-size: 0.77rem;
            }

            .planner-intro-content {
              gap: 10px;
            }

            .planner-intro-icon {
              width: 40px;
              height: 40px;
              border-radius: 12px;
            }

            .planner-intro-title {
              font-size: 0.91rem;
            }

            .planner-actions {
              display: grid;
              grid-template-columns: 1fr 1fr;
            }

            .planner-action-primary,
            .planner-action-button,
            .planner-action-link {
              width: 100%;
            }

            .planner-action-primary {
              grid-column: span 2;
            }

            .planner-action-link {
              grid-column: span 2;
            }

            .planner-results-description {
              font-size: 0.62rem;
            }

            .planner-day-header {
              padding: 13px;
            }

            .planner-day-body {
              padding: 11px !important;
            }

            .planner-stop-name {
              font-size: 0.71rem;
            }

            .planner-category-tag {
              max-width: 95px;
            }

            .planner-modal-body,
            .planner-picker-body {
              padding: 12px !important;
            }

            .customizer-section {
              padding: 12px;
            }

            .planner-option-card {
              min-height: 67px;
            }
          }
        `}</style>
      </div>
    );
  };

export default ItineraryPlanner;
