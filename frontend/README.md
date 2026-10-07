# ReviewSense AI frontend

React + Vite dashboard for the ReviewSense FastAPI service.

## Run locally

```bash
npm install
npm run dev
```

Vite listens on `0.0.0.0:5173` and proxies `/api/*` to `http://127.0.0.1:8000/*`. Start the backend separately using the commands in the root README. `REVIEWSENSE_API_PROXY` can change the Vite proxy target; `VITE_API_BASE_URL` can point the browser to a separately deployed API root.

## Build

```bash
npm run build
npm run preview
```

## Test

```bash
npm test
```

The Vitest + Testing Library suite renders the dashboard in jsdom and verifies that a mocked API response appears in the result and history panels, that backend failures surface user-facing errors, and that empty reviews are rejected without calling `/predict`.

## UI structure

- `src/pages/DashboardPage.jsx` — dashboard composition and prediction orchestration.
- `src/components/` — sidebar, hero, analyzer, result card, Model Arena, history, statistics, and shared UI pieces.
- `src/data/` — model options and clickable example reviews.
- `src/hooks/` — theme, API status polling, and local analysis history.
- `src/lib/` — review text and metric formatting helpers.
- `src/services/api.js` — health, model metadata, and prediction requests with network/response error handling.
- `src/index.css` — Tailwind entry point, base styles, and reduced-motion preference.

Sentiment values, probabilities, confidence, and model comparison metrics are read from the API. The frontend contains no prediction or model-metric fixtures.
