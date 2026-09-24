import React, { useState } from 'react';
import { IonApp, setupIonicReact } from '@ionic/react';
import { BrowserRouter as Router, Switch, Route, useHistory } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DarkModeProvider } from './context/DarkModeContext';
import BottomNav from './components/common/BottomNav';
import OfflineBanner from './components/common/OfflineBanner';
import ProtectedRoute from './components/admin/ProtectedRoute';
import UserProtectedRoute from './components/common/UserProtectedRoute';
import SplashScreen from './components/common/SplashScreen';
import Sidebar from './components/common/Sidebar';
import AppHeader from './components/common/AppHeader';

import Welcome from './pages/Welcome';
import Destinations from './pages/Destinations';
import DestinationDetail from './pages/DestinationDetail';
import GettingThere from './pages/GettingThere';
import InteractiveMap from './pages/InteractiveMap';
import MapPage from './pages/MapPage';
import Accommodations from './pages/Accommodations';
import AccommodationDetail from './pages/AccommodationDetail';
import Guides from './pages/Guides';
import ItineraryPlanner from './pages/ItineraryPlanner';
import ItineraryRequest from './pages/ItineraryRequest';
import Events from './pages/Events';
import UserLogin from './pages/UserLogin';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDestinations from './pages/admin/AdminDestinations';
import AdminGettingThere from './pages/admin/AdminGettingThere';
import AdminEvents from './pages/admin/AdminEvents';
import AdminAccommodations from './pages/admin/AdminAccommodations';
import AdminGuides from './pages/admin/AdminGuides';
import AdminRequests from './pages/admin/AdminRequests';
import AdminUsers from './pages/admin/AdminUsers';
import AdminMap from './pages/admin/AdminMap';
import AdminManagement from './pages/admin/AdminManagement';
import AdminFeedback from './pages/admin/AdminFeedback';

import 'leaflet/dist/leaflet.css';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const isAdminRoute = (pathname: string) => pathname.startsWith('/admin');

const SPLASH_KEY = 'calbayog_splash_done';

const App: React.FC = () => {
  const isAdmin = window.location.pathname.startsWith('/admin');
  const alreadySeen = sessionStorage.getItem(SPLASH_KEY) === '1';
  const [splashDone, setSplashDone] = useState(true); // Skip splash for debugging

  const handleSplashComplete = () => {
    sessionStorage.setItem(SPLASH_KEY, '1');
    setSplashDone(true);
  };

  if (!splashDone) {
    return (
      <SplashScreen
        onComplete={handleSplashComplete}
      />
    );
  }

  return (
    <IonApp>
      <AuthProvider>
        <DarkModeProvider>
          <Router>
            <AppContent />
          </Router>
        </DarkModeProvider>
      </AuthProvider>
    </IonApp>
  );
};

const AppContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const history = useHistory();

  const handleSearch = (query: string) => {
    history.push(`/destinations?search=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <OfflineBanner />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Switch>
        {/* Public Routes */}
        <Route exact path="/" render={() => <><AppHeader onMenuClick={() => setSidebarOpen(true)} onSearch={handleSearch} /><Welcome /></>} />
        <Route exact path="/login" component={UserLogin} />

        {/* Protected User Routes */}
        <Route exact path="/destinations" render={() => <UserProtectedRoute><><AppHeader onMenuClick={() => setSidebarOpen(true)} onSearch={handleSearch} /><Destinations /></></UserProtectedRoute>} />
        <Route exact path="/destinations/:id" render={() => <UserProtectedRoute><><AppHeader onMenuClick={() => setSidebarOpen(true)} onSearch={handleSearch} /><DestinationDetail /></></UserProtectedRoute>} />
        <Route exact path="/getting-there" render={() => <UserProtectedRoute><><AppHeader onMenuClick={() => setSidebarOpen(true)} onSearch={handleSearch} /><GettingThere /></></UserProtectedRoute>} />
        <Route exact path="/map" render={() => <UserProtectedRoute><MapPage /></UserProtectedRoute>} />
        <Route exact path="/interactive-map" render={() => <UserProtectedRoute><><AppHeader onMenuClick={() => setSidebarOpen(true)} onSearch={handleSearch} /><InteractiveMap /></></UserProtectedRoute>} />
        <Route exact path="/accommodations" render={() => <UserProtectedRoute><><AppHeader onMenuClick={() => setSidebarOpen(true)} onSearch={handleSearch} /><Accommodations /></></UserProtectedRoute>} />
        <Route exact path="/accommodations/:id" render={() => <UserProtectedRoute><><AppHeader onMenuClick={() => setSidebarOpen(true)} onSearch={handleSearch} /><AccommodationDetail /></></UserProtectedRoute>} />
        <Route exact path="/guides" render={() => <UserProtectedRoute><><AppHeader onMenuClick={() => setSidebarOpen(true)} onSearch={handleSearch} /><Guides /></></UserProtectedRoute>} />
        <Route exact path="/itinerary" render={() => <UserProtectedRoute><><AppHeader onMenuClick={() => setSidebarOpen(true)} onSearch={handleSearch} /><ItineraryPlanner /></></UserProtectedRoute>} />
        <Route exact path="/itinerary-request" render={() => <UserProtectedRoute><><AppHeader onMenuClick={() => setSidebarOpen(true)} onSearch={handleSearch} /><ItineraryRequest /></></UserProtectedRoute>} />
        <Route exact path="/events" render={() => <UserProtectedRoute><><AppHeader onMenuClick={() => setSidebarOpen(true)} onSearch={handleSearch} /><Events /></></UserProtectedRoute>} />

        {/* Admin Routes */}
        <Route exact path="/admin/login" component={AdminLogin} />
        <Route exact path="/admin" render={() => <ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route exact path="/admin/destinations" render={() => <ProtectedRoute><AdminDestinations /></ProtectedRoute>} />
        <Route exact path="/admin/getting-there" render={() => <ProtectedRoute><AdminGettingThere /></ProtectedRoute>} />
        <Route exact path="/admin/events" render={() => <ProtectedRoute><AdminEvents /></ProtectedRoute>} />
        <Route exact path="/admin/accommodations" render={() => <ProtectedRoute><AdminAccommodations /></ProtectedRoute>} />
        <Route exact path="/admin/guides" render={() => <ProtectedRoute><AdminGuides /></ProtectedRoute>} />
        <Route exact path="/admin/requests" render={() => <ProtectedRoute><AdminRequests /></ProtectedRoute>} />
        <Route exact path="/admin/users" render={() => <ProtectedRoute><AdminUsers /></ProtectedRoute>} />
        <Route exact path="/admin/map" render={() => <ProtectedRoute><AdminMap /></ProtectedRoute>} />
        <Route exact path="/admin/management" render={() => <ProtectedRoute><AdminManagement /></ProtectedRoute>} />
        <Route exact path="/admin/feedback" render={() => <ProtectedRoute><AdminFeedback /></ProtectedRoute>} />
      </Switch>
      <BottomNav />
    </>
  );
};

export default App;
