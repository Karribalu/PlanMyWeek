# Copilot Instructions for PlanMyWeek

## Project Overview

PlanMyWeek is a weather-based activity ranking system with a React frontend and GraphQL Apollo Server backend. The core purpose is to rank outdoor activities (skiing, surfing, sightseeing) based on weather forecasts and location searches.

## Architecture & Key Components

### Backend (`/backend`)

- **Apollo GraphQL Server** on port 8080 with TypeScript ESM modules
- **Schema-first approach**: GraphQL schemas split across `/src/resources/*.graphql` files
- **Build pattern**: TypeScript compiles to `/dist`, with post-compile step copying GraphQL files
- **Weather integration**: Uses Open-Meteo API via `openmeteo` package
- **Location mock data**: In-memory mock locations in `index.ts` (lines 32-66) for development

### Frontend (`/frontend`)

- **Vite + React + TypeScript** setup with ESLint flat config
- **Apollo Client**: Centralized GraphQL client (`src/apollo/client.ts`) with `useQuery` / `useLazyQuery` hooks
- **Environment-based endpoint**: `VITE_GRAPHQL_URL` controls GraphQL URL
- **Debounced search**: 300ms delay for location typeahead leveraging `useLazyQuery`

## Critical Patterns

### GraphQL Schema Loading

```typescript
// Backend dynamically loads all .graphql files from resources/
const allGraphQLFiles = getAllGraphQLFiles();
```

- Schema files are automatically discovered and combined
- Add new schema types by creating `.graphql` files in `/backend/src/resources/`
- Build copies schema files from `src/resources/` to `dist/resources/`

### Development Workflow

```bash
# Backend development
cd backend && npm run build && npm start  # Compiles TS + copies schemas + starts server

# Frontend development
cd frontend && npm run dev  # Vite dev server with HMR
```

### Mock Data Strategy

- Location search uses hardcoded `mockLocations` array in `backend/src/index.ts`
- Contains realistic lat/lng/timezone data for common cities
- Filter logic: case-insensitive substring matching with configurable limits

## Data Flow Patterns

### Location Search

1. Frontend: Debounced input → GraphQL `searchLocations` query
2. Backend: `mockLocations.filter()` by name substring → slice results
3. Returns `{ name, country, latitude, longitude, timezone, source }`

### Weather Service Integration

- `weather-service.ts` calls Open-Meteo Climate API
- Processes multiple weather variables: temp, rain, snow, pressure
- Currently returns processed arrays but not yet integrated with GraphQL resolvers

## Key Files to Understand

- `backend/src/index.ts`: Main server setup, mock data, and location resolver
- `backend/src/resources/schema.graphql`: Core GraphQL API including `getRankedActivities`
- `backend/src/services/utils.ts`: Schema file discovery logic for dev vs production
- `frontend/src/App.tsx`: High-level layout; Apollo hooks used in pages/components
- `frontend/src/apollo/client.ts`: Apollo Client configuration

## Conventions

- **TypeScript strict mode** enabled across both frontend and backend
- **ESM modules** throughout (note `"type": "module"` in package.json files)
- **Schema-first GraphQL**: Define types in `.graphql` files, implement in resolvers
- **Monorepo structure**: Separate `backend/` and `frontend/` with independent package.json files

## Integration Points

- **Frontend → Backend**: Direct HTTP POST to GraphQL endpoint (port 8080)
- **Backend → Weather API**: Open-Meteo Climate API for forecast data
- **Future**: Activity ranking algorithm to combine weather + activity preferences

## Development Notes

- Backend requires build step before running (TypeScript compilation + resource copying)
- Frontend uses Vite's fast HMR for development
- GraphQL schema changes require backend restart
- Mock location data is easily extensible in `index.ts` mockLocations array
