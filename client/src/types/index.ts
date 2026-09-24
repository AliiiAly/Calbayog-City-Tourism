export interface Destination {
  id: string;
  name: string;
  category: string;
  description: string;
  short_description?: string;
  images: string[];

  location_lat: number;
  location_lng: number;
  location_address?: string;

  contact_phone?: string;
  contact_email?: string;
  contact_facebook?: string;
  contact_website?: string;

  opening_hours?: string;
  entrance_fee?: string;
  getting_there?: string;
  tips?: string[];

  tags?: string[];

  featured?: boolean;

  // Homepage visibility
  show_on_welcome?: boolean;

  is_active?: boolean;

  created_at?: string;
  updated_at?: string;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  venue: string;

  location?: {
    lat?: number;
    lng?: number;
  };

  image?: string;
  organizer?: string;

  contact?: {
    phone?: string;
    email?: string;
    facebook?: string;
  };

  isFree?: boolean;
  ticketPrice?: string;
  tags?: string[];
  featured?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface Accommodation {
  id: string;
  name: string;
  type: string;
  description: string;
  short_description?: string;

  images: string[];

  location?: {
    lat: number;
    lng: number;
    address: string;
  };

  locationAddress?: string;
  location_lat?: number;
  location_lng?: number;

  contact?: {
    phone?: string;
    email?: string;
    facebook?: string;
    website?: string;
    messenger?: string;
  };

  amenities?: string[];
  room_types?: string[];

  price_range?: string;

  priceRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };

  price_min?: number;
  price_max?: number;

  dot_accredited?: boolean;
  dotAccredited?: boolean;

  star_rating?: number;
  starRating?: number;

  check_in?: string;
  checkIn?: string;

  check_out?: string;
  checkOut?: string;

  featured?: boolean;

  // Homepage visibility
  show_on_welcome?: boolean;
  showOnWelcome?: boolean;

  is_active?: boolean;
  isActive?: boolean;

  created_at?: string;
  createdAt?: string;

  updated_at?: string;
  updatedAt?: string;
}

export interface Guide {
  _id: string;
  name: string;
  description: string;
  short_description?: string;
  image?: string;

  location_lat: number;
  location_lng: number;
  location_address?: string;

  contact_phone: string;
  contact_email?: string;
  contact_facebook?: string;

  languages?: string[];
  specialties?: string[];
  rate?: string;

  featured?: boolean;
  is_active?: boolean;

  created_at?: string;
  updated_at?: string;
}

export interface ItineraryRequest {
  _id?: string;
  fullName: string;
  email: string;
  phone?: string;

  travelDateStart: string;
  travelDateEnd: string;

  groupSize: number;
  groupType: string;

  preferredSpots?: string[];

  accommodationNeeded?: boolean;
  guideNeeded?: boolean;

  budget?: string;
  specialRequests?: string;

  status?: string;
  adminNotes?: string;

  createdAt?: string;
}

export interface ItineraryDay {
  id: string;
  day: number;
  date?: string;
  destinations: Destination[];
  notes?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface Feedback {
  id: string;
  name: string;
  email: string;
  message: string;
  rating?: number;
  created_at?: string;
  is_read?: boolean;
}

export type DestinationCategory =
  | "All"
  | "Nature"
  | "History and Culture"
  | "Industrial Tourism"
  | "Shopping"
  | "Other";