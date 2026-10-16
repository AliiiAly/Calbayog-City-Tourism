
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
type FavoriteToggleResult = {
  favorited: boolean;
  favoriteCount: number;
};

interface FavoritesContextValue {
  favoriteIds: Set<string>;
  favoriteCounts: FavoriteCounts;
  isFavorite: (itemType: FavoriteItemType, itemId: string) => boolean;
  getFavoriteCount: (itemType: FavoriteItemType, itemId: string) => number;
  setFavoriteCount: (
    itemType: FavoriteItemType,
    itemId: string,
    count: number,
  ) => void;
  toggleFavorite: (
    itemType: FavoriteItemType,
    itemId: string,
  ) => Promise<FavoriteToggleResult>;
  refreshFavorites: () => Promise<void>;
  isFavoritePending: (itemType: FavoriteItemType, itemId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const keyOf = (type: FavoriteItemType, id: string) =>
  `${type}:${String(id).trim()}`;

const toCount = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : undefined;
};

const unwrapResponse = (response: any) => response?.data ?? response ?? {};

const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isUserAuthenticated } = useAuth();

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteCounts, setFavoriteCounts] = useState<FavoriteCounts>({});
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());

  // Ref locks take effect synchronously, even during rapid clicks.
  const pendingIds = useRef<Set<string>>(new Set());

  // Prevent an older refresh from overwriting a more recent click.
  const mutationVersion = useRef(0);
  const refreshVersion = useRef(0);
  const authenticatedRef = useRef(isUserAuthenticated);

  authenticatedRef.current = isUserAuthenticated;

  const isFavorite = useCallback(
    (type: FavoriteItemType, id: string) =>
      favoriteIds.has(keyOf(type, id)),
    [favoriteIds],
  );

  const getFavoriteCount = useCallback(
    (type: FavoriteItemType, id: string) =>
      Math.max(0, favoriteCounts[keyOf(type, id)] ?? 0),
    [favoriteCounts],
  );

  const setFavoriteCount = useCallback(
    (type: FavoriteItemType, id: string, count: number) => {
      const cleanId = String(id ?? "").trim();
      if (!cleanId) return;

      const key = keyOf(type, cleanId);
      const cleanCount = toCount(count) ?? 0;

      setFavoriteCounts((previous) =>
        previous[key] === cleanCount
          ? previous
          : { ...previous, [key]: cleanCount },
      );
    },
    [],
  );

  const isFavoritePending = useCallback(
    (type: FavoriteItemType, id: string) =>
      pendingKeys.has(keyOf(type, id)),
    [pendingKeys],
  );

  const refreshFavorites = useCallback(async () => {
    if (!isUserAuthenticated) {
      refreshVersion.current += 1;
      mutationVersion.current += 1;
      setFavoriteIds(new Set());
      return;
    }

    const thisRefresh = ++refreshVersion.current;
    const versionAtStart = mutationVersion.current;

    try {
      const rawResponse = await getFavorites();
      const response = unwrapResponse(rawResponse);

      if (
        thisRefresh !== refreshVersion.current ||
        versionAtStart !== mutationVersion.current ||
        !authenticatedRef.current
      ) {
        return;
      }

      const records = Array.isArray(response?.favorites)
        ? response.favorites
        : Array.isArray(response)
          ? response
          : [];

      const nextIds = new Set<string>();
      const countsFromServer: Record<string, number> = {};

      for (const favorite of records) {
        const type = favorite?.item_type ?? favorite?.itemType;
        const id = favorite?.item_id ?? favorite?.itemId;

        if (
          !type ||
          id === undefined ||
          id === null ||
          !String(id).trim()
        ) {
          continue;
        }

        const key = keyOf(type as FavoriteItemType, String(id));
        nextIds.add(key);

        // Support server responses that include the item's total count.
        const count = toCount(
          favorite?.favoriteCount ??
            favorite?.favorite_count ??
            favorite?.favorites,
        );

        if (count !== undefined) {
          countsFromServer[key] = count;
        }
      }

      setFavoriteIds(nextIds);

      if (Object.keys(countsFromServer).length > 0) {
        setFavoriteCounts((previous) => ({
          ...previous,
          ...countsFromServer,
        }));
      }
    } catch (error) {
      console.error("Failed to load favorites:", error);
      // Keep existing state on a network failure.
    }
  }, [isUserAuthenticated]);

  useEffect(() => {
    void refreshFavorites();
  }, [refreshFavorites]);

  const toggleFavorite = useCallback(
    async (
      type: FavoriteItemType,
      id: string,
    ): Promise<FavoriteToggleResult> => {
      const cleanId = String(id ?? "").trim();

      if (!cleanId) {
        return { favorited: false, favoriteCount: 0 };
      }

      const key = keyOf(type, cleanId);
      const current = favoriteIds.has(key);
      const currentCount = Math.max(0, favoriteCounts[key] ?? 0);

      if (!authenticatedRef.current) {
        window.dispatchEvent(new Event("open-login-modal"));
        return {
          favorited: current,
          favoriteCount: currentCount,
        };
      }

      // Ignore duplicate clicks while this card's request is in progress.
      if (pendingIds.current.has(key)) {
        return {
          favorited: current,
          favoriteCount: currentCount,
        };
      }

      pendingIds.current.add(key);
      mutationVersion.current += 1;

      setPendingKeys((previous) => new Set(previous).add(key));

      const next = !current;
      const optimisticCount = Math.max(
        0,
        currentCount + (next ? 1 : -1),
      );

      // Update the heart and count immediately, before waiting for the API.
      setFavoriteIds((previous) => {
        const updated = new Set(previous);
        if (next) updated.add(key);
        else updated.delete(key);
        return updated;
      });

      setFavoriteCounts((previous) => ({
        ...previous,
        [key]: optimisticCount,
      }));

      try {
        const rawResponse = next
          ? await addFavorite(type, cleanId)
          : await removeFavorite(type, cleanId);

        const response = unwrapResponse(rawResponse);

        // A successful add means favorited unless the server explicitly
        // says otherwise. A successful removal means not favorited.
        const serverFavorited =
          typeof response?.favorited === "boolean"
            ? response.favorited
            : next;

        const favorited = next ? serverFavorited : false;

        const serverCount = toCount(
          response?.favoriteCount ??
            response?.favorite_count ??
            response?.favorites,
        );

        const finalCount = serverCount ?? optimisticCount;

        setFavoriteIds((previous) => {
          const updated = new Set(previous);
          if (favorited) updated.add(key);
          else updated.delete(key);
          return updated;
        });

        setFavoriteCounts((previous) => ({
          ...previous,
          [key]: finalCount,
        }));

        return {
          favorited,
          favoriteCount: finalCount,
        };
      } catch (error: any) {
        console.error(
          "Failed to toggle favorite:",
          error?.response?.data ?? error,
        );

        // Roll back only this card's optimistic update.
        setFavoriteIds((previous) => {
          const updated = new Set(previous);
          if (current) updated.add(key);
          else updated.delete(key);
          return updated;
        });

        setFavoriteCounts((previous) => ({
          ...previous,
          [key]: currentCount,
        }));

        if (error?.response?.status === 401) {
          window.dispatchEvent(new Event("open-login-modal"));
        }

        return {
          favorited: current,
          favoriteCount: currentCount,
        };
      } finally {
        pendingIds.current.delete(key);

        setPendingKeys((previous) => {
          const updated = new Set(previous);
          updated.delete(key);
          return updated;
        });
      }
    },
    [favoriteIds, favoriteCounts],
  );

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
    [
      favoriteIds,
      favoriteCounts,
      isFavorite,
      getFavoriteCount,
      setFavoriteCount,
      toggleFavorite,
      refreshFavorites,
      isFavoritePending,
    ],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export { FavoritesProvider };

export const useFavorites = (): FavoritesContextValue => {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used inside FavoritesProvider");
  }

  return context;
};
