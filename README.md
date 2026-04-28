# GreenAtlas Ifrane

**Environmental monitoring platform for Ifrane Province, Morocco.**  
Citizens report wildfires, illegal logging, water leaks, and pollution. Agents and admins verify and resolve them. Live weather, satellite fire data, water levels, and forest health are all tracked in one dashboard.

---

## Table of Contents

1. [What This App Does](#what-this-app-does)
2. [How the App Is Structured](#how-the-app-is-structured)
3. [The Full Logic Flow — Step by Step](#the-full-logic-flow--step-by-step)
   - [Starting the App](#1-starting-the-app)
   - [Authentication Flow](#2-authentication-flow)
   - [Submitting a Report](#3-submitting-a-report)
   - [How the Map Works](#4-how-the-map-works)
   - [Weather and Fire Risk](#5-weather-and-fire-risk)
   - [Water and Forest Monitoring](#6-water-and-forest-monitoring)
   - [Notifications](#7-notifications)
   - [Gamification — Green Score and Badges](#8-gamification--green-score-and-badges)
   - [Role-Based Access](#9-role-based-access)
4. [Tech Stack — Every Tool Explained](#tech-stack--every-tool-explained)
   - [Frontend](#frontend)
   - [Backend](#backend)
   - [External APIs](#external-apis)
5. [Project File Structure](#project-file-structure)
6. [Quick Start](#quick-start)
7. [Demo Accounts](#demo-accounts)
8. [API Reference](#api-reference)
9. [Production Build](#production-build)

---

## What This App Does

GreenAtlas gives three types of users a way to interact with environmental data for the Ifrane region:

- **Citizens** can submit incident reports (wildfire spotted, illegal logging, water leak, pollution) with a photo and GPS coordinates. They earn points and badges for their contributions.
- **Agents** (park rangers, municipal staff) can verify or resolve reports, add water and forest measurements, and see all submitted reports.
- **Admins** manage users, see analytics charts across all data, and have full control over the platform.

On top of citizen reports, the platform also pulls in:
- Live weather data (temperature, humidity, wind, rainfall) from **OpenWeatherMap**
- Satellite wildfire hotspot data from **NASA FIRMS**
- Manual water level and forest health measurements entered by agents

All of this is combined into a dashboard with charts, an interactive map, and a real-time notification system.

---

## How the App Is Structured

The project is split into two completely separate applications that run at the same time and talk to each other over HTTP:

```
GreenAtlas/
├── server/    ← Node.js API server (handles data, auth, business logic)
│   └── src/
│       ├── config/        Database connection setup
│       ├── controllers/   Functions that handle each API request
│       ├── middleware/     Auth checks, file uploads, validation, error handling
│       ├── models/        MongoDB schemas (what data looks like in the database)
│       ├── routes/        URL definitions — which URL calls which controller
│       ├── services/      External API integrations (weather, fire satellite)
│       ├── seeds/         Script to populate demo data
│       └── utils/         Shared helpers (scoring, badges)
│
└── client/    ← React app (what users see in the browser)
    └── src/
        ├── pages/         Full-page views (Dashboard, Map, Login, etc.)
        ├── components/    Reusable UI pieces (Navbar, Sidebar, charts, map markers)
        ├── context/       Global state shared across the whole app (auth, notifications, theme)
        ├── services/      Functions that call the backend API
        ├── i18n/          Translation files (English, Arabic, Darija)
        └── types/         TypeScript type definitions
```

The frontend runs on `http://localhost:5173` (Vite dev server).  
The backend runs on `http://localhost:5001` (Express server).  
Vite is configured to proxy any request starting with `/api` from the frontend to the backend, so the browser never has to know about two different ports.

---

## The Full Logic Flow — Step by Step

### 1. Starting the App

When you run `npm run dev` in the server folder, Node.js executes `server.ts`. That file does the following in order:

1. Loads environment variables from the `.env` file (API keys, database URL, JWT secret) into `process.env` using **dotenv**.
2. Creates an Express app instance.
3. Calls `connectDB()` which uses **Mongoose** to open a persistent connection to MongoDB.
4. Attaches security middleware: **Helmet** (sets HTTP security headers), **CORS** (allows the frontend origin to make requests), **Morgan** (logs every request to the terminal).
5. Attaches body parsers so JSON request bodies and file uploads are parsed correctly.
6. Mounts every route group at its URL prefix (`/api/auth`, `/api/reports`, etc.).
7. Attaches the global error handler as the last middleware.
8. Starts listening on port 5001.

When you run `npm run dev` in the client folder, **Vite** starts a local development server. It reads all the React/TypeScript files, compiles them in memory, and serves the app. Any code change is reflected in the browser instantly via hot module replacement — you never need to refresh.

---

### 2. Authentication Flow

This is the most important flow to understand because almost every other feature depends on it.

**On the backend (server):**

Passwords are never stored in plain text. When a user registers, the `User` model has a Mongoose `pre('save')` hook — a function that automatically runs before any user document is saved to the database. That hook calls **bcryptjs** to hash the password with a cost factor of 12 (meaning the hashing algorithm runs 2^12 = 4096 iterations, making brute-force attacks computationally expensive). The original password is discarded; only the hash is stored.

When a user logs in, `bcrypt.compare()` hashes the typed password the same way and checks if the result matches the stored hash. If yes, the server creates a **JWT** (JSON Web Token) using `jwt.sign()`. The token contains:
- `id`: the user's MongoDB ObjectId
- `role`: `citizen`, `agent`, or `admin`

This token is signed with a secret key from `.env`. Anyone can decode the token to read its contents, but only the server can verify that the signature is genuine (because only the server knows the secret). The token expires after 7 days.

**On the frontend (client):**

After login succeeds, the token and user object are stored in `localStorage` under the keys `ga_token` and `ga_user`. This is handled by `AuthContext.tsx`, a React Context that wraps the entire app and makes the current user available to any component that needs it.

Every single HTTP request made from the frontend goes through a central Axios instance defined in `services/api.ts`. That instance has an **interceptor** — a function that runs automatically before every request is sent. The interceptor reads `ga_token` from `localStorage` and attaches it as an `Authorization: Bearer <token>` header. This means you never have to manually attach auth headers in individual service files.

The same Axios instance has a **response interceptor** — a function that runs automatically after every response comes back. If the server returns a `401 Unauthorized` (token expired or invalid), this interceptor clears localStorage and redirects the user to `/login` automatically.

On the backend, every protected route uses the `protect` middleware from `middleware/auth.ts`. That middleware reads the `Authorization` header, calls `jwt.verify()` to validate the signature and check expiry, fetches the full user document from MongoDB, and attaches it to `req.user` so the route handler can access it.

**Staying logged in on page refresh:**

When the React app first loads, `AuthContext` runs a `useEffect` on mount that checks `localStorage` for a stored token and user. If they exist, it restores them to state — so the user stays logged in across page refreshes without needing to contact the server.

**Route protection in the browser:**

`App.tsx` defines an `AppShell` component that wraps all authenticated pages. If `isAuthenticated` is false (no valid token in state), it immediately redirects to `/login` using React Router's `<Navigate>`. For role-specific pages like `/admin`, a `RoleGuard` component checks the current user's role and redirects if they don't have permission.

---

### 3. Submitting a Report

This flow involves the most moving parts — file upload, database write, point scoring, badge recalculation, and notification creation all happen in one request.

1. The user fills out the `ReportForm` page and optionally attaches a photo.
2. The frontend constructs a `FormData` object (not JSON — because it includes a file) and sends `POST /api/reports`.
3. On the server, the request first hits the `upload` middleware (powered by **Multer**), which reads the attached file, validates it, and saves it to the `server/uploads/` folder. Multer puts the saved file path on `req.file`.
4. The `protect` middleware runs next, validates the JWT, and attaches the user to `req.request`.
5. The `reportController.createReport` function runs:
   - Reads the form fields and file path from the request.
   - Creates a new `Report` document in MongoDB with `status: 'pending'` and a reference to the submitting user's ID.
   - Calls `awardPointsAndRefreshBadges()` from `utils/scoring.ts`.
6. **Scoring:** `awardPointsAndRefreshBadges()` increments the user's `greenScore` in MongoDB using `$inc` (a MongoDB atomic increment — no read-then-write race condition). Points vary by category: wildfire = 30, illegal logging = 20, water leak = 15, pollution = 10.
7. **Badge recalculation:** `refreshBadges()` counts all of the user's reports by category and status, then computes the full set of earned badges from scratch and writes them back. For example, reporting 3 wildfires earns the `fire_watcher` badge. Having a green score over 100 earns `top_ranger`.
8. **Notifications:** After the report is saved, a `Notification` document is created for every user with the `agent` or `admin` role, alerting them that a new report was submitted.
9. The server responds with the created report object. The frontend shows a success toast via **react-hot-toast** and navigates to the dashboard.

When an agent changes a report's status to `verified` or `resolved`, an additional points bonus (20 or 10) is awarded to the original reporter, and another notification is created for them.

---

### 4. How the Map Works

The map is built with **Leaflet** (a standalone JavaScript mapping library) wrapped in **React Leaflet** (React components that manage Leaflet's lifecycle).

1. When `MapPage` mounts, it calls `reportService.getReports()` and `weatherService.getEnvironmentData()` in parallel.
2. `getReports()` fetches all reports from `GET /api/reports`. Each report has a `latitude` and `longitude` stored in MongoDB.
3. `getEnvironmentData()` fetches `GET /api/environment`, which calls `firmsService.ts` on the server. That service either calls the NASA FIRMS API (satellite hotspot data) or falls back to realistic mock data if the key isn't set.
4. React Leaflet renders a base tile layer (OpenStreetMap tiles — free, no key required) and then maps each report to a `<Marker>` component positioned at the report's GPS coordinates. Each marker is color-coded by category.
5. Fire hotspots from NASA FIRMS are rendered as a separate layer with a different marker style.
6. The `FilterBar` component lets users toggle which categories and statuses are visible. This filtering happens entirely in the browser — all data is already loaded, so toggling a filter is instant.
7. Clicking a marker opens a popup showing the report title, category, status, and submission date.

---

### 5. Weather and Fire Risk

Weather data flows from OpenWeatherMap through the server to the frontend — it is never called directly from the browser. This keeps the API key secret.

1. The frontend calls `GET /api/weather`.
2. `weatherController.ts` calls `weatherService.fetchWeatherData()`.
3. `weatherService.ts` checks an **in-memory cache** first. If a valid cached result exists (less than 10 minutes old), it returns that immediately without hitting OpenWeatherMap. This prevents rate limiting and makes the dashboard load faster.
4. If the cache is stale or empty, it calls the OpenWeatherMap API with Ifrane's latitude/longitude (hardcoded to `33.5228, -5.1071`).
5. The raw OpenWeatherMap response is transformed: wind speed is converted from m/s to km/h, rainfall is extracted from either the `1h` or `3h` field if present.
6. The **Fire Risk Score** is computed from three weather factors:
   - **Temperature contribution:** `max(0, (temp - 10) × 1.5)` — risk only starts above 10°C
   - **Humidity contribution:** `max(0, (60 - humidity) × 0.8)` — dry air (below 60% humidity) increases risk
   - **Wind contribution:** `windSpeed × 1.2` — wind spreads fire
   - All three are summed and clamped to 100. The result maps to a level: Low / Medium / High / Very High / Extreme.
7. If the API key is missing or the API call fails, `generateMockWeather()` returns realistic randomized data so the dashboard still works.

---

### 6. Water and Forest Monitoring

These two features follow the same pattern.

- **Agents** add measurements via `POST /api/water` or `POST /api/forest`. Each measurement is a document in MongoDB with a value, location, timestamp, and optional notes.
- **Anyone** can read the data via `GET /api/water` or `GET /api/forest`.
- The controllers aggregate the data (calculate averages, find min/max, compute trend direction) before sending it to the frontend.
- The frontend uses **Chart.js** (via **React Chartjs 2**) to render line and bar charts of the historical data. Chart.js is configured with custom colors matching the green/blue theme of the app.
- The `GET /api/forest/live` endpoint enriches forest data with the current fire risk score from the weather service, so the Forest Monitoring page can show both static measurements and a live risk indicator side by side.

---

### 7. Notifications

The notification system uses a simple polling approach — there is no WebSocket or server-sent event connection.

1. `NotificationContext.tsx` wraps the authenticated part of the app. On mount, it calls `GET /api/notifications` to fetch the current user's unread notifications.
2. It also sets up a `setInterval` that polls for new notifications every 30 seconds.
3. The `NotificationBell` component in the Navbar reads from `NotificationContext` and shows an unread count badge.
4. When a notification is read or "mark all as read" is clicked, `PUT /api/notifications/read-all` is called, and the context state is updated locally so the badge disappears immediately without waiting for the next poll.
5. On the backend, notifications are created by controllers (report creation, status change) and stored as `Notification` documents in MongoDB, each linked to a recipient user ID.

---

### 8. Gamification — Green Score and Badges

Every citizen accumulates a `greenScore` over time, visible on their profile and on the Leaderboard page.

**How points are earned:**
| Action | Points |
|---|---|
| Submit any report | Varies by category |
| Wildfire report | +30 |
| Illegal logging report | +20 |
| Water leak report | +15 |
| Pollution report | +10 |
| Report gets verified | +20 bonus |
| Report gets resolved | +10 bonus |

**How badges are earned:**
| Badge | Condition |
|---|---|
| `first_report` | Submit your first report |
| `fire_watcher` | Submit 3+ wildfire reports |
| `forest_guardian` | Submit 3+ illegal logging reports |
| `water_sentinel` | Submit 3+ water leak reports |
| `eco_warrior` | Submit 10+ reports total |
| `verified_hero` | Have 5+ reports verified or resolved |
| `top_ranger` | Reach a green score of 100+ |

Badge state is always computed fresh from the database (never incrementally updated), so it's always consistent even if data is corrected.

---

### 9. Role-Based Access

There are three roles: `citizen`, `agent`, `admin`. Access is enforced at two layers:

**Backend (API layer):**  
The `authorize(...roles)` middleware in `middleware/auth.ts` is attached to any route that requires a specific role. For example, `DELETE /api/reports/:id` requires `agent` or `admin`. If a citizen somehow calls that endpoint directly, they get a `403 Forbidden` response.

**Frontend (UI layer):**  
The `RoleGuard` component in `App.tsx` checks `user.role` and redirects to the homepage if the current user doesn't have permission for that page. The Sidebar also conditionally renders navigation links based on role — citizens don't see the Admin Dashboard link, for example.

Both layers are necessary. The UI layer is convenience (don't show links that won't work). The API layer is the actual security boundary.

---

## Tech Stack — Every Tool Explained

### Frontend

**React 18**  
The UI framework. The core idea is that your UI is a function of your data — you describe what the page should look like for a given state, and React figures out what changed and updates only that part of the DOM. This makes it much easier to build complex, interactive interfaces compared to manually manipulating HTML.

**TypeScript**  
JavaScript with a type system. When you write `user.nmae` instead of `user.name`, TypeScript catches it at compile time before it ever runs. For a project with multiple data shapes (User, Report, WaterData, ForestData, etc.) and many files calling each other, TypeScript prevents an entire class of bugs and makes refactoring much safer.

**Vite**  
The build tool and development server. Traditional bundlers like Webpack were slow because they compiled the entire app on every change. Vite serves files as native ES modules during development (the browser imports them directly) and only transforms a file when it's actually requested. This makes startup and hot reload nearly instant.

**Tailwind CSS**  
A utility-first CSS framework. Rather than writing class names like `.card` and defining their styles in a separate CSS file, you write styles directly on the element: `className="bg-white rounded-xl shadow-md p-6 dark:bg-slate-800"`. Every class does one thing. This eliminates the problem of CSS growing uncontrollably and styles conflicting across files. Dark mode is handled by a `dark:` prefix — add `dark:bg-slate-800` next to `bg-white` and Tailwind applies the dark version automatically when the `dark` class is on the `<html>` element.

**React Router v6**  
Client-side navigation. In a traditional website, clicking a link loads a new HTML page from the server. React Router intercepts navigation, swaps out the component for the new route, and updates the browser URL — all without a page reload. This makes the app feel instant.

**Axios**  
An HTTP client for making API calls. The important thing in this project is the central `api.ts` instance with interceptors. Every request automatically gets the JWT header attached (request interceptor), and every 401 response automatically logs the user out (response interceptor). Without this, you'd have to write that logic in every service file.

**Leaflet + React Leaflet**  
Leaflet is the most widely-used open-source interactive map library. It renders map tiles, handles pan/zoom, and manages markers. React Leaflet wraps Leaflet's JavaScript API in React components (`<MapContainer>`, `<TileLayer>`, `<Marker>`, `<Popup>`) so it integrates naturally with React's component model and state.

**Chart.js + React Chartjs 2**  
Chart.js draws charts on an HTML `<canvas>` element. It handles all the math (scales, axes, gridlines, tooltips) and lets you focus on the data. React Chartjs 2 wraps Chart.js so you can use it as React components (`<Line>`, `<Bar>`, etc.) and pass data as props.

**Framer Motion**  
An animation library built for React. It handles the login card entrance animation, form field stagger (fields appear one by one with a delay), page transitions (each route change fades and slides), and button physics. The key concept is `variants` — you define named animation states (`initial`, `animate`, `exit`) and Framer Motion interpolates between them.

**tsparticles (@tsparticles/react + @tsparticles/slim)**  
The animated particle network on the login background. You configure what particles look like (size, color, opacity), how they move (direction, speed), and how they interact (linked by lines when close enough). The `slim` bundle is a lighter version that excludes particle shapes the project doesn't use.

**react-hot-toast**  
Shows non-blocking notification toasts (the small pop-ups in the corner). Used for success/error feedback after API calls. The `Toaster` component is placed once in `App.tsx` and toasts are triggered anywhere in the app with `toast.success()` or `toast.error()`.

**Lucide React**  
A library of clean, consistent SVG icons as React components. Used for the sun/moon icon in the theme toggle, the globe icon in the language switcher, the leaf on the login page, and various UI icons throughout.

**i18next + react-i18next**  
The internationalization system. All user-visible text is stored as translation keys (`auth.login`, `nav.dashboard`, etc.) in three locale files: `en.ts` (English), `ar.ts` (Arabic), `darija.ts` (Moroccan Darija). `react-i18next` provides a `useTranslation` hook — you write `t('auth.login')` instead of `"Login"` and the library swaps in the right string based on the selected language. When Arabic is selected, the `dir="rtl"` attribute is added to the document and the layout mirrors automatically.

---

### Backend

**Node.js**  
A JavaScript runtime that runs outside the browser. Normally JavaScript only runs in a browser — Node.js lets you run it on a server. It uses a single-threaded event loop model: instead of creating a new thread for each request (expensive), it handles many requests concurrently by delegating I/O operations (database queries, API calls) and moving on to the next request while waiting for the result.

**Express**  
A minimal web framework for Node.js. It handles the low-level HTTP plumbing (parsing request bodies, setting response headers) and gives you a clean way to define routes and middleware. Middleware is a chain of functions — each one does something to the request or response and either passes it to the next function or ends the chain. In this project: Helmet → CORS → Morgan → body parser → route handler → error handler.

**TypeScript (server-side)**  
Same benefits as on the frontend. Typed request/response objects, typed Mongoose documents, typed environment variables — everything that moves through the server has a known shape, which prevents subtle bugs when the API and the frontend disagree about data structure.

**MongoDB**  
A document database. Instead of tables and rows, data is stored as BSON documents (Binary JSON) in collections. A report document looks exactly like a JavaScript object. There's no rigid schema enforced at the database level — that's handled by Mongoose. MongoDB was chosen here because the data shapes are naturally document-oriented (a report with optional fields, a user with a variable-length badges array) and because it pairs well with the JavaScript ecosystem.

**Mongoose**  
An ODM (Object-Document Mapper) that sits on top of MongoDB. It lets you define schemas (what fields exist, what types, what constraints) as JavaScript objects, and it enforces those at the application level. It also adds hooks (`pre('save')`), virtual fields, and helper methods to documents. The password hashing logic lives in the User schema's `pre('save')` hook — it runs automatically whenever a user is saved, so you can never accidentally save a plaintext password by forgetting to hash it.

**JWT (jsonwebtoken)**  
JSON Web Tokens are a standard for representing claims (user ID, role, expiry) as a signed string. The signature is created using HMAC-SHA256 with the server's secret key. Anyone can decode the payload (it's just Base64), but only the server can verify the signature is genuine. This means the server doesn't need to store sessions — it just verifies the token's signature on every request. The token also carries the user's role, so the `authorize` middleware can check permissions without a database query.

**bcryptjs**  
A password hashing library. Hashing is one-way — you can verify a password by hashing it again, but you can't reverse a hash to get the original password. bcrypt uses a **salt** (random data added before hashing) to ensure two users with the same password get different hashes, preventing precomputed rainbow table attacks. The cost factor of 12 means the hash takes ~250ms to compute — fast enough for UX, slow enough to make bulk brute-force attacks impractical.

**Helmet**  
A collection of small Express middlewares that set HTTP security headers. For example: `X-Frame-Options: DENY` prevents clickjacking (your site being embedded in an iframe), `X-Content-Type-Options: nosniff` prevents MIME-type sniffing attacks, `Content-Security-Policy` restricts what resources can be loaded. One function call adds significant protection with zero configuration required.

**CORS (cors)**  
Browsers enforce a Same-Origin Policy — a script on `localhost:5173` cannot make requests to `localhost:5001` by default (different port = different origin). The `cors` middleware tells Express to send the right headers (`Access-Control-Allow-Origin`, etc.) to explicitly allow the frontend origin. Without this, every API call from the browser would be blocked.

**Multer**  
Handles `multipart/form-data` requests, which is the encoding used for file uploads. When a report is submitted with a photo, the request body is not JSON — it's a multipart stream with both text fields and a binary file. Multer parses the stream, saves the file to `server/uploads/`, and makes the file metadata available on `req.file` for the controller to use. The upload folder is then served as static files so the frontend can display images via `/uploads/filename.jpg`.

**express-validator**  
Input validation middleware. Before a controller runs, validators check that required fields are present, strings are within length limits, coordinates are valid numbers in the correct range (-90 to 90 for latitude, etc.). If validation fails, a structured error response is returned before any business logic runs. This is the correct place to validate — at the system boundary, where external input enters the application.

**Morgan**  
An HTTP request logger. Logs a line for each request: method, URL, status code, response time. Essential for debugging during development — you can see exactly what requests are hitting the server and whether they succeeded.

**dotenv**  
Loads a `.env` file into `process.env` at startup. This keeps secrets (API keys, JWT secret, database password) out of the source code and out of version control. Different environments (development, production) can have different `.env` files with different values.

**nodemon + ts-node (dev tools)**  
`ts-node` executes TypeScript files directly without a separate compile step — useful during development. `nodemon` watches for file changes and restarts the server automatically. Without these, every code change would require manually stopping the server, compiling TypeScript to JavaScript, and starting again.

**csv-parse**  
Used by `firmsService.ts` to parse NASA FIRMS data, which is delivered as a CSV file. Converts raw CSV text into an array of JavaScript objects.

---

### External APIs

**OpenWeatherMap**  
Provides current weather for Ifrane: temperature, humidity, wind speed, pressure, visibility, rainfall. The free tier allows 1,000 calls/day. The server caches the response for 10 minutes to stay well within limits.

**NASA FIRMS (Fire Information for Resource Management System)**  
Provides near-real-time satellite data for active fire hotspots. The satellite data has a latency of a few hours. The server falls back to mock data if the key isn't configured.

---

## Project File Structure

```
GreenAtlas/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts          Mongoose connection
│   │   ├── controllers/
│   │   │   ├── authController.ts    register, login, getMe
│   │   │   ├── reportController.ts  CRUD + stats + scoring trigger
│   │   │   ├── weatherController.ts proxy to weatherService
│   │   │   ├── environmentController.ts NASA FIRMS proxy
│   │   │   ├── waterController.ts   water measurements CRUD + summary
│   │   │   ├── forestController.ts  forest measurements CRUD + live risk
│   │   │   ├── userController.ts    admin user management
│   │   │   ├── notificationController.ts fetch + mark read
│   │   │   └── leaderboardController.ts top users by green score
│   │   ├── middleware/
│   │   │   ├── auth.ts              protect + authorize middleware
│   │   │   ├── errorHandler.ts      global error handler
│   │   │   ├── upload.ts            Multer config
│   │   │   └── validation.ts        express-validator rule sets
│   │   ├── models/
│   │   │   ├── User.ts              name, email, password, role, greenScore, badges
│   │   │   ├── Report.ts            title, description, category, coordinates, status, user ref
│   │   │   ├── WaterData.ts         value, source, location, timestamp
│   │   │   ├── ForestData.ts        health index, zone, canopy cover, timestamp
│   │   │   └── Notification.ts      recipient, message, read flag, timestamp
│   │   ├── routes/
│   │   │   ├── authRoutes.ts        POST /register, POST /login, GET /me
│   │   │   ├── reportRoutes.ts      CRUD + GET /stats
│   │   │   ├── weatherRoutes.ts     GET /
│   │   │   ├── environmentRoutes.ts GET / (fire hotspots)
│   │   │   ├── waterRoutes.ts       GET + POST
│   │   │   ├── forestRoutes.ts      GET + GET /live + POST
│   │   │   ├── userRoutes.ts        admin CRUD
│   │   │   ├── notificationRoutes.ts GET + PUT /read-all
│   │   │   └── leaderboardRoutes.ts GET /
│   │   ├── services/
│   │   │   ├── weatherService.ts    OpenWeatherMap + fire risk formula + cache
│   │   │   └── firmsService.ts      NASA FIRMS + mock fallback
│   │   ├── seeds/
│   │   │   └── seed.ts              populates demo users, reports, water, forest data
│   │   └── utils/
│   │       └── scoring.ts           point values, badge logic
│   ├── uploads/                     uploaded report images (gitignored)
│   ├── .env.example
│   └── tsconfig.json
│
└── client/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.tsx            tsparticles bg, framer-motion animations
    │   │   ├── Register.tsx
    │   │   ├── Dashboard.tsx        stat cards, chart overview, recent reports
    │   │   ├── MapPage.tsx          Leaflet map with reports + fire hotspots
    │   │   ├── ReportForm.tsx       submit report with GPS + photo
    │   │   ├── WaterMonitoring.tsx  water level charts + status table
    │   │   ├── ForestMonitoring.tsx forest health gauge + zone table
    │   │   ├── EcosystemPulse.tsx   combined environmental overview
    │   │   ├── Leaderboard.tsx      top contributors by green score
    │   │   ├── Profile.tsx          personal stats, badges, report history
    │   │   ├── UsersPage.tsx        agent/admin user list
    │   │   └── AdminDashboard.tsx   analytics + full user/report management
    │   ├── components/
    │   │   ├── Sidebar.tsx          nav links filtered by role
    │   │   ├── Navbar.tsx           theme toggle, language switcher, notification bell
    │   │   ├── NotificationBell.tsx unread count badge + dropdown
    │   │   ├── MapView.tsx          Leaflet wrapper component
    │   │   ├── ReportCard.tsx       report summary card
    │   │   ├── StatCard.tsx         metric card with icon
    │   │   ├── WaterChart.tsx       Chart.js line chart
    │   │   ├── ForestDashboard.tsx  forest summary charts
    │   │   ├── ThemeToggle.tsx      sun/moon button
    │   │   ├── LanguageSwitcher.tsx EN/AR/Darija dropdown
    │   │   ├── FilterBar.tsx        category + status filter pills
    │   │   ├── ProtectedRoute.tsx   redirects unauthenticated users
    │   │   └── ConfirmModal.tsx     reusable confirmation dialog
    │   ├── context/
    │   │   ├── AuthContext.tsx      user, token, login/logout/register, localStorage sync
    │   │   ├── NotificationContext.tsx unread count, poll every 30s
    │   │   └── ThemeContext.tsx     dark/light mode, localStorage sync
    │   ├── services/
    │   │   ├── api.ts               central Axios instance with JWT + 401 interceptors
    │   │   ├── authService.ts       login, register, getMe
    │   │   ├── reportService.ts     CRUD reports
    │   │   ├── weatherService.ts    fetch weather
    │   │   ├── waterService.ts      fetch water data
    │   │   ├── forestService.ts     fetch forest data
    │   │   ├── userService.ts       admin user operations
    │   │   ├── notificationService.ts fetch + mark read
    │   │   └── leaderboardService.ts fetch leaderboard
    │   ├── i18n/
    │   │   ├── index.ts             i18next setup + language detection
    │   │   └── locales/
    │   │       ├── en.ts            English translations
    │   │       ├── ar.ts            Arabic translations (RTL)
    │   │       └── darija.ts        Moroccan Darija translations
    │   ├── types/
    │   │   └── index.ts             User, Report, WaterData, ForestData, Notification types
    │   ├── App.tsx                  router setup, context providers, AppShell, route guards
    │   └── main.tsx                 React entry point, i18n init
    └── vite.config.ts               proxy /api → localhost:5001
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection string

### 1. Clone and configure

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/greenatlas
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
OPENWEATHER_API_KEY=your_key_here
NASA_FIRMS_MAP_KEY=your_key_here
CLIENT_URL=http://localhost:5173
```

> **Free API keys:**
> - OpenWeatherMap: sign up at openweathermap.org → API Keys tab
> - NASA FIRMS: register at firms.modaps.eosdis.nasa.gov/api
>
> The app works without both keys — it falls back to realistic mock data automatically.

### 2. Start the backend

```bash
cd server
npm install
npm run seed        # creates demo users, reports, water & forest data
npm run dev         # starts on http://localhost:5001
```

### 3. Start the frontend

```bash
cd client
npm install
npm run dev         # starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Demo Accounts

| Role    | Email                   | Password    | Can do |
|---------|-------------------------|-------------|--------|
| Admin   | admin@greenatlas.ma     | Admin@123   | Everything |
| Agent   | agent@greenatlas.ma     | Agent@123   | Verify/resolve reports, add measurements |
| Citizen | karim@example.com       | Citizen@123 | Submit reports, view data |

---

## API Reference

| Method | Endpoint                      | Auth required       | Description |
|--------|-------------------------------|---------------------|-------------|
| POST   | /api/auth/register            | Public              | Register new citizen account |
| POST   | /api/auth/login               | Public              | Login — returns JWT + user object |
| GET    | /api/auth/me                  | Any logged-in user  | Get current user profile |
| GET    | /api/reports                  | Any logged-in user  | List reports (filter by category/status) |
| POST   | /api/reports                  | Any logged-in user  | Submit new report with optional photo |
| PUT    | /api/reports/:id              | Owner / Agent       | Update report status |
| DELETE | /api/reports/:id              | Agent / Admin       | Delete a report |
| GET    | /api/reports/stats            | Any logged-in user  | Aggregate counts by category/status |
| GET    | /api/weather                  | Any logged-in user  | Live weather + fire risk score for Ifrane |
| GET    | /api/environment              | Any logged-in user  | NASA FIRMS fire hotspot data |
| GET    | /api/water                    | Any logged-in user  | Water level history + summary |
| POST   | /api/water                    | Agent / Admin       | Add a new water measurement |
| GET    | /api/forest                   | Any logged-in user  | Forest health data + zone summary |
| GET    | /api/forest/live              | Any logged-in user  | Forest data enriched with live fire risk |
| POST   | /api/forest                   | Agent / Admin       | Add a new forest measurement |
| GET    | /api/leaderboard              | Any logged-in user  | Top users ranked by green score |
| GET    | /api/users                    | Admin only          | List all users |
| PUT    | /api/users/:id                | Admin / Self        | Update user role or profile info |
| DELETE | /api/users/:id                | Admin only          | Delete a user |
| GET    | /api/notifications            | Any logged-in user  | Current user's notifications |
| PUT    | /api/notifications/read-all   | Any logged-in user  | Mark all notifications as read |
| GET    | /api/health                   | Public              | Server health check |

---

## Production Build

```bash
# Build and run the backend
cd server
npm run build
node dist/server.js

# Build the frontend (outputs static files to client/dist/)
cd client
npm run build
```

In production, serve `client/dist/` with a static file server (Nginx, Vercel, Netlify, etc.) and point the frontend's API base URL to your deployed backend.
