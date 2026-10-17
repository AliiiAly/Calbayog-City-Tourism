            <div
              className="detail-map-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`Map of ${attraction.name}`}
              onClick={() =>
                setMapOpen(false)
              }
            >
              <div
                className="detail-map-modal-card"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >
                <div className="detail-map-header">
                  <div className="detail-map-header-left">
                    <div className="detail-map-icon">
                      <MapPinned
                        size={19}
                      />
                    </div>

                    <div>
                      <p className="detail-map-kicker">
                        Explore Calbayog
                      </p>

                      <h2 className="detail-map-title">
                        Calbayog Attractions
                      </h2>

                      <p className="detail-map-subtitle">
                        Drag the map, switch map styles, use your location, or open street-level imagery.
                      </p>
                    </div>
                  </div>

                  <div className="detail-map-stats">
                    <span className="detail-map-stat">
                      <MapPin size={12} />
                      {mapAttractions.length}{" "}
                      attractions
                    </span>

                    <div className="detail-map-header-actions">
                      <button
                        type="button"
                        className="detail-map-street-button"
                        onClick={() =>
                          openStreetLevelView(
                            currentMapCoordinates,
                          )
                        }
                        disabled={!currentMapCoordinates}
                      >
                        <MapPinned size={14} />
                        Street View
                      </button>

                      <button
                        type="button"
                        className="detail-map-modal-close"
                        onClick={() =>
                          setMapOpen(false)
                        }
                        aria-label="Close map"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="detail-map-modal-body">
                  <TourismMap
                    center={mapCenter}
                    attractions={
                      mapAttractions
                    }
                    interactive
                  />


                </div>

                <div className="detail-map-legend">
                  {Object.values(
                    CATEGORY_MARKER_DESIGNS,
                  ).map((design) => (
                    <span
                      key={design.label}
                      className="detail-map-legend-item"
                    >
                      <span
                        className="detail-map-legend-dot"
                        style={{
                          background:
                            design.color,
                        }}
                      />
                      {design.label}
                    </span>
                  ))}

                  <span className="detail-map-legend-item">
                    <span
                      className="detail-map-legend-dot"
                      style={{
                        background:
                          "#e33f5f",
                      }}
                    />
                    Current attraction (red label)
                  </span>
                </div>

              </div>
            </div>,
            document.body,
          )}
      </div>
    );
  };

export default AttractionDetail;
