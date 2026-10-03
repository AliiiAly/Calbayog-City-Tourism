import axios from "axios";
import { Capacitor } from "@capacitor/core";
import {
  supabase,
  SUPABASE_ANON_KEY,
} from "./supabase";

// =========================================================
// PLATFORM
// =========================================================

export const isNative =
  Capacitor.isNativePlatform();

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

// =========================================================
// CACHE
// =========================================================

const CACHE_DURATION = 10 * 60 * 1000;

const getCacheKey = (
  url: string,
  params?: any,
) => {
  const paramString = params
    ? JSON.stringify(params)
    : "";

  return `cache_${url}_${paramString}`;
};

const getCachedData = (key: string) => {
  try {
    const cached =
      localStorage.getItem(key);

    if (!cached || cached === "undefined") {
      return null;
    }

    const { data, timestamp } =
      JSON.parse(cached);

    if (
      Date.now() - timestamp >
      CACHE_DURATION
    ) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch {
    return null;
  }
};

const setCachedData = (
  key: string,
  data: any,
) => {
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
  baseURL: isNative
    ? SERVER_BASE_URL
    : BASE_URL,
});

// =========================================================
// USER API
// =========================================================

const userApi = axios.create({
  baseURL: isNative
    ? SERVER_BASE_URL
    : BASE_URL,
  headers: {
    "X-Client-Type": "user",
  },
});

// =========================================================
// USER TOKEN
// =========================================================

const getUserToken = (): string | null => {
  const userTokenKeys = [
    "user_token",
    "userToken",
    "user_access_token",
    "userAccessToken",
  ];

  for (const key of userTokenKeys) {
    const localValue =
      localStorage.getItem(key);

    if (
      typeof localValue === "string" &&
      localValue.trim().length > 0
    ) {
      return localValue.trim();
    }

    const sessionValue =
      sessionStorage.getItem(key);

    if (
      typeof sessionValue === "string" &&
      sessionValue.trim().length > 0
    ) {
      return sessionValue.trim();
    }
  }

  return null;
};

// =========================================================
// AUTHENTICATED USER TOKEN
// =========================================================

export const getAuthenticatedUserToken =
  (): string | null =>
    getUserToken();

// =========================================================
// USER AUTHORIZATION INTERCEPTOR
// =========================================================

userApi.interceptors.request.use(
  (config) => {
    const token = getUserToken();

    config.headers =
      config.headers || {};

    if (
      typeof config.headers.set ===
      "function"
    ) {
      config.headers.set(
        "X-Client-Type",
        "user",
      );
    } else {
      config.headers[
        "X-Client-Type"
      ] = "user";
    }

    if (
      token &&
      token.trim().length > 0
    ) {
      const authorizationValue =
        `Bearer ${token.trim()}`;

      if (
        typeof config.headers.set ===
        "function"
      ) {
        config.headers.set(
          "Authorization",
          authorizationValue,
        );
      } else {
        config.headers.Authorization =
          authorizationValue;
      }

      console.log(
        "[USER API] Authorization header attached:",
        {
          url: config.url,
          method: config.method,
          hasToken: true,
          tokenLength:
            token.trim().length,
        },
      );
    } else {
      if (
        typeof config.headers.delete ===
        "function"
      ) {
        config.headers.delete(
          "Authorization",
        );
      } else {
        delete config.headers
          .Authorization;
      }

      console.error(
        "[USER API] No user token found:",
        {
          url: config.url,
          method: config.method,
          localStorageUserToken:
            localStorage.getItem(
              "user_token",
            ),
          localStorageUserTokenAlias:
            localStorage.getItem(
              "userToken",
            ),
          sessionStorageUserToken:
            sessionStorage.getItem(
              "user_token",
            ),
        },
      );
    }

    return config;
  },
  (error) =>
    Promise.reject(error),
);

// =========================================================
// PLACEHOLDER IMAGE
// =========================================================

const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/400x300?text=No+Image";

// =========================================================
// IMAGE URL
// =========================================================

export const getImageUrl = (
  path: string,
) => {
  if (!path) {
    return PLACEHOLDER_IMAGE;
  }

  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  if (
    path.startsWith("/uploads/")
  ) {
    return PLACEHOLDER_IMAGE;
  }

  return path;
};

// =========================================================
// ADMIN TOKEN
// =========================================================

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "admin_token",
      );

    if (token) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
);

// =========================================================
// SUPABASE REST CLIENT
// =========================================================

const supabaseApi = axios.create({
  baseURL: `${SUPABASE_URL}/rest/v1`,
  headers: {
    "Content-Type":
      "application/json",
    Accept: "application/json",
    Prefer:
      "return=representation",
  },
});

// =========================================================
// SUPABASE REST AUTH HEADERS
// =========================================================

supabaseApi.interceptors.request.use(
  (config) => {
    if (!SUPABASE_ANON_KEY) {
      console.error(
        "Supabase public key is missing.",
      );
    }

    config.headers =
      config.headers || {};

    config.headers.apikey =
      SUPABASE_ANON_KEY;

    config.headers.Authorization =
      `Bearer ${SUPABASE_ANON_KEY}`;

    config.headers.Accept =
      "application/json";

    config.headers[
      "Content-Type"
    ] = "application/json";

    config.headers.Prefer =
      "return=representation";

    return config;
  },
);

// =========================================================
// IMAGE REWRITE
// =========================================================

const rewriteImageUrls = (
  obj: any,
): any => {
  if (
    typeof obj !== "object" ||
    obj === null
  ) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(
      rewriteImageUrls,
    );
  }

  const rewritten: any = {};

  for (const key in obj) {
    if (
      typeof obj[key] === "string" &&
      obj[key].startsWith(
        "/uploads/",
      )
    ) {
      rewritten[key] =
        PLACEHOLDER_IMAGE;
    } else if (
      Array.isArray(obj[key])
    ) {
      rewritten[key] =
        obj[key].map(
          (item: any) => {
            if (
              typeof item ===
                "string" &&
              item.startsWith(
                "/uploads/",
              )
            ) {
              return PLACEHOLDER_IMAGE;
            }

            return typeof item ===
              "object" &&
              item !== null
              ? rewriteImageUrls(
                  item,
                )
              : item;
          },
        );
    } else if (
      typeof obj[key] ===
        "object" &&
      obj[key] !== null
    ) {
      rewritten[key] =
        rewriteImageUrls(
          obj[key],
        );
    } else {
      rewritten[key] =
        obj[key];
    }
  }

  return rewritten;
};

// =========================================================
// SUPABASE REST RESPONSE INTERCEPTOR
// =========================================================

supabaseApi.interceptors.response.use(
  (response) => {
    if (
      isNative &&
      response.data
    ) {
      response.data =
        rewriteImageUrls(
          response.data,
        );
    }

    return response;
  },
);

// =========================================================
// WEB CACHE REQUEST INTERCEPTOR
// =========================================================

api.interceptors.request.use(
  (config) => {
    if (
      isNative ||
      config.method?.toLowerCase() !==
        "get"
    ) {
      return config;
    }

    /*
     * FEATURED VIDEOS:
     * Always request the latest list from the backend.
     */
    if (
      (config.url || "").includes(
        "/featured-videos",
      )
    ) {
      return config;
    }

    const cacheKey =
      getCacheKey(
        config.url || "",
        config.params,
      );

    const cachedData =
      getCachedData(cacheKey);

    if (
      cachedData !== null &&
      cachedData !== undefined
    ) {
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
  },
);

// =========================================================
// WEB CACHE RESPONSE INTERCEPTOR
// =========================================================

api.interceptors.response.use(
  (response) => {
    if (
      isNative &&
      response.data
    ) {
      response.data =
        rewriteImageUrls(
          response.data,
        );
    }

    /*
     * FEATURED VIDEOS:
     * Do not cache the response.
     */
    if (
      response.config.method?.toLowerCase() ===
        "get" &&
      !(response.config.url || "").includes(
        "/featured-videos",
      )
    ) {
      const cacheKey =
        getCacheKey(
          response.config.url || "",
          response.config.params,
        );

      setCachedData(
        cacheKey,
        response.data,
      );
    }

    return response;
  },
  (error) => {
    const requestConfig =
      error.config;

    const requestUrl = String(
      requestConfig?.url || "",
    );

    const clientType =
      requestConfig?.headers?.[
        "X-Client-Type"
      ] ||
      requestConfig?.headers?.[
        "x-client-type"
      ];

    const isUserRequest =
      clientType === "user" ||
      requestUrl.includes(
        "/memories",
      ) ||
      requestUrl.includes(
        "/favorites",
      );

    const isAdminRequest =
      clientType === "admin" ||
      !isUserRequest;

    if (
      !isNative &&
      error.response?.status ===
        401 &&
      isAdminRequest &&
      !isUserRequest
    ) {
      localStorage.removeItem(
        "admin_token",
      );

      localStorage.removeItem(
        "admin_user",
      );

      if (
        window.location.pathname !==
        "/admin/login"
      ) {
        window.location.href =
          "/admin/login";
      }
    }

    return Promise.reject(
      error,
    );
  },
);

// =========================================================
// USER API RESPONSE ERROR HANDLER
// =========================================================

userApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status ===
      401
    ) {
      const userTokenKeys = [
        "user_token",
        "userToken",
        "user_access_token",
        "userAccessToken",
      ];

      userTokenKeys.forEach(
        (key) => {
          localStorage.removeItem(
            key,
          );

          sessionStorage.removeItem(
            key,
          );
        },
      );

      localStorage.removeItem(
        "user_data",
      );

      sessionStorage.removeItem(
        "user_data",
      );
    }

    return Promise.reject(
      error,
    );
  },
);

// =========================================================
// CLEAR CACHE
// =========================================================

export const clearCache = (
  pattern?: string,
) => {
  try {
    const keys =
      Object.keys(
        localStorage,
      );

    keys.forEach((key) => {
      if (
        !key.startsWith(
          "cache_",
        )
      ) {
        return;
      }

      if (
        !pattern ||
        key.includes(pattern)
      ) {
        localStorage.removeItem(
          key,
        );
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

export const loginAdmin =
  async (data: {
    username: string;
    password: string;
  }) => {
    if (
      !data.username ||
      !data.username.trim()
    ) {
      throw new Error(
        "Username is required.",
      );
    }

    if (!data.password) {
      throw new Error(
        "Password is required.",
      );
    }

    try {
      const response =
        await axios.post(
          `${SERVER_BASE_URL}/auth/login`,
          {
            username:
              data.username.trim(),
            password:
              data.password,
          },
        );

      const token =
        response.data?.token;

      const admin =
        response.data?.admin;

      if (!token) {
        throw new Error(
          "Admin login failed: no authentication token was returned.",
        );
      }

      if (!admin) {
        throw new Error(
          "Admin login failed: no admin information was returned.",
        );
      }

      localStorage.setItem(
        "admin_token",
        token,
      );

      localStorage.setItem(
        "admin_user",
        JSON.stringify(admin),
      );

      return {
        data: {
          token,
          admin,
        },
      };
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Admin login failed.";

      throw new Error(message);
    }
  };

// =========================================================
// ATTRACTIONS
// =========================================================

export const getAttractions =
  async (params?: {
    show_on_welcome?: boolean;
    category?: string;
    search?: string;
  }) => {
    let query = supabase
      .from("attractions")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false,
        },
      );

    if (
      params?.show_on_welcome !==
      undefined
    ) {
      query = query.eq(
        "show_on_welcome",
        params.show_on_welcome,
      );
    }

    if (
      params?.category &&
      params.category !== "All"
    ) {
      query = query.eq(
        "category",
        params.category,
      );
    }

    if (params?.search) {
      query = query.or(
        `name.ilike.%${params.search}%,description.ilike.%${params.search}%`,
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        "Supabase getAttractions error:",
        error,
      );

      throw error;
    }

    return {
      data: Array.isArray(
        data,
      )
        ? data
        : [],
    };
  };

export const getAttraction =
  async (id: string) => {
    const {
      data,
      error,
    } = await supabase
      .from("attractions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return { data };
  };

export const createAttraction = (
  data: object,
) =>
  supabaseApi.post(
    "/attractions",
    data,
  );

export const updateAttraction = (
  id: string,
  data: object,
) =>
  supabaseApi.patch(
    `/attractions?id=eq.${encodeURIComponent(
      id,
    )}`,
    data,
  );

export const deleteAttraction = (
  id: string,
) =>
  supabaseApi.delete(
    `/attractions?id=eq.${encodeURIComponent(
      id,
    )}`,
  );

// =========================================================
// EVENTS
// =========================================================

export const getEvents = (
  _params?: object,
) =>
  supabaseApi.get(
    "/events?select=*&order=start_date.desc",
  );

export const getEvent = (
  id: string,
) =>
  supabaseApi.get(
    `/events?id=eq.${encodeURIComponent(
      id,
    )}&select=*`,
  );

export const createEvent = (data: object) =>
  api.post("/events", data);

export const updateEvent = (id: string, data: object) =>
  api.put(`/events/${encodeURIComponent(id)}`, data);

export const deleteEvent = (id: string) =>
  api.delete(`/events/${encodeURIComponent(id)}`);

// =========================================================
// ACCOMMODATIONS
// =========================================================

export const getAccommodations =
  async (params?: {
    show_on_welcome?: boolean;
    type?: string;
    dot_accredited?: boolean;
  }) => {
    let query = supabase
      .from("accommodations")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false,
        },
      );

    /*
     * IMPORTANT:
     *
     * The current accommodations table in Supabase contains:
     *
     * id
     * name
     * owner
     * manager
     * address
     * contact_number
     * website
     * images
     * created_at
     * updated_at
     * short_description
     * description
     * getting_there
     * latitude
     * longitude
     * favorites
     *
     * We therefore only apply filters when those columns are
     * actually supported by the current table.
     *
     * Do not send unsupported columns such as:
     * show_on_welcome
     * type
     * dot_accredited
     *
     * to Supabase.
     */

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        "Supabase getAccommodations error:",
        error,
      );

      throw error;
    }

    return {
      data: Array.isArray(
        data,
      )
        ? data
        : [],
    };
  };

export const getAccommodation =
  async (id: string) => {
    if (!id) {
      throw new Error(
        "Accommodation ID is required.",
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from("accommodations")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return { data };
  };

/*
 * IMPORTANT:
 *
 * Accommodation CREATE / UPDATE / DELETE operations MUST go
 * through the Render backend.
 *
 * The regular "api" Axios instance automatically attaches:
 *
 * Authorization: Bearer <admin_token>
 *
 * from localStorage.
 *
 * This means the Supabase anonymous key is NO LONGER used
 * for accommodation writes.
 *
 * The Render backend will then:
 *
 * 1. verify the admin JWT
 * 2. verify the user has role = "admin"
 * 3. use the server-side Supabase service-role key
 * 4. write to the accommodations table
 *
 * This keeps the Supabase service-role key out of Vercel
 * and out of the browser.
 */

export const createAccommodation = (
  data: object,
) =>
  api.post(
    "/accommodations",
    data,
  );

export const updateAccommodation = (
  id: string,
  data: object,
) => {
  if (!id) {
    throw new Error(
      "Accommodation ID is required.",
    );
  }

  return api.put(
    `/accommodations/${encodeURIComponent(
      id,
    )}`,
    data,
  );
};

export const deleteAccommodation = (
  id: string,
) => {
  if (!id) {
    throw new Error(
      "Accommodation ID is required.",
    );
  }

  return api.delete(
    `/accommodations/${encodeURIComponent(
      id,
    )}`,
  );
};

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

export const getFavorites =
  async (): Promise<{
    data: {
      favorites:
        FavoriteRecord[];
    };
  }> => {
    const response =
      await userApi.get(
        "/favorites",
      );

    return {
      data: {
        favorites:
          Array.isArray(
            response?.data
              ?.favorites,
          )
            ? response.data
                .favorites
            : [],
      },
    };
  };

export const addFavorite =
  async (
    itemType: FavoriteItemType,
    itemId: string,
  ): Promise<FavoriteResponse> => {
    if (!itemType) {
      throw new Error(
        "Favorite item type is required.",
      );
    }

    if (!itemId) {
      throw new Error(
        "Favorite item ID is required.",
      );
    }

    const response =
      await userApi.post(
        "/favorites",
        {
          itemType,
          itemId,
        },
      );

    return {
      message:
        response?.data
          ?.message,
      favorited: Boolean(
        response?.data
          ?.favorited,
      ),
      favoriteCount:
        Number(
          response?.data
            ?.favoriteCount,
        ) || 0,
      favorite:
        response?.data
          ?.favorite || null,
    };
  };

export const removeFavorite =
  async (
    itemType: FavoriteItemType,
    itemId: string,
  ): Promise<FavoriteResponse> => {
    if (!itemType) {
      throw new Error(
        "Favorite item type is required.",
      );
    }

    if (!itemId) {
      throw new Error(
        "Favorite item ID is required.",
      );
    }

    const response =
      await userApi.delete(
        `/favorites/${encodeURIComponent(
          itemType,
        )}/${encodeURIComponent(
          itemId,
        )}`,
      );

    return {
      message:
        response?.data
          ?.message,
      favorited: Boolean(
        response?.data
          ?.favorited,
      ),
      favoriteCount:
        Number(
          response?.data
            ?.favoriteCount,
        ) || 0,
      favorite:
        response?.data
          ?.favorite || null,
    };
  };

export const checkFavorite =
  async (
    itemType: FavoriteItemType,
    itemId: string,
  ): Promise<FavoriteResponse> => {
    if (!itemType) {
      throw new Error(
        "Favorite item type is required.",
      );
    }

    if (!itemId) {
      throw new Error(
        "Favorite item ID is required.",
      );
    }

    const response =
      await userApi.get(
        `/favorites/${encodeURIComponent(
          itemType,
        )}/${encodeURIComponent(
          itemId,
        )}`,
      );

    return {
      favorited: Boolean(
        response?.data
          ?.favorited,
      ),
      favoriteCount:
        Number(
          response?.data
            ?.favoriteCount,
        ) || 0,
      message:
        response?.data
          ?.message,
      favorite:
        response?.data
          ?.favorite || null,
    };
  };

// =========================================================
// GENERIC REST HELPERS
// =========================================================

const createCrudFunctions = (
  table: string,
) => ({
  getAll: (
    _params?: object,
  ) =>
    supabaseApi.get(
      `/${table}?select=*&order=created_at.desc`,
    ),

  getOne: (id: string) =>
    supabaseApi.get(
      `/${table}?id=eq.${encodeURIComponent(
        id,
      )}&select=*`,
    ),

  create: (data: object) =>
    supabaseApi.post(
      `/${table}`,
      data,
    ),

  update: (
    id: string,
    data: object,
  ) =>
    supabaseApi.patch(
      `/${table}?id=eq.${encodeURIComponent(
        id,
      )}`,
      data,
    ),

  remove: (id: string) =>
    supabaseApi.delete(
      `/${table}?id=eq.${encodeURIComponent(
        id,
      )}`,
    ),
});

// =========================================================
// GUIDES
// =========================================================

export const getGuides = (
  params?: object,
) =>
  createCrudFunctions(
    "guides",
  ).getAll(params);

export const getGuide = (
  id: string,
) =>
  createCrudFunctions(
    "guides",
  ).getOne(id);

export const createGuide = (
  data: object,
) =>
  createCrudFunctions(
    "guides",
  ).create(data);

export const updateGuide = (
  id: string,
  data: object,
) =>
  createCrudFunctions(
    "guides",
  ).update(id, data);

export const deleteGuide = (
  id: string,
) =>
  createCrudFunctions(
    "guides",
  ).remove(id);

// =========================================================
// ITINERARY REQUESTS
// =========================================================

export const submitItineraryRequest = (
  data: object,
) =>
  supabaseApi.post(
    "/itinerary_requests",
    data,
  );

export const getItineraryRequests = (
  _params?: object,
) =>
  supabaseApi.get(
    "/itinerary_requests?select=*&order=created_at.desc",
  );

export const getItineraryRequest = (
  id: string,
) =>
  supabaseApi.get(
    `/itinerary_requests?id=eq.${encodeURIComponent(
      id,
    )}&select=*`,
  );

export const updateItineraryRequest = (
  id: string,
  data: object,
) =>
  supabaseApi.patch(
    `/itinerary_requests?id=eq.${encodeURIComponent(
      id,
    )}`,
    data,
  );

// =========================================================
// ADMIN MANAGEMENT
// =========================================================

/*
 * IMPORTANT:
 *
 * Admin management MUST use the backend route.
 *
 * Do NOT use supabaseApi here because that would bypass
 * server-side password hashing and the admin authentication
 * middleware.
 *
 * The "api" Axios instance automatically attaches:
 *
 * Authorization: Bearer <admin_token>
 *
 * through the ADMIN TOKEN interceptor above.
 */

export const getAdmins = () =>
  api.get(
    "/admin-management",
  );

export const getAdmin = (
  id: string,
) =>
  api.get(
    `/admin-management/${encodeURIComponent(
      id,
    )}`,
  );

export const createAdmin = (
  data: object,
) =>
  api.post(
    "/admin-management",
    data,
  );

export const updateAdmin = (
  id: string,
  data: object,
) =>
  api.put(
    `/admin-management/${encodeURIComponent(
      id,
    )}`,
    data,
  );

export const deleteAdmin = (
  id: string,
) =>
  api.delete(
    `/admin-management/${encodeURIComponent(
      id,
    )}`,
  );

// =========================================================
// FEEDBACK
// =========================================================

export const getFeedback = () =>
  supabaseApi.get(
    "/feedback?select=*&order=created_at.desc",
  );

export const createFeedback = (
  data: object,
) =>
  supabaseApi.post(
    "/feedback",
    data,
  );

export const updateFeedback = (
  id: string,
  data: object,
) =>
  supabaseApi.patch(
    `/feedback?id=eq.${encodeURIComponent(
      id,
    )}`,
    data,
  );

export const deleteFeedback = (
  id: string,
) =>
  supabaseApi.delete(
    `/feedback?id=eq.${encodeURIComponent(
      id,
    )}`,
  );

// =========================================================
// IMAGE UPLOAD
// =========================================================

export const uploadImageToSupabase =
  async (
    file: File,
  ): Promise<string> => {
    const ext =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "jpg";

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${ext}`;

    const {
      data,
      error,
    } = await supabase.storage
      .from("images")
      .upload(
        fileName,
        file,
        {
          upsert: true,
          contentType:
            file.type ||
            "image/jpeg",
        },
      );

    if (error) {
      throw new Error(
        `Image upload failed: ${error.message}`,
      );
    }

    const {
      data: publicData,
    } =
      supabase.storage
        .from("images")
        .getPublicUrl(
          data.path,
        );

    return publicData.publicUrl;
  };

export const uploadImage =
  async (
    file: File,
  ): Promise<{
    data: {
      url: string;
    };
  }> => {
    const url =
      await uploadImageToSupabase(
        file,
      );

    return {
      data: {
        url,
      },
    };
  };

export const uploadMultipleImages =
  async (
    files: File[],
  ): Promise<{
    data: {
      urls: string[];
    };
  }> => {
    const urls =
      await Promise.all(
        files.map(
          (file) =>
            uploadImageToSupabase(
              file,
            ),
        ),
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

export const getGettingThere =
  () =>
    supabaseApi.get(
      "/getting_there?select=*&order=created_at.desc",
    );

export const createGettingThere = (
  data: object,
) =>
  supabaseApi.post(
    "/getting_there",
    data,
  );

export const updateGettingThere = (
  id: string,
  data: object,
) =>
  supabaseApi.patch(
    `/getting_there?id=eq.${encodeURIComponent(
      id,
    )}`,
    data,
  );

export const deleteGettingThere = (
  id: string,
) =>
  supabaseApi.delete(
    `/getting_there?id=eq.${encodeURIComponent(
      id,
    )}`,
  );

// =========================================================
// USERS
// =========================================================

export const getUsers = () =>
  supabaseApi.get(
    "/users?select=*&order=created_at.desc",
  );

export const createUser = (
  data: object,
) =>
  supabaseApi.post(
    "/users",
    data,
  );

export const updateUser = (
  id: string,
  data: object,
) =>
  supabaseApi.patch(
    `/users?id=eq.${encodeURIComponent(
      id,
    )}`,
    data,
  );

export const deleteUser = (
  id: string,
) =>
  supabaseApi.delete(
    `/users?id=eq.${encodeURIComponent(
      id,
    )}`,
  );

// =========================================================
// NOTIFICATIONS
// =========================================================

export const getNotifications = (
  userId: string,
) =>
  supabaseApi.get(
    `/notifications?user_id=eq.${encodeURIComponent(
      userId,
    )}&order=created_at.desc`,
  );

export const getUnreadCount =
  async (
    userId: string,
  ) => {
    const response =
      await supabaseApi.get(
        `/notifications?user_id=eq.${encodeURIComponent(
          userId,
        )}&is_read=eq.false&select=id`,
      );

    return {
      data: {
        count:
          Array.isArray(
            response.data,
          )
            ? response.data.length
            : 0,
      },
    };
  };

export const markAsRead = (
  id: string,
) =>
  supabaseApi.patch(
    `/notifications?id=eq.${encodeURIComponent(
      id,
    )}`,
    {
      is_read: true,
    },
  );

export const markAllAsRead = (
  userId: string,
) =>
  supabaseApi.patch(
    `/notifications?user_id=eq.${encodeURIComponent(
      userId,
    )}&is_read=eq.false`,
    {
      is_read: true,
    },
  );

export const createNotification = (
  data: object,
) =>
  supabaseApi.post(
    "/notifications",
    data,
  );

export const deleteNotification = (
  id: string,
) =>
  supabaseApi.delete(
    `/notifications?id=eq.${encodeURIComponent(
      id,
    )}`,
  );

// =========================================================
// USER MEMORIES
// =========================================================

export interface UserMemory {
  id: string;
  user_id: string;
  attraction_id: string;
  caption: string;
  image_urls: string[];
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
  image_urls: string[];
}

// =========================================================
// NORMALIZE MEMORY
// =========================================================

const normalizeMemory = (
  memory: UserMemory,
): UserMemory => {
  const existingImageUrls =
    Array.isArray(
      memory.image_urls,
    )
      ? memory.image_urls.filter(
          (
            url,
          ): url is string =>
            typeof url ===
              "string" &&
            url.trim().length >
              0,
        )
      : [];

  const legacyImageUrl =
    typeof memory.image_url ===
      "string" &&
    memory.image_url
      .trim()
      .length > 0
      ? memory.image_url.trim()
      : null;

  const normalizedImageUrls =
    existingImageUrls.length >
    0
      ? existingImageUrls
      : legacyImageUrl
        ? [legacyImageUrl]
        : [];

  return {
    ...memory,
    image_urls:
      normalizedImageUrls,
    image_url:
      memory.image_url ??
      null,
  };
};

// =========================================================
// GET MY MEMORIES
// =========================================================

export const getMyMemories =
  async (): Promise<{
    data: UserMemory[];
  }> => {
    const response =
      await userApi.get<UserMemoriesResponse>(
        "/memories",
      );

    const memories =
      Array.isArray(
        response.data
          ?.memories,
      )
        ? response.data
            .memories
        : [];

    return {
      data: memories.map(
        normalizeMemory,
      ),
    };
  };

// =========================================================
// GET MEMORIES FOR ATTRACTION
// =========================================================

export const getMyAttractionMemories =
  async (
    attractionId: string,
  ): Promise<{
    data: UserMemory[];
  }> => {
    if (!attractionId) {
      throw new Error(
        "Attraction ID is required.",
      );
    }

    const response =
      await userApi.get<UserMemoriesResponse>(
        `/memories/attraction/${encodeURIComponent(
          attractionId,
        )}`,
      );

    const memories =
      Array.isArray(
        response.data
          ?.memories,
      )
        ? response.data
            .memories
        : [];

    return {
      data: memories.map(
        normalizeMemory,
      ),
    };
  };

// =========================================================
// CREATE MEMORY
// =========================================================

export const createMyMemory =
  async (
    payload: CreateMemoryPayload,
  ): Promise<{
    data: UserMemory;
    message?: string;
  }> => {
    if (!payload.attraction_id) {
      throw new Error(
        "Attraction ID is required.",
      );
    }

    if (
      !payload.caption.trim()
    ) {
      throw new Error(
        "Memory caption is required.",
      );
    }

    if (
      !Array.isArray(
        payload.image_urls,
      ) ||
      payload.image_urls
        .length === 0
    ) {
      throw new Error(
        "At least one memory image is required.",
      );
    }

    const cleanedImageUrls =
      payload.image_urls
        .filter(
          (
            url,
          ): url is string =>
            typeof url ===
              "string" &&
            url.trim().length >
              0,
        )
        .map((url) =>
          url.trim(),
        );

    if (
      cleanedImageUrls.length ===
      0
    ) {
      throw new Error(
        "At least one valid memory image is required.",
      );
    }

    const userToken =
      getUserToken();

    if (
      !userToken ||
      !userToken.trim()
    ) {
      throw new Error(
        "User authentication is missing. Please log in again before submitting a memory.",
      );
    }

    const requestUrl =
      "https://calbayog-city-tourism.onrender.com/api/memories";

    const response =
      await fetch(
        requestUrl,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${userToken.trim()}`,
            "X-Client-Type":
              "user",
          },
          body: JSON.stringify({
            attraction_id:
              payload.attraction_id,
            caption:
              payload.caption.trim(),
            image_urls:
              cleanedImageUrls,
          }),
        },
      );

    const responseData =
      await response.json();

    if (!response.ok) {
      throw new Error(
        responseData?.message ||
          responseData?.error ||
          `Memory submission failed with status ${response.status}.`,
      );
    }

    return {
      data: normalizeMemory(
        responseData.memory,
      ),
      message:
        responseData.message,
    };
  };

// =========================================================
// UPLOAD MEMORY PHOTOS
// =========================================================

export const uploadMemoryPhotos =
  async (
    files: File[],
    attractionId: string,
  ): Promise<{
    data: {
      urls: string[];
    };
  }> => {
    if (!attractionId) {
      throw new Error(
        "Attraction ID is required.",
      );
    }

    if (
      !Array.isArray(files) ||
      files.length === 0
    ) {
      throw new Error(
        "At least one image is required.",
      );
    }

    if (files.length > 10) {
      throw new Error(
        "You can upload a maximum of 10 pictures.",
      );
    }

    const formData =
      new FormData();

    formData.append(
      "attraction_id",
      attractionId,
    );

    files.forEach(
      (file) => {
        formData.append(
          "photos",
          file,
          file.name,
        );
      },
    );

    const response =
      await userApi.post<{
        urls?: string[];
        message?: string;
      }>(
        "/memories/upload",
        formData,
      );

    const urls =
      Array.isArray(
        response.data?.urls,
      )
        ? response.data.urls.filter(
            (
              url,
            ): url is string =>
              typeof url ===
                "string" &&
              url.trim().length >
                0,
          )
        : [];

    if (
      urls.length !==
      files.length
    ) {
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

// =========================================================
// DELETE MEMORY
// =========================================================

export const deleteMyMemory =
  async (
    memoryId: string,
  ): Promise<{
    message?: string;
  }> => {
    if (!memoryId) {
      throw new Error(
        "Memory ID is required.",
      );
    }

    const response =
      await userApi.delete(
        `/memories/${encodeURIComponent(
          memoryId,
        )}`,
      );

    return {
      message:
        response.data?.message,
    };
  };

// =========================================================
// FEATURED VIDEOS
// =========================================================

export interface FeaturedVideo {
  id: string;
  title: string;
  description?: string | null;
  video_url: string;
  storage_path: string;
  created_at: string;
  updated_at: string;
}

export const getFeaturedVideos =
  async (): Promise<{
    data: FeaturedVideo[];
  }> => {
    /*
     * Featured Videos intentionally bypass the generic
     * 10-minute web cache because this is admin-managed
     * content and must immediately reflect uploads/deletions.
     */
    const response =
      await api.get<{
        data?: FeaturedVideo[];
      }>("/featured-videos");

    return {
      data: Array.isArray(
        response.data?.data,
      )
        ? response.data.data
        : [],
    };
  };

export const uploadFeaturedVideo =
  async (
    file: File,
    title: string,
    description?: string,
  ): Promise<{
    data: FeaturedVideo;
    message?: string;
  }> => {
    if (!file) {
      throw new Error(
        "Featured video file is required.",
      );
    }

    if (!title.trim()) {
      throw new Error(
        "Featured video title is required.",
      );
    }

    const formData =
      new FormData();

    formData.append(
      "video",
      file,
      file.name,
    );

    formData.append(
      "title",
      title.trim(),
    );

    if (
      description &&
      description.trim()
    ) {
      formData.append(
        "description",
        description.trim(),
      );
    }

    const response =
      await api.post<{
        data: FeaturedVideo;
        message?: string;
      }>(
        "/featured-videos",
        formData,
      );

    /*
     * Remove any old Featured Videos cache entries
     * just in case one exists from an older deployment.
     */
    clearCache("/featured-videos");

    return {
      data: response.data.data,
      message:
        response.data.message,
    };
  };

export const deleteFeaturedVideo =
  async (
    id: string,
  ): Promise<{
    message?: string;
  }> => {
    if (!id) {
      throw new Error(
        "Featured video ID is required.",
      );
    }

    const response =
      await api.delete<{
        message?: string;
      }>(
        `/featured-videos/${encodeURIComponent(
          id,
        )}`,
      );

    /*
     * Remove any old Featured Videos cache entries
     * after deletion as well.
     */
    clearCache("/featured-videos");

    return {
      message:
        response.data?.message,
    };
  };

// =========================================================
// DEFAULT EXPORT
// =========================================================

export default api;
