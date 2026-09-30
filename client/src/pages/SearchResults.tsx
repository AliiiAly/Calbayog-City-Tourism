import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Container, Spinner } from "react-bootstrap";
import { Search, MapPin, CalendarDays, Hotel } from "lucide-react";
import { useLocation } from "react-router-dom";

import {
  getAttractions,
  getAccommodations,
  getEvents,
} from "../services/api";

import AttractionCard from "../components/attractions/AttractionCard";
import AccommodationCard from "../components/accommodations/AccommodationCard";
import EventCard, {
  EventCardItem,
} from "../components/events/EventCard";

import { Destination } from "../types";

interface SearchResultsLocation {
  pathname: string;
  search: string;
}

interface AccommodationSearchItem {
  id: string;
  name: string;
  owner?: string | null;
  manager?: string | null;
  address?: string | null;
  contact_number?: string | null;
  website?: string | null;
  images?: string[];
  description?: string | null;
  price_range?: string | null;
  featured?: boolean;

  type?: string | null;
  amenities?: string[] | null;

  [key: string]: any;
}

interface EventSearchItem
  extends EventCardItem {
  [key: string]: any;
}

const normalizeText = (
  value: unknown,
): string => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    Array.isArray(value)
  ) {
    return value
      .map(normalizeText)
      .join(" ");
  }

  if (
    typeof value === "object"
  ) {
    return Object.values(
      value as Record<
        string,
        unknown
      >,
    )
      .map(normalizeText)
      .join(" ");
  }

  return String(value)
    .toLowerCase()
    .trim();
};

const getQueryFromLocation = (
  location: SearchResultsLocation,
): string => {
  const params =
    new URLSearchParams(
      location.search,
    );

  return (
    params.get("query") ||
    ""
  ).trim();
};

const SearchResults: React.FC =
  () => {
    const location =
      useLocation<SearchResultsLocation>();

    const query =
      getQueryFromLocation(
        location,
      );

    const [
      attractions,
      setAttractions,
    ] = useState<
      Destination[]
    >([]);

    const [
      accommodations,
      setAccommodations,
    ] = useState<
      AccommodationSearchItem[]
    >([]);

    const [
      events,
      setEvents,
    ] = useState<
      EventSearchItem[]
    >([]);

    const [
      loading,
      setLoading,
    ] = useState(true);

    const [
      error,
      setError,
    ] = useState("");

    /* =====================================================
       LOAD SEARCH DATA
    ===================================================== */

    useEffect(() => {
      let cancelled = false;

      const loadSearchData =
        async () => {
          setLoading(true);
          setError("");

          try {
            const [
              attractionsResponse,
              accommodationsResponse,
              eventsResponse,
            ] = await Promise.all([
              getAttractions(),
              getAccommodations(),
              getEvents(),
            ]);

            if (cancelled) {
              return;
            }

            setAttractions(
              Array.isArray(
                attractionsResponse?.data,
              )
                ? attractionsResponse.data
                : [],
            );

            setAccommodations(
              Array.isArray(
                accommodationsResponse?.data,
              )
                ? accommodationsResponse.data
                : [],
            );

            setEvents(
              Array.isArray(
                eventsResponse?.data,
              )
                ? eventsResponse.data
                : [],
            );
          } catch (searchError) {
            console.error(
              "Search results loading error:",
              searchError,
            );

            if (!cancelled) {
              setError(
                "We couldn't load the search results. Please try again.",
              );
            }
          } finally {
            if (!cancelled) {
              setLoading(false);
            }
          }
        };

      void loadSearchData();

      return () => {
        cancelled = true;
      };
    }, []);

    /* =====================================================
       SEARCH
    ===================================================== */

    const normalizedQuery =
      normalizeText(query);

    const filteredAttractions =
      useMemo(() => {
        if (!normalizedQuery) {
          return [];
        }

        return attractions.filter(
          (attraction) => {
            const item =
              attraction as any;

            const searchableText =
              [
                item.name,
                item.category,
                item.attraction_type,
                item.type,
                item.description,
                item.short_description,
                item.location_address,
                item.location,
                item.things_to_do,
                item.best_time_to_visit,
                item.operational_hours,
                item.entrance_fee,
                item.website,
              ]
                .map(
                  normalizeText,
                )
                .join(" ");

            return searchableText.includes(
              normalizedQuery,
            );
          },
        );
      }, [
        attractions,
        normalizedQuery,
      ]);

    const filteredAccommodations =
      useMemo(() => {
        if (!normalizedQuery) {
          return [];
        }

        return accommodations.filter(
          (accommodation) => {
            const searchableText =
              [
                accommodation.name,
                accommodation.type,
                accommodation.description,
                accommodation.address,
                accommodation.owner,
                accommodation.manager,
                accommodation.contact_number,
                accommodation.website,
                accommodation.price_range,
                accommodation.amenities,
              ]
                .map(
                  normalizeText,
                )
                .join(" ");

            return searchableText.includes(
              normalizedQuery,
            );
          },
        );
      }, [
        accommodations,
        normalizedQuery,
      ]);

    const filteredEvents =
      useMemo(() => {
        if (!normalizedQuery) {
          return [];
        }

        return events.filter(
          (event) => {
            const searchableText =
              [
                event.title,
                event.category,
                event.description,
                event.venue,
                event.organizer,
                event.startDate,
                event.endDate,
                event.start_date,
                event.end_date,
                event.facebook,
              ]
                .map(
                  normalizeText,
                )
                .join(" ");

            return searchableText.includes(
              normalizedQuery,
            );
          },
        );
      }, [
        events,
        normalizedQuery,
      ]);

    const totalResults =
      filteredAttractions.length +
      filteredAccommodations.length +
      filteredEvents.length;

    /* =====================================================
       RENDER
    ===================================================== */

    return (
      <>
        <section className="search-results-page">
          <Container>
            {/* =================================================
                HEADER
            ================================================= */}

            <div className="search-results-header">
              <div className="search-results-heading">
                <div className="search-results-icon">
                  <Search
                    size={22}
                    strokeWidth={1.8}
                  />
                </div>

                <div>
                  <p className="search-results-eyebrow">
                    CALBAYOG CITY TOURISM
                  </p>

                  <h1>
                    Search results
                  </h1>
                </div>
              </div>

              {query && (
                <div className="search-results-query">
                  <span>
                    Results for
                  </span>

                  <strong>
                    "{query}"
                  </strong>
                </div>
              )}
            </div>

            {/* =================================================
                LOADING
            ================================================= */}

            {loading && (
              <div className="search-results-state">
                <Spinner
                  animation="border"
                  role="status"
                  size="sm"
                />

                <span>
                  Searching Calbayog City...
                </span>
              </div>
            )}

            {/* =================================================
                ERROR
            ================================================= */}

            {!loading &&
              error && (
                <div className="search-results-state search-results-error">
                  <Search
                    size={28}
                    strokeWidth={1.7}
                  />

                  <h2>
                    Something went wrong
                  </h2>

                  <p>
                    {error}
                  </p>
                </div>
              )}

            {/* =================================================
                EMPTY QUERY
            ================================================= */}

            {!loading &&
              !error &&
              !query && (
                <div className="search-results-state">
                  <Search
                    size={34}
                    strokeWidth={1.6}
                  />

                  <h2>
                    What are you looking for?
                  </h2>

                  <p>
                    Search for attractions,
                    accommodations, events,
                    places, activities, and
                    more.
                  </p>
                </div>
              )}

            {/* =================================================
                NO RESULTS
            ================================================= */}

            {!loading &&
              !error &&
              query &&
              totalResults ===
                0 && (
                <div className="search-results-state search-results-no-results">
                  <div className="search-results-empty-icon">
                    <Search
                      size={34}
                      strokeWidth={1.6}
                    />
                  </div>

                  <h2>
                    No results found
                  </h2>

                  <p>
                    We couldn't find
                    anything matching{" "}
                    <strong>
                      "{query}"
                    </strong>
                    .
                  </p>

                  <span>
                    Try another keyword,
                    place name, event,
                    or category.
                  </span>
                </div>
              )}

            {/* =================================================
                RESULTS SUMMARY
            ================================================= */}

            {!loading &&
              !error &&
              query &&
              totalResults >
                0 && (
                <div className="search-results-summary">
                  <strong>
                    {totalResults}
                  </strong>{" "}
                  {totalResults ===
                  1
                    ? "result"
                    : "results"}{" "}
                  found
                </div>
              )}

            {/* =================================================
                ATTRACTIONS
            ================================================= */}

            {!loading &&
              !error &&
              filteredAttractions.length >
                0 && (
                <section className="search-results-section">
                  <div className="search-results-section-heading">
                    <div className="search-results-section-icon">
                      <MapPin
                        size={18}
                        strokeWidth={1.8}
                      />
                    </div>

                    <div>
                      <h2>
                        Attractions
                      </h2>

                      <p>
                        Places to explore
                        in Calbayog
                      </p>
                    </div>

                    <span className="search-results-count">
                      {
                        filteredAttractions.length
                      }
                    </span>
                  </div>

                  <div className="search-results-grid">
                    {filteredAttractions.map(
                      (
                        attraction,
                        index,
                      ) => (
                        <AttractionCard
                          key={String(
                            (attraction as any)
                              ?.id ??
                              `attraction-${index}`,
                          )}
                          attraction={
                            attraction
                          }
                          imageIndex={
                            index
                          }
                          showFavoriteCount={
                            true
                          }
                          showFeatured={
                            true
                        }
                          compact={
                            false
                          }
                        />
                      ),
                    )}
                  </div>
                </section>
              )}

            {/* =================================================
                ACCOMMODATIONS
            ================================================= */}

            {!loading &&
              !error &&
              filteredAccommodations.length >
                0 && (
                <section className="search-results-section">
                  <div className="search-results-section-heading">
                    <div className="search-results-section-icon">
                      <Hotel
                        size={18}
                        strokeWidth={1.8}
                      />
                    </div>

                    <div>
                      <h2>
                        Accommodations
                      </h2>

                      <p>
                        Places to stay
                        in Calbayog
                      </p>
                    </div>

                    <span className="search-results-count">
                      {
                        filteredAccommodations.length
                      }
                    </span>
                  </div>

                  <div className="search-results-grid">
                    {filteredAccommodations.map(
                      (
                        accommodation,
                        index,
                      ) => (
                        <AccommodationCard
                          key={String(
                            accommodation.id ||
                              `accommodation-${index}`,
                          )}
                          accommodation={
                            accommodation
                          }
                          imageIndex={
                            index
                          }
                          showFeatured={
                            true
                          }
                          compact={
                            false
                          }
                        />
                      ),
                    )}
                  </div>
                </section>
              )}

            {/* =================================================
                EVENTS
            ================================================= */}

            {!loading &&
              !error &&
              filteredEvents.length >
                0 && (
                <section className="search-results-section">
                  <div className="search-results-section-heading">
                    <div className="search-results-section-icon">
                      <CalendarDays
                        size={18}
                        strokeWidth={1.8}
                      />
                    </div>

                    <div>
                      <h2>
                        Events
                      </h2>

                      <p>
                        What's happening
                        in Calbayog
                      </p>
                    </div>

                    <span className="search-results-count">
                      {
                        filteredEvents.length
                      }
                    </span>
                  </div>

                  <div className="search-results-grid">
                    {filteredEvents.map(
                      (
                        event,
                        index,
                      ) => (
                        <EventCard
                          key={String(
                            event.id ||
                              event._id ||
                              `event-${index}`,
                          )}
                          event={
                            event
                          }
                          showFeatured={
                            true
                          }
                          compact={
                            false
                          }
                          onClick={(
                            selectedEvent,
                          ) => {
                            const eventId =
                              selectedEvent.id ||
                              selectedEvent._id;

                            if (
                              !eventId
                            ) {
                              return;
                            }

                            window.location.href =
                              `/events/${encodeURIComponent(
                                eventId,
                              )}`;
                          }}
                        />
                      ),
                    )}
                  </div>
                </section>
              )}
          </Container>
        </section>

        {/* =====================================================
            STYLES
        ===================================================== */}

        <style>{`
          .search-results-page {
            min-height: 70vh;
            padding:
              48px 0
              72px;
            background:
              linear-gradient(
                180deg,
                #f8faf9 0%,
                #ffffff 42%,
                #f8faf9 100%
              );
          }

          .search-results-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 34px;
            padding-bottom: 24px;
            border-bottom:
              1px solid #e9edea;
          }

          .search-results-heading {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .search-results-icon {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            border-radius: 15px;
            background: #eef0ff;
            color: ${CALBAYOG_BLUE};
          }

          .search-results-eyebrow {
            margin: 0 0 3px;
            color: #7b847f;
            font-size: 0.62rem;
            line-height: 1.2;
            font-weight: 800;
            letter-spacing: 0.12em;
          }

          .search-results-header h1 {
            margin: 0;
            color: #171b18;
            font-size:
              clamp(
                1.65rem,
                3vw,
                2.3rem
              );
            line-height: 1.15;
            font-weight: 750;
          }

          .search-results-query {
            display: flex;
            align-items: center;
            gap: 7px;
            flex-wrap: wrap;
            justify-content: flex-end;
            color: #727b76;
            font-size: 0.78rem;
          }

          .search-results-query strong {
            color: #171b18;
            font-weight: 800;
          }

          .search-results-summary {
            margin-bottom: 30px;
            color: #727b76;
            font-size: 0.78rem;
            font-weight: 600;
          }

          .search-results-summary strong {
            color: #171b18;
            font-weight: 800;
          }

          .search-results-section {
            margin-top: 42px;
          }

          .search-results-section:first-of-type {
            margin-top: 0;
          }

          .search-results-section-heading {
            display: flex;
            align-items: center;
            gap: 11px;
            margin-bottom: 20px;
          }

          .search-results-section-icon {
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            border-radius: 12px;
            background: #f1f3f1;
            color: #343b36;
          }

          .search-results-section-heading h2 {
            margin: 0;
            color: #171b18;
            font-size: 1.05rem;
            line-height: 1.25;
            font-weight: 750;
          }

          .search-results-section-heading p {
            margin: 2px 0 0;
            color: #858d88;
            font-size: 0.68rem;
            line-height: 1.35;
            font-weight: 600;
          }

          .search-results-count {
            margin-left: auto;
            min-width: 27px;
            height: 27px;
            padding: 0 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            background: #eef0ff;
            color: ${CALBAYOG_BLUE};
            font-size: 0.66rem;
            font-weight: 800;
          }

          .search-results-grid {
            display: grid;
            grid-template-columns:
              repeat(
                4,
                minmax(0, 1fr)
              );
            gap:
              32px 20px;
          }

          .search-results-state {
            min-height: 300px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 40px 20px;
            color: #7a837e;
            text-align: center;
          }

          .search-results-state svg {
            color: ${CALBAYOG_BLUE};
          }

          .search-results-state h2 {
            margin: 4px 0 0;
            color: #171b18;
            font-size: 1.2rem;
            font-weight: 750;
          }

          .search-results-state p {
            max-width: 500px;
            margin: 0;
            color: #7a837e;
            font-size: 0.78rem;
            line-height: 1.6;
          }

          .search-results-no-results {
            min-height: 380px;
          }

          .search-results-empty-icon {
            width: 72px;
            height: 72px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 4px;
            border-radius: 22px;
            background: #f1f3f1;
            color: #727b76;
          }

          .search-results-empty-icon svg {
            color: #727b76;
          }

          .search-results-no-results span {
            color: #9aa19d;
            font-size: 0.7rem;
            font-weight: 600;
          }

          .search-results-error svg {
            color: #a94a4a;
          }

          @media (max-width: 1199.98px) {
            .search-results-grid {
              grid-template-columns:
                repeat(
                  3,
                  minmax(0, 1fr)
                );
            }
          }

          @media (max-width: 767.98px) {
            .search-results-page {
              padding:
                32px 0
                54px;
            }

            .search-results-header {
              align-items: flex-start;
              flex-direction: column;
              gap: 14px;
              margin-bottom: 28px;
              padding-bottom: 20px;
            }

            .search-results-query {
              justify-content: flex-start;
              padding-left: 62px;
            }

            .search-results-grid {
              grid-template-columns:
                repeat(
                  2,
                  minmax(0, 1fr)
                );
              gap:
                28px 14px;
            }

            .search-results-section {
              margin-top: 34px;
            }
          }

          @media (max-width: 479.98px) {
            .search-results-heading {
              align-items: flex-start;
            }

            .search-results-icon {
              width: 42px;
              height: 42px;
              border-radius: 13px;
            }

            .search-results-header h1 {
              font-size: 1.45rem;
            }

            .search-results-query {
              padding-left: 0;
            }

            .search-results-grid {
              grid-template-columns:
                minmax(0, 1fr);
              gap: 30px;
            }

            .search-results-section-heading {
              margin-bottom: 16px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .search-results-page * {
              scroll-behavior: auto !important;
            }
          }
        `}</style>
      </>
    );
  };

export default SearchResults;
