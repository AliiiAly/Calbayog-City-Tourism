const express = require("express");
const axios = require("axios");

const {
  userProtect,
} = require("../middleware/userAuth");

const router = express.Router();

/* =========================================================
   SUPABASE REST HELPERS
========================================================= */

const supabaseHeaders = {
  apikey:
    process.env.SUPABASE_SERVICE_ROLE_KEY,

  Authorization:
    `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
};

const supabaseJsonHeaders = {
  ...supabaseHeaders,
  "Content-Type": "application/json",
};

const getSupabaseRestUrl = (table) => {
  return `${process.env.SUPABASE_URL}/rest/v1/${table}`;
};

/* =========================================================
   ALLOWED FAVORITE TYPES
========================================================= */

const FAVORITE_TYPES = {
  attraction: {
    table: "attractions",
  },

  accommodation: {
    table: "accommodations",
  },

  event: {
    table: "events",
  },
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeItemType = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

const normalizeItemId = (value) => {
  return String(value || "")
    .trim();
};

const isValidItemType = (itemType) => {
  return Boolean(
    FAVORITE_TYPES[itemType]
  );
};

const getTargetTable = (itemType) => {
  return FAVORITE_TYPES[itemType]?.table || null;
};

/* =========================================================
   GET CURRENT ITEM
========================================================= */

const getItem = async (
  itemType,
  itemId
) => {
  const table =
    getTargetTable(itemType);

  if (!table) {
    return null;
  }

  const response =
    await axios.get(
      `${getSupabaseRestUrl(
        table
      )}?id=eq.${encodeURIComponent(
        itemId
      )}&select=id,favorites`,
      {
        headers:
          supabaseHeaders,
      }
    );

  return response.data?.[0] || null;
};

/* =========================================================
   GET FAVORITE RECORD
========================================================= */

const getFavoriteRecord = async ({
  userId,
  itemType,
  itemId,
}) => {
  const response =
    await axios.get(
      `${getSupabaseRestUrl(
        "favorites"
      )}?user_id=eq.${encodeURIComponent(
        userId
      )}&item_type=eq.${encodeURIComponent(
        itemType
      )}&item_id=eq.${encodeURIComponent(
        itemId
      )}&select=id,user_id,item_type,item_id,created_at&limit=1`,
      {
        headers:
          supabaseHeaders,
      }
    );

  return response.data?.[0] || null;
};

/* =========================================================
   COUNT USER FAVORITES FOR AN ITEM
========================================================= */

const countFavorites = async ({
  itemType,
  itemId,
}) => {
  const response =
    await axios.get(
      `${getSupabaseRestUrl(
        "favorites"
      )}?item_type=eq.${encodeURIComponent(
        itemType
      )}&item_id=eq.${encodeURIComponent(
        itemId
      )}&select=id`,
      {
        headers:
          supabaseHeaders,
      }
    );

  return Array.isArray(
    response.data
  )
    ? response.data.length
    : 0;
};

/* =========================================================
   UPDATE FAVORITES COUNT ON CONTENT TABLE
========================================================= */

const updateFavoriteCount = async ({
  itemType,
  itemId,
  count,
}) => {
  const table =
    getTargetTable(itemType);

  if (!table) {
    return;
  }

  await axios.patch(
    `${getSupabaseRestUrl(
      table
    )}?id=eq.${encodeURIComponent(
      itemId
    )}`,
    {
      favorites: Math.max(
        0,
        Number(count) || 0
      ),
      updated_at:
        new Date().toISOString(),
    },
    {
      headers:
        supabaseJsonHeaders,
    }
  );
};

/* =========================================================
   GET USER FAVORITES
========================================================= */

/*
  GET /api/favorites

  Authentication:
    Logged-in tourism user only.

  Response:

  {
    favorites: [
      {
        id,
        item_type,
        item_id,
        created_at
      }
    ]
  }

  No user list is exposed to the public.
  The authenticated user's own favorites are returned.
*/

router.get(
  "/",
  userProtect,
  async (req, res) => {
    try {
      const userId =
        req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message:
            "Unauthorized - user identity is missing.",
        });
      }

      const response =
        await axios.get(
          `${getSupabaseRestUrl(
            "favorites"
          )}?user_id=eq.${encodeURIComponent(
            userId
          )}&select=id,item_type,item_id,created_at&order=created_at.desc`,
          {
            headers:
              supabaseHeaders,
          }
        );

      return res.json({
        favorites:
          Array.isArray(
            response.data
          )
            ? response.data
            : [],
      });
    } catch (error) {
      console.error(
        "Get favorites error:",
        error.response?.data ||
          error
      );

      return res.status(500).json({
        message:
          error.response?.data
            ?.message ||
          error.message ||
          "Failed to get favorites.",
      });
    }
  }
);

/* =========================================================
   ADD FAVORITE
========================================================= */

/*
  POST /api/favorites

  Body:

  {
    itemType: "attraction",
    itemId: "uuid"
  }

  or:

  {
    itemType: "accommodation",
    itemId: "uuid"
  }

  or:

  {
    itemType: "event",
    itemId: "uuid"
  }

  IMPORTANT:
  user_id is NEVER accepted from the frontend.
  It comes from req.user.id.
*/

router.post(
  "/",
  userProtect,
  async (req, res) => {
    try {
      const userId =
        req.user?.id;

      const itemType =
        normalizeItemType(
          req.body?.itemType ||
            req.body?.item_type
        );

      const itemId =
        normalizeItemId(
          req.body?.itemId ||
            req.body?.item_id
        );

      /* -----------------------------------------------------
         VALIDATE USER
      ----------------------------------------------------- */

      if (!userId) {
        return res.status(401).json({
          message:
            "Unauthorized - user identity is missing.",
        });
      }

      /* -----------------------------------------------------
         VALIDATE ITEM TYPE
      ----------------------------------------------------- */

      if (
        !isValidItemType(
          itemType
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid favorite item type. Allowed values are attraction, accommodation, and event.",
        });
      }

      /* -----------------------------------------------------
         VALIDATE ITEM ID
      ----------------------------------------------------- */

      if (!itemId) {
        return res.status(400).json({
          message:
            "Favorite item ID is required.",
        });
      }

      /* -----------------------------------------------------
         MAKE SURE ITEM EXISTS
      ----------------------------------------------------- */

      const item =
        await getItem(
          itemType,
          itemId
        );

      if (!item) {
        return res.status(404).json({
          message:
            "The item you are trying to favorite could not be found.",
        });
      }

      /* -----------------------------------------------------
         CHECK EXISTING FAVORITE
      ----------------------------------------------------- */

      const existingFavorite =
        await getFavoriteRecord({
          userId,
          itemType,
          itemId,
        });

      /*
        If the user already hearted this item,
        don't create another record and don't
        increase the count again.

        We simply return the current state.
      */

      if (existingFavorite) {
        const favoriteCount =
          await countFavorites({
            itemType,
            itemId,
          });

        /*
          Synchronize the count column in case it
          became stale for any reason.
        */
        await updateFavoriteCount({
          itemType,
          itemId,
          count: favoriteCount,
        });

        return res.json({
          message:
            "This item is already in your favorites.",
          favorited: true,
          favoriteCount,
          favorite: {
            id:
              existingFavorite.id,
            itemType,
            itemId,
            createdAt:
              existingFavorite.created_at,
          },
        });
      }

      /* -----------------------------------------------------
         CREATE FAVORITE
      ----------------------------------------------------- */

      let insertResponse;

      try {
        insertResponse =
          await axios.post(
            getSupabaseRestUrl(
              "favorites"
            ),
            {
              user_id:
                userId,
              item_type:
                itemType,
              item_id:
                itemId,
            },
            {
              headers: {
                ...supabaseJsonHeaders,

                Prefer:
                  "return=representation",
              },
            }
          );
      } catch (insertError) {
        /*
          A second simultaneous request from the same
          user may hit the UNIQUE constraint.

          In that case, treat the item as already
          favorited instead of returning a confusing
          server error.
        */

        const errorDetails =
          insertError.response
            ?.data;

        const errorText =
          typeof errorDetails ===
          "object"
            ? JSON.stringify(
                errorDetails
              )
            : String(
                errorDetails ||
                  insertError.message ||
                  ""
              );

        if (
          /duplicate|unique|23505/i.test(
            errorText
          )
        ) {
          const existingAfterConflict =
            await getFavoriteRecord({
              userId,
              itemType,
              itemId,
            });

          const favoriteCount =
            await countFavorites({
              itemType,
              itemId,
            });

          await updateFavoriteCount({
            itemType,
            itemId,
            count:
              favoriteCount,
          });

          return res.json({
            message:
              "This item is already in your favorites.",
            favorited: true,
            favoriteCount,
            favorite:
              existingAfterConflict
                ? {
                    id:
                      existingAfterConflict.id,
                    itemType,
                    itemId,
                    createdAt:
                      existingAfterConflict.created_at,
                  }
                : null,
          });
        }

        throw insertError;
      }

      const favorite =
        insertResponse.data?.[0];

      /* -----------------------------------------------------
         RECOUNT FAVORITES
      ----------------------------------------------------- */

      const favoriteCount =
        await countFavorites({
          itemType,
          itemId,
        });

      /* -----------------------------------------------------
         UPDATE CONTENT COUNT
      ----------------------------------------------------- */

      await updateFavoriteCount({
        itemType,
        itemId,
        count: favoriteCount,
      });

      /* -----------------------------------------------------
         RESPONSE
      ----------------------------------------------------- */

      return res.status(201).json({
        message:
          "Added to favorites.",
        favorited: true,
        favoriteCount,
        favorite: favorite
          ? {
              id: favorite.id,
              itemType,
              itemId,
              createdAt:
                favorite.created_at,
            }
          : null,
      });
    } catch (error) {
      console.error(
        "Add favorite error:",
        error.response?.data ||
          error
      );

      return res.status(500).json({
        message:
          error.response?.data
            ?.message ||
          error.message ||
          "Failed to add favorite.",
      });
    }
  }
);

/* =========================================================
   REMOVE FAVORITE
========================================================= */

/*
  DELETE /api/favorites/:itemType/:itemId

  Example:

  DELETE /api/favorites/attraction/UUID
*/

router.delete(
  "/:itemType/:itemId",
  userProtect,
  async (req, res) => {
    try {
      const userId =
        req.user?.id;

      const itemType =
        normalizeItemType(
          req.params.itemType
        );

      const itemId =
        normalizeItemId(
          req.params.itemId
        );

      /* -----------------------------------------------------
         VALIDATE USER
      ----------------------------------------------------- */

      if (!userId) {
        return res.status(401).json({
          message:
            "Unauthorized - user identity is missing.",
        });
      }

      /* -----------------------------------------------------
         VALIDATE ITEM TYPE
      ----------------------------------------------------- */

      if (
        !isValidItemType(
          itemType
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid favorite item type. Allowed values are attraction, accommodation, and event.",
        });
      }

      /* -----------------------------------------------------
         VALIDATE ITEM ID
      ----------------------------------------------------- */

      if (!itemId) {
        return res.status(400).json({
          message:
            "Favorite item ID is required.",
        });
      }

      /* -----------------------------------------------------
         MAKE SURE ITEM EXISTS
      ----------------------------------------------------- */

      const item =
        await getItem(
          itemType,
          itemId
        );

      if (!item) {
        return res.status(404).json({
          message:
            "The item you are trying to unfavorite could not be found.",
        });
      }

      /* -----------------------------------------------------
         DELETE USER'S FAVORITE
      ----------------------------------------------------- */

      const deleteResponse =
        await axios.delete(
          `${getSupabaseRestUrl(
            "favorites"
          )}?user_id=eq.${encodeURIComponent(
            userId
          )}&item_type=eq.${encodeURIComponent(
            itemType
          )}&item_id=eq.${encodeURIComponent(
            itemId
          )}`,
          {
            headers:
              supabaseHeaders,
          }
        );

      /*
        We don't need the deleted row itself.
        The DELETE operation is intentionally
        idempotent: if there wasn't a favorite,
        the end result is still "not favorited".
      */

      void deleteResponse;

      /* -----------------------------------------------------
         RECOUNT FAVORITES
      ----------------------------------------------------- */

      const favoriteCount =
        await countFavorites({
          itemType,
          itemId,
        });

      /* -----------------------------------------------------
         UPDATE CONTENT COUNT
      ----------------------------------------------------- */

      await updateFavoriteCount({
        itemType,
        itemId,
        count: favoriteCount,
      });

      /* -----------------------------------------------------
         RESPONSE
      ----------------------------------------------------- */

      return res.json({
        message:
          "Removed from favorites.",
        favorited: false,
        favoriteCount,
      });
    } catch (error) {
      console.error(
        "Remove favorite error:",
        error.response?.data ||
          error
      );

      return res.status(500).json({
        message:
          error.response?.data
            ?.message ||
          error.message ||
          "Failed to remove favorite.",
      });
    }
  }
);

/* =========================================================
   CHECK ONE FAVORITE
========================================================= */

/*
  GET /api/favorites/:itemType/:itemId

  This is useful when a page wants to check only
  one item instead of loading all user favorites.

  Response:

  {
    favorited: true,
    favoriteCount: 27
  }
*/

router.get(
  "/:itemType/:itemId",
  userProtect,
  async (req, res) => {
    try {
      const userId =
        req.user?.id;

      const itemType =
        normalizeItemType(
          req.params.itemType
        );

      const itemId =
        normalizeItemId(
          req.params.itemId
        );

      /* -----------------------------------------------------
         VALIDATE USER
      ----------------------------------------------------- */

      if (!userId) {
        return res.status(401).json({
          message:
            "Unauthorized - user identity is missing.",
        });
      }

      /* -----------------------------------------------------
         VALIDATE ITEM TYPE
      ----------------------------------------------------- */

      if (
        !isValidItemType(
          itemType
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid favorite item type.",
        });
      }

      /* -----------------------------------------------------
         VALIDATE ITEM ID
      ----------------------------------------------------- */

      if (!itemId) {
        return res.status(400).json({
          message:
            "Favorite item ID is required.",
        });
      }

      /* -----------------------------------------------------
         MAKE SURE ITEM EXISTS
      ----------------------------------------------------- */

      const item =
        await getItem(
          itemType,
          itemId
        );

      if (!item) {
        return res.status(404).json({
          message:
            "The requested item could not be found.",
        });
      }

      /* -----------------------------------------------------
         CHECK FAVORITE
      ----------------------------------------------------- */

      const favorite =
        await getFavoriteRecord({
          userId,
          itemType,
          itemId,
        });

      /* -----------------------------------------------------
         COUNT
      ----------------------------------------------------- */

      const favoriteCount =
        await countFavorites({
          itemType,
          itemId,
        });

      /*
        Keep the cached count synchronized.
      */
      await updateFavoriteCount({
        itemType,
        itemId,
        count: favoriteCount,
      });

      /* -----------------------------------------------------
         RESPONSE
      ----------------------------------------------------- */

      return res.json({
        favorited:
          Boolean(favorite),
        favoriteCount,
      });
    } catch (error) {
      console.error(
        "Check favorite error:",
        error.response?.data ||
          error
      );

      return res.status(500).json({
        message:
          error.response?.data
            ?.message ||
          error.message ||
          "Failed to check favorite.",
      });
    }
  }
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = router;