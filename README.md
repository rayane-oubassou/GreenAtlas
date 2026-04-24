# GreenAtlas Ifrane

Environmental monitoring platform for Ifrane Province, Morocco.  
Tracks forest health, wildfire risk, water resources, and citizen incident reports.

---

## Architecture

```
GreenAtlas/
├── server/          Node.js + Express + TypeScript + MongoDB
│   └── src/
│       ├── models/          Mongoose schemas
│       ├── controllers/     Business logic
│       ├── routes/          REST endpoints
│       ├── middleware/       Auth, validation, upload, errors
│       ├── services/        OpenWeatherMap + NASA FIRMS integrations
│       └── seeds/           Demo data script
└── client/          React + TypeScript + Vite + Tailwind CSS
    └── src/
        ├── pages/           Full-page views
        ├── components/      Reusable UI components
        ├── services/        Axios API layer
        ├── context/         Auth + Notification providers
        └── types/           Shared TypeScript types
```

**Roles:** Citizen · Agent · Admin  
**External APIs:** OpenWeatherMap (weather + fire risk), NASA FIRMS (satellite fire hotspots)

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (or Atlas connection string)

### 1. Clone and configure environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/greenatlas
JWT_SECRET=change_this_to_a_long_random_string
OPENWEATHER_API_KEY=your_key_from_openweathermap.org
NASA_FIRMS_MAP_KEY=your_key_from_firms.modaps.eosdis.nasa.gov
```

> **API Keys (free):**
> - OpenWeatherMap: https://openweathermap.org/api → sign up → copy API key
> - NASA FIRMS: https://firms.modaps.eosdis.nasa.gov/api/ → register → get MAP_KEY
>
> The app works without API keys — it falls back to realistic mock data.

### 2. Install and seed the backend

```bash
cd server
npm install
npm run seed        # populates demo users, reports, water & forest data
npm run dev         # starts on http://localhost:5000
```

### 3. Install and start the frontend

```bash
cd client
npm install
npm run dev         # starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Demo Accounts

| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@greenatlas.ma      | Admin@123   |
| Agent   | agent@greenatlas.ma      | Agent@123   |
| Citizen | karim@example.com        | Citizen@123 |

---

## API Reference

| Method | Endpoint                    | Auth        | Description                        |
|--------|-----------------------------|-------------|------------------------------------|
| POST   | /api/auth/register          | Public      | Register new citizen               |
| POST   | /api/auth/login             | Public      | Login, returns JWT                 |
| GET    | /api/auth/me                | All         | Current user profile               |
| GET    | /api/reports                | All         | List reports (filter by category/status) |
| POST   | /api/reports                | All         | Submit new report (multipart)      |
| PUT    | /api/reports/:id            | Owner/Agent | Update report status               |
| DELETE | /api/reports/:id            | Agent/Admin | Delete report                      |
| GET    | /api/reports/stats          | All         | Aggregate statistics               |
| GET    | /api/weather                | All         | Current weather + fire risk score  |
| GET    | /api/environment            | All         | NASA FIRMS fire hotspots           |
| GET    | /api/water                  | All         | Water level data + summary         |
| POST   | /api/water                  | Agent/Admin | Add water measurement              |
| GET    | /api/forest                 | All         | Forest data + zone summary         |
| GET    | /api/forest/live            | All         | Forest data + live weather risk    |
| POST   | /api/forest                 | Agent/Admin | Add forest measurement             |
| GET    | /api/users                  | Admin       | All users                          |
| PUT    | /api/users/:id              | Admin/Self  | Update user role/info              |
| DELETE | /api/users/:id              | Admin       | Delete user                        |
| GET    | /api/notifications          | All         | User's notifications               |
| PUT    | /api/notifications/read-all | All         | Mark all as read                   |

---

## Features

- **Incident Reporting** — Citizens submit wildfire/logging/water/pollution reports with GPS + photo
- **Interactive Map** — Leaflet map with color-coded markers by category, NASA fire hotspot overlay, real-time filters
- **Weather Dashboard** — Live OpenWeatherMap data: temperature, humidity, wind, rainfall
- **Fire Risk Index** — Computed from temperature + humidity + wind (scored 0–100)
- **Water Monitoring** — Level trends with Chart.js, per-source status, critical alerts
- **Forest Monitoring** — Health index gauge, zone table, risk level distribution charts
- **Notifications** — Real-time in-app alerts for new reports (agents) and status changes (reporters)
- **Admin Dashboard** — Analytics charts, full user/report management with role editing
- **JWT Auth** — bcrypt-hashed passwords, role-based route protection

---

## Production Build

```bash
# Backend
cd server && npm run build && node dist/server.js

# Frontend
cd client && npm run build   # outputs to client/dist/
```
