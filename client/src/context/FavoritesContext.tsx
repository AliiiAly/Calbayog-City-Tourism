import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addFavorite,
  getFavorites,
  removeFavorite,
  FavoriteItemType,
} from "../services/api";
import { useAuth } from "./AuthContext";

type FavoriteCounts = Record<string, number>;
type FavoriteToggleResult = { favorited: boolean; favoriteCount: number };

interface FavoritesContextValue {
  favoriteIds: Set<string>;
  favoriteCounts: FavoriteCounts;
  isFavorite: (itemType: FavoriteItemType, itemId: string) => boolean;
  getFavoriteCount: (itemType: FavoriteItemType, itemId: string) => number;
  setFavoriteCount: (itemType: FavoriteItemType, itemId: string, count: number) => void;
  toggleFavorite: (itemType: FavoriteItemType, itemId: string) => Promise<FavoriteToggleResult>;
  refreshFavorites: () => Promise<void>;
  isFavoritePending: (itemType: FavoriteItemType, itemId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const keyOf = (type: FavoriteItemType, id: string) => `${type}:${String(id).trim()}`;

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isUserAuthenticated } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteCounts, setFavoriteCounts] = useState<FavoriteCounts>({});
  const pendingIds = useRef<Set<string>>(new Set());
  // Prevent an older GET /favorites response from overwriting a newer click.
  const mutationVersion = useRef(0);
  const refreshVersion = useRef(0);

  const refreshFavorites = useCallback(async () => {
    if (!isUserAuthenticated) {
      refreshVersion.current += 1;
      setFavoriteIds(new Set());
      return;
    }

    const thisRefresh = ++refreshVersion.current;
    const versionAtStart = mutationVersion.current;

    try {
      const response = await getFavorites();
      // Ignore stale responses if a newer refresh or favorite click happened.
      if (thisRefresh !== refreshVersion.current || versionAtStart !== mutationVersion.current) return;

      const records = Array.isArray(response?.data?.favorites)
        ? response.data.favorites
        : [];
      const next = new Set<string>();
      records.forEach((favorite: any) => {
        const itemType = favorite?.item_type ?? favorite?.itemType;
        const itemId = favorite?.item_id ?? favorite?.itemId;
        if (itemType && itemId !== undefined && itemId !== null && String(itemId).trim()) {
          next.add(keyOf(itemType as FavoriteItemType, String(itemId)));
        }
      });
      setFavoriteIds(next);
    } catch (error) {
      console.error("Failed to load favorites:", error);
      // Don't clear current state due to a failed or stale refresh.
      if (thisRefresh === refreshVersion.current && versionAtStart === mutationVersion.current) {
        setFavoriteIds(new Set());
      }
    }
  }, [isUserAuthenticated]);

  useEffect(() => {
    void refreshFavorites();
  }, [refreshFavorites]);

  const isFavorite = useCallback(
    (type: FavoriteItemType, id: string) => favoriteIds.has(keyOf(type, id)),
    [favoriteIds],
  );

  const getFavoriteCount = useCallback(
    (type: FavoriteItemType, id: string) =>
      Math.max(0, Number(favoriteCounts[keyOf(type, id)]) || 0),
    [favoriteCounts],
  );

  const setFavoriteCount = useCallback((type: FavoriteItemType, id: string, count: number) => {
    const cleanId = String(id).trim();
    if (!cleanId) return;
    const key = keyOf(type, cleanId);
    const cleanCount = Math.max(0, Number(count) || 0);
    setFavoriteCounts((previous) =>
      previous[key] === cleanCount ? previous : { ...previous, [key]: cleanCount },
    );
  }, []);

  const isFavoritePending = useCallback(
    (type: FavoriteItemType, id: string) => pendingIds.current.has(keyOf(type, id)),
    [],
  );

  const toggleFavorite = useCallback(async (type: FavoriteItemType, id: string): Promise<FavoriteToggleResult> => {
    const cleanId = String(id ?? "").trim();
    if (!cleanId) return { favorited: false, favoriteCount: 0 };

    const key = keyOf(type, cleanId);
    const current = isFavorite(type, cleanId);
    const currentCount = getFavoriteCount(type, cleanId);

    if (!isUserAuthenticated) {
      window.dispatchEvent(new Event("open-login-modal"));
      return { favorited: false, favoriteCount: currentCount };
    }

    if (pendingIds.current.has(key)) {
      return { favorited: current, favoriteCount: currentCount };
    }

    pendingIds.current.add(key);
    mutationVersion.current += 1;
    const next = !current;
    const optimisticCount = Math.max(0, currentCount + (next ? 1 : -1));

    setFavoriteIds((previous) => {
      const copy = new Set(previous);
      if (next) copy.add(key);
      else copy.delete(key);
      return copy;
    });
    setFavoriteCounts((previous) => ({ ...previous, [key]: optimisticCount }));

    try {
      const response = next
        ? await addFavorite(type, cleanId)
        : await removeFavorite(type, cleanId);

      // For a successful DELETE, removal is authoritative even if the API
      // response omits `favorited` or returns an inconsistent legacy shape.
      const favorited = next ? response?.favorited === true : false;
      const favoriteCount = Math.max(0, Number(response?.favoriteCount) || optimisticCount);

      setFavoriteIds((previous) => {
        const copy = new Set(previous);
        if (favorited) copy.add(key);
        else copy.delete(key);
        return copy;
      });
      setFavoriteCounts((previous) => ({ ...previous, [key]: favoriteCount }));
      return { favorited, favoriteCount };
    } catch (error: any) {
      console.error("Failed to toggle favorite:", error?.response?.data ?? error);
      setFavoriteIds((previous) => {
        const copy = new Set(previous);
        if (current) copy.add(key);
        else copy.delete(key);
        return copy;
      });
      setFavoriteCounts((previous) => ({ ...previous, [key]: currentCount }));
      if (error?.response?.status === 401) {
        window.dispatchEvent(new Event("open-login-modal"));
      }
      return { favorited: current, favoriteCount: currentCount };
    } finally {
      pendingIds.current.delete(key);
    }
  }, [getFavoriteCount, isFavorite, isUserAuthenticated]);

  const value = useMemo(
    () => ({
      favoriteIds,
      favoriteCounts,
      isFavorite,
      getFavoriteCount,
      setFavoriteCount,
      toggleFavorite,
      refreshFavorites,
      isFavoritePending,
    }),
    [favoriteIds, favoriteCounts, isFavorite, getFavoriteCount, setFavoriteCount, toggleFavorite, refreshFavorites, isFavoritePending],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = (): FavoritesContextValue => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside FavoritesProvider");
  return context;
};
