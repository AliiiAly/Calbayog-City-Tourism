# 🌴 Calbayog City Tourism Web App

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)

A full-stack PWA tourism platform for Calbayog City, Western Samar, Philippines — featuring real-time sync, offline support, and mobile app conversion.

## ✨ Features

- 🚀 **Real-time Sync** — Changes in admin panel reflect instantly in the app
- 📱 **Mobile-First** — PWA with offline support + Android app via Capacitor
- 🖼️ **Cloud Storage** — Image uploads to Supabase Storage (no local server needed)
- 🔐 **Secure Admin** — PIN-based admin login with separate domain deployment
- 🗺️ **Interactive Maps** — Leaflet.js integration for location-based exploration
- 📊 **Admin Dashboard** — Full CRUD for destinations, events, accommodations, guides
- 🔔 **Notifications** — Push notifications for new events and guides
- 🌐 **Multi-Language Ready** — Built with i18n support

## 🛠 Tech Stack

### Frontend
- **Framework:** Vite + React (TypeScript)
- **UI Library:** React Bootstrap, Ionic React
- **Maps:** Leaflet.js (react-leaflet)
- **State Management:** React Context API
- **PWA:** Workbox Service Worker

### Backend
- **Database:** Supabase (PostgreSQL + Realtime + Storage)
- **Auth:** Supabase Auth (admin PIN-based)
- **Real-time:** Supabase Realtime subscriptions

### Deployment
- **Admin Panel:** Vercel (separate build with `VITE_BUILD_MODE=admin`)
- **Mobile App:** Capacitor (Android APK)
- **User App:** Web PWA (deployable to any hosting)

## Project Structure
```
calbayog-tourism/
├── client/           — React PWA frontend (with Supabase integration)
├── calbayog-tourism-ionic/ — Capacitor project for Android app
└── server/           — Legacy Express API (optional, for local development)
```

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- Supabase project (free tier works)
- Android Studio (for mobile app build)

### 1️⃣ Supabase Setup

1. **Create a project** at [supabase.com](https://supabase.com)
2. **Run the SQL setup script** in Supabase SQL Editor:
   ```bash
   # Open server/supabase-full-setup.sql
   # Copy and paste the entire script into Supabase SQL Editor
   # Run to create tables, RLS policies, storage bucket, and realtime publications
   ```
3. **Get your credentials** from Project Settings → API
4. **Update Supabase config** in `client/src/services/supabase.ts`:
   ```typescript
   const SUPABASE_URL = 'your_supabase_url';
   const SUPABASE_ANON_KEY = 'your_supabase_anon_key';
   ```

### 2️⃣ Client Setup (Web)

```bash
cd client
npm install
npm run dev
```

Visit `http://localhost:5173` to see the app.

### 3️⃣ Admin Panel Deployment (Vercel)

The admin panel is deployed as a separate build with `VITE_BUILD_MODE=admin`:

```bash
cd client
npm run build
vercel --prod
```

**Set environment variable in Vercel:**
- `VITE_BUILD_MODE=admin` (production)

**Admin URL:** `https://calbayog-admin.vercel.app/admin/login`

### 4️⃣ Mobile App (Capacitor)

```bash
cd client
npm run build
npx cap sync android
npx cap open android  # Opens Android Studio
```

Build and run the APK from Android Studio.

## ⚙️ Environment Variables

Create `client/.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BUILD_MODE=admin  # Only for admin build, omit for user build
```

## 📊 Supabase Tables

| Table | Description |
|-------|-------------|
| `destinations` | Tourist spots and attractions |
| `events` | Events and festivals |
| `accommodations` | Hotels, resorts, inns |
| `guides` | Tour guides |
| `getting_there` | Transportation guide |
| `itinerary_requests` | User itinerary requests |
| `feedback` | User feedback |
| `admins` | Admin accounts (PIN-based login) |
| `users` | User accounts |
| `notifications` | Push notifications |

## 📱 App Modules

1. **Welcome Page** — Hero section with featured destinations
2. **Tourist Destinations** — Browse and filter attractions
3. **Interactive Map** — Location-based exploration
4. **Getting There Guide** — Transportation options
5. **Accommodations** — Hotels, resorts, and lodging
6. **Site Guide Directory** — Tour guide listings
7. **Itinerary Planner** — Plan your trip
8. **Itinerary Request** — Submit custom itinerary requests
9. **Events & Festivals** — Upcoming local events
10. **Feedback System** — User feedback collection
11. **Admin Dashboard** — Full CRUD management (separate deployment)

## 🔐 Admin Login

- **Username:** Admin username from Supabase `admins` table
- **Password:** Mobile PIN from `admins.mobile_pin` field

## 🌐 Deployment

### Admin Panel (Vercel)
- Build mode: `VITE_BUILD_MODE=admin`
- URL: `https://calbayog-admin.vercel.app`
- Only admin routes accessible

### User App (PWA)
- Build mode: Default (no `VITE_BUILD_MODE`)
- Deploy to any static hosting (Vercel, Netlify, GitHub Pages)
- Full user interface with all features

### Mobile App (Capacitor)
- Built from same codebase as user app
- Converts to Android APK
- Uses Supabase for real-time data

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with ❤️ for Calbayog City Tourism
