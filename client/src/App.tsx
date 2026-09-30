import React, { useEffect, useState } from "react";
import { IonApp } from "@ionic/react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  useHistory,
  useLocation,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { DarkModeProvider } from "./context/DarkModeContext";

import BottomNav from "./components/common/BottomNav";
import OfflineBanner from "./components/common/OfflineBanner";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import UserProtectedRoute from "./components/common/UserProtectedRoute";
import SplashScreen from "./components/common/SplashScreen";
import Sidebar from "./components/common/Sidebar";
import AppHeader from "./components/common/AppHeader";

// Public Pages
import Welcome from "./pages/Welcome";
import Attractions from "./pages/Attractions";
import AttractionDetail from "./pages/AttractionDetail";
import GettingThere from "./pages/GettingThere";
import Accommodations from "./pages/Accommodations";
import AccommodationDetail from "./pages/AccommodationDetail";
import Guides from "./pages/Guides";
import ItineraryPlanner from "./pages/ItineraryPlanner";
import ItineraryRequest from "./pages/ItineraryRequest";
import Events from "./pages/Events";
import Memories from "./pages/Memories";
import SearchResults from "./pages/SearchResults";
import UserLogin from "./pages/UserLogin";
import VerifyEmail from "./components/VerifyEmail";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAttractions from "./pages/admin/AdminAttractions";
import AdminGettingThere from "./pages/admin/AdminGettingThere";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminAccommodations from "./pages/admin/AdminAccommodations";
import AdminGuides from "./pages/admin/AdminGuides";
import AdminRequests from "./pages/admin/AdminRequests";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminManagement from "./pages/admin/AdminManagement";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminFeaturedVideos from "./pages/admin/AdminFeaturedVideos";

/* =========================================================
   HELPERS
========================================================= */

const isAdminRoute = (pathname: string) => {
  return pathname.startsWith("/admin");
};

/* =========================================================
   CONSTANTS
========================================================= */

const SPLASH_KEY = "calbayog_splash_done";

const IS_ADMIN_BUILD =
  import.meta.env.VITE_BUILD_MODE === "admin";

/* =========================================================
   APP
========================================================= */

const App: React.FC = () => {
  const isAdmin =
    IS_ADMIN_BUILD ||
    window.location.pathname.startsWith("/admin");

  const alreadySeen =
    sessionStorage.getItem(SPLASH_KEY) === "1";

  const [splashDone, setSplashDone] = useState(
    isAdmin || alreadySeen
  );

  /* =========================================================
     INITIAL ADMIN BODY CLASS
  ========================================================= */

  useEffect(() => {
    if (isAdminRoute(window.location.pathname)) {
      document.body.classList.add("admin-page");
    }
  }, []);

  /* =========================================================
     SPLASH COMPLETE
  ========================================================= */

  const handleSplashComplete = () => {
    sessionStorage.setItem(SPLASH_KEY, "1");
    setSplashDone(true);
  };

  /* =========================================================
     PUBLIC SPLASH
  ========================================================= */

  if (!splashDone) {
    return (
      <SplashScreen onComplete={handleSplashComplete} />
    );
  }

  /* =========================================================
     APP PROVIDERS
  ========================================================= */

  return (
    <IonApp>
      <AuthProvider>
        <FavoritesProvider>
          <DarkModeProvider>
            <Router>
              <AppContent />
            </Router>
          </DarkModeProvider>
        </FavoritesProvider>
      </AuthProvider>
    </IonApp>
  );
};

/* =========================================================
   APP CONTENT
========================================================= */

const AppContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const history = useHistory();

  /* =========================================================
     ROUTE / BODY CLASS SYNC
  ========================================================= */

  useEffect(() => {
    const updateBodyClass = () => {
      if (isAdminRoute(window.location.pathname)) {
        document.body.classList.add("admin-page");
      } else {
        document.body.classList.remove("admin-page");
      }

      setSidebarOpen(false);
    };

    updateBodyClass();

    const unlisten = history.listen(() => {
      updateBodyClass();
    });

    return () => {
      unlisten();
      document.body.classList.remove("admin-page");
    };
  }, [history]);

  /* =========================================================
     GLOBAL SEARCH
  ========================================================= */

  const handleSearch = (query: string) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    history.push(
      `/search?query=${encodeURIComponent(trimmedQuery)}`
    );
  };

  /* =========================================================
     SHARED PUBLIC HEADER
  ========================================================= */

  const renderPublicPage = (page: React.ReactNode) => (
    <>
      <AppHeader
        onMenuClick={() => setSidebarOpen(true)}
        onSearch={handleSearch}
      />
      {page}
    </>
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <OfflineBanner />

      {/* SIDEBAR */}

      {!IS_ADMIN_BUILD && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN SCROLL CONTAINER */}

      <div
        className="page-scroll-container"
        style={{ paddingBottom: 0 }}
      >
        <Switch>
          {/* =================================================
              ADMIN ROUTES
          ================================================= */}

          <Route
            exact
            path="/admin/login"
            render={() => (
              <Redirect to="/?openLogin=1" />
            )}
          />

          <Route
            exact
            path="/admin"
            render={() => (
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            )}
          />

          <Route
            exact
            path="/admin/attractions"
            render={() => (
              <ProtectedRoute>
                <AdminAttractions />
              </ProtectedRoute>
            )}
          />

          <Route
            exact
            path="/admin/getting-there"
            render={() => (
              <ProtectedRoute>
                <AdminGettingThere />
              </ProtectedRoute>
            )}
          />

          <Route
            exact
            path="/admin/events"
            render={() => (
              <ProtectedRoute>
                <AdminEvents />
              </ProtectedRoute>
            )}
          />

          <Route
            exact
            path="/admin/accommodations"
            render={() => (
              <ProtectedRoute>
                <AdminAccommodations />
              </ProtectedRoute>
            )}
          />

          <Route
            exact
            path="/admin/guides"
            render={() => (
              <ProtectedRoute>
                <AdminGuides />
              </ProtectedRoute>
            )}
          />

          <Route
            exact
            path="/admin/requests"
            render={() => (
              <ProtectedRoute>
                <AdminRequests />
              </ProtectedRoute>
            )}
          />

          <Route
            exact
            path="/admin/users"
            render={() => (
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            )}
          />

          <Route
            exact
            path="/admin/management"
            render={() => (
              <ProtectedRoute>
                <AdminManagement />
              </ProtectedRoute>
            )}
          />

          <Route
            exact
            path="/admin/feedback"
            render={() => (
              <ProtectedRoute>
                <AdminFeedback />
              </ProtectedRoute>
            )}
          />

          <Route
            exact
            path="/admin/featured-videos"
            render={() => (
              <ProtectedRoute>
                <AdminFeaturedVideos />
              </ProtectedRoute>
            )}
          />

          {/* =================================================
              PUBLIC HOME
          ================================================= */}

          {!IS_ADMIN_BUILD && (
            <Route
              exact
              path="/"
              render={() => (
                <WelcomeWithHeader
                  onMenuClick={() =>
                    setSidebarOpen(true)
                  }
                  onSearch={handleSearch}
                />
              )}
            />
          )}

          {/* =================================================
              USER LOGIN
          ================================================= */}

          {!IS_ADMIN_BUILD && (
            <Route
              exact
              path="/login"
              component={UserLogin}
            />
          )}

          {/* =================================================
              ATTRACTIONS — PUBLIC
          ================================================= */}

          {!IS_ADMIN_BUILD && (
            <Route
              exact
              path="/attractions"
              render={() =>
                renderPublicPage(<Attractions />)
              }
            />
          )}

          {/* ATTRACTION DETAILS — PUBLIC */}

          {!IS_ADMIN_BUILD && (
            <Route
              exact
              path="/attractions/:id"
              render={() =>
                renderPublicPage(
                  <AttractionDetail />
                )
              }
            />
          )}

          {/* GETTING THERE — PUBLIC */}

          {!IS_ADMIN_BUILD && (
            <Route
              exact
              path="/getting-there"
              render={() =>
                renderPublicPage(<GettingThere />)
              }
            />
          )}

          {/* ACCOMMODATIONS — PUBLIC */}

          {!IS_ADMIN_BUILD && (
            <Route
              exact
              path="/accommodations"
              render={() =>
                renderPublicPage(
                  <Accommodations />
                )
              }
            />
          )}

          {/* ACCOMMODATION DETAILS — PUBLIC */}

          {!IS_ADMIN_BUILD && (
            <Route
              exact
              path="/accommodations/:id"
              render={() =>
                renderPublicPage(
                  <AccommodationDetail />
                )
              }
            />
          )}

          {/* GUIDES — PUBLIC */}

          {!IS_ADMIN_BUILD && (
            <Route
              exact
              path="/guides"
              render={() =>
                renderPublicPage(<Guides />)
              }
            />
          )}

          {/* =================================================
              ITINERARY — REGULAR USERS ONLY
          ================================================= */}

          {!IS_ADMIN_BUILD && (
            <Route
              exact
              path="/itinerary"
              render={() => (
                <UserProtectedRoute>
                  {renderPublicPage(
                    <ItineraryPlanner />
                  )}
                </UserProtectedRoute>
              )}
            />
          )}

          {/* REQUEST ITINERARY — REGULAR USERS ONLY */}

          {!IS_ADMIN_BUILD && (
            <Route
              exact
              path="/request-itinerary"
              render={() => (
                <UserProtectedRoute>
                  {renderPublicPage(
                    <ItineraryRequest />
                  )}
                </UserProtectedRoute>
              )}
            />
          )}

          {/* EVENTS — PUBLIC */}

          {!IS_ADMIN_BUILD && (
            <Route
              exact
              path="/events"
              render={() =>
                renderPublicPage(<Events />)
              }
            />
          )}

          {/* =================================================
              GLOBAL SEARCH RESULTS — PUBLIC
          ================================================= */}

          {!IS_ADMIN_BUILD && (
            <Route
              exact
              path="/search"
              render={() =>
                renderPublicPage(
                  <SearchResults />
                )
              }
            />
          )}

          {/* MEMORIES — REGULAR USERS ONLY */}

          {!IS_ADMIN_BUILD && (
            <Route
              exact
              path="/memories"
              render={() => (
                <UserProtectedRoute>
                  {renderPublicPage(
                    <Memories />
                  )}
                </UserProtectedRoute>
              )}
            />
          )}

          {/* EMAIL VERIFICATION */}

          {!IS_ADMIN_BUILD && (
            <Route
              exact
              path="/verify-email"
              component={VerifyEmail}
            />
          )}

          {/* FALLBACK */}

          <Route
            path="*"
            render={() => (
              <Redirect
                to={
                  IS_ADMIN_BUILD
                    ? "/admin/login"
                    : "/"
                }
              />
            )}
          />
        </Switch>

        {/* PUBLIC FOOTER */}

        <PublicBottomNav />
      </div>
    </>
  );
};

/* =========================================================
   HOME HEADER
========================================================= */

interface WelcomeWithHeaderProps {
  onMenuClick: () => void;
  onSearch: (query: string) => void;
}

const WelcomeWithHeader: React.FC<
  WelcomeWithHeaderProps
> = ({
  onMenuClick,
  onSearch,
}) => {
  return (
    <>
      <AppHeader
        onMenuClick={onMenuClick}
        onSearch={onSearch}
      />
      <Welcome />
    </>
  );
};

/* =========================================================
   PUBLIC FOOTER
========================================================= */

const PublicBottomNav: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;

  /*
   * Hide footer on:
   * - all admin routes
   * - login
   */

  if (
    isAdminRoute(pathname) ||
    pathname === "/login"
  ) {
    return null;
  }

  return <BottomNav />;
};

export default App;
