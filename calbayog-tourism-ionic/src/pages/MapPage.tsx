import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Form, InputGroup, Button, Card, Spinner, Alert, Badge, ListGroup } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getDestinations } from '../services/api';
import Sidebar from '../components/common/Sidebar';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Calbayog City ACCURATE coordinates: 12.0686°N, 124.5972°E
const CALBAYOG_CENTER: [number, number] = [12.0686, 124.5972];
const CALBAYOG_BOUNDS: [[number, number], [number, number]] = [
  [11.95, 124.45],  // Southwest
  [12.20, 124.70]   // Northeast
];

// Calbayog landmarks and barangays with REAL ACCURATE coordinates
const CALBAYOG_PLACES = [
  // Major Landmarks (verified coordinates)
  { id: 'lm1', name: 'Calbayog City Hall', lat: 12.0686, lng: 124.5972, type: 'Landmark', description: 'City Government Center', address: 'City Proper, Calbayog City' },
  { id: 'lm2', name: 'Calbayog Airport (CBC)', lat: 12.0727, lng: 124.5447, type: 'Landmark', description: 'Domestic airport with flights to Manila & Cebu', address: 'Brgy. Rawis, Calbayog City' },
  { id: 'lm3', name: 'Calbayog Port', lat: 12.0650, lng: 124.6020, type: 'Landmark', description: 'Main seaport for ferries to Cebu & Manila', address: 'Port Area, Calbayog City' },
  { id: 'lm4', name: 'Saints Peter and Paul Cathedral', lat: 12.0680, lng: 124.5980, type: 'Landmark', description: 'Historic Spanish-era Catholic cathedral', address: 'City Proper, Calbayog City' },
  { id: 'lm5', name: 'Calbayog Public Market', lat: 12.0675, lng: 124.5960, type: 'Landmark', description: 'Main public market for fresh goods', address: 'City Proper, Calbayog City' },
  { id: 'lm6', name: 'Nijaga Park', lat: 12.0690, lng: 124.5975, type: 'Landmark', description: 'City plaza and recreational park', address: 'City Proper, Calbayog City' },
  { id: 'lm7', name: 'Northwest Samar State University', lat: 12.0750, lng: 124.6000, type: 'Landmark', description: 'State university main campus', address: 'Brgy. Mercedes, Calbayog City' },
  { id: 'lm8', name: 'Calbayog District Hospital', lat: 12.0700, lng: 124.5985, type: 'Landmark', description: 'Government hospital', address: 'City Proper, Calbayog City' },
  { id: 'lm9', name: 'Calbayog Integrated Bus Terminal', lat: 12.066, lng: 124.595, type: 'Landmark', description: 'Main terminal for buses to Tacloban & Manila', address: 'City Proper, Calbayog City' },
  { id: 'lm10', name: 'Gaisano Capital Calbayog', lat: 12.0685, lng: 124.5968, type: 'Landmark', description: 'Major shopping mall', address: 'City Proper, Calbayog City' },
  { id: 'lm11', name: 'Calbayog City Coliseum', lat: 12.0695, lng: 124.5955, type: 'Landmark', description: 'Sports and events venue', address: 'City Proper, Calbayog City' },
  // Popular Barangays
  { id: 'bg1', name: 'Barangay Obrero', lat: 12.0700, lng: 124.5990, type: 'Barangay', description: 'Urban barangay near city center', address: 'Calbayog City' },
  { id: 'bg2', name: 'Barangay Central', lat: 12.0686, lng: 124.5972, type: 'Barangay', description: 'City center barangay', address: 'Calbayog City' },
  { id: 'bg3', name: 'Barangay Rawis', lat: 12.0727, lng: 124.5447, type: 'Barangay', description: 'Airport area', address: 'Calbayog City' },
  { id: 'bg4', name: 'Barangay Mawacat', lat: 12.048, lng: 124.615, type: 'Barangay', description: 'Coastal beach area', address: 'Calbayog City' },
  { id: 'bg5', name: 'Barangay Oquendo', lat: 12.11, lng: 124.54, type: 'Barangay', description: 'Famous waterfall district', address: 'Calbayog City' },
  { id: 'bg6', name: 'Barangay Malajog', lat: 12.032, lng: 124.625, type: 'Barangay', description: 'Famous Malajog Beach area', address: 'Calbayog City' },
  { id: 'bg7', name: 'Barangay Tinaplacan', lat: 12.075, lng: 124.585, type: 'Barangay', description: 'Eco park and zipline area', address: 'Calbayog City' },
  { id: 'bg8', name: 'Barangay Pan-as', lat: 12.025, lng: 124.63, type: 'Barangay', description: 'Southern coastal area', address: 'Calbayog City' },
  { id: 'bg9', name: 'Barangay Dagum', lat: 12.08, lng: 124.58, type: 'Barangay', description: 'Rural barangay', address: 'Calbayog City' },
  { id: 'bg10', name: 'Barangay Lonoy', lat: 12.095, lng: 124.555, type: 'Barangay', description: 'Near waterfalls', address: 'Calbayog City' },
];

// Custom marker icons
const createIcon = (color: string, emoji: string, size: number = 36) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    ">
      <span style="transform: rotate(45deg); font-size: ${size * 0.45}px;">${emoji}</span>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
};

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div style="
    background: #3b82f6;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 4px solid white;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 3px 10px rgba(0,0,0,0.3);
    animation: pulse 2s infinite;
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const categoryIcons: { [key: string]: L.DivIcon } = {
  'Hotels': createIcon('#f59e0b', '🏨'),
  'Resorts': createIcon('#8b5cf6', '🏖️'),
  'Beaches': createIcon('#06b6d4', '🏖️'),
  'Waterfalls': createIcon('#10b981', '💧'),
  'Nature': createIcon('#22c55e', '🌿'),
  'Food': createIcon('#ef4444', '🍽️'),
  'Heritage': createIcon('#a855f7', '🏛️'),
  'Transport': createIcon('#6366f1', '🚌'),
  'Landmark': createIcon('#64748b', '🏛️'),
  'Barangay': createIcon('#94a3b8', '📍'),
  'default': createIcon('#1a5f4a', '📍')
};

interface Destination {
  id: string;
  name: string;
  category: string;
  description: string;
  shortDescription?: string;
  locationLat: number;
  locationLng: number;
  locationAddress: string;
  images: string[];
  entranceFee?: string;
  openingHours?: string;
  contactPhone?: string;
}

interface SearchResult {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  description?: string;
  address?: string;
  isDestination?: boolean;
  destination?: Destination;
}

// Calculate distance between two points
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Component to handle map events
const MapController: React.FC<{
  flyToLocation: [number, number] | null;
  zoomLevel: number;
}> = ({ flyToLocation, zoomLevel }) => {
  const map = useMap();

  useEffect(() => {
    if (flyToLocation) {
      map.flyTo(flyToLocation, zoomLevel, { duration: 1 });
    }
  }, [flyToLocation, zoomLevel, map]);

  useEffect(() => {
    map.setMaxBounds(CALBAYOG_BOUNDS);
    map.setMinZoom(11);
  }, [map]);

  return null;
};

const MapPage: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [flyToLocation, setFlyToLocation] = useState<[number, number] | null>(null);
  const [zoomLevel, setZoomLevel] = useState(12);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [showNearby, setShowNearby] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite' | 'terrain'>('street');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch destinations from Supabase
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        const response = await getDestinations();
        const data = response.data.map((d: any) => ({
          id: d.id,
          name: d.name,
          category: d.category,
          description: d.description,
          shortDescription: d.short_description || d.shortDescription,
          locationLat: d.location_lat || d.locationLat || 12.0686,
          locationLng: d.location_lng || d.locationLng || 124.5972,
          locationAddress: d.location_address || d.locationAddress || 'Calbayog City',
          images: d.images || [],
          entranceFee: d.entrance_fee || d.entranceFee,
          openingHours: d.opening_hours || d.openingHours,
          contactPhone: d.contact_phone || d.contactPhone
        }));
        setDestinations(data);
      } catch (err: any) {
        setError('Failed to load destinations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  // Get user's current location
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          // Use Capacitor Geolocation for native apps
          const permission = await Geolocation.requestPermissions();
          console.log('Location permission:', permission.location);
          
          if (permission.location === 'granted' || permission.coarseLocation === 'granted') {
            const position = await Geolocation.getCurrentPosition({
              enableHighAccuracy: true,
              timeout: 30000,
              maximumAge: 0
            });
            const { latitude, longitude, accuracy } = position.coords;
            console.log('Got location:', latitude, longitude, 'accuracy:', accuracy);
            
            // Always use actual location - don't restrict to Calbayog bounds
            setUserLocation([latitude, longitude]);
          } else {
            console.log('Location permission denied');
            setUserLocation(CALBAYOG_CENTER);
          }
        } else if ('geolocation' in navigator) {
          // Use browser geolocation for web
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              console.log('Web location:', latitude, longitude);
              setUserLocation([latitude, longitude]);
            },
            (error) => {
              console.error('Web geolocation error:', error);
              setUserLocation(CALBAYOG_CENTER);
            },
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
          );
        } else {
          setUserLocation(CALBAYOG_CENTER);
        }
      } catch (error) {
        console.error('Error getting location:', error);
        setUserLocation(CALBAYOG_CENTER);
      }
    };
    getCurrentLocation();
  }, []);

  // Search functionality - combines destinations, landmarks, and barangays
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setSelectedCategory('all'); // Reset category filter when search is cleared
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Check if searching for a category (e.g., "hotel", "beach", "waterfall")
    const categoryKeywords: { [key: string]: string } = {
      'hotel': 'Hotels',
      'hotels': 'Hotels',
      'resort': 'Resorts',
      'resorts': 'Resorts',
      'beach': 'Beaches',
      'beaches': 'Beaches',
      'waterfall': 'Waterfalls',
      'waterfalls': 'Waterfalls',
      'falls': 'Waterfalls',
      'food': 'Food',
      'restaurant': 'Food',
      'restaurants': 'Food',
      'kainan': 'Food',
      'nature': 'Nature',
      'heritage': 'Heritage',
      'transport': 'Transport',
    };

    // If user types a category keyword, filter to show all of that category
    const matchedCategory = categoryKeywords[query];
    if (matchedCategory) {
      setSelectedCategory(matchedCategory);
    }

    // Search destinations from Supabase
    destinations.forEach(dest => {
      if (dest.name.toLowerCase().includes(query) ||
          dest.category.toLowerCase().includes(query) ||
          dest.locationAddress.toLowerCase().includes(query) ||
          dest.description?.toLowerCase().includes(query)) {
        results.push({
          id: dest.id,
          name: dest.name,
          type: dest.category,
          lat: dest.locationLat,
          lng: dest.locationLng,
          description: dest.shortDescription || dest.description,
          address: dest.locationAddress,
          isDestination: true,
          destination: dest
        });
      }
    });

    // Landmarks and barangays removed from search

    setSearchResults(results.slice(0, 10)); // Limit to 10 results
    setShowSearchResults(results.length > 0);
  }, [searchQuery, destinations]);

  // Show notification helper
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filter destinations by category
  const filteredDestinations = useMemo(() => {
    if (!Array.isArray(destinations)) return [];
    if (selectedCategory === 'all') return destinations;
    return destinations.filter(d => d.category === selectedCategory);
  }, [destinations, selectedCategory]);

  // Get nearest destinations
  const nearbyDestinations = useMemo(() => {
    if (!userLocation) return [];
    return [...destinations]
      .map(dest => ({
        ...dest,
        distance: calculateDistance(userLocation[0], userLocation[1], dest.locationLat, dest.locationLng)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [destinations, userLocation]);

  // Handle search result selection
  const handleSelectSearchResult = (result: SearchResult) => {
    setSearchQuery(result.name);
    setShowSearchResults(false);
    setFlyToLocation([result.lat, result.lng]);
    setZoomLevel(16);
    
    if (result.isDestination && result.destination) {
      setSelectedDestination(result.destination);
    } else {
      setSelectedDestination(null);
    }
  };

  // Handle "Show all" for a category
  const handleShowAllCategory = (category: string) => {
    setSelectedCategory(category);
    setShowSearchResults(false);
    setSearchQuery('');
    // Zoom out to show all markers of this category
    if (mapRef.current) {
      mapRef.current.flyTo(CALBAYOG_CENTER, 12);
    }
  };

  // Get route using OSRM
  const getRoute = async (dest: Destination) => {
    if (!userLocation) return;

    setRouteLoading(true);
    setRoute(null);
    setRouteInfo(null);

    try {
      const start = `${userLocation[1]},${userLocation[0]}`;
      const end = `${dest.locationLng},${dest.locationLat}`;
      
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`
      );
      
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes?.[0]) {
        const routeCoords = data.routes[0].geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        );
        setRoute(routeCoords);
        setRouteInfo({
          distance: `${(data.routes[0].distance / 1000).toFixed(1)} km`,
          duration: `${Math.round(data.routes[0].duration / 60)} min`
        });
        setSelectedDestination(dest);
        showNotification('Route calculated successfully!', 'success');
      }
    } catch (err) {
      console.error('Routing error:', err);
      showNotification('Could not calculate route', 'error');
    } finally {
      setRouteLoading(false);
    }
  };

  const clearRoute = () => {
    setRoute(null);
    setRouteInfo(null);
  };

  const categories = useMemo(() => 
    ['all', ...new Set(destinations.map(d => d.category))],
    [destinations]
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', background: '#f8fafc' }}>
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="mt-2 text-muted">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Search Bar - Google Maps Style */}
      <div style={{
        padding: '12px 16px',
        background: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 1001,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Hamburger Menu Button */}
        <Button
          variant="light"
          onClick={() => setSidebarOpen(true)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '1.2rem',
            background: 'white'
          }}
        >
          ☰
        </Button>
        
        <InputGroup style={{ flex: 1 }}>
          <InputGroup.Text style={{ background: 'white', border: '1px solid #e2e8f0', borderRight: 'none' }}>
            🔍
          </InputGroup.Text>
          <Form.Control
            ref={searchInputRef}
            placeholder="Search places in Calbayog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowSearchResults(true)}
            style={{ 
              border: '1px solid #e2e8f0', 
              borderLeft: 'none',
              fontSize: '0.95rem'
            }}
          />
          {searchQuery && (
            <Button 
              variant="light" 
              onClick={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
              style={{ border: '1px solid #e2e8f0', borderLeft: 'none' }}
            >
              ✕
            </Button>
          )}
        </InputGroup>
        
        {/* Notification Bell */}
        <Button
          variant="light"
          onClick={() => setShowNotificationPanel(!showNotificationPanel)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '1.2rem',
            background: 'white',
            position: 'relative'
          }}
        >
          🔔
          {notification && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              background: '#ef4444',
              borderRadius: '50%',
              border: '2px solid white'
            }} />
          )}
        </Button>

        {/* Notification Panel */}
        {showNotificationPanel && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            width: '280px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 1003,
            marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e2e8f0',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Notifications</span>
              <Button 
                variant="light" 
                size="sm" 
                onClick={() => setShowNotificationPanel(false)}
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              >
                ✕
              </Button>
            </div>
            <div style={{ padding: '12px' }}>
              {notification ? (
                <div style={{
                  padding: '10px',
                  background: notification.type === 'success' ? '#f0fdf4' : 
                              notification.type === 'error' ? '#fef2f2' : '#eff6ff',
                  borderRadius: '8px',
                  border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : 
                                   notification.type === 'error' ? '#fecaca' : '#bfdbfe'}`,
                  fontSize: '0.85rem',
                  color: notification.type === 'success' ? '#166534' : 
                         notification.type === 'error' ? '#991b1b' : '#1e40af'
                }}>
                  {notification.message}
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#94a3b8', 
                  fontSize: '0.85rem',
                  padding: '20px 0'
                }}>
                  No new notifications
                </div>
              )}
            </div>
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid #e2e8f0',
              fontSize: '0.75rem',
              color: '#64748b',
              textAlign: 'center'
            }}>
              Map Interaction Features
            </div>
          </div>
        )}

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <ListGroup style={{
            position: 'absolute',
            top: '100%',
            left: '16px',
            right: '16px',
            maxHeight: '350px',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '0 0 12px 12px',
            zIndex: 1002
          }}>
            {/* Show "View all [category]" option if searching for a category */}
            {(() => {
              const query = searchQuery.toLowerCase();
              const categoryMap: { [key: string]: { name: string; icon: string; count: number } } = {};
              
              // Count results by category
              searchResults.forEach(r => {
                if (r.isDestination) {
                  if (!categoryMap[r.type]) {
                    categoryMap[r.type] = { 
                      name: r.type, 
                      icon: r.type === 'Hotels' ? '🏨' : r.type === 'Beaches' ? '🏖️' : r.type === 'Waterfalls' ? '💧' : r.type === 'Food' ? '🍽️' : '📍',
                      count: 0 
                    };
                  }
                  categoryMap[r.type].count++;
                }
              });

              // Show "View all" buttons for categories with multiple results
              return Object.entries(categoryMap)
                .filter(([_, data]) => data && data.count >= 2)
                .map(([category, data]) => (
                  <ListGroup.Item
                    key={`all-${category}`}
                    action
                    onClick={() => handleShowAllCategory(category)}
                    style={{ 
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderLeft: 'none',
                      borderRight: 'none',
                      background: '#f0fdf4'
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <span style={{ 
                        marginRight: '12px',
                        width: '32px',
                        height: '32px',
                        background: '#1a5f4a',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.9rem'
                      }}>
                        {data.icon}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1a5f4a' }}>
                          📍 Show all {data.name} on map
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {data.count} places found
                        </div>
                      </div>
                    </div>
                  </ListGroup.Item>
                ));
            })()}

            {searchResults.map(result => (
              <ListGroup.Item
                key={result.id}
                action
                onClick={() => handleSelectSearchResult(result)}
                style={{ 
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderLeft: 'none',
                  borderRight: 'none'
                }}
              >
                <div className="d-flex align-items-center">
                  <span style={{ 
                    marginRight: '12px',
                    width: '32px',
                    height: '32px',
                    background: result.isDestination ? '#1a5f4a' : '#64748b',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}>
                    {result.type === 'Hotels' ? '🏨' : 
                     result.type === 'Beaches' ? '🏖️' : 
                     result.type === 'Waterfalls' ? '💧' :
                     result.type === 'Food' ? '🍽️' :
                     result.type === 'Landmark' ? '🏛️' :
                     result.type === 'Barangay' ? '📍' : '📍'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{result.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {result.type} • {result.address}
                    </div>
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </div>

      {/* Category Filter Pills */}
      <div style={{
        padding: '8px 16px',
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        zIndex: 1000
      }}>
        {categories.map(cat => (
          <Badge
            key={cat}
            bg={selectedCategory === cat ? 'success' : 'light'}
            text={selectedCategory === cat ? 'white' : 'dark'}
            style={{
              cursor: 'pointer',
              padding: '8px 14px',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              border: selectedCategory === cat ? 'none' : '1px solid #e2e8f0',
              borderRadius: '20px'
            }}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'all' ? '📍 All' : 
             cat === 'Hotels' ? '🏨 Hotels' :
             cat === 'Beaches' ? '🏖️ Beaches' :
             cat === 'Waterfalls' ? '💧 Waterfalls' :
             cat === 'Food' ? '🍽️ Food' :
             cat === 'Nature' ? '🌿 Nature' : cat}
          </Badge>
        ))}
      </div>

      {error && (
        <Alert variant="danger" className="m-2 mb-0 py-2" style={{ fontSize: '0.85rem' }}>
          {error}
        </Alert>
      )}

      {/* Route Info Bar */}
      {routeInfo && selectedDestination && (
        <div style={{
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #1a5f4a 0%, #0d3d2e 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 999
        }}>
          <div>
            <strong style={{ fontSize: '0.95rem' }}>📍 {selectedDestination.name}</strong>
            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '2px' }}>
              🚗 {routeInfo.distance} • ⏱️ {routeInfo.duration}
            </div>
          </div>
          <Button variant="light" size="sm" onClick={clearRoute} style={{ borderRadius: '20px' }}>
            ✕ Clear
          </Button>
        </div>
      )}

      {/* Map Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={userLocation || CALBAYOG_CENTER}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          maxBounds={CALBAYOG_BOUNDS}
          maxBoundsViscosity={1.0}
        >
          {/* Map Layers - Street, Satellite, Terrain */}
          {mapLayer === 'street' && (
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          )}
          {mapLayer === 'satellite' && (
            <TileLayer
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          )}
          {mapLayer === 'terrain' && (
            <TileLayer
              attribution='&copy; OpenTopoMap'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          )}

          <MapController
            flyToLocation={flyToLocation}
            zoomLevel={zoomLevel}
          />

          {/* User Location Marker */}
          {userLocation && (
            <Marker position={userLocation} icon={userLocationIcon}>
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <strong>📍 Your Location</strong>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Destination Markers */}
          {filteredDestinations.map(dest => (
            <Marker
              key={dest.id}
              position={[dest.locationLat, dest.locationLng]}
              icon={categoryIcons[dest.category] || categoryIcons['default']}
              eventHandlers={{
                click: () => setSelectedDestination(dest)
              }}
            >
              <Popup maxWidth={280} minWidth={260}>
                <div style={{ 
                  margin: '-13px -20px -13px -20px', 
                  width: '260px',
                  overflow: 'hidden',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  background: '#fff'
                }}>
                  {/* Image Section */}
                  <div style={{ position: 'relative', height: '120px', overflow: 'hidden' }}>
                    <img
                      src={dest.images?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
                      alt={dest.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400';
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)'
                    }} />
                    
                    {/* Category Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: dest.category === 'Hotels' ? '#f59e0b' : 
                                  dest.category === 'Beaches' ? '#06b6d4' : 
                                  dest.category === 'Waterfalls' ? '#10b981' : 
                                  dest.category === 'Food' ? '#ef4444' : 
                                  dest.category === 'Nature' ? '#22c55e' : '#1a5f4a',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 700
                    }}>
                      {dest.category === 'Hotels' ? '🏨' : 
                       dest.category === 'Beaches' ? '🏖️' : 
                       dest.category === 'Waterfalls' ? '💧' : 
                       dest.category === 'Food' ? '🍽️' : 
                       dest.category === 'Nature' ? '🌿' : '📍'} {dest.category}
                    </div>

                    {/* Title */}
                    <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px' }}>
                      <h3 style={{ 
                        fontSize: '0.95rem', 
                        fontWeight: 700, 
                        color: 'white',
                        margin: 0,
                        textAlign: 'center',
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)'
                      }}>
                        {dest.name}
                      </h3>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div style={{ padding: '12px' }}>
                    {/* Location - Centered */}
                    <div style={{ 
                      textAlign: 'center',
                      marginBottom: '10px',
                      padding: '8px',
                      background: '#f8fafc',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '2px' }}>📍 Location</div>
                      <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                        {dest.locationAddress}
                      </div>
                    </div>

                    {/* Info Tags - Centered */}
                    {(dest.entranceFee || dest.openingHours) && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center',
                        gap: '8px', 
                        marginBottom: '10px' 
                      }}>
                        {dest.entranceFee && (
                          <div style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '0.6rem', color: '#16a34a', fontWeight: 600 }}>💰 FEE</div>
                            <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 700 }}>{dest.entranceFee}</div>
                          </div>
                        )}
                        {dest.openingHours && (
                          <div style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '0.6rem', color: '#2563eb', fontWeight: 600 }}>🕐 HOURS</div>
                            <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700 }}>{dest.openingHours}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description - Centered */}
                    <p style={{ 
                      fontSize: '0.78rem', 
                      color: '#64748b',
                      margin: '0 0 12px 0',
                      lineHeight: 1.5,
                      textAlign: 'center'
                    }}>
                      {(dest.shortDescription || dest.description || '').substring(0, 70)}...
                    </p>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        onClick={() => getRoute(dest)}
                        disabled={routeLoading}
                        style={{
                          flex: 1,
                          background: '#1a5f4a',
                          color: 'white',
                          border: 'none',
                          padding: '8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        🧭 Directions
                      </button>
                      <button
                        onClick={() => window.location.href = `/destinations/${dest.id}`}
                        style={{
                          background: '#e2e8f0',
                          color: '#475569',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        View →
                      </button>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Landmark Markers (from local data) */}
          {showLandmarks && CALBAYOG_PLACES.filter(p => p.type === 'Landmark').map(place => (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={categoryIcons['Landmark']}
            >
              <Popup maxWidth={240} minWidth={220}>
                <div style={{ 
                  margin: '-13px -20px -13px -20px', 
                  width: '220px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  overflow: 'hidden'
                }}>
                  {/* Header */}
                  <div style={{
                    background: '#64748b',
                    padding: '12px',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🏛️</div>
                    <span style={{
                      background: 'rgba(255,255,255,0.2)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      Landmark
                    </span>
                    <h3 style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 700, 
                      margin: '8px 0 0 0',
                      lineHeight: 1.2
                    }}>
                      {place.name}
                    </h3>
                  </div>
                  
                  {/* Content */}
                  <div style={{ padding: '12px', background: '#fff', textAlign: 'center' }}>
                    <p style={{ 
                      fontSize: '0.78rem', 
                      color: '#64748b',
                      margin: '0 0 10px 0',
                      lineHeight: 1.5
                    }}>
                      {place.description}
                    </p>
                    
                    {/* Location */}
                    <div style={{ 
                      background: '#f1f5f9',
                      padding: '8px',
                      borderRadius: '6px'
                    }}>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '2px' }}>📍 Address</div>
                      <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
                        {place.address}
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Route Polyline */}
          {route && (
            <Polyline
              positions={route}
              color="#1a5f4a"
              weight={5}
              opacity={0.8}
              dashArray="10, 10"
            />
          )}
        </MapContainer>

        {/* Map Layer Switcher */}
        <div style={{
          position: 'absolute',
          top: '80px',
          right: '10px',
          zIndex: 1000,
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setMapLayer('street')}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              background: mapLayer === 'street' ? '#1a5f4a' : 'white',
              color: mapLayer === 'street' ? 'white' : '#333',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: '1px solid #e2e8f0'
            }}
          >
            🗺️ Street
          </button>
          <button
            onClick={() => setMapLayer('satellite')}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              background: mapLayer === 'satellite' ? '#1a5f4a' : 'white',
              color: mapLayer === 'satellite' ? 'white' : '#333',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: '1px solid #e2e8f0'
            }}
          >
            🛰️ Satellite
          </button>
          <button
            onClick={() => setMapLayer('terrain')}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              background: mapLayer === 'terrain' ? '#1a5f4a' : 'white',
              color: mapLayer === 'terrain' ? 'white' : '#333',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ⛰️ Terrain
          </button>
        </div>

        {/* Floating Action Buttons */}
        <div style={{
          position: 'absolute',
          bottom: '80px',
          right: '16px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Toggle Landmarks */}
          <Button
            variant={showLandmarks ? 'warning' : 'light'}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem'
            }}
            onClick={() => setShowLandmarks(!showLandmarks)}
            title="Toggle landmarks"
          >
            🏛️
          </Button>

          {/* Show Nearby */}
          <Button
            variant={showNearby ? 'success' : 'light'}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem'
            }}
            onClick={() => setShowNearby(!showNearby)}
            title="Show nearby places"
          >
            🎯
          </Button>

          {/* Center on User Location */}
          <Button
            variant="light"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem'
            }}
            onClick={() => {
              if (userLocation && mapRef.current) {
                mapRef.current.flyTo(userLocation, 15);
              }
            }}
            title="My location"
          >
            📍
          </Button>

          {/* Center on Calbayog */}
          <Button
            variant="success"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem'
            }}
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.flyTo(CALBAYOG_CENTER, 12);
              }
            }}
            title="View all Calbayog"
          >
            🗺️
          </Button>
        </div>

        {/* Nearby Places Panel */}
        {showNearby && nearbyDestinations.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '80px',
            left: '16px',
            right: '80px',
            zIndex: 1000,
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            maxHeight: '250px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '12px 16px', 
              borderBottom: '1px solid #e2e8f0',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>🎯 Nearest Places</span>
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => setShowNearby(false)}
                style={{ padding: 0, color: '#64748b' }}
              >
                ✕
              </Button>
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {nearbyDestinations.map((dest, idx) => (
                <div
                  key={dest.id}
                  style={{
                    padding: '10px 16px',
                    borderBottom: idx < nearbyDestinations.length - 1 ? '1px solid #f1f5f9' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                  onClick={() => {
                    setFlyToLocation([dest.locationLat, dest.locationLng]);
                    setZoomLevel(16);
                    setSelectedDestination(dest);
                    setShowNearby(false);
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                  }}>
                    {dest.category === 'Hotels' ? '🏨' : 
                     dest.category === 'Beaches' ? '🏖️' : 
                     dest.category === 'Waterfalls' ? '💧' :
                     dest.category === 'Food' ? '🍽️' : '📍'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{dest.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {dest.category} • {dest.distance.toFixed(1)} km away
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Count Badge */}
        {!showNearby && (
          <div style={{
            position: 'absolute',
            bottom: '80px',
            left: '16px',
            zIndex: 1000,
            background: 'white',
            padding: '10px 16px',
            borderRadius: '24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            fontSize: '0.85rem',
            fontWeight: 500
          }}>
            📍 {filteredDestinations.length} places
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            background: notification.type === 'success' ? '#10b981' : 
                        notification.type === 'error' ? '#ef4444' : '#3b82f6',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '0.9rem',
            fontWeight: 600,
            animation: 'slideIn 0.3s ease'
          }}>
            {notification.message}
          </div>
        )}
      </div>

      {/* CSS for animations and popup styling */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .leaflet-popup-content-wrapper {
          padding: 0 !important;
          border-radius: 12px !important;
          overflow: hidden !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }
        .leaflet-popup-tip {
          background: white !important;
          box-shadow: none !important;
        }
        .leaflet-popup-close-button {
          display: none !important;
        }
        .custom-marker {
          transition: transform 0.2s ease;
        }
        .custom-marker:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default MapPage;
