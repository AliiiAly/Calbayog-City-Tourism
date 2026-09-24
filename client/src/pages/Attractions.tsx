import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLocation,
} from "react-router-dom";

import {
  Container,
  Row,
  Col,
  Button,
  Spinner,
} from "react-bootstrap";

import {
  Factory,
  Globe2,
  Landmark,
  Leaf,
  MapPin,
  ShoppingBag,
} from "lucide-react";

import {
  getAttractions,
} from "../services/api";

import {
  Destination,
  DestinationCategory,
} from "../types";

import {
  useFavorites,
} from "../context/FavoritesContext";

import AttractionCard from "../components/attractions/AttractionCard";

/* =========================================================
   BRAND COLOR
========================================================= */

const CALBAYOG_BLUE = "#2D3195";

/* =========================================================
   MAIN CATEGORIES
========================================================= */

const CATEGORIES: DestinationCategory[] = [
  "All",
  "Nature",
  "History and Culture",
  "Industrial Tourism",
  "Shopping",
  "Other",
];

/* =========================================================
   ATTRACTION TYPES
========================================================= */

const ATTRACTION_TYPES: Record<
  string,
  string[]
> = {
  Nature: [
    "Waterfalls",
    "Beaches",
    "Caves",
    "Hot Springs",
    "Rivers",
    "Dive Sites",
    "Other",
  ],

  "History and Culture": [
    "Churches",
    "Museums",
    "Historic Buildings",
    "Monuments",
    "Parks",
    "Other",
  ],

  "Industrial Tourism": [
    "Factories",
    "Farms",
    "Production Sites",
    "Other",
  ],

  Shopping: [
    "Markets",
    "Malls",
    "Local Craft Centers",
    "Other",
  ],

  Other: ["Other"],
};

/* =========================================================
   CATEGORY ICONS
========================================================= */

const categoryIcons = {
  All: Globe2,
  Nature: Leaf,
  "History and Culture": Landmark,
  "Industrial Tourism": Factory,
  Shopping: ShoppingBag,
  Other: MapPin,
};

/* =========================================================
   CATEGORY COLORS
========================================================= */

const categoryColors: Record<
  string,
  {
    color: string;
    background: string;
  }
> = {
  All: {
    color: "#0077B6",
    background: "#e7f4fb",
  },

  Nature: {
    color: "#1A7A4A",
    background: "#e8f5ee",
  },

  "History and Culture": {
    color: "#765548",
    background: "#f3ece8",
  },

  "Industrial Tourism": {
    color: "#536878",
    background: "#edf1f4",
  },

  Shopping: {
    color: "#b56a00",
    background: "#fff5df",
  },

  Other: {
    color: "#68736d",
    background: "#eef1ef",
  },
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeText = (
  value: unknown,
): string => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
};

/* =========================================================
   GET ATTRACTION ID
========================================================= */

const getAttractionId = (
  attraction: Destination,
): string => {
  return String(
    (attraction as any)?.id ?? "",
  ).trim();
};

/* =========================================================
   REALTIME WATCHERS
========================================================= */

const subscribeToAttractions = (
  _callback: () => void,
) => {
  /*
   * No active realtime subscription is currently
   * configured for this page.
   */
};

const unsubscribeAll = () => {
  /*
   * Cleanup placeholder.
   */
};

/* =========================================================
   ATTRACTIONS COMPONENT
========================================================= */

const Attractions: React.FC = () => {
  const location = useLocation();

  /* =========================================================
     GLOBAL FAVORITES
  ========================================================= */

  const {
    setFavoriteCount,
  } = useFavorites();

  /* =========================================================
     PAGE STATE
  ========================================================= */

  const [
    attractions,
    setAttractions,
  ] = useState<Destination[]>(
    [],
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    activeCategory,
    setActiveCategory,
  ] =
    useState<DestinationCategory>(
      "All",
    );

  const [
    activeType,
    setActiveType,
  ] = useState<string>("All");

  /* =========================================================
     IMAGE ROTATION
  ========================================================= */

  const [
    imageIndexes,
    setImageIndexes,
  ] = useState<
    Record<string, number>
  >({});

  /* =========================================================
     FETCH LOCK
  ========================================================= */

  const fetchLock =
    useRef(false);

  /* =========================================================
     READ CATEGORY + TYPE FROM URL
  ========================================================= */

  useEffect(() => {
    const params =
      new URLSearchParams(
        location.search,
      );

    const categoryParam =
      params.get("category");

    const typeParam =
      params.get("type");

    const validCategory =
      CATEGORIES.includes(
        categoryParam as DestinationCategory,
      )
        ? (categoryParam as DestinationCategory)
        : "All";

    setActiveCategory(
      validCategory,
    );

    if (
      validCategory !== "All"
    ) {
      const availableTypes =
        ATTRACTION_TYPES[
          validCategory
        ] || [];

      if (
        typeParam &&
        availableTypes.includes(
          typeParam,
        )
      ) {
        setActiveType(
          typeParam,
        );
      } else {
        setActiveType(
          "All",
        );
      }
    } else {
      setActiveType(
        "All",
      );
    }
  }, [
    location.search,
  ]);

  /* =========================================================
     FETCH ATTRACTIONS
  ========================================================= */

  const fetchAttractions =
    async () => {
      if (
        fetchLock.current
      ) {
        return;
      }

      fetchLock.current = true;
      setLoading(true);

      try {
        const response =
          await getAttractions();

        const data =
          Array.isArray(
            response?.data,
          )
            ? response.data
            : [];

        setAttractions(
          data,
        );

        setImageIndexes({});

        /* =====================================================
           SEED GLOBAL FAVORITE COUNTS
        ===================================================== */

        data.forEach(
          (
            attraction: Destination,
          ) => {
            const attractionId =
              getAttractionId(
                attraction,
              );

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
      } catch (error) {
        console.error(
          "Failed to fetch attractions:",
          error,
        );

        setAttractions(
          [],
        );
      } finally {
        fetchLock.current = false;
        setLoading(false);
      }
    };

  /* =========================================================
     INITIAL FETCH
  ========================================================= */

  useEffect(() => {
    void fetchAttractions();
  }, []);

  /* =========================================================
     REALTIME SUBSCRIPTION
  ========================================================= */

  useEffect(() => {
    subscribeToAttractions(
      () => {
        void fetchAttractions();
      },
    );

    return () => {
      unsubscribeAll();
    };
  }, []);

  /* =========================================================
     AUTO IMAGE ROTATION
  ========================================================= */

  useEffect(() => {
    if (
      attractions.length ===
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

              attractions.forEach(
                (attraction) => {
                  const images =
                    Array.isArray(
                      attraction.images,
                    )
                      ? attraction.images.filter(
                          Boolean,
                        )
                      : [];

                  const attractionId =
                    getAttractionId(
                      attraction,
                    );

                  if (
                    attractionId &&
                    images.length >
                      1
                  ) {
                    const currentIndex =
                      previous[
                        attractionId
                      ] || 0;

                    next[
                      attractionId
                    ] =
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
    attractions,
  ]);

  /* =========================================================
     AVAILABLE TYPES
  ========================================================= */

  const availableTypes =
    useMemo(() => {
      if (
        activeCategory ===
        "All"
      ) {
        return [];
      }

      return (
        ATTRACTION_TYPES[
          activeCategory
        ] || []
      );
    }, [
      activeCategory,
    ]);

  /* =========================================================
     FILTER ATTRACTIONS
  ========================================================= */

  const filteredAttractions =
    useMemo(() => {
      return attractions.filter(
        (attraction) => {
          const categoryMatches =
            activeCategory ===
              "All" ||
            normalizeText(
              attraction.category,
            ) ===
              normalizeText(
                activeCategory,
              );

          if (
            !categoryMatches
          ) {
            return false;
          }

          const attractionType =
            normalizeText(
              (
                attraction as any
              )
                .attraction_type,
            );

          const otherAttractionType =
            normalizeText(
              (
                attraction as any
              )
                .other_attraction_type,
            );

          let typeMatches =
            true;

          if (
            activeType !==
            "All"
          ) {
            typeMatches =
              attractionType ===
              normalizeText(
                activeType,
              );

            if (
              activeType ===
                "Other" &&
              attractionType ===
                "other" &&
              otherAttractionType
            ) {
              typeMatches =
                true;
            }
          }

          return typeMatches;
        },
      );
    }, [
      attractions,
      activeCategory,
      activeType,
    ]);

  /* =========================================================
     UPDATE URL
  ========================================================= */

  const updateUrl = (
    category: DestinationCategory,
    type: string,
  ) => {
    const params =
      new URLSearchParams();

    if (
      category !== "All"
    ) {
      params.set(
        "category",
        category,
      );
    }

    if (
      category !== "All" &&
      type !== "All"
    ) {
      params.set(
        "type",
        type,
      );
    }

    const queryString =
      params.toString();

    const newUrl =
      queryString
        ? `/attractions?${queryString}`
        : "/attractions";

    window.history.replaceState(
      window.history.state,
      "",
      newUrl,
    );
  };

  /* =========================================================
     CATEGORY CHANGE
  ========================================================= */

  const handleCategoryChange =
    (
      category: DestinationCategory,
    ) => {
      setActiveCategory(
        category,
      );

      setActiveType(
        "All",
      );

      updateUrl(
        category,
        "All",
      );
    };

  /* =========================================================
     TYPE CHANGE
  ========================================================= */

  const handleTypeChange = (
    type: string,
  ) => {
    setActiveType(type);

    updateUrl(
      activeCategory,
      type,
    );
  };

  /* =========================================================
     CLEAR FILTERS
  ========================================================= */

  const clearFilters =
    () => {
      setActiveCategory(
        "All",
      );

      setActiveType(
        "All",
      );

      window.history.replaceState(
        window.history.state,
        "",
        "/attractions",
      );
    };

  /* =========================================================
     RESULT LABEL
  ========================================================= */

  const getResultLabel =
    () => {
      if (
        activeCategory ===
        "All"
      ) {
        return "All attractions";
      }

      if (
        activeType !==
        "All"
      ) {
        return `${activeType} in ${activeCategory}`;
      }

      return activeCategory;
    };

  /* =========================================================
     ACTIVE CATEGORY STYLE
  ========================================================= */

  const activeCategoryStyle =
    categoryColors[
      activeCategory
    ] ||
    categoryColors.All;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="page-enter attractions-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="attractions-header">
        <div className="attractions-header-inner">
          <h1 className="attractions-title">
            ATTRACTIONS
          </h1>

          <p className="attractions-subtitle">
            Discover the natural
            beauty, culture, and
            memorable places
            waiting to be explored
            in Calbayog City.
          </p>
        </div>
      </section>

      {/* =====================================================
          BODY
      ===================================================== */}

      <Container className="attractions-container">

        {/* ===================================================
            CATEGORY BUTTONS
        =================================================== */}

        <div className="category-pills">
          {CATEGORIES.map(
            (category) => {
              const isActive =
                activeCategory ===
                category;

              const style =
                categoryColors[
                  category
                ] ||
                categoryColors.All;

              const Icon =
                categoryIcons[
                  category as keyof typeof categoryIcons
                ] ||
                MapPin;

              return (
                <button
                  key={
                    category
                  }
                  type="button"
                  onClick={() =>
                    handleCategoryChange(
                      category,
                    )
                  }
                  className={`category-pill ${
                    isActive
                      ? "category-pill-active"
                      : ""
                  }`}
                  style={
                    {
                      "--pill-color":
                        style.color,
                      "--pill-background":
                        style.background,
                    } as React.CSSProperties
                  }
                >
                  <Icon
                    size={16}
                    strokeWidth={
                      1.9
                    }
                  />

                  <span>
                    {category}
                  </span>
                </button>
              );
            },
          )}
        </div>

        {/* ===================================================
            TYPE FILTERS
        =================================================== */}

        {activeCategory !==
          "All" &&
          availableTypes.length >
            0 && (
            <div className="type-filter-section">
              <div className="type-filter-label">
                Narrow it down
              </div>

              <div className="type-pills">
                <button
                  type="button"
                  className={`type-pill ${
                    activeType ===
                    "All"
                      ? "type-pill-active"
                      : ""
                  }`}
                  onClick={() =>
                    handleTypeChange(
                      "All",
                    )
                  }
                  style={
                    {
                      "--type-color":
                        activeCategoryStyle.color,
                      "--type-background":
                        activeCategoryStyle.background,
                    } as React.CSSProperties
                  }
                >
                  All
                </button>

                {availableTypes.map(
                  (type) => {
                    const isActive =
                      activeType ===
                      type;

                    return (
                      <button
                        key={
                          type
                        }
                        type="button"
                        className={`type-pill ${
                          isActive
                            ? "type-pill-active"
                            : ""
                        }`}
                        onClick={() =>
                          handleTypeChange(
                            type,
                          )
                        }
                        style={
                          {
                            "--type-color":
                              activeCategoryStyle.color,
                            "--type-background":
                              activeCategoryStyle.background,
                          } as React.CSSProperties
                        }
                      >
                        {
                          type
                        }
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          )}

        {/* ===================================================
            RESULTS BAR
        =================================================== */}

        {!loading && (
          <div className="results-bar">
            <div className="results-left">
              <div
                className="results-icon"
                style={{
                  background:
                    activeCategoryStyle.background,
                  color:
                    activeCategoryStyle.color,
                }}
              >
                {(() => {
                  const Icon =
                    categoryIcons[
                      activeCategory as keyof typeof categoryIcons
                    ] ||
                    MapPin;

                  return (
                    <Icon
                      size={18}
                      strokeWidth={
                        1.9
                      }
                    />
                  );
                })()}
              </div>

              <div>
                <div className="results-label">
                  Showing
                </div>

                <div className="results-count">
                  <strong>
                    {
                      filteredAttractions.length
                    }
                  </strong>{" "}
                  attraction
                  {filteredAttractions.length !==
                  1
                    ? "s"
                    : ""}
                </div>
              </div>
            </div>

            <div className="results-right">
              <span className="results-category">
                {getResultLabel()}
              </span>

              {(activeCategory !==
                "All" ||
                activeType !==
                  "All") && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={
                    clearFilters
                  }
                  className="clear-button"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (
          <div className="attractions-loading">
            <div className="loading-icon">
              <Spinner
                animation="border"
                size="sm"
              />
            </div>

            <div className="loading-title">
              Discovering
              attractions...
            </div>

            <p className="loading-subtitle">
              Please wait a
              moment.
            </p>
          </div>
        ) : filteredAttractions.length ===
          0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <MapPin
                size={30}
                strokeWidth={
                  1.6
                }
              />
            </div>

            <h3>
              No attractions
              found
            </h3>

            <p>
              There are no
              attractions under
              this category yet.
              Try exploring
              another category.
            </p>

            <Button
              variant="outline-primary"
              onClick={
                clearFilters
              }
              className="empty-button"
            >
              <Leaf
                size={15}
                strokeWidth={
                  1.8
                }
              />

              View all
              attractions
            </Button>
          </div>
        ) : (
          <Row className="attractions-grid">
            {filteredAttractions.map(
              (attraction) => {
                const attractionId =
                  getAttractionId(
                    attraction,
                  );

                return (
                  <Col
                    xs={12}
                    sm={6}
                    lg={3}
                    key={
                      attractionId ||
                      attraction.name
                    }
                    className="attraction-col"
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
        )}
      </Container>

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

        .attractions-page {
          min-height: 100vh;
          background: #ffffff;
          color: #171a18;
        }

        .attractions-header {
          width: 100%;
          background: #ffffff;
          padding: 30px 20px 18px;
        }

        .attractions-header-inner {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
        }

        .attractions-title {
          margin: 0;
          font-family: "Barabara", sans-serif !important;
          font-size:
            clamp(
              1.65rem,
              2.8vw,
              2.4rem
            );
          font-weight: 400;
          line-height: 0.95;
          letter-spacing: 0.015em;
          color: ${CALBAYOG_BLUE};
        }

        .attractions-subtitle {
          max-width: 590px;
          margin: 6px 0 0;
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

        .attractions-container {
          width: 100%;
          max-width: 1240px;
          padding: 0 0 60px;
          margin: 0 auto;
        }

        /* =====================================================
           CATEGORY ROW
           
           FIX:
           Added top breathing room so touched/hovered pills
           never get clipped at the top.
           
           Also removed the upward movement that was causing
           the clipping on touch devices.
        ===================================================== */

        .category-pills {
          display: flex;
          align-items: center;
          gap: 8px;

          overflow-x: auto;
          overflow-y: hidden;

          margin: 0 0 5px;

          padding:
            6px 0 14px;

          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .category-pills::-webkit-scrollbar,
        .type-pills::-webkit-scrollbar {
          display: none;
        }

        .category-pill {
          flex: 0 0 auto;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 7px;

          min-height: 39px;

          padding:
            8px 15px;

          border:
            1px solid #e3e7e4;

          border-radius: 999px;

          background: #ffffff;

          color: #68716c;

          font-family:
            "Nunito",
            "Segoe UI",
            sans-serif;

          font-size: 0.74rem;
          font-weight: 800;

          cursor: pointer;

          transition:
            color 0.2s ease,
            background 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;

          white-space: nowrap;

          -webkit-tap-highlight-color: transparent;
        }

        .category-pill:hover {
          color: var(--pill-color);
          border-color: var(--pill-color);
          background: var(--pill-background);

          /* IMPORTANT:
             No translateY here, so touch/hover
             cannot push the pill into the top edge.
          */
          transform: none;
        }

        .category-pill-active {
          color: var(--pill-color);
          border-color: var(--pill-color);
          background: var(--pill-background);

          box-shadow:
            0 5px 16px
            rgba(
              20,
              30,
              24,
              0.07
            );
        }

        .type-filter-section {
          margin: 3px 0 25px;
        }

        .type-filter-label {
          margin-bottom: 8px;
          padding-left: 2px;
          font-family: "Nunito", sans-serif;
          font-size: 0.64rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #949c97;
        }

        .type-pills {
          display: flex;
          align-items: center;
          gap: 7px;
          overflow-x: auto;
          padding: 2px 1px 5px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .type-pill {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 35px;
          padding: 7px 12px;
          border: 1px solid #e5e9e6;
          border-radius: 999px;
          background: #ffffff;
          color: #7a837e;
          font-family: "Nunito", sans-serif;
          font-size: 0.69rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .type-pill:hover,
        .type-pill-active {
          border-color: var(--type-color);
          background: var(--type-background);
          color: var(--type-color);
        }

        .results-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          flex-wrap: wrap;
          margin-bottom: 27px;
          padding: 11px 2px;
          border-top: 1px solid #f0f2f0;
          border-bottom: 1px solid #f0f2f0;
        }

        .results-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .results-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
        }

        .results-label {
          font-family: "Nunito", sans-serif;
          font-size: 0.64rem;
          color: #8b938e;
          line-height: 1.2;
        }

        .results-count {
          margin-top: 2px;
          font-family: "Poppins", sans-serif;
          font-size: 0.74rem;
          font-weight: 700;
          color: #252b27;
        }

        .results-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .results-category {
          font-family: "Nunito", sans-serif;
          font-size: 0.69rem;
          font-weight: 700;
          color: #858d88;
        }

        .clear-button {
          border-radius: 999px !important;
          padding: 5px 11px !important;
          font-family: "Nunito", sans-serif;
          font-size: 0.66rem !important;
          font-weight: 800 !important;
        }

        .attractions-grid {
          row-gap: 46px !important;
          margin-left: -12px;
          margin-right: -12px;
        }

        .attraction-col {
          padding-left: 12px;
          padding-right: 12px;
          display: flex;
        }

        .attractions-loading {
          min-height: 360px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
        }

        .loading-icon {
          width: 58px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 13px;
          border-radius: 17px;
          background: #eef0ff;
        }

        .loading-icon .spinner-border {
          color: ${CALBAYOG_BLUE};
        }

        .loading-title {
          font-family: "Poppins", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          color: #202521;
        }

        .loading-subtitle {
          margin: 4px 0 0;
          color: #89918c;
          font-family: "Nunito", sans-serif;
          font-size: 0.72rem;
        }

        .empty-state {
          text-align: center;
          padding: 65px 20px;
          border: 1px solid #edf1ee;
          border-radius: 20px;
          background: #fafcfb;
        }

        .empty-icon {
          width: 68px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px;
          border-radius: 20px;
          color: ${CALBAYOG_BLUE};
          background: #eef0ff;
        }

        .empty-state h3 {
          margin: 0 0 7px;
          color: #202521;
          font-family: "Poppins", sans-serif;
          font-size: 1rem;
          font-weight: 700;
        }

        .empty-state p {
          max-width: 380px;
          margin: 0 auto 18px;
          color: #7e8781;
          font-family: "Nunito", sans-serif;
          font-size: 0.77rem;
          line-height: 1.55;
        }

        .empty-button {
          display: inline-flex !important;
          align-items: center;
          gap: 6px;
          border-radius: 999px !important;
          padding: 8px 16px !important;
          font-size: 0.73rem !important;
          font-weight: 800 !important;
        }

        @media (max-width: 991.98px) {
          .attractions-header {
            padding: 28px 20px 18px;
          }

          .attractions-title {
            font-size:
              clamp(
                1.65rem,
                4.5vw,
                2.25rem
              );
          }

          .attractions-grid {
            row-gap:
              40px !important;
          }
        }

        @media (max-width: 767.98px) {
          .attractions-header {
            padding:
              25px 17px 16px;
          }

          .attractions-title {
            font-size: 1.9rem;
          }

          .attractions-subtitle {
            margin-top: 6px;
            font-size: 0.78rem;
          }

          .attractions-container {
            padding-top: 0;
            padding-left: 17px;
            padding-right: 17px;
          }

          .category-pills {
            padding-top: 7px;
          }

          .results-bar {
            align-items: flex-start;
          }

          .results-right {
            width: 100%;
            justify-content: space-between;
          }

          .attractions-grid {
            row-gap:
              36px !important;
          }

          .attraction-col {
            padding-left: 12px;
            padding-right: 12px;
          }
        }

        @media (max-width: 479.98px) {
          .attractions-title {
            font-size: 1.8rem;
          }

          .attractions-subtitle {
            font-size: 0.77rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Attractions;