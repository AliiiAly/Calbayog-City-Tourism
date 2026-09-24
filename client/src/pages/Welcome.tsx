import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  Container,
  Row,
  Col,
  Card,
} from "react-bootstrap";

import {
  getAccommodations,
  getAttractions,
} from "../services/api";

import {
  Destination,
  Accommodation,
} from "../types";

import { useAuth } from "../context/AuthContext";

import { useFavorites } from "../context/FavoritesContext";

import AttractionCard from "../components/attractions/AttractionCard";

import {
  FerrisWheel,
  Houses,
  CalendarFold,
  Compass,
  NotebookPen,
  Car,
  MapPin,
  CalendarDays,
  CloudSun,
} from "lucide-react";

/* =========================================================
   BRAND COLOR
========================================================= */

const CALBAYOG_BLUE = "#2D3195";

/* =========================================================
   QUICK ACCESS CARDS
========================================================= */

const quickCards: Array<{
  icon: React.ReactNode;
  label: string;
  to: string;
  color: string;
  bg: string;
}> = [
  {
    icon: (
      <FerrisWheel
        size={22}
        strokeWidth={2.2}
        aria-hidden="true"
      />
    ),
    label: "Attractions",
    to: "/attractions",
    color: "#0077B6",
    bg: "#e0f2ff",
  },

  {
    icon: (
      <Houses
        size={22}
        strokeWidth={2.2}
        aria-hidden="true"
      />
    ),
    label: "Stays",
    to: "/accommodations",
    color: "#F4A226",
    bg: "#fff8e6",
  },

  {
    icon: (
      <CalendarFold
        size={22}
        strokeWidth={2.2}
        aria-hidden="true"
      />
    ),
    label: "Events",
    to: "/events",
    color: "#e63946",
    bg: "#ffe8ea",
  },

  {
    icon: (
      <Compass
        size={22}
        strokeWidth={2.2}
        aria-hidden="true"
      />
    ),
    label: "Guides",
    to: "/guides",
    color: "#2d6a4f",
    bg: "#e8f5ee",
  },

  {
    icon: (
      <NotebookPen
        size={22}
        strokeWidth={2.2}
        aria-hidden="true"
      />
    ),
    label: "Plan Trip",
    to: "/itinerary",
    color: "#6d4c41",
    bg: "#f0ebe6",
  },

  {
    icon: (
      <Car
        size={22}
        strokeWidth={2.2}
        aria-hidden="true"
      />
    ),
    label: "Getting There",
    to: "/getting-there",
    color: "#0077B6",
    bg: "#e0f2ff",
  },
];

/* =========================================================
   HERO SLIDES
========================================================= */

const heroSlides = [
  {
    id: "calbayog-1",
    image: "/calbayog1.jpg",
    alt: "Calbayog City",
  },

  {
    id: "calbayog-2",
    image: "/calbayog2.jpeg",
    alt: "Calbayog City",
  },

  {
    id: "calbayog-3",
    image: "/calbayog3.jpg",
    alt: "Calbayog City",
  },

  {
    id: "calbayog-4",
    image: "/calbayogonair.webp",
    alt: "Calbayog City",
  },
];

/* =========================================================
   FEATURED VIDEOS
========================================================= */

const featuredVideos = [
  {
    id: "calbayog-video-1",
    src: "/promo.mp4",
    title: "Discover Calbayog City",
    description:
      "Experience the beauty, places, and stories of Calbayog City.",
  },
];

/* =========================================================
   WEATHER TYPES
========================================================= */

type WeatherState = {
  temperature: number | null;
  weatherCode: number | null;
  isDay: boolean;
  loading: boolean;
  error: boolean;
};

/* =========================================================
   WEATHER DESCRIPTION
========================================================= */

const getWeatherDescription = (
  weatherCode: number | null,
): string => {
  if (weatherCode === null) {
    return "Weather unavailable";
  }

  if (weatherCode === 0) {
    return "Clear sky";
  }

  if (
    weatherCode === 1 ||
    weatherCode === 2
  ) {
    return "Partly cloudy";
  }

  if (weatherCode === 3) {
    return "Overcast";
  }

  if (
    weatherCode === 45 ||
    weatherCode === 48
  ) {
    return "Foggy";
  }

  if (
    weatherCode === 51 ||
    weatherCode === 53 ||
    weatherCode === 55
  ) {
    return "Drizzle";
  }

  if (
    weatherCode === 56 ||
    weatherCode === 57
  ) {
    return "Freezing drizzle";
  }

  if (
    weatherCode === 61 ||
    weatherCode === 63 ||
    weatherCode === 65
  ) {
    return "Rain";
  }

  if (
    weatherCode === 66 ||
    weatherCode === 67
  ) {
    return "Freezing rain";
  }

  if (
    weatherCode === 71 ||
    weatherCode === 73 ||
    weatherCode === 75
  ) {
    return "Snow";
  }

  if (weatherCode === 77) {
    return "Snow grains";
  }

  if (
    weatherCode === 80 ||
    weatherCode === 81 ||
    weatherCode === 82
  ) {
    return "Rain showers";
  }

  if (
    weatherCode === 85 ||
    weatherCode === 86
  ) {
    return "Snow showers";
  }

  if (weatherCode === 95) {
    return "Thunderstorm";
  }

  if (
    weatherCode === 96 ||
    weatherCode === 99
  ) {
    return "Thunderstorm with hail";
  }

  return "Current weather";
};

/* =========================================================
   WELCOME COMPONENT
========================================================= */

const Welcome: React.FC = () => {
  const { user } = useAuth();

  /*
   * =======================================================
   * GLOBAL FAVORITES
   *
   * Welcome does NOT maintain its own favoriteIds.
   *
   * The shared FavoritesContext controls favorite state
   * and counts for the entire application.
   * =======================================================
   */
  const {
    setFavoriteCount,
  } = useFavorites();

  /* =========================================================
     WELCOME DATA
  ========================================================= */

  const [
    welcomeDestinations,
    setWelcomeDestinations,
  ] = useState<Destination[]>([]);

  const [
    welcomeAccommodations,
    setWelcomeAccommodations,
  ] = useState<Accommodation[]>([]);

  const [
    loadingDestinations,
    setLoadingDestinations,
  ] = useState(true);

  const [
    loadingAccommodations,
    setLoadingAccommodations,
  ] = useState(true);

  /* =========================================================
     IMAGE ROTATION
  ========================================================= */

  const [
    imageIndexes,
    setImageIndexes,
  ] = useState<Record<string, number>>({});

  /* =========================================================
     HERO SLIDER STATE
  ========================================================= */

  const [
    activeSlide,
    setActiveSlide,
  ] = useState(0);

  /* =========================================================
     TOUCH / SWIPE STATE
  ========================================================= */

  const touchStartX =
    useRef<number | null>(null);

  const touchEndX =
    useRef<number | null>(null);

  /* =========================================================
     MOUSE DRAG STATE
  ========================================================= */

  const mouseStartX =
    useRef<number | null>(null);

  const isDragging =
    useRef(false);

  /* =========================================================
     DATE
  ========================================================= */

  const [
    currentDate,
    setCurrentDate,
  ] = useState("");

  /* =========================================================
     WEATHER
  ========================================================= */

  const [
    weather,
    setWeather,
  ] = useState<WeatherState>({
    temperature: null,
    weatherCode: null,
    isDay: true,
    loading: true,
    error: false,
  });

  /* =========================================================
     USER GREETING
  ========================================================= */

  const firstName = user?.name
    ? user.name
        .trim()
        .split(/\s+/)[0]
    : "";

  const welcomeGreeting =
    firstName
      ? `MABUHAY, ${firstName.toUpperCase()}!`
      : "MABUHAY!";

  /* =========================================================
     LOAD CURRENT DATE
  ========================================================= */

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();

      const formattedDate =
        new Intl.DateTimeFormat(
          "en-PH",
          {
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone:
              "Asia/Manila",
          },
        ).format(now);

      setCurrentDate(
        formattedDate,
      );
    };

    updateDate();

    const interval =
      window.setInterval(
        updateDate,
        60 * 1000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, []);

  /* =========================================================
     LOAD CURRENT CALBAYOG WEATHER
  ========================================================= */

  useEffect(() => {
    const controller =
      new AbortController();

    const loadWeather =
      async () => {
        try {
          setWeather(
            (previous) => ({
              ...previous,
              loading: true,
              error: false,
            }),
          );

          const geocodingResponse =
            await fetch(
              "https://geocoding-api.open-meteo.com/v1/search?name=Calbayog&count=10&language=en&format=json",
              {
                signal:
                  controller.signal,
              },
            );

          if (
            !geocodingResponse.ok
          ) {
            throw new Error(
              "Unable to find Calbayog location.",
            );
          }

          const geocodingData =
            await geocodingResponse.json();

          const results =
            Array.isArray(
              geocodingData?.results,
            )
              ? geocodingData.results
              : [];

          const calbayogLocation =
            results.find(
              (location: any) =>
                location?.country_code ===
                  "PH" &&
                String(
                  location?.name ||
                    "",
                ).toLowerCase() ===
                  "calbayog",
            ) ||
            results.find(
              (location: any) =>
                location?.country_code ===
                "PH",
            );

          if (
            !calbayogLocation?.latitude ||
            !calbayogLocation?.longitude
          ) {
            throw new Error(
              "Calbayog location was not found.",
            );
          }

          const weatherResponse =
            await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
                calbayogLocation.latitude,
              )}&longitude=${encodeURIComponent(
                calbayogLocation.longitude,
              )}&current=temperature_2m,weather_code,is_day&timezone=Asia%2FManila`,
              {
                signal:
                  controller.signal,
              },
            );

          if (
            !weatherResponse.ok
          ) {
            throw new Error(
              "Unable to load current weather.",
            );
          }

          const weatherData =
            await weatherResponse.json();

          const current =
            weatherData?.current;

          if (!current) {
            throw new Error(
              "Current weather data is unavailable.",
            );
          }

          setWeather({
            temperature:
              typeof current.temperature_2m ===
              "number"
                ? current.temperature_2m
                : null,

            weatherCode:
              typeof current.weather_code ===
              "number"
                ? current.weather_code
                : null,

            isDay:
              Number(
                current.is_day,
              ) === 1,

            loading: false,
            error: false,
          });
        } catch (error: any) {
          if (
            error?.name ===
            "AbortError"
          ) {
            return;
          }

          console.error(
            "Failed to load Calbayog weather:",
            error,
          );

          setWeather({
            temperature: null,
            weatherCode: null,
            isDay: true,
            loading: false,
            error: true,
          });
        }
      };

    void loadWeather();

    const weatherInterval =
      window.setInterval(
        loadWeather,
        15 * 60 * 1000,
      );

    return () => {
      controller.abort();

      window.clearInterval(
        weatherInterval,
      );
    };
  }, []);

  /* =========================================================
     PRELOAD HERO IMAGES
  ========================================================= */

  useEffect(() => {
    heroSlides.forEach(
      (slide) => {
        const image =
          new Image();

        image.src =
          slide.image;
      },
    );
  }, []);

  /* =========================================================
     NEXT SLIDE
  ========================================================= */

  const nextSlide = () => {
    setActiveSlide(
      (current) =>
        (current + 1) %
        heroSlides.length,
    );
  };

  /* =========================================================
     PREVIOUS SLIDE
  ========================================================= */

  const previousSlide = () => {
    setActiveSlide(
      (current) =>
        current === 0
          ? heroSlides.length -
            1
          : current - 1,
    );
  };

  /* =========================================================
     AUTOMATIC SLIDESHOW
  ========================================================= */

  useEffect(() => {
    const interval =
      window.setInterval(
        () => {
          setActiveSlide(
            (current) =>
              (current + 1) %
              heroSlides.length,
          );
        },
        6000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, []);

  /* =========================================================
     TOUCH START
  ========================================================= */

  const handleTouchStart = (
    e: React.TouchEvent<HTMLDivElement>,
  ) => {
    touchStartX.current =
      e.touches[0].clientX;

    touchEndX.current =
      null;
  };

  /* =========================================================
     TOUCH MOVE
  ========================================================= */

  const handleTouchMove = (
    e: React.TouchEvent<HTMLDivElement>,
  ) => {
    touchEndX.current =
      e.touches[0].clientX;
  };

  /* =========================================================
     TOUCH END
  ========================================================= */

  const handleTouchEnd = () => {
    if (
      touchStartX.current ===
        null ||
      touchEndX.current ===
        null
    ) {
      return;
    }

    const distance =
      touchStartX.current -
      touchEndX.current;

    const minimumSwipeDistance = 50;

    if (
      Math.abs(distance) <
      minimumSwipeDistance
    ) {
      touchStartX.current =
        null;

      touchEndX.current =
        null;

      return;
    }

    if (distance > 0) {
      nextSlide();
    } else {
      previousSlide();
    }

    touchStartX.current =
      null;

    touchEndX.current =
      null;
  };

  /* =========================================================
     MOUSE DRAG START
  ========================================================= */

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    mouseStartX.current =
      e.clientX;

    isDragging.current =
      true;
  };

  /* =========================================================
     MOUSE DRAG END
  ========================================================= */

  const handleMouseUp = (
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (
      mouseStartX.current ===
        null ||
      !isDragging.current
    ) {
      return;
    }

    const distance =
      mouseStartX.current -
      e.clientX;

    const minimumDragDistance = 50;

    if (
      Math.abs(distance) >=
      minimumDragDistance
    ) {
      if (distance > 0) {
        nextSlide();
      } else {
        previousSlide();
      }
    }

    mouseStartX.current =
      null;

    isDragging.current =
      false;
  };

  /* =========================================================
     MOUSE LEAVE
  ========================================================= */

  const handleMouseLeave =
    () => {
      mouseStartX.current =
        null;

      isDragging.current =
        false;
    };

  /* =========================================================
     LOAD SELECTED ATTRACTIONS
  ========================================================= */

  const loadWelcomeDestinations =
    async () => {
      setLoadingDestinations(
        true,
      );

      try {
        const response =
          await getAttractions({
            show_on_welcome: true,
          });

        const data =
          Array.isArray(
            response?.data,
          )
            ? response.data
            : [];

        const selected =
          data.slice(0, 4);

        setWelcomeDestinations(
          selected,
        );

        /*
         * =====================================================
         * SYNC DATABASE FAVORITE COUNTS
         *
         * The count comes from the attraction record.
         * It is placed into the shared FavoritesContext.
         *
         * This means Welcome and Attractions use the same
         * total count.
         * =====================================================
         */

        selected.forEach(
          (
            attraction: Destination,
          ) => {
            const attractionId =
              String(
                (attraction as any)
                  ?.id ?? "",
              ).trim();

            if (
              !attractionId
            ) {
              return;
            }

            const count =
              Math.max(
                0,
                Number(
                  (
                    attraction as any
                  )?.favorites ??
                    0,
                ) || 0,
              );

            setFavoriteCount(
              "attraction",
              attractionId,
              count,
            );
          },
        );

        setImageIndexes({});
      } catch (error) {
        console.error(
          "Failed to load Welcome Page attractions:",
          error,
        );

        setWelcomeDestinations(
          [],
        );
      } finally {
        setLoadingDestinations(
          false,
        );
      }
    };

  /* =========================================================
     LOAD SELECTED ACCOMMODATIONS
  ========================================================= */

  const loadWelcomeAccommodations =
    async () => {
      setLoadingAccommodations(
        true,
      );

      try {
        const response =
          await getAccommodations({
            show_on_welcome: true,
          });

        const data =
          Array.isArray(
            response?.data,
          )
            ? response.data
            : [];

        setWelcomeAccommodations(
          data.slice(0, 4),
        );
      } catch (error) {
        console.error(
          "Failed to load Welcome Page accommodations:",
          error,
        );

        setWelcomeAccommodations(
          [],
        );
      } finally {
        setLoadingAccommodations(
          false,
        );
      }
    };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    void loadWelcomeDestinations();

    void loadWelcomeAccommodations();
  }, []);

  /* =========================================================
     AUTO ROTATE ATTRACTION IMAGES
  ========================================================= */

  useEffect(() => {
    if (
      welcomeDestinations.length ===
      0
    ) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          setImageIndexes(
            (previous) => {
              const next = {
                ...previous,
              };

              welcomeDestinations.forEach(
                (destination) => {
                  const images =
                    Array.isArray(
                      destination.images,
                    )
                      ? destination.images.filter(
                          Boolean,
                        )
                      : [];

                  const id =
                    String(
                      (
                        destination as any
                      )?.id ?? "",
                    ).trim();

                  if (
                    id &&
                    images.length >
                      1
                  ) {
                    const currentIndex =
                      previous[
                        id
                      ] || 0;

                    next[id] =
                      (currentIndex +
                        1) %
                      images.length;
                  }
                },
              );

              return next;
            },
          );
        },
        5500,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [
    welcomeDestinations,
  ]);

  /* =========================================================
     CURRENT HERO
  ========================================================= */

  const currentHero =
    heroSlides[activeSlide];

  /* =========================================================
     WEATHER DISPLAY
  ========================================================= */

  const weatherDescription =
    getWeatherDescription(
      weather.weatherCode,
    );

  const weatherText =
    weather.loading
      ? "Loading weather..."
      : weather.error
        ? "Weather unavailable"
        : weather.temperature !==
            null
          ? `${weather.temperature.toFixed(
              1,
            )}°C`
          : weatherDescription;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="page-enter welcome-page">
      <Container className="welcome-container py-4 py-md-5">

        {/* =====================================================
            SWIPEABLE WELCOME HERO
        ===================================================== */}

        <section className="welcome-hero-section mb-5">
          <div
            className="welcome-hero-slider"
            onTouchStart={
              handleTouchStart
            }
            onTouchMove={
              handleTouchMove
            }
            onTouchEnd={
              handleTouchEnd
            }
            onMouseDown={
              handleMouseDown
            }
            onMouseUp={
              handleMouseUp
            }
            onMouseLeave={
              handleMouseLeave
            }
          >
            <img
              key={
                currentHero.id
              }
              src={
                currentHero.image
              }
              alt={
                currentHero.alt
              }
              className="welcome-hero-image"
              draggable={false}
            />

            <div className="welcome-hero-overlay" />

            <div className="welcome-hero-content">
              <h1 className="welcome-hero-title barabara-display">
                {welcomeGreeting}
              </h1>

              <div className="welcome-hero-detail">
                <span className="welcome-hero-detail-icon">
                  <MapPin
                    size={23}
                    strokeWidth={
                      2.1
                    }
                    aria-hidden="true"
                  />
                </span>

                <span>
                  Calbayog City, Philippines
                </span>
              </div>

              <div className="welcome-hero-detail">
                <span className="welcome-hero-detail-icon">
                  <CalendarDays
                    size={23}
                    strokeWidth={
                      2.1
                    }
                    aria-hidden="true"
                  />
                </span>

                <span>
                  {currentDate ||
                    "Loading date..."}
                </span>
              </div>

              <div
                className="welcome-hero-detail"
                aria-live="polite"
              >
                <span className="welcome-hero-detail-icon">
                  <CloudSun
                    size={25}
                    strokeWidth={
                      2.1
                    }
                    aria-hidden="true"
                  />
                </span>

                <span>
                  {weatherText}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="welcome-hero-arrow welcome-hero-arrow-left"
              onClick={(e) => {
                e.stopPropagation();

                previousSlide();
              }}
              aria-label="Previous hero image"
            >
              ‹
            </button>

            <button
              type="button"
              className="welcome-hero-arrow welcome-hero-arrow-right"
              onClick={(e) => {
                e.stopPropagation();

                nextSlide();
              }}
              aria-label="Next hero image"
            >
              ›
            </button>

            <div className="welcome-hero-dots">
              {heroSlides.map(
                (
                  slide,
                  index,
                ) => (
                  <button
                    type="button"
                    key={
                      slide.id
                    }
                    className={`welcome-hero-dot ${
                      activeSlide ===
                      index
                        ? "active"
                        : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();

                      setActiveSlide(
                        index,
                      );
                    }}
                    aria-label={`Show hero image ${
                      index + 1
                    }`}
                    aria-current={
                      activeSlide ===
                      index
                        ? "true"
                        : undefined
                    }
                  />
                ),
              )}
            </div>
          </div>
        </section>

        {/* =====================================================
            EXPLORE CALBAYOG
        ===================================================== */}

        <section className="welcome-explore-section mb-5">
          <div className="welcome-section-heading">
            <div className="welcome-intro">
              <div className="welcome-intro-eyebrow">
                WELCOME TO CALBAYOG
              </div>

              <p className="welcome-intro-text">
                Explore breathtaking
                waterfalls, peaceful
                coastlines, rich heritage,
                and local experiences
                waiting to be discovered.
              </p>
            </div>

            <div
              className="welcome-bunting"
              aria-hidden="true"
            >
              <span className="bunting-flag bunting-red" />
              <span className="bunting-flag bunting-orange" />
              <span className="bunting-flag bunting-yellow" />
              <span className="bunting-flag bunting-teal" />

              <span className="bunting-flag bunting-red" />
              <span className="bunting-flag bunting-orange" />
              <span className="bunting-flag bunting-yellow" />
              <span className="bunting-flag bunting-teal" />

              <span className="bunting-flag bunting-red" />
              <span className="bunting-flag bunting-orange" />
              <span className="bunting-flag bunting-yellow" />
              <span className="bunting-flag bunting-teal" />

              <span className="bunting-flag bunting-red" />
              <span className="bunting-flag bunting-orange" />
              <span className="bunting-flag bunting-yellow" />
              <span className="bunting-flag bunting-teal" />

              <span className="bunting-flag bunting-red" />
              <span className="bunting-flag bunting-orange" />
              <span className="bunting-flag bunting-yellow" />
              <span className="bunting-flag bunting-teal" />
            </div>

            <div className="section-header welcome-main-heading">
              <div>
                <h2 className="section-title welcome-display-title barabara-display">
                  EXPLORE CALBAYOG
                </h2>
              </div>
            </div>

            <div className="welcome-section-eyebrow welcome-explore-eyebrow">
              <span className="welcome-heading-line" />

              <span>
                Find a place worth slowing down for
              </span>

              <span className="welcome-heading-line" />
            </div>
          </div>

          <Row className="g-3 g-md-4 welcome-quick-grid">
            {quickCards.map(
              (card) => (
                <Col
                  xs={3}
                  sm={3}
                  md={3}
                  key={card.to}
                >
                  <Link
                    to={card.to}
                    className="welcome-quick-link"
                  >
                    <Card className="quick-card welcome-quick-card text-center border-0 h-100">
                      <Card.Body className="quick-card-body">
                        <div
                          className="quick-card-icon-wrap"
                          style={{
                            background:
                              card.bg,
                          }}
                        >
                          <span className="quick-card-icon">
                            {card.icon}
                          </span>
                        </div>

                        <div
                          className="quick-card-label"
                          style={{
                            color:
                              card.color,
                          }}
                        >
                          {card.label}
                        </div>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
              ),
            )}
          </Row>
        </section>

        {/* =====================================================
            ATTRACTIONS
            SHARED AttractionCard
        ===================================================== */}

        {!loadingDestinations &&
          welcomeDestinations.length >
            0 && (
            <section className="welcome-discover-section mb-5">
              <div className="welcome-attractions-heading">
                <h2 className="welcome-attractions-title barabara-display">
                  ATTRACTIONS
                </h2>

                <div className="welcome-section-eyebrow welcome-attractions-eyebrow">
                  <span className="welcome-heading-line" />

                  <span>
                    Places worth discovering in Calbayog
                  </span>

                  <span className="welcome-heading-line" />
                </div>
              </div>

              <Row className="welcome-attractions-grid">
                {welcomeDestinations.map(
                  (attraction) => {
                    const attractionId =
                      String(
                        (attraction as any)
                          ?.id ?? "",
                      ).trim();

                    return (
                      <Col
                        xs={12}
                        sm={6}
                        lg={3}
                        key={
                          attractionId ||
                          attraction.name
                        }
                        className="welcome-attraction-col"
                      >
                        <AttractionCard
                          attraction={
                            attraction
                          }
                          imageIndex={
                            attractionId
                              ? imageIndexes[
                                  attractionId
                                ] || 0
                              : 0
                          }
                          showFavoriteCount={
                            true
                          }
                          showFeatured={
                            true
                          }
                        />
                      </Col>
                    );
                  },
                )}
              </Row>
            </section>
          )}

        {/* =====================================================
            ACCOMMODATIONS
        ===================================================== */}

        {!loadingAccommodations &&
          welcomeAccommodations.length >
            0 && (
            <section className="welcome-accommodations-section mb-5">
              <div className="welcome-accommodations-heading">
                <h2 className="welcome-accommodations-title barabara-display">
                  ACCOMMODATIONS
                </h2>

                <div className="welcome-section-eyebrow">
                  <span className="welcome-heading-line" />

                  <span>
                    Places to stay in Calbayog
                  </span>

                  <span className="welcome-heading-line" />
                </div>
              </div>

              <Row className="g-3 g-md-4">
                {welcomeAccommodations.map(
                  (
                    accommodation,
                  ) => {
                    const accommodationData =
                      accommodation as any;

                    const images =
                      Array.isArray(
                        accommodationData.images,
                      )
                        ? accommodationData.images
                        : typeof accommodationData.images ===
                              "string" &&
                            accommodationData.images.trim()
                          ? accommodationData.images
                              .split(",")
                              .map(
                                (
                                  image: string,
                                ) =>
                                  image.trim(),
                              )
                              .filter(
                                Boolean,
                              )
                          : [];

                    const image =
                      images[0] || "";

                    const priceMin =
                      accommodationData.price_min;

                    const priceMax =
                      accommodationData.price_max;

                    const hasPriceMin =
                      priceMin !== null &&
                      priceMin !==
                        undefined &&
                      priceMin !== "";

                    const hasPriceMax =
                      priceMax !== null &&
                      priceMax !==
                        undefined &&
                      priceMax !== "";

                    let priceText =
                      "";

                    if (
                      hasPriceMin &&
                      hasPriceMax
                    ) {
                      priceText = `₱${Number(
                        priceMin,
                      ).toLocaleString()} – ₱${Number(
                        priceMax,
                      ).toLocaleString()}`;
                    } else if (
                      hasPriceMin
                    ) {
                      priceText = `From ₱${Number(
                        priceMin,
                      ).toLocaleString()}`;
                    } else if (
                      hasPriceMax
                    ) {
                      priceText = `Up to ₱${Number(
                        priceMax,
                      ).toLocaleString()}`;
                    }

                    return (
                      <Col
                        xs={12}
                        sm={6}
                        lg={3}
                        key={
                          accommodation.id
                        }
                      >
                        <Link
                          to={`/accommodations/${accommodation.id}`}
                          className="welcome-accommodation-link"
                          style={{
                            textDecoration:
                              "none",
                            display:
                              "block",
                            height:
                              "100%",
                          }}
                        >
                          <Card
                            className="welcome-accommodation-card border-0 h-100"
                            style={{
                              borderRadius:
                                "18px",
                              overflow:
                                "hidden",
                              background:
                                "#fff",
                              boxShadow:
                                "0 4px 18px rgba(0,0,0,0.08)",
                              transition:
                                "transform 0.25s ease, box-shadow 0.25s ease",
                            }}
                            onMouseEnter={(
                              e,
                            ) => {
                              e.currentTarget.style.transform =
                                "translateY(-6px)";

                              e.currentTarget.style.boxShadow =
                                "0 12px 30px rgba(0,0,0,0.14)";
                            }}
                            onMouseLeave={(
                              e,
                            ) => {
                              e.currentTarget.style.transform =
                                "translateY(0)";

                              e.currentTarget.style.boxShadow =
                                "0 4px 18px rgba(0,0,0,0.08)";
                            }}
                          >
                            <div className="welcome-accommodation-image-wrapper">
                              {image ? (
                                <img
                                  src={
                                    image
                                  }
                                  alt={
                                    accommodation.name
                                  }
                                  className="welcome-accommodation-image"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="welcome-accommodation-placeholder">
                                  🏨
                                </div>
                              )}

                              <div className="welcome-accommodation-image-overlay" />
                            </div>

                            <Card.Body className="welcome-accommodation-body">
                              <Card.Title className="welcome-accommodation-title">
                                {
                                  accommodation.name
                                }
                              </Card.Title>

                              {accommodationData.location_address && (
                                <p className="welcome-accommodation-address">
                                  {
                                    accommodationData.location_address
                                  }
                                </p>
                              )}

                              {priceText && (
                                <div className="welcome-accommodation-price">
                                  {
                                    priceText
                                  }
                                </div>
                              )}

                              <div className="welcome-accommodation-explore">
                                View stay

                                <span
                                  aria-hidden="true"
                                >
                                  →
                                </span>
                              </div>
                            </Card.Body>
                          </Card>
                        </Link>
                      </Col>
                    );
                  },
                )}
              </Row>
            </section>
          )}

        {/* =====================================================
            FEATURED VIDEOS
        ===================================================== */}

        <section className="welcome-videos-section mb-5">
          <div className="welcome-videos-heading">
            <h2 className="welcome-videos-title barabara-display">
              FEATURED VIDEOS
            </h2>

            <div className="welcome-section-eyebrow welcome-videos-eyebrow">
              <span className="welcome-heading-line" />

              <span>
                Experience Calbayog through video
              </span>

              <span className="welcome-heading-line" />
            </div>
          </div>

          <Row className="justify-content-center">
            {featuredVideos.map(
              (video) => (
                <Col
                  xs={12}
                  key={video.id}
                >
                  <Card className="welcome-video-card border-0">
                    <div className="welcome-video-wrapper">
                      <video
                        className="welcome-video-player"
                        controls
                        playsInline
                        preload="metadata"
                      >
                        <source
                          src={video.src}
                          type="video/mp4"
                        />

                        Your browser does not
                        support the video element.
                      </video>
                    </div>

                    <Card.Body className="welcome-video-body">
                      <h3 className="welcome-video-card-title">
                        {
                          video.title
                        }
                      </h3>

                      <p className="welcome-video-card-description">
                        {
                          video.description
                        }
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              ),
            )}
          </Row>
        </section>
      </Container>

      {/* =======================================================
          WELCOME PAGE STYLES
      ======================================================= */}

      <style>{`
        @import url(
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
        );

        @font-face {
          font-family: "Barabara";
          src: url("/fonts/BARABARA-final.otf")
            format("opentype");
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        .welcome-page,
        .welcome-page * {
          font-family:
            "Inter",
            sans-serif;
        }

        .barabara-display {
          font-family:
            "Barabara",
            "Arial Black",
            Arial,
            sans-serif !important;
          font-style: normal;
          font-weight: 400;
        }

        .welcome-display-title {
          color:
            #2D3195 !important;
        }

        .welcome-intro {
          width:
            100%;
          max-width:
            680px;
          margin:
            0 auto 30px;
          padding:
            0 12px;
          text-align:
            center;
        }

        .welcome-intro-eyebrow {
          margin:
            0;
          color:
            #2D3195;
          font-size:
            0.62rem;
          font-weight:
            700;
          letter-spacing:
            0.18em;
          line-height:
            1.2;
          text-transform:
            uppercase;
        }

        .welcome-intro-text {
          margin:
            10px auto 0;
          max-width:
            630px;
          color:
            #666666;
          font-size:
            0.79rem;
          font-weight:
            400;
          line-height:
            1.7;
        }

        .welcome-section-heading {
          width:
            100%;
          display:
            flex;
          flex-direction:
            column;
          align-items:
            center;
          padding-top:
            18px;
          margin-bottom:
            2.6rem;
        }

        .welcome-main-heading {
          width:
            100%;
          display:
            flex;
          justify-content:
            center;
          align-items:
            center;
          margin-top:
            0;
          margin-bottom:
            7px;
        }

        .welcome-main-heading > div {
          width:
            100%;
          text-align:
            center;
        }

        .welcome-explore-eyebrow {
          margin-top:
            0;
          margin-bottom:
            0;
        }

        .welcome-bunting {
          width:
            min(100%, 940px);
          height:
            32px;
          display:
            flex;
          align-items:
            flex-start;
          justify-content:
            center;
          overflow:
            hidden;
          margin:
            0 auto 26px;
          padding:
            0 8px;
          line-height:
            0;
        }

        .bunting-flag {
          position:
            relative;
          display:
            block;
          width:
            46px;
          height:
            32px;
          flex:
            0 0 46px;
          clip-path:
            polygon(
              0 0,
              100% 0,
              50% 100%
            );
          margin-left:
            -1px;
        }

        .bunting-red {
          background:
            #ED1C24;
        }

        .bunting-orange {
          background:
            #F36C21;
        }

        .bunting-yellow {
          background:
            #F2B705;
        }

        .bunting-teal {
          background:
            #14A6A0;
        }

        .bunting-flag:not(:first-child) {
          border-left:
            2px solid #ffffff;
        }

        .welcome-section-eyebrow {
          display:
            flex;
          align-items:
            center;
          justify-content:
            center;
          width:
            100%;
          gap:
            12px;
          color:
            #555555;
          font-size:
            0.68rem;
          font-weight:
            600;
          letter-spacing:
            0.14em;
          text-transform:
            uppercase;
          line-height:
            1.2;
          text-align:
            center;
        }

        .welcome-heading-line {
          width:
            38px;
          height:
            1px;
          background:
            rgba(
              45,
              49,
              149,
              0.24
            );
          flex-shrink:
            0;
        }

        .welcome-display-title {
          margin:
            0;
          padding:
            0;
          color:
            #2D3195 !important;
          font-size:
            clamp(
              2rem,
              4vw,
              3.15rem
            );
          line-height:
            1;
          letter-spacing:
            0.015em;
          text-align:
            center;
        }

        .welcome-quick-grid {
          margin-top:
            0;
          row-gap:
            42px;
        }

        .welcome-quick-link {
          color:
            inherit;
          text-decoration:
            none;
        }

        .welcome-quick-link:hover {
          color:
            inherit;
          text-decoration:
            none;
        }

        .welcome-quick-card {
          font-family:
            "Inter",
            sans-serif;
        }

        .quick-card-body {
          font-family:
            "Inter",
            sans-serif;
        }

        .quick-card-label {
          font-family:
            "Inter",
            sans-serif;
          font-weight:
            600;
        }

        /* =====================================================
           SHARED ATTRACTION GRID
        ===================================================== */

        .welcome-attractions-heading {
          width:
            100%;
          display:
            flex;
          flex-direction:
            column;
          align-items:
            center;
          justify-content:
            center;
          margin-bottom:
            2.35rem;
        }

        .welcome-attractions-title {
          margin:
            0 0 7px;
          padding:
            0;
          color:
            #2D3195 !important;
          font-size:
            clamp(
              1.75rem,
              4vw,
              2.35rem
            );
          line-height:
            1;
          letter-spacing:
            0.015em;
          text-align:
            center;
        }

        .welcome-attractions-eyebrow {
          color:
            #555555;
        }

        .welcome-attractions-grid {
          margin-left:
            -12px;
          margin-right:
            -12px;
          row-gap:
            46px;
        }

        .welcome-attraction-col {
          padding-left:
            12px;
          padding-right:
            12px;
          display:
            flex;
        }

        /* =====================================================
           ACCOMMODATIONS
        ===================================================== */

        .welcome-accommodations-section {
          width:
            100%;
          margin-top:
            85px;
        }

        .welcome-accommodations-heading {
          width:
            100%;
          display:
            flex;
          flex-direction:
            column;
          align-items:
            center;
          justify-content:
            center;
          margin-bottom:
            2rem;
        }

        .welcome-accommodations-title {
          margin:
            0 0 7px;
          padding:
            0;
          color:
            #2D3195 !important;
          font-size:
            clamp(
              2rem,
              4vw,
              3.15rem
            );
          line-height:
            1;
          letter-spacing:
            0.015em;
          text-align:
            center;
        }

        .welcome-accommodation-link {
          color:
            inherit;
        }

        .welcome-accommodation-link:hover {
          color:
            inherit;
        }

        .welcome-accommodation-card,
        .welcome-accommodation-card * {
          font-family:
            "Inter",
            sans-serif;
        }

        .welcome-accommodation-image-wrapper {
          position:
            relative;
          height:
            210px;
          overflow:
            hidden;
          background:
            #eef2ef;
        }

        .welcome-accommodation-image {
          width:
            100%;
          height:
            100%;
          object-fit:
            cover;
          display:
            block;
          transition:
            transform 0.4s ease;
        }

        .welcome-accommodation-card:hover
          .welcome-accommodation-image {
          transform:
            scale(1.04);
        }

        .welcome-accommodation-placeholder {
          width:
            100%;
          height:
            100%;
          display:
            flex;
          align-items:
            center;
          justify-content:
            center;
          font-size:
            3rem;
          background:
            #eef2ef;
        }

        .welcome-accommodation-image-overlay {
          position:
            absolute;
          inset:
            0;
          background:
            linear-gradient(
              to top,
              rgba(
                0,
                0,
                0,
                0.38
              ),
              transparent 55%
            );
          pointer-events:
            none;
        }

        .welcome-accommodation-body {
          padding:
            1.1rem
            1.1rem
            1.2rem;
          display:
            flex;
          flex-direction:
            column;
          height:
            calc(100% - 210px);
        }

        .welcome-accommodation-title {
          margin:
            0 0 0.5rem;
          color:
            #212529;
          font-size:
            1.05rem;
          font-weight:
            700;
          line-height:
            1.3;
        }

        .welcome-accommodation-address {
          margin:
            0 0 0.7rem;
          color:
            #6c757d;
          font-size:
            0.76rem;
          line-height:
            1.5;
          display:
            -webkit-box;
          -webkit-line-clamp:
            2;
          -webkit-box-orient:
            vertical;
          overflow:
            hidden;
        }

        .welcome-accommodation-price {
          color:
            #2D3195;
          font-size:
            0.78rem;
          font-weight:
            700;
          margin-bottom:
            0.75rem;
        }

        .welcome-accommodation-explore {
          margin-top:
            auto;
          padding-top:
            0.7rem;
          border-top:
            1px solid
            #f0f0f0;
          color:
            #2D3195;
          font-size:
            0.78rem;
          font-weight:
            700;
          display:
            flex;
          align-items:
            center;
          gap:
            5px;
        }

        /* =====================================================
           VIDEOS
        ===================================================== */

        .welcome-videos-section {
          width:
            100%;
          margin-top:
            90px;
        }

        .welcome-videos-heading {
          width:
            100%;
          display:
            flex;
          flex-direction:
            column;
          align-items:
            center;
          justify-content:
            center;
          margin-bottom:
            2.2rem;
        }

        .welcome-videos-title {
          margin:
            0 0 7px;
          padding:
            0;
          color:
            #2D3195 !important;
          font-size:
            clamp(
              1.75rem,
              4vw,
              2.35rem
            );
          line-height:
            1;
          letter-spacing:
            0.015em;
          text-align:
            center;
        }

        .welcome-videos-eyebrow {
          color:
            #555555;
        }

        .welcome-video-card {
          width:
            100%;
          max-width:
            820px;
          margin:
            0 auto;
          border-radius:
            20px;
          overflow:
            hidden;
          background:
            #ffffff;
          box-shadow:
            0 8px 28px
            rgba(
              0,
              0,
              0,
              0.08
            );
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease;
        }

        .welcome-video-card:hover {
          transform:
            translateY(-4px);
          box-shadow:
            0 14px 36px
            rgba(
              0,
              0,
              0,
              0.12
            );
        }

        .welcome-video-wrapper {
          position:
            relative;
          width:
            100%;
          max-width:
            780px;
          margin:
            0 auto;
          background:
            #10131c;
          overflow:
            hidden;
          aspect-ratio:
            16 / 9;
        }

        .welcome-video-player {
          width:
            100%;
          height:
            100%;
          display:
            block;
          object-fit:
            cover;
          background:
            #10131c;
        }

        .welcome-video-body {
          padding:
            1.1rem
            1.2rem
            1.25rem;
        }

        .welcome-video-card-title {
          margin:
            0 0 0.45rem;
          color:
            #212529;
          font-size:
            1.08rem;
          font-weight:
            700;
          line-height:
            1.3;
        }

        .welcome-video-card-description {
          margin:
            0;
          color:
            #6c757d;
          font-size:
            0.8rem;
          line-height:
            1.6;
        }

        /* =====================================================
           HERO
        ===================================================== */

        .welcome-hero-section {
          width:
            100%;
        }

        .welcome-hero-slider {
          position:
            relative;
          width:
            100%;
          height:
            390px;
          overflow:
            hidden;
          border-radius:
            24px;
          background:
            #102a23;
          box-shadow:
            0 12px 35px
            rgba(
              0,
              0,
              0,
              0.10
            );
          cursor:
            grab;
          user-select:
            none;
          touch-action:
            pan-y;
        }

        .welcome-hero-slider:active {
          cursor:
            grabbing;
        }

        .welcome-hero-image {
          position:
            absolute;
          inset:
            0;
          width:
            100%;
          height:
            100%;
          object-fit:
            cover;
          object-position:
            center;
          display:
            block;
          pointer-events:
            none;
          animation:
            welcomeHeroImageFade
            0.65s
            ease;
        }

        @keyframes welcomeHeroImageFade {
          from {
            opacity:
              0.45;
            transform:
              scale(
                1.035
              );
          }

          to {
            opacity:
              1;
            transform:
              scale(
                1
              );
          }
        }

        .welcome-hero-overlay {
          position:
            absolute;
          inset:
            0;
          pointer-events:
            none;
          background:
            linear-gradient(
              90deg,
              rgba(
                0,
                0,
                0,
                0.68
              ) 0%,
              rgba(
                0,
                0,
                0,
                0.52
              ) 25%,
              rgba(
                0,
                0,
                0,
                0.25
              ) 52%,
              rgba(
                0,
                0,
                0,
                0.06
              ) 100%
            ),
            linear-gradient(
              180deg,
              rgba(
                0,
                0,
                0,
                0.22
              ) 0%,
              rgba(
                0,
                0,
                0,
                0.02
              ) 50%,
              rgba(
                0,
                0,
                0,
                0.24
              ) 100%
            );
        }

        .welcome-hero-content {
          position:
            absolute;
          z-index:
            5;
          left:
            7%;
          top:
            50%;
          transform:
            translateY(-50%);
          display:
            flex;
          flex-direction:
            column;
          align-items:
            flex-start;
          color:
            #ffffff;
          max-width:
            620px;
        }

        .welcome-hero-title {
          margin:
            0 0 20px;
          padding:
            0;
          color:
            #ffffff;
          font-size:
            clamp(
              2.6rem,
              4.5vw,
              4rem
            );
          line-height:
            0.9;
          letter-spacing:
            0;
          text-shadow:
            0 3px 12px
            rgba(
              0,
              0,
              0,
              0.24
            );
          white-space:
            nowrap;
        }

        .welcome-hero-detail {
          display:
            flex;
          align-items:
            center;
          gap:
            12px;
          margin-bottom:
            10px;
          color:
            #ffffff;
          font-size:
            clamp(
              0.92rem,
              1.65vw,
              1.25rem
            );
          font-weight:
            400;
          line-height:
            1.4;
          text-shadow:
            0 2px 8px
            rgba(
              0,
              0,
              0,
              0.40
            );
        }

        .welcome-hero-detail:last-child {
          margin-bottom:
            0;
        }

        .welcome-hero-detail-icon {
          width:
            27px;
          min-width:
            27px;
          height:
            27px;
          display:
            inline-flex;
          align-items:
            center;
          justify-content:
            center;
          color:
            #ffffff;
          flex-shrink:
            0;
          line-height:
            1;
          filter:
            drop-shadow(
              0 2px 5px
              rgba(
                0,
                0,
                0,
                0.30
              )
            );
        }

        .welcome-hero-detail-icon svg {
          display:
            block;
          color:
            #ffffff;
        }

        .welcome-hero-arrow {
          position:
            absolute;
          z-index:
            10;
          top:
            50%;
          transform:
            translateY(-50%);
          width:
            44px;
          height:
            44px;
          display:
            flex;
          align-items:
            center;
          justify-content:
            center;
          padding:
            0;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.22
            );
          border-radius:
            50%;
          background:
            rgba(
              255,
              255,
              255,
              0.16
            );
          color:
            #ffffff;
          font-size:
            32px;
          font-family:
            Arial,
            sans-serif;
          font-weight:
            300;
          line-height:
            1;
          backdrop-filter:
            blur(10px);
          -webkit-backdrop-filter:
            blur(10px);
          box-shadow:
            0 5px 15px
            rgba(
              0,
              0,
              0,
              0.12
            );
          cursor:
            pointer;
          transition:
            background 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease,
            border-color 0.2s ease;
        }

        .welcome-hero-arrow:hover {
          background:
            rgba(
              255,
              255,
              255,
              0.90
            );
          color:
            #2D3195;
          border-color:
            rgba(
              255,
              255,
              255,
              0.95
            );
          transform:
            translateY(-50%)
            scale(
              1.06
            );
        }

        .welcome-hero-arrow-left {
          left:
            16px;
        }

        .welcome-hero-arrow-right {
          right:
            16px;
        }

        .welcome-hero-dots {
          position:
            absolute;
          z-index:
            10;
          left:
            50%;
          bottom:
            17px;
          transform:
            translateX(-50%);
          display:
            flex;
          align-items:
            center;
          gap:
            8px;
        }

        .welcome-hero-dot {
          width:
            8px;
          height:
            8px;
          padding:
            0;
          border:
            0;
          border-radius:
            50%;
          background:
            rgba(
              255,
              255,
              255,
              0.68
            );
          cursor:
            pointer;
          transition:
            width 0.25s ease,
            background 0.25s ease,
            transform 0.25s ease;
        }

        .welcome-hero-dot:hover {
          transform:
            scale(
              1.15
            );
        }

        .welcome-hero-dot.active {
          width:
            24px;
          border-radius:
            999px;
          background:
            #2D3195;
          box-shadow:
            0 0 8px
            rgba(
              45,
              49,
              149,
              0.45
            );
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 991.98px) {
          .welcome-hero-slider {
            height:
              370px;
            border-radius:
              22px;
          }

          .welcome-hero-content {
            left:
              6%;
          }

          .welcome-hero-title {
            font-size:
              clamp(
                2.5rem,
                5.5vw,
                3.6rem
              );
            margin-bottom:
              18px;
          }

          .welcome-hero-detail {
            font-size:
              1rem;
            gap:
              10px;
            margin-bottom:
              9px;
          }

          .welcome-hero-arrow {
            width:
              42px;
            height:
              42px;
          }

          .welcome-intro {
            margin-bottom:
              28px;
          }

          .welcome-intro-text {
            font-size:
              0.76rem;
          }

          .welcome-bunting {
            height:
              29px;
            margin-bottom:
              23px;
          }

          .bunting-flag {
            width:
              40px;
            height:
              29px;
            flex-basis:
              40px;
          }

          .welcome-section-heading {
            margin-bottom:
              2.4rem;
          }

          .welcome-main-heading {
            margin-bottom:
              6px;
          }

          .welcome-quick-grid {
            row-gap:
              38px;
          }

          .welcome-accommodations-section {
            margin-top:
              75px;
          }

          .welcome-videos-section {
            margin-top:
              75px;
          }
        }

        @media (max-width: 767.98px) {
          .welcome-hero-slider {
            height:
              430px;
            border-radius:
              20px;
          }

          .welcome-hero-image {
            object-position:
              center center;
          }

          .welcome-hero-overlay {
            background:
              linear-gradient(
                180deg,
                rgba(
                  0,
                  0,
                  0,
                  0.32
                ) 0%,
                rgba(
                  0,
                  0,
                  0,
                  0.14
                ) 28%,
                rgba(
                  0,
                  0,
                  0,
                  0.68
                ) 100%
              );
          }

          .welcome-hero-content {
            left:
              26px;
            right:
              26px;
            top:
              auto;
            bottom:
              52px;
            transform:
              none;
            max-width:
              none;
          }

          .welcome-hero-title {
            font-size:
              2.7rem;
            margin-bottom:
              17px;
            letter-spacing:
              0;
          }

          .welcome-hero-detail {
            font-size:
              0.94rem;
            gap:
              10px;
            margin-bottom:
              8px;
          }

          .welcome-hero-detail-icon {
            width:
              24px;
            min-width:
              24px;
            height:
              24px;
          }

          .welcome-hero-detail-icon svg {
            width:
              21px;
            height:
              21px;
          }

          .welcome-hero-arrow {
            width:
              38px;
            height:
              38px;
            font-size:
              28px;
          }

          .welcome-hero-arrow-left {
            left:
              10px;
          }

          .welcome-hero-arrow-right {
            right:
              10px;
          }

          .welcome-hero-dots {
            bottom:
              16px;
          }

          .welcome-intro {
            max-width:
              560px;
            margin-bottom:
              27px;
            padding:
              0 8px;
          }

          .welcome-intro-eyebrow {
            font-size:
              0.56rem;
            letter-spacing:
              0.16em;
          }

          .welcome-intro-text {
            max-width:
              470px;
            font-size:
              0.68rem;
            line-height:
              1.65;
            margin-top:
              9px;
          }

          .welcome-section-heading {
            margin-bottom:
              2rem;
          }

          .welcome-bunting {
            width:
              100%;
            height:
              24px;
            margin-bottom:
              22px;
            padding:
              0;
          }

          .bunting-flag {
            width:
              30px;
            height:
              24px;
            flex-basis:
              30px;
          }

          .bunting-flag:nth-child(n + 13) {
            display:
              none;
          }

          .welcome-section-eyebrow {
            gap:
              9px;
            font-size:
              0.58rem;
            letter-spacing:
              0.11em;
          }

          .welcome-heading-line {
            width:
              24px;
          }

          .welcome-display-title {
            font-size:
              clamp(
                1.8rem,
                8vw,
                2.55rem
              );
            line-height:
              1;
          }

          .welcome-main-heading {
            margin-bottom:
              6px;
          }

          .welcome-quick-grid {
            row-gap:
              42px;
          }

          .welcome-attractions-heading {
            margin-bottom:
              1.8rem;
          }

          .welcome-attractions-grid {
            row-gap:
              36px;
          }

          .welcome-accommodations-section {
            margin-top:
              65px;
          }

          .welcome-accommodations-title,
          .welcome-videos-title {
            font-size:
              1.8rem;
            line-height:
              1;
          }

          .welcome-accommodations-heading,
          .welcome-videos-heading {
            margin-bottom:
              1.8rem;
          }

          .welcome-accommodation-image-wrapper {
            height:
              210px;
          }

          .welcome-video-card {
            border-radius:
              18px;
          }

          .welcome-video-body {
            padding:
              0.95rem
              1rem
              1.05rem;
          }

          .welcome-video-card-title {
            font-size:
              1rem;
          }

          .welcome-video-card-description {
            font-size:
              0.74rem;
          }

          .welcome-videos-section {
            margin-top:
              65px;
          }
        }

        @media (max-width: 480px) {
          .welcome-hero-slider {
            height:
              410px;
            border-radius:
              18px;
          }

          .welcome-hero-content {
            left:
              21px;
            right:
              21px;
            bottom:
              48px;
          }

          .welcome-hero-title {
            font-size:
              2.25rem;
            margin-bottom:
              15px;
            letter-spacing:
              0;
          }

          .welcome-hero-detail {
            font-size:
              0.79rem;
            gap:
              8px;
            margin-bottom:
              7px;
          }

          .welcome-hero-detail-icon {
            width:
              21px;
            min-width:
              21px;
            height:
              21px;
          }

          .welcome-hero-detail-icon svg {
            width:
              19px;
            height:
              19px;
          }

          .welcome-hero-arrow {
            width:
              34px;
            height:
              34px;
            font-size:
              24px;
          }

          .welcome-hero-arrow-left {
            left:
              8px;
          }

          .welcome-hero-arrow-right {
            right:
              8px;
          }

          .welcome-intro {
            margin-bottom:
              24px;
            padding:
              0 5px;
          }

          .welcome-intro-eyebrow {
            font-size:
              0.51rem;
            letter-spacing:
              0.14em;
          }

          .welcome-intro-text {
            font-size:
              0.62rem;
            line-height:
              1.6;
            margin-top:
              8px;
          }

          .welcome-bunting {
            height:
              20px;
            margin-bottom:
              18px;
          }

          .bunting-flag {
            width:
              25px;
            height:
              20px;
            flex-basis:
              25px;
          }

          .bunting-flag:nth-child(n + 11) {
            display:
              none;
          }

          .welcome-section-eyebrow {
            gap:
              7px;
            font-size:
              0.52rem;
            letter-spacing:
              0.09em;
          }

          .welcome-heading-line {
            width:
              18px;
          }

          .welcome-display-title {
            font-size:
              2rem;
            line-height:
              1.02;
          }

          .welcome-main-heading {
            margin-bottom:
              5px;
          }

          .welcome-quick-grid {
            row-gap:
              38px;
          }

          .welcome-attractions-heading {
            margin-bottom:
              1.65rem;
          }

          .welcome-attractions-title {
            font-size:
              2rem;
          }

          .welcome-accommodations-section {
            margin-top:
              55px;
          }

          .welcome-accommodations-title,
          .welcome-videos-title {
            font-size:
              1.65rem;
            line-height:
              1.02;
          }

          .welcome-accommodations-heading,
          .welcome-videos-heading {
            margin-bottom:
              1.55rem;
          }

          .welcome-accommodation-image-wrapper {
            height:
              190px;
          }

          .welcome-video-card-description {
            font-size:
              0.68rem;
            line-height:
              1.55;
          }

          .welcome-videos-section {
            margin-top:
              55px;
          }
        }

        @media (max-width: 380px) {
          .welcome-intro-eyebrow {
            font-size:
              0.48rem;
          }

          .welcome-intro-text {
            font-size:
              0.59rem;
          }

          .welcome-bunting {
            height:
              18px;
            margin-bottom:
              16px;
          }

          .bunting-flag {
            width:
              22px;
            height:
              18px;
            flex-basis:
              22px;
          }

          .welcome-display-title {
            font-size:
              1.82rem;
          }

          .welcome-section-eyebrow {
            font-size:
              0.49rem;
            gap:
              6px;
          }

          .welcome-heading-line {
            width:
              15px;
          }

          .welcome-attractions-title {
            font-size:
              1.82rem;
          }

          .welcome-accommodations-title,
          .welcome-videos-title {
            font-size:
              1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Welcome;