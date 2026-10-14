
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  Search,
  SlidersHorizontal,
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

const normalizeText = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const getRestaurantId = (restaurant: Restaurant): string =>
  String(restaurant.id ?? "").trim();

const Restaurants: React.FC = () => {
  const { setFavoriteCount } = useFavorites();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCuisine, setActiveCuisine] = useState("All");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const fetchLock = useRef(false);

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
            Math.max(0, Number(restaurant.favorites ?? 0) || 0),
          );
        });
      } catch (error) {
        console.error("Failed to fetch restaurants:", error);
        if (!cancelled) setRestaurants([]);
      } finally {
        fetchLock.current = false;
        if (!cancelled) setLoading(false);
      }
    };

    void fetchRestaurants();

    return () => {
      cancelled = true;
    };
  }, [setFavoriteCount]);

  const cuisines = useMemo(() => {
    const values = restaurants
      .map((restaurant) => restaurant.cuisine_type?.trim())
      .filter((value): value is string => Boolean(value));

    return ["All", ...Array.from(new Set(values)).sort()];
  }, [restaurants]);

  const filteredRestaurants = useMemo(() => {
    const term = normalizeText(searchTerm);

    return restaurants.filter((restaurant) => {
      const matchesCuisine =
        activeCuisine === "All" ||
        normalizeText(restaurant.cuisine_type) ===
          normalizeText(activeCuisine);

      const matchesFeatured =
        !featuredOnly || restaurant.featured === true;

      const searchableText = [
        restaurant.name,
        restaurant.description,
        restaurant.short_description,
        restaurant.location_address,
        restaurant.cuisine_type,
        restaurant.price_range,
      ]
        .map(normalizeText)
        .join(" ");

      const matchesSearch =
        !term || searchableText.includes(term);

      return matchesCuisine && matchesFeatured && matchesSearch;
    });
  }, [restaurants, searchTerm, activeCuisine, featuredOnly]);

  const clearFilters = () => {
    setSearchTerm("");
    setActiveCuisine("All");
    setFeaturedOnly(false);
  };

  return (
    <div className="page-enter restaurants-page">
      <section className="restaurants-header">
        <div className="restaurants-header-inner">
          <h1 className="restaurants-title">RESTAURANTS</h1>
          <p className="restaurants-subtitle">
            Discover places to eat in Calbayog City, explore local
            flavors, and find a restaurant for your next meal.
          </p>
        </div>
      </section>

      <Container className="restaurants-container">
        <div className="restaurant-search-row">
          <div className="restaurant-search">
            <Search size={18} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search restaurants, cuisine, or location..."
              aria-label="Search restaurants"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            className={`featured-filter ${featuredOnly ? "featured-filter-active" : ""}`}
            onClick={() => setFeaturedOnly((previous) => !previous)}
            aria-pressed={featuredOnly}
          >
            <SlidersHorizontal size={16} />
            Featured
          </button>
        </div>

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

            {(searchTerm || activeCuisine !== "All" || featuredOnly) && (
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

        {loading ? (
          <div className="restaurants-loading">
            <Spinner animation="border" />
            <h3>Discovering restaurants...</h3>
            <p>Please wait a moment.</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="restaurant-empty-state">
            <div className="restaurant-empty-icon">
              <MapPin size={30} />
            </div>

            <h3>No restaurants found</h3>
            <p>
              {restaurants.length === 0
                ? "Restaurant listings will appear here when available."
                : "Try another search or clear your filters to see more restaurants."}
            </p>

            <Button
              variant="outline-primary"
              onClick={clearFilters}
            >
              View all restaurants
            </Button>
          </div>
        ) : (
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

        .restaurant-search-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 8px 0 24px;
        }

        .restaurant-search {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
          padding: 0 14px;
          border: 1px solid #e5e9e6;
          border-radius: 12px;
          background: #fff;
          color: #858d88;
        }

        .restaurant-search input {
          width: 100%;
          min-width: 0;
          height: 44px;
          border: 0;
          outline: none;
          background: transparent;
          color: #252b27;
          font: 500 .78rem "Nunito", sans-serif;
        }

        .restaurant-search input:focus-visible {
          outline: none;
        }

        .restaurant-search button {
          border: 0;
          background: transparent;
          color: #737b76;
          font-size: 1.4rem;
          cursor: pointer;
        }

        .featured-filter {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 44px;
          padding: 0 14px;
          border: 1px solid #e5e9e6;
          border-radius: 12px;
          background: #fff;
          color: #68716c;
          font: 800 .73rem "Nunito", sans-serif;
          white-space: nowrap;
          cursor: pointer;
        }

        .featured-filter-active {
          border-color: ${CALBAYOG_BLUE};
          background: #eef0ff;
          color: ${CALBAYOG_BLUE};
        }

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
          transition: background .2s ease, color .2s ease;
        }

        .restaurant-cuisine-pill:hover,
        .restaurant-cuisine-pill-active {
          border-color: ${CALBAYOG_BLUE};
          background: #eef0ff;
          color: ${CALBAYOG_BLUE};
        }

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

          .restaurant-search-row {
            align-items: stretch;
          }

          .restaurant-search {
            gap: 7px;
            padding: 0 10px;
          }

          .restaurant-search input {
            font-size: .72rem;
          }

          .featured-filter {
            padding: 0 10px;
            font-size: .68rem;
          }

          .restaurants-grid {
            row-gap: 36px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Restaurants;
