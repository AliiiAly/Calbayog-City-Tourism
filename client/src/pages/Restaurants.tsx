import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useHistory } from "react-router-dom";

import {
  Container,
  Row,
  Col,
  Button,
  Spinner,
} from "react-bootstrap";

import {
  Utensils,
  MapPin,
  Globe2,
} from "lucide-react";

import {
  getRestaurants,
  type Restaurant,
} from "../services/api";

import {
  useFavorites,
} from "../context/FavoritesContext";

import RestaurantCard from "../components/restaurants/RestaurantCard";

const CALBAYOG_BLUE = "#2D3195";

/*
 * Keeps the restaurant listing's scroll position when the
 * component unmounts and the user returns from RestaurantDetail.
 */
let savedRestaurantsScrollY = 0;

const normalizeText = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const getRestaurantId = (restaurant: Restaurant): string =>
  String(restaurant.id ?? "").trim();

const Restaurants: React.FC = () => {
  const history = useHistory();
  const { setFavoriteCount } = useFavorites();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCuisine, setActiveCuisine] = useState("All");

  const fetchLock = useRef(false);
  const hasRestoredScroll = useRef(false);

  /* =========================================================
     FETCH RESTAURANTS
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const fetchRestaurants = async () => {
      if (fetchLock.current) return;

      fetchLock.current = true;
      setLoading(true);

      try {
        const response = await getRestaurants();

        const data = Array.isArray(response?.data)
          ? response.data
          : [];

        if (cancelled) return;

        setRestaurants(data);

        data.forEach((restaurant) => {
          const id = getRestaurantId(restaurant);
          if (!id) return;

          setFavoriteCount(
            "restaurant",
            id,
            Math.max(
              0,
              Number(restaurant.favorites ?? 0) || 0,
            ),
          );
        });
      } catch (error) {
        console.error("Failed to fetch restaurants:", error);

        if (!cancelled) {
          setRestaurants([]);
        }
      } finally {
        fetchLock.current = false;

        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchRestaurants();

    return () => {
      cancelled = true;
    };
  }, [setFavoriteCount]);

  /* =========================================================
     PRESERVE SCROLL POSITION

     Save the current scroll position as the user scrolls.
     When returning with Back/POP navigation, restore it after
     the restaurant cards finish loading and render.
  ========================================================= */

  useEffect(() => {
    const saveScrollPosition = () => {
      savedRestaurantsScrollY =
        window.scrollY || window.pageYOffset || 0;
    };

    window.addEventListener(
      "scroll",
      saveScrollPosition,
      { passive: true },
    );

    saveScrollPosition();

    return () => {
      saveScrollPosition();

      window.removeEventListener(
        "scroll",
        saveScrollPosition,
      );
    };
  }, []);

  useEffect(() => {
    if (
      loading ||
      hasRestoredScroll.current ||
      history.action !== "POP" ||
      savedRestaurantsScrollY <= 0
    ) {
      return;
    }

    hasRestoredScroll.current = true;

    const savedPosition = savedRestaurantsScrollY;

    let secondFrame = 0;

    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        window.scrollTo({
          top: savedPosition,
          left: 0,
          behavior: "auto",
        });

        savedRestaurantsScrollY = 0;
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);

      if (secondFrame) {
        window.cancelAnimationFrame(secondFrame);
      }
    };
  }, [loading, history.action]);

  /* =========================================================
     CUISINE FILTER OPTIONS
  ========================================================= */

  const cuisines = useMemo(() => {
    const values = restaurants
      .map((restaurant) => restaurant.cuisine_type?.trim())
      .filter((value): value is string => Boolean(value));

    return ["All", ...Array.from(new Set(values)).sort()];
  }, [restaurants]);

  /* =========================================================
     FILTER RESTAURANTS

     Search has been removed. Cuisine and Featured filters
     remain functional.
  ========================================================= */

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      const matchesCuisine =
        activeCuisine === "All" ||
        normalizeText(restaurant.cuisine_type) ===
          normalizeText(activeCuisine);

      return matchesCuisine;
    });
  }, [restaurants, activeCuisine]);

  /* =========================================================
     CLEAR FILTERS
  ========================================================= */

  const clearFilters = () => {
    setActiveCuisine("All");
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="page-enter restaurants-page">
      <section className="restaurants-header">
        <div className="restaurants-header-inner">
          <h1 className="restaurants-title">
            RESTAURANTS
          </h1>

          <p className="restaurants-subtitle">
            Discover places to eat in Calbayog City, explore local
            flavors, and find a restaurant for your next meal.
          </p>
        </div>
      </section>

      <Container className="restaurants-container">
        {/* CUISINE FILTERS */}

        <div className="restaurant-cuisine-label">
          EXPLORE BY CUISINE
        </div>

        <div className="restaurant-cuisine-pills">
          {cuisines.map((cuisine) => (
            <button
              key={cuisine}
              type="button"
              className={`restaurant-cuisine-pill ${
                activeCuisine === cuisine
                  ? "restaurant-cuisine-pill-active"
                  : ""
              }`}
              onClick={() => setActiveCuisine(cuisine)}
            >
              {cuisine === "All" && <Globe2 size={15} />}
              {cuisine}
            </button>
          ))}
        </div>

        {/* RESULTS BAR */}

        {!loading && (
          <div className="restaurant-results-bar">
            <div className="restaurant-results-icon">
              <Utensils size={19} />
            </div>

            <div className="restaurant-results-copy">
              <span>Showing</span>

              <strong>
                {filteredRestaurants.length} restaurant
                {filteredRestaurants.length !== 1 ? "s" : ""}
              </strong>
            </div>

            {(activeCuisine !== "All") && (
              <Button
                variant="outline-secondary"
                size="sm"
                className="restaurant-clear-button"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* LOADING STATE */}

        {loading ? (
          <div className="restaurants-loading">
            <Spinner animation="border" />

            <h3>Discovering restaurants...</h3>

            <p>Please wait a moment.</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          /* EMPTY STATE */

          <div className="restaurant-empty-state">
            <div className="restaurant-empty-icon">
              <MapPin size={30} />
            </div>

            <h3>
              {restaurants.length === 0
                ? "No restaurants available"
                : "No restaurants found"}
            </h3>

            <p>
              {restaurants.length === 0
                ? "Restaurant listings will appear here when available."
                : "Try selecting another cuisine or clearing your filters to see more restaurants."}
            </p>

            <Button
              variant="outline-primary"
              onClick={clearFilters}
            >
              View all restaurants
            </Button>
          </div>
        ) : (
          /* RESTAURANT GRID */

          <Row className="restaurants-grid">
            {filteredRestaurants.map((restaurant) => {
              const id = getRestaurantId(restaurant);

              return (
                <Col
                  xs={12}
                  sm={6}
                  lg={3}
                  key={id || restaurant.name}
                  className="restaurant-col"
                >
                  <RestaurantCard
                    restaurant={restaurant}
                    imageIndex={0}
                    showFeatured={true}
                  />
                </Col>
              );
            })}
          </Row>
        )}
      </Container>

      {/* PAGE STYLES */}

      <style>{`
        .restaurants-page {
          min-height: 100vh;
          background: #fff;
          color: #171a18;
        }

        .restaurants-header {
          padding: 30px 20px 18px;
          background: #fff;
        }

        .restaurants-header-inner {
          max-width: 1240px;
          margin: 0 auto;
        }

        .restaurants-title {
          margin: 0;
          color: ${CALBAYOG_BLUE};
          font-family: "Barabara", sans-serif;
          font-size: clamp(1.65rem, 2.8vw, 2.4rem);
          font-weight: 400;
          line-height: 1;
        }

        .restaurants-subtitle {
          max-width: 590px;
          margin: 8px 0 0;
          color: #737b76;
          font-family: "Nunito", "Poppins", sans-serif;
          font-size: .81rem;
          line-height: 1.6;
        }

        .restaurants-container {
          max-width: 1240px;
          padding: 0 0 60px;
        }

        /* CUISINE FILTERS */

        .restaurant-cuisine-label {
          margin-bottom: 10px;
          color: #949c97;
          font: 800 .64rem "Nunito", sans-serif;
          letter-spacing: .08em;
        }

        .restaurant-cuisine-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding: 2px 0 14px;
          margin-bottom: 10px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .restaurant-cuisine-pills::-webkit-scrollbar {
          display: none;
        }

        .restaurant-cuisine-pill {
          display: inline-flex;
          flex: 0 0 auto;
          align-items: center;
          gap: 7px;
          min-height: 37px;
          padding: 8px 14px;
          border: 1px solid #e3e7e4;
          border-radius: 999px;
          background: #fff;
          color: #68716c;
          font: 800 .72rem "Nunito", sans-serif;
          white-space: nowrap;
          cursor: pointer;
          transition:
            background .2s ease,
            color .2s ease;
        }

        .restaurant-cuisine-pill:hover,
        .restaurant-cuisine-pill-active {
          border-color: ${CALBAYOG_BLUE};
          background: #eef0ff;
          color: ${CALBAYOG_BLUE};
        }

        /* RESULTS BAR */

        .restaurant-results-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 8px 0 27px;
          padding: 13px 2px;
          border-top: 1px solid #f0f2f0;
          border-bottom: 1px solid #f0f2f0;
        }

        .restaurant-results-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          border-radius: 10px;
          background: #eef0ff;
          color: ${CALBAYOG_BLUE};
        }

        .restaurant-results-copy {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-family: "Nunito", sans-serif;
        }

        .restaurant-results-copy span {
          color: #8b938e;
          font-size: .64rem;
        }

        .restaurant-results-copy strong {
          color: #252b27;
          font-size: .76rem;
        }

        .restaurant-clear-button {
          margin-left: auto;
          border-radius: 999px !important;
          font: 800 .68rem "Nunito", sans-serif !important;
        }

        /* RESTAURANT GRID */

        .restaurants-grid {
          row-gap: 46px !important;
          margin-right: -12px;
          margin-left: -12px;
        }

        .restaurant-col {
          display: flex;
          padding-right: 12px;
          padding-left: 12px;
        }

        /* LOADING STATE */

        .restaurants-loading {
          display: flex;
          min-height: 340px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: ${CALBAYOG_BLUE};
        }

        .restaurants-loading h3 {
          margin: 5px 0 0;
          color: #202521;
          font: 700 .9rem "Poppins", sans-serif;
        }

        .restaurants-loading p {
          margin: 0;
          color: #89918c;
          font: .74rem "Nunito", sans-serif;
        }

        /* EMPTY STATE */

        .restaurant-empty-state {
          padding: 65px 20px;
          border: 1px solid #edf1ee;
          border-radius: 20px;
          background: #fafcfb;
          text-align: center;
        }

        .restaurant-empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 68px;
          height: 68px;
          margin: 0 auto 15px;
          border-radius: 20px;
          background: #eef0ff;
          color: ${CALBAYOG_BLUE};
        }

        .restaurant-empty-state h3 {
          margin: 0 0 7px;
          color: #202521;
          font: 700 1rem "Poppins", sans-serif;
        }

        .restaurant-empty-state p {
          max-width: 390px;
          margin: 0 auto 18px;
          color: #7e8781;
          font: .77rem/1.6 "Nunito", sans-serif;
        }

        .restaurant-empty-state .btn {
          border-radius: 999px;
          font: 800 .73rem "Nunito", sans-serif;
        }

        /* RESPONSIVE: TABLET AND MOBILE */

        @media (max-width: 991.98px) {
          .restaurants-container {
            padding-right: 20px;
            padding-left: 20px;
          }
        }

        @media (max-width: 767.98px) {
          .restaurants-header {
            padding: 25px 17px 16px;
          }

          .restaurants-title {
            font-size: 1.9rem;
          }

          .restaurants-subtitle {
            font-size: .78rem;
          }

          .restaurants-container {
            padding-right: 17px;
            padding-left: 17px;
          }

          .restaurant-cuisine-pills {
            gap: 7px;
          }

          .restaurant-cuisine-pill {
            padding-right: 12px;
            padding-left: 12px;
          }

          .restaurant-results-bar {
            gap: 9px;
          }

          .restaurants-grid {
            row-gap: 36px !important;
          }
        }

        @media (max-width: 479.98px) {
          .restaurants-title {
            font-size: 1.75rem;
          }

          .restaurants-subtitle {
            font-size: .76rem;
          }

          .restaurant-results-bar {
            flex-wrap: wrap;
          }

          .restaurant-clear-button {
            margin-left: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default Restaurants;
