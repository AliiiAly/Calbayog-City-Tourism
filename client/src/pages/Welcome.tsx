import React, { 
  useCallback,
  useEffect, 
  useMemo,
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
  getFeaturedVideos, 
  FeaturedVideo, 
} from "../services/api"; 
 
import { 
  Destination, 
  Accommodation, 
} from "../types"; 
 
import { useAuth } from "../context/AuthContext"; 
 
import { useFavorites } from "../context/FavoritesContext"; 
 
import AttractionCard from "../components/attractions/AttractionCard"; 

import AccommodationCard, {
  AccommodationCardItem,
} from "../components/accommodations/AccommodationCard";
 
import { 
  Mountain,
  Hotel,
  CalendarDays,
  Compass,
  NotebookPen,
  Images,
  MapPin, 
  CloudSun, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
} from "lucide-react"; 
 
import { 
  Swiper, 
  SwiperSlide, 
} from "swiper/react"; 
 
import { 
  EffectCoverflow, 
  Navigation, 
  Pagination, 
  A11y, 
} from "swiper/modules"; 
 
import type { 
  Swiper as SwiperInstance, 
} from "swiper"; 
 
import "swiper/css"; 
import "swiper/css/effect-coverflow"; 
import "swiper/css/navigation"; 
import "swiper/css/pagination";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  LayersControl,
  LayerGroup,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";
 
/* ========================================================= 
   BRAND COLOR 
========================================================= */ 
 
const CALBAYOG_BLUE = "#2D3195"; 
 
// QUICK ACCESS CARDS 
