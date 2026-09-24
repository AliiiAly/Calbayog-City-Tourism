import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { getDestinations, SERVER_BASE_URL } from '../services/api';
import { Destination } from '../types';
import { Capacitor } from '@capacitor/core';

const quickCards = [
  { icon: '🌊', label: 'Destinations', to: '/destinations', color: '#0077B6' },
  { icon: '📍', label: 'Interactive Map', to: '/map', color: '#1A7A4A' },
  { icon: '🏨', label: 'Accommodations', to: '/accommodations', color: '#F4A226' },
  { icon: '🎉', label: 'Events', to: '/events', color: '#e63946' },
  { icon: '👤', label: 'Guides', to: '/guides', color: '#2d6a4f' },
  { icon: '📋', label: 'Plan Trip', to: '/itinerary', color: '#6d4c41' },
];

const Welcome: React.FC = () => {
  const [featured, setFeatured] = useState<Destination[]>([]);

  useEffect(() => {
    getDestinations({ featured: true })
      .then((r) => setFeatured(Array.isArray(r.data) ? r.data.slice(0, 4) : []))
      .catch(() => {});
  }, []);

  return (
    <div className="page-enter">
      <Container className="py-4">
        {/* Promo Video */}
        <div className="mb-4">
          <div className="promo-video-wrapper rounded-xl overflow-hidden shadow-tourism">
            <video
              autoPlay
              controls
              muted
              loop
              playsInline
              preload="metadata"
              className="promo-video"
              style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain' }}
              onError={(e) => {
                (e.target as HTMLVideoElement).style.display = 'none';
              }}
            >
              <source src={`${SERVER_BASE_URL}/promo.mp4`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Quick Access Grid */}
        <div className="section-header mb-3">
          <h2 className="section-title">Explore Calbayog</h2>
          <p className="section-subtitle">Discover amazing places and experiences</p>
        </div>
        <Row className="g-3 mb-4">
          {quickCards.map((card) => (
            <Col xs={6} sm={4} md={3} key={card.to}>
              <Link to={card.to} style={{ textDecoration: 'none' }}>
                <Card className="quick-card text-center border-0 h-100">
                  <Card.Body className="py-4">
                    <div className="quick-card-icon" style={{ color: card.color }}>
                      {card.icon}
                    </div>
                    <div className="quick-card-label fw-semibold">
                      {card.label}
                    </div>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>

        {/* Featured Destinations */}
        {featured.length > 0 && (
          <>
            <div className="section-header mb-3">
              <h2 className="section-title">Featured Spots</h2>
              <Link to="/destinations" className="view-all-link">
                See all →
              </Link>
            </div>
            <Row className="g-3 mb-4">
              {featured.map((dest) => (
                <Col xs={12} sm={6} key={dest.id}>
                  <Link to={`/destinations/${dest.id}`} style={{ textDecoration: 'none' }}>
                    <Card className="featured-card">
                      <div className="featured-image-wrapper">
                        {dest.images?.[0] ? (
                          <img
                            src={dest.images[0]}
                            alt={dest.name}
                            className="featured-image"
                          />
                        ) : (
                          <div className="featured-image-placeholder">
                            🌿
                          </div>
                        )}
                        <span className="featured-badge">
                          {dest.category}
                        </span>
                      </div>
                      <Card.Body className="p-3">
                        <Card.Title className="featured-title">
                          {dest.name}
                        </Card.Title>
                        <p className="featured-description">
                          {dest.short_description || dest.description.slice(0, 80)}...
                        </p>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
              ))}
            </Row>
          </>
        )}

        {/* CTA */}
        <div className="cta-section rounded-xl mb-4">
          <div className="cta-content">
            <h5 className="cta-title">Ready to Explore?</h5>
            <p className="cta-description">
              Let us help plan your perfect Calbayog adventure.
            </p>
            <div className="cta-buttons">
              <Link to="/request-itinerary" className="btn btn-primary cta-btn">
                📅 Request Itinerary
              </Link>
              <Link to="/itinerary" className="btn btn-outline-primary cta-btn">
                🗓️ Plan Yourself
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Welcome;
