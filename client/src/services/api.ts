import axios from "axios";
import { Capacitor } from "@capacitor/core";
import { supabase } from "./supabase";

// =========================================================
// PLATFORM
// =========================================================

export const isNative = Capacitor.isNativePlatform();

const BASE_URL =
  "https://calbayog-city-tourism.onrender.com/api";

export const SERVER_BASE_URL =
  "https://calbayog-city-tourism.onrender.com/api";

// =========================================================
// SUPABASE
// =========================================================

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://wemjefizjcbjvtplllxa.supabase.co";

// IMPORTANT:
// Use only your Supabase public anon/publishable key.
// NEVER use the service_role key in frontend code.
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";

// =========================================================
// CACHE
// =========================================================

const CACHE_DURATION = 10 * 60 * 1000;

const getCacheKey = (url: string, params?: any) => {
  const paramString = params ? JSON.stringify(params) : "";
  return `cache_${url}_${paramString}`;
};

const getCachedData = (key: string) => {
  try {
    const cached = localStorage.getItem(key);

    if (!cached || cached === "undefined") {
      return null;
    }

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
    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    );
  } catch {
    // Ignore storage errors
  }
};

// =========================================================
// REGULAR API
// =========================================================

const api = axios.create({
  baseURL: isNative ? SERVER_BASE_URL : BASE_URL,
});

// =========================================================
// USER API
// =========================================================

// =========================================================
// USER API
// =========================================================

const userApi = axios.create({
  baseURL: isNative ? SERVER_BASE_URL : BASE_URL,
  headers: {
    "X-Client-Type": "user",
  },
});

/**
 * Retrieve only the authenticated user's token.
 *
 * IMPORTANT:
 * Do not use generic token keys such as:
 * - token
 * - authToken
 * - accessToken
 * - jwt
 *
 * Those keys may contain an admin token or an unrelated token.
 */
const getUserToken = (): string | null => {
  // Only check keys that belong to the user session.
  // Never use admin_token or generic shared token keys here.
  const userTokenKeys = [
    "user_token",
    "userToken",
    "user_access_token",
    "userAccessToken",
  ];

  for (const key of userTokenKeys) {
    const localValue = localStorage.getItem(key);

    if (
      typeof localValue === "string" &&
      localValue.trim().length > 0
    ) {
      return localValue.trim();
    }

    const sessionValue = sessionStorage.getItem(key);

    if (
      typeof sessionValue === "string" &&
      sessionValue.trim().length > 0
    ) {
      return sessionValue.trim();
    }
  }

  return null;
};

/**
 * Return the current authenticated user token.
 */
export const getAuthenticatedUserToken = (): string | null =>
  getUserToken();

/**
 * Attach the user authentication token to user requests.
 */
userApi.interceptors.request.use(
  (config) => {
    const token = getUserToken();

    config.headers = config.headers || {};

if (typeof config.headers.set === "function") {
  config.headers.set("X-Client-Type", "user");
} else {
  config.headers["X-Client-Type"] = "user";
}

if (token && token.trim().length > 0) {
  const authorizationValue = `Bearer ${token.trim()}`;

  if (typeof config.headers.set === "function") {
    config.headers.set(
      "Authorization",
      authorizationValue,
    );
  } else {
    config.headers.Authorization = authorizationValue;
  }

  console.log(
    "[USER API] Authorization header attached:",
    {
      url: config.url,
      method: config.method,
      hasToken: true,
      tokenLength: token.trim().length,
    },
  );
} else {
  if (typeof config.headers.delete === "function") {
    config.headers.delete("Authorization");
  } else {
    delete config.headers.Authorization;
  }

  console.error(
    "[USER API] No user token found:",
    {
      url: config.url,
      method: config.method,
      localStorageUserToken:
        localStorage.getItem("user_token"),
      localStorageUserTokenAlias:
        localStorage.getItem("userToken"),
      sessionStorageUserToken:
        sessionStorage.getItem("user_token"),
    },
  );
}

    return config;
  },
  (error) => Promise.reject(error),
);
// =========================================================
// PLACEHOLDER IMAGE
// =========================================================

const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/400x300?text=No+Image";

// =========================================================
// IMAGE URL
// =========================================================

export const getImageUrl = (path: string) => {
  if (!path) {
    return PLACEHOLDER_IMAGE;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/uploads/")) {
    return PLACEHOLDER_IMAGE;
  }

  return path;
};

// =========================================================
// ADMIN TOKEN
// =========================================================

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// =========================================================
// SUPABASE REST CLIENT
// =========================================================

const supabaseApi = axios.create({
  baseURL: `${SUPABASE_URL}/rest/v1`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Prefer: "return=representation",
  },
});

// Add the required Supabase REST API headers.
supabaseApi.interceptors.request.use((config) => {
  if (!SUPABASE_ANON_KEY) {
    console.error(
      "Supabase public key is missing. Add VITE_SUPABASE_ANON_KEY to your .env file.",
    );
  }

  config.headers = config.headers || {};

  config.headers.apikey = SUPABASE_ANON_KEY;
  config.headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  config.headers.Accept = "application/json";
  config.headers["Content-Type"] = "application/json";
  config.headers.Prefer = "return=representation";

  return config;
});

// =========================================================
// IMAGE REWRITE
// =========================================================

const rewriteImageUrls = (obj: any): any => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(rewriteImageUrls);
  }

  const rewritten: any = {};

  for (const key in obj) {
    if (
      typeof obj[key] === "string" &&
      obj[key].startsWith("/uploads/")
    ) {
      rewritten[key] = PLACEHOLDER_IMAGE;
    } else if (Array.isArray(obj[key])) {
      rewritten[key] = obj[key].map((item: any) => {
        if (
          typeof item === "string" &&
          item.startsWith("/uploads/")
        ) {
          return PLACEHOLDER_IMAGE;
        }

        return typeof item === "object" && item !== null
          ? rewriteImageUrls(item)
          : item;
      });
    } else if (
      typeof obj[key] === "object" &&
      obj[key] !== null
    ) {
      rewritten[key] = rewriteImageUrls(obj[key]);
    } else {
      rewritten[key] = obj[key];
    }
  }

  return rewritten;
};

// =========================================================
// SUPABASE REST RESPONSE INTERCEPTOR
// =========================================================

supabaseApi.interceptors.response.use((response) => {
  if (isNative && response.data) {
    response.data = rewriteImageUrls(response.data);
  }

  return response;
});

// =========================================================
// WEB CACHE REQUEST INTERCEPTOR
// =========================================================

api.interceptors.request.use((config) => {
  if (
    isNative ||
    config.method?.toLowerCase() !== "get"
  ) {
    return config;
  }

  const cacheKey = getCacheKey(
    config.url || "",
    config.params,
  );

  const cachedData = getCachedData(cacheKey);

  if (cachedData !== null && cachedData !== undefined) {
    config.adapter = () =>
      Promise.resolve({
        data: cachedData,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      });
  }

  return config;
});

// =========================================================
// WEB CACHE RESPONSE INTERCEPTOR
// =========================================================

api.interceptors.response.use(
  (response) => {
    if (isNative && response.data) {
      response.data = rewriteImageUrls(response.data);
    }

    if (response.config.method?.toLowerCase() === "get") {
      const cacheKey = getCacheKey(
        response.config.url || "",
        response.config.params,
      );

      setCachedData(cacheKey, response.data);
    }

    return response;
  },
  (error) => {
  const requestConfig = error.config;
  const requestUrl = String(requestConfig?.url || "");
  const clientType =
    requestConfig?.headers?.["X-Client-Type"] ||
    requestConfig?.headers?.["x-client-type"];

  const isUserRequest =
    clientType === "user" ||
    requestUrl.includes("/memories") ||
    requestUrl.includes("/favorites");

  const isAdminRequest =
    clientType === "admin" ||
    !isUserRequest;

  /**
   * Only redirect to the admin login page for actual
   * admin requests.
   *
   * User memory and favorite requests must never
   * redirect to the admin login page.
   */
  if (
    !isNative &&
    error.response?.status === 401 &&
    isAdminRequest &&
    !isUserRequest
  ) {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");

    if (
      window.location.pathname !== "/admin/login"
    ) {
      window.location.href = "/admin/login";
    }
  }

  return Promise.reject(error);
},
);

// =========================================================
// USER API RESPONSE ERROR HANDLER
// =========================================================

userApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const userTokenKeys = [
        "user_token",
        "userToken",
        "user_access_token",
        "userAccessToken",
      ];

      userTokenKeys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      localStorage.removeItem("user_data");
      sessionStorage.removeItem("user_data");
    }

    // Never redirect to the admin login page from a user request.
    return Promise.reject(error);
  },
);

// =========================================================
// CLEAR CACHE
// =========================================================

export const clearCache = (pattern?: string) => {
  try {
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (!key.startsWith("cache_")) {
        return;
      }

      if (!pattern || key.includes(pattern)) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // Ignore storage errors
  }
};

if (isNative) {
  clearCache();
}

// =========================================================
// ADMIN AUTH
// =========================================================

export const loginAdmin = async (data: {
  username: string;
  password: string;
}) => {
  const response = await supabaseApi.get(
    `/admins?username=eq.${encodeURIComponent(
      data.username,
    )}&select=*`,
  );

  const admins = Array.isArray(response.data)
    ? response.data
    : [];

  const admin = admins[0];

  if (!admin) {
    throw new Error("Invalid username");
  }

  if (
    admin.mobile_pin &&
    admin.mobile_pin === data.password
  ) {
    const token = btoa(
      JSON.stringify({
        id: admin.id,
        username: admin.username,
        exp: Date.now() + 8 * 60 * 60 * 1000,
      }),
    );

    return {
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          email: admin.email,
        },
      },
    };
  }

  throw new Error(
    "Invalid password. Please use your mobile PIN.",
  );
};

// =========================================================
// ATTRACTIONS
// =========================================================

export const getAttractions = async (params?: {
  show_on_welcome?: boolean;
  category?: string;
  search?: string;
}) => {
  let query = supabase
    .from("attractions")
    .select("*")
    .order("created_at", { ascending: false });

  if (params?.show_on_welcome !== undefined) {
    query = query.eq(
      "show_on_welcome",
      params.show_on_welcome,
    );
  }

  if (params?.category && params.category !== "All") {
    query = query.eq("category", params.category);
  }

  if (params?.search) {
    query = query.or(
      `name.ilike.%${params.search}%,description.ilike.%${params.search}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      "Supabase getAttractions error:",
      error,
    );

    throw error;
  }

  return {
    data: Array.isArray(data) ? data : [],
  };
};

export const getAttraction = async (id: string) => {
  const { data, error } = await supabase
    .from("attractions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return { data };
};

export const createAttraction = (data: object) =>
  supabaseApi.post("/attractions", data);

export const updateAttraction = (
  id: string,
  data: object,
) =>
  supabaseApi.patch(
    `/attractions?id=eq.${encodeURIComponent(id)}`,
    data,
  );

export const deleteAttraction = (id: string) =>
  supabaseApi.delete(
    `/attractions?id=eq.${encodeURIComponent(id)}`,
  );

// =========================================================
// EVENTS
// =========================================================

export const getEvents = (_params?: object) =>
  supabaseApi.get(
    "/events?select=*&order=start_date.desc",
  );

export const getEvent = (id: string) =>
  supabaseApi.get(
    `/events?id=eq.${encodeURIComponent(id)}&select=*`,
  );

export const createEvent = (data: object) =>
  supabaseApi.post("/events", data);

export const updateEvent = (
  id: string,
  data: object,
) =>
  supabaseApi.patch(
    `/events?id=eq.${encodeURIComponent(id)}`,
    data,
  );

export const deleteEvent = (id: string) =>
  supabaseApi.delete(
    `/events?id=eq.${encodeURIComponent(id)}`,
  );

// =========================================================
// ACCOMMODATIONS
// =========================================================

export const getAccommodations = async (params?: {
  show_on_welcome?: boolean;
  type?: string;
  dot_accredited?: boolean;
}) => {
  let query = supabase
    .from("accommodations")
    .select("*")
    .order("created_at", { ascending: false });

  if (params?.show_on_welcome !== undefined) {
    query = query.eq(
      "show_on_welcome",
      params.show_on_welcome,
    );
  }

  if (params?.type && params.type !== "All") {
    query = query.eq("type", params.type);
  }

  if (params?.dot_accredited !== undefined) {
    query = query.eq(
      "dot_accredited",
      params.dot_accredited,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      "Supabase getAccommodations error:",
      error,
    );

    throw error;
  }

  return {
    data: Array.isArray(data) ? data : [],
  };
};

export const getAccommodation = async (id: string) => {
  const { data, error } = await supabase
    .from("accommodations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return { data };
};

export const createAccommodation = (data: object) =>
  supabaseApi.post("/accommodations", data);

export const updateAccommodation = (
  id: string,
  data: object,
) =>
  supabaseApi.patch(
    `/accommodations?id=eq.${encodeURIComponent(id)}`,
    data,
  );

export const deleteAccommodation = (id: string) =>
  supabaseApi.delete(
    `/accommodations?id=eq.${encodeURIComponent(id)}`,
  );

// =========================================================
// FAVORITES
// =========================================================

export type FavoriteItemType =
  | "attraction"
  | "accommodation"
  | "event";

export interface FavoriteRecord {
  id: string;
  item_type: FavoriteItemType;
  item_id: string;
  created_at: string;
}

export interface FavoriteResponse {
  message?: string;
  favorited: boolean;
  favoriteCount: number;
  favorite?: {
    id: string;
    itemType: FavoriteItemType;
    itemId: string;
    createdAt?: string;
  } | null;
}

export const getFavorites = async (): Promise<{
  data: {
    favorites: FavoriteRecord[];
  };
}> => {
  const response = await userApi.get("/favorites");

  return {
    data: {
      favorites: Array.isArray(
        response?.data?.favorites,
      )
        ? response.data.favorites
        : [],
    },
  };
};

export const addFavorite = async (
  itemType: FavoriteItemType,
  itemId: string,
): Promise<FavoriteResponse> => {
  if (!itemType) {
    throw new Error("Favorite item type is required.");
  }

  if (!itemId) {
    throw new Error("Favorite item ID is required.");
  }

  const response = await userApi.post("/favorites", {
    itemType,
    itemId,
  });

  return {
    message: response?.data?.message,
    favorited: Boolean(response?.data?.favorited),
    favoriteCount:
      Number(response?.data?.favoriteCount) || 0,
    favorite: response?.data?.favorite || null,
  };
};

export const removeFavorite = async (
  itemType: FavoriteItemType,
  itemId: string,
): Promise<FavoriteResponse> => {
  if (!itemType) {
    throw new Error("Favorite item type is required.");
  }

  if (!itemId) {
    throw new Error("Favorite item ID is required.");
  }

  const response = await userApi.delete(
    `/favorites/${encodeURIComponent(
      itemType,
    )}/${encodeURIComponent(itemId)}`,
  );

  return {
    message: response?.data?.message,
    favorited: Boolean(response?.data?.favorited),
    favoriteCount:
      Number(response?.data?.favoriteCount) || 0,
    favorite: response?.data?.favorite || null,
  };
};

export const checkFavorite = async (
  itemType: FavoriteItemType,
  itemId: string,
): Promise<FavoriteResponse> => {
  if (!itemType) {
    throw new Error("Favorite item type is required.");
  }

  if (!itemId) {
    throw new Error("Favorite item ID is required.");
  }

  const response = await userApi.get(
    `/favorites/${encodeURIComponent(
      itemType,
    )}/${encodeURIComponent(itemId)}`,
  );

  return {
    favorited: Boolean(response?.data?.favorited),
    favoriteCount:
      Number(response?.data?.favoriteCount) || 0,
    message: response?.data?.message,
    favorite: response?.data?.favorite || null,
  };
};

// =========================================================
// GENERIC REST HELPERS
// =========================================================

const createCrudFunctions = (table: string) => ({
  getAll: (_params?: object) =>
    supabaseApi.get(
      `/${table}?select=*&order=created_at.desc`,
    ),

  getOne: (id: string) =>
    supabaseApi.get(
      `/${table}?id=eq.${encodeURIComponent(id)}&select=*`,
    ),

  create: (data: object) =>
    supabaseApi.post(`/${table}`, data),

  update: (id: string, data: object) =>
    supabaseApi.patch(
      `/${table}?id=eq.${encodeURIComponent(id)}`,
      data,
    ),

  remove: (id: string) =>
    supabaseApi.delete(
      `/${table}?id=eq.${encodeURIComponent(id)}`,
    ),
});

// =========================================================
// GUIDES
// =========================================================

export const getGuides = (params?: object) =>
 createCrudFunctions("guides").getAll(params);

export const getGuide = (id: string) =>
  createCrudFunctions("guides").getOne(id);

export const createGuide = (data: object) =>
  createCrudFunctions("guides").create(data);

export const updateGuide = (
  id: string,
  data: object,
) =>
  createCrudFunctions("guides").update(id, data);

export const deleteGuide = (id: string) =>
  createCrudFunctions("guides").remove(id);

// =========================================================
// ITINERARY REQUESTS
// =========================================================

export const submitItineraryRequest = (data: object) =>
  supabaseApi.post("/itinerary_requests", data);

export const getItineraryRequests = (_params?: object) =>
  supabaseApi.get(
    "/itinerary_requests?select=*&order=created_at.desc",
  );

export const getItineraryRequest = (id: string) =>
  supabaseApi.get(
    `/itinerary_requests?id=eq.${encodeURIComponent(id)}&select=*`,
  );

export const updateItineraryRequest = (
  id: string,
  data: object,
) =>
  supabaseApi.patch(
    `/itinerary_requests?id=eq.${encodeURIComponent(id)}`,
    data,
  );

// =========================================================
// ADMIN MANAGEMENT
// =========================================================

export const getAdmins = () =>
  supabaseApi.get(
    "/admins?select=*&order=created_at.desc",
  );

export const getAdmin = (id: string) =>
  supabaseApi.get(
    `/admins?id=eq.${encodeURIComponent(id)}&select=*`,
  );

export const createAdmin = (data: object) =>
 supabaseApi.post("/admins", data);

export const updateAdmin = (
  id: string,
  data: object,
) =>
  supabaseApi.patch(
    `/admins?id=eq.${encodeURIComponent(id)}`,
    data,
  );

export const deleteAdmin = (id: string) =>
  supabaseApi.delete(
    `/admins?id=eq.${encodeURIComponent(id)}`,
  );

// =========================================================
// FEEDBACK
// =========================================================

export const getFeedback = () =>
  supabaseApi.get(
    "/feedback?select=*&order=created_at.desc",
  );

export const createFeedback = (data: object) =>
  supabaseApi.post("/feedback", data);

export const updateFeedback = (
  id: string,
  data: object,
) =>
  supabaseApi.patch(
    `/feedback?id=eq.${encodeURIComponent(id)}`,
    data,
  );

export const deleteFeedback = (id: string) =>
  supabaseApi.delete(
    `/feedback?id=eq.${encodeURIComponent(id)}`,
  );

// =========================================================
// IMAGE UPLOAD
// =========================================================

export const uploadImageToSupabase = async (
  file: File,
): Promise<string> => {
  const ext =
    file.name.split(".").pop()?.toLowerCase() || "jpg";

  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}.${ext}`;

  const { data, error } = await supabase.storage
    .from("images")
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type || "image/jpeg",
    });

  if (error) {
    throw new Error(
      `Image upload failed: ${error.message}`,
    );
  }

  const { data: publicData } = supabase.storage
    .from("images")
    .getPublicUrl(data.path);

  return publicData.publicUrl;
};

export const uploadImage = async (
  file: File,
): Promise<{
  data: {
    url: string;
  };
}> => {
  const url = await uploadImageToSupabase(file);

  return {
    data: {
      url,
    },
  };
};

export const uploadMultipleImages = async (
  files: File[],
): Promise<{
  data: {
    urls: string[];
  };
}> => {
  const urls = await Promise.all(
    files.map((file) => uploadImageToSupabase(file)),
  );

  return {
    data: {
      urls,
    },
  };
};

// =========================================================
// GETTING THERE
// =========================================================

export const getGettingThere = () =>
  supabaseApi.get(
    "/getting_there?select=*&order=created_at.desc",
  );

export const createGettingThere = (data: object) =>
  supabaseApi.post("/getting_there", data);

export const updateGettingThere = (
  id: string,
  data: object,
) =>
  supabaseApi.patch(
    `/getting_there?id=eq.${encodeURIComponent(id)}`,
    data,
  );

export const deleteGettingThere = (id: string) =>
  supabaseApi.delete(
    `/getting_there?id=eq.${encodeURIComponent(id)}`,
  );

// =========================================================
// USERS
// =========================================================

export const getUsers = () =>
  supabaseApi.get(
    "/users?select=*&order=created_at.desc",
  );

export const createUser = (data: object) =>
  supabaseApi.post("/users", data);

export const updateUser = (
  id: string,
  data: object,
) =>
  supabaseApi.patch(
    `/users?id=eq.${encodeURIComponent(id)}`,
    data,
  );

export const deleteUser = (id: string) =>
  supabaseApi.delete(
    `/users?id=eq.${encodeURIComponent(id)}`,
  );

// =========================================================
// NOTIFICATIONS
// =========================================================

export const getNotifications = (userId: string) =>
  supabaseApi.get(
    `/notifications?user_id=eq.${encodeURIComponent(
      userId,
    )}&order=created_at.desc`,
  );

export const getUnreadCount = async (userId: string) => {
  const response = await supabaseApi.get(
    `/notifications?user_id=eq.${encodeURIComponent(
      userId,
    )}&is_read=eq.false&select=id`,
  );

  return {
    data: {
      count: Array.isArray(response.data)
        ? response.data.length
        : 0,
    },
  };
};

export const markAsRead = (id: string) =>
  supabaseApi.patch(
    `/notifications?id=eq.${encodeURIComponent(id)}`,
    {
      is_read: true,
    },
  );

export const markAllAsRead = (userId: string) =>
  supabaseApi.patch(
    `/notifications?user_id=eq.${encodeURIComponent(
      userId,
    )}&is_read=eq.false`,
    {
      is_read: true,
    },
  );

export const createNotification = (data: object) =>
  supabaseApi.post("/notifications", data);

export const deleteNotification = (id: string) =>
  supabaseApi.delete(
    `/notifications?id=eq.${encodeURIComponent(id)}`,
  );


// =========================================================
// USER MEMORIES
// =========================================================

export interface UserMemory {
  id: string;
  user_id: string;
  attraction_id: string;
  caption: string;

  // Supports multiple images per memory.
  image_urls: string[];

  // Kept for backward compatibility with older records.
  image_url?: string | null;

  created_at?: string;
  updated_at?: string;
}

export interface UserMemoriesResponse {
  memories: UserMemory[];
}

export interface CreateMemoryPayload {
  attraction_id: string;
  caption: string;

  // Multiple image URLs.
  image_urls: string[];
}

/**
 * Normalize a memory returned by the backend.
 *
 * This keeps older memories that use image_url working,
 * while newer memories use image_urls.
 */
const normalizeMemory = (
  memory: UserMemory,
): UserMemory => {
  const existingImageUrls = Array.isArray(
    memory.image_urls,
  )
    ? memory.image_urls.filter(
        (url): url is string =>
          typeof url === "string" &&
          url.trim().length > 0,
      )
    : [];

  const legacyImageUrl =
    typeof memory.image_url === "string" &&
    memory.image_url.trim().length > 0
      ? memory.image_url.trim()
      : null;

  const normalizedImageUrls =
    existingImageUrls.length > 0
      ? existingImageUrls
      : legacyImageUrl
        ? [legacyImageUrl]
        : [];

  return {
    ...memory,
    image_urls: normalizedImageUrls,
    image_url: memory.image_url ?? null,
  };
};

/**
 * Get all memories belonging to the authenticated user.
 */
export const getMyMemories = async (): Promise<{
  data: UserMemory[];
}> => {
  const response =
    await userApi.get<UserMemoriesResponse>(
      "/memories",
    );

  const memories = Array.isArray(
    response.data?.memories,
  )
    ? response.data.memories
    : [];

  return {
    data: memories.map(normalizeMemory),
  };
};

/**
 * Get only the authenticated user's memories
 * for one attraction.
 */
export const getMyAttractionMemories = async (
  attractionId: string,
): Promise<{
  data: UserMemory[];
}> => {
  if (!attractionId) {
    throw new Error("Attraction ID is required.");
  }

  const response =
    await userApi.get<UserMemoriesResponse>(
      `/memories/attraction/${encodeURIComponent(
        attractionId,
      )}`,
    );

  const memories = Array.isArray(
    response.data?.memories,
  )
    ? response.data.memories
    : [];

  return {
    data: memories.map(normalizeMemory),
  };
};

/**
 * Create a memory.
 *
 * The backend determines user_id from the JWT.
 * Do not include user_id in the payload.
 */
export const createMyMemory = async (
  payload: CreateMemoryPayload,
): Promise<{
  data: UserMemory;
  message?: string;
}> => {
  if (!payload.attraction_id) {
    throw new Error("Attraction ID is required.");
  }

  if (!payload.caption.trim()) {
    throw new Error("Memory caption is required.");
  }

  if (
    !Array.isArray(payload.image_urls) ||
    payload.image_urls.length === 0
  ) {
    throw new Error(
      "At least one memory image is required.",
    );
  }

  const cleanedImageUrls = payload.image_urls
    .filter(
      (url): url is string =>
        typeof url === "string" &&
        url.trim().length > 0,
    )
    .map((url) => url.trim());

  if (cleanedImageUrls.length === 0) {
    throw new Error(
      "At least one valid memory image is required.",
    );
  }

  const userToken = getUserToken();

  if (!userToken || !userToken.trim()) {
    throw new Error(
      "User authentication is missing. Please log in again before submitting a memory.",
    );
  }

  const requestUrl =
    "https://calbayog-city-tourism.onrender.com/api/memories";

  const response = await fetch(requestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${userToken.trim()}`,
      "X-Client-Type": "user",
    },
    body: JSON.stringify({
      attraction_id: payload.attraction_id,
      caption: payload.caption.trim(),
      image_urls: cleanedImageUrls,
    }),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(
      responseData?.message ||
        responseData?.error ||
        `Memory submission failed with status ${response.status}.`,
    );
  }

  return {
    data: normalizeMemory(responseData.memory),
    message: responseData.message,
  };
};

/**
 * Upload memory photos through the protected backend.
 *
 * The backend uploads the files to Supabase Storage using
 * the server-side Supabase service role key.
 *
 * The service role key must never be placed in frontend code.
 */

export const uploadMemoryPhotos = async (
  files: File[],
  attractionId: string,
): Promise<{
  data: {
    urls: string[];
  };
}> => {
  if (!attractionId) {
    throw new Error("Attraction ID is required.");
  }

  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("At least one image is required.");
  }

  if (files.length > 10) {
    throw new Error(
      "You can upload a maximum of 10 pictures.",
    );
  }

  const formData = new FormData();

  formData.append("attraction_id", attractionId);

  /*
    IMPORTANT:
    Every file is appended individually using
    the field name "photos".

    This must match the backend multer field name.
  */

  files.forEach((file) => {
    formData.append("photos", file, file.name);
  });

  /*
    Do not manually set Content-Type.

    Axios automatically adds the correct multipart
    boundary when FormData is used.
  */

  const response = await userApi.post<{
    urls?: string[];
    message?: string;
  }>("/memories/upload", formData);

  const urls = Array.isArray(response.data?.urls)
    ? response.data.urls.filter(
        (url): url is string =>
          typeof url === "string" &&
          url.trim().length > 0,
      )
    : [];

  if (urls.length !== files.length) {
    throw new Error(
      `Only ${urls.length} of ${files.length} images were uploaded successfully.`,
    );
  }

  return {
    data: {
      urls,
    },
  };
};

/**
 * Delete a memory belonging to the authenticated user.
 */
export const deleteMyMemory = async (
  memoryId: string,
): Promise<{
  message?: string;
}> => {
  if (!memoryId) {
    throw new Error("Memory ID is required.");
  }

  const response = await userApi.delete(
    `/memories/${encodeURIComponent(memoryId)}`,
  );

  return {
    message: response.data?.message,
  };
};

// =========================================================
// DEFAULT EXPORT
// =========================================================

export default api;
