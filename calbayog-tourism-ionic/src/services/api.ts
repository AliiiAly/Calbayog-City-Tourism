import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Use full URL for native apps, relative URL for web
const isNative = Capacitor.isNativePlatform();
// IMPORTANT: Change this IP to your PC's local network IP when running on a physical device
const SERVER_IP = '192.168.254.106';
const SERVER_PORT = '5000';
const BASE_URL = isNative ? `http://${SERVER_IP}:${SERVER_PORT}/api` : '/api';

const SUPABASE_URL = 'https://wemjefizjcbjvtplllxa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlbWplZml6amNianZ0cGxsbHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDA1MDUsImV4cCI6MjA5NzI3NjUwNX0.jYyiWGUgJ61ztwqDWoUjR5GAHZJ0TwPHkcA_lXhAWuM';

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const SERVER_BASE_URL = isNative ? `http://${SERVER_IP}:${SERVER_PORT}` : '';

// Rewrites relative /uploads/... paths to full server URL on native
export const getImageUrl = (path: string | undefined | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (isNative && path.startsWith('/uploads/')) return `http://${SERVER_IP}:${SERVER_PORT}${path}`;
  return path;
};

// Regular API for web
const api = axios.create({ 
  baseURL: BASE_URL
});

// Recursively rewrite /uploads/ paths in any nested object/array
const rewriteImagePaths = (obj: any): any => {
  if (!isNative || !obj) return obj;
  if (typeof obj === 'string') {
    if (obj.startsWith('/uploads/')) return `http://${SERVER_IP}:${SERVER_PORT}${obj}`;
    return obj;
  }
  if (Array.isArray(obj)) return obj.map(rewriteImagePaths);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) result[key] = rewriteImagePaths(obj[key]);
    return result;
  }
  return obj;
};

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Rewrite image URLs in responses for native Android
api.interceptors.response.use((response) => {
  if (isNative) {
    response.data = rewriteImagePaths(response.data);
  }
  return response;
});

// Supabase API for native apps
const supabaseApi = axios.create({
  baseURL: `${SUPABASE_URL}/rest/v1`,
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
});

// Cache utility
const getCacheKey = (url: string, params?: any) => {
  const paramString = params ? JSON.stringify(params) : '';
  return `cache_${url}_${paramString}`;
};

const getCachedData = (key: string) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached || cached === 'undefined') return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const setCachedData = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    // Ignore storage errors
  }
};

api.interceptors.request.use((config) => {
  // Add authorization header for admin requests
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Skip caching for non-GET requests
  if (config.method?.toLowerCase() !== 'get') {
    return config;
  }

  const cacheKey = getCacheKey(config.url || '', config.params);
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    config.adapter = () => Promise.resolve({
      data: cachedData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    });
  }

  return config;
});

api.interceptors.response.use(
  (res) => {
    // Cache GET responses
    if (res.config.method?.toLowerCase() === 'get') {
      const cacheKey = getCacheKey(res.config.url || '', res.config.params);
      setCachedData(cacheKey, res.data);
    }
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

// Clear cache for specific endpoint or all cache
export const clearCache = (pattern?: string) => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        if (!pattern || key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      }
    });
  } catch (e) {
    // Ignore errors
  }
};

// Auth
export const loginAdmin = async (data: { username: string; password: string }) => {
  if (isNative) {
    // For native apps, query Supabase directly and check mobile_pin
    const response = await supabaseApi.get(`/admins?username=eq.${data.username}&select=*`);
    const admins = Array.isArray(response.data) ? response.data : [];
    const admin = admins[0];
    
    if (!admin) {
      throw new Error('Invalid username');
    }
    
    // Check mobile_pin field for native app login
    if (admin.mobile_pin && admin.mobile_pin === data.password) {
      const token = btoa(JSON.stringify({ id: admin.id, username: admin.username, exp: Date.now() + 8 * 60 * 60 * 1000 }));
      return {
        data: {
          token,
          admin: { id: admin.id, username: admin.username, name: admin.name, email: admin.email }
        }
      };
    }
    
    // If no mobile_pin or doesn't match, show helpful error
    throw new Error('Admin login is not available on mobile app. Please use the web version or contact administrator to set up mobile PIN.');
  }
  return api.post('/auth/login', data);
};

// Destinations
export const getDestinations = (params?: object) => {
  if (isNative) {
    return supabaseApi.get('/destinations?select=*');
  }
  return api.get('/destinations', { params });
};
export const getDestination = (id: string) => {
  if (isNative) {
    return supabaseApi.get(`/destinations?id=eq.${id}&select=*`);
  }
  return api.get(`/destinations/${id}`);
};
export const createDestination = (data: object) => api.post('/destinations', data);
export const updateDestination = (id: string, data: object) => api.put(`/destinations/${id}`, data);
export const deleteDestination = (id: string) => api.delete(`/destinations/${id}`);

// Events
export const getEvents = (params?: object) => {
  if (isNative) {
    return supabaseApi.get('/events?select=*');
  }
  return api.get('/events', { params });
};
export const getEvent = (id: string) => {
  if (isNative) {
    return supabaseApi.get(`/events?id=eq.${id}&select=*`);
  }
  return api.get(`/events/${id}`);
};
export const createEvent = (data: object) => api.post('/events', data);
export const updateEvent = (id: string, data: object) => api.put(`/events/${id}`, data);
export const deleteEvent = (id: string) => api.delete(`/events/${id}`);

// Accommodations
export const getAccommodations = (params?: object) => {
  if (isNative) {
    return supabaseApi.get('/accommodations?select=*');
  }
  return api.get('/accommodations', { params });
};
export const getAccommodation = (id: string) => {
  if (isNative) {
    return supabaseApi.get(`/accommodations?id=eq.${id}&select=*`);
  }
  return api.get(`/accommodations/${id}`);
};
export const createAccommodation = (data: object) => api.post('/accommodations', data);
export const updateAccommodation = (id: string, data: object) => api.put(`/accommodations/${id}`, data);
export const deleteAccommodation = (id: string) => api.delete(`/accommodations/${id}`);

// Guides
export const getGuides = (params?: object) => {
  if (isNative) {
    return supabaseApi.get('/guides?select=*');
  }
  return api.get('/guides', { params });
};
export const getGuide = (id: string) => {
  if (isNative) {
    return supabaseApi.get(`/guides?id=eq.${id}&select=*`);
  }
  return api.get(`/guides/${id}`);
};
export const createGuide = (data: object) => api.post('/guides', data);
export const updateGuide = (id: string, data: object) => api.put(`/guides/${id}`, data);
export const deleteGuide = (id: string) => api.delete(`/guides/${id}`);

// Itinerary Requests
export const submitItineraryRequest = (data: object) => api.post('/itinerary-requests', data);
export const getItineraryRequests = (params?: object) => api.get('/itinerary-requests', { params });
export const getItineraryRequest = (id: string) => api.get(`/itinerary-requests/${id}`);
export const updateItineraryRequest = (id: string, data: object) =>
  api.put(`/itinerary-requests/${id}`, data);

// Admin Management
export const getAdmins = (params?: object) => api.get('/admin-management', { params });
export const getAdmin = (id: string) => api.get(`/admin-management/${id}`);
export const createAdmin = (data: object) => api.post('/admin-management', data);
export const updateAdmin = (id: string, data: object) => api.put(`/admin-management/${id}`, data);
export const deleteAdmin = (id: string) => api.delete(`/admin-management/${id}`);

// Feedback
export const getFeedback = (params?: object) => api.get('/feedback', { params });
export const updateFeedback = (id: string, data: object) => api.put(`/feedback/${id}`, data);
export const deleteFeedback = (id: string) => api.delete(`/feedback/${id}`);

// Upload
export const uploadImage = (file: File) => {
  const form = new FormData();
  form.append('image', file);
  return api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const uploadMultipleImages = (files: File[]) => {
  const form = new FormData();
  files.forEach((file) => form.append('images', file));
  
  // Get auth token
  const token = localStorage.getItem('admin_token');
  
  if (!token) {
    return Promise.reject(new Error('No authentication token found'));
  }
  
  // Use direct URL to server to avoid proxy issues with large files
  return axios.post('http://localhost:5000/api/upload/multiple', form, {
    timeout: 180000,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Getting There
export const getGettingThere = (params?: object) => api.get('/getting-there', { params });
export const createGettingThere = (data: object) => api.post('/getting-there', data);
export const updateGettingThere = (id: string, data: object) => api.put(`/getting-there/${id}`, data);
export const deleteGettingThere = (id: string) => api.delete(`/getting-there/${id}`);

// Notifications
export const getNotifications = (userId: string) => api.get('/notifications', { params: { userId } });
export const getUnreadCount = (userId: string) => api.get('/notifications/unread-count', { params: { userId } });
export const markAsRead = (id: string) => api.patch(`/notifications/${id}/read`);
export const markAllAsRead = (userId: string) => api.patch('/notifications/read-all', { userId });
export const createNotification = (data: object) => api.post('/notifications', data);
export const deleteNotification = (id: string) => api.delete(`/notifications/${id}`);

export default api;
