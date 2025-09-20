# PlanMyWeek Frontend

A modern React application built with TypeScript, Vite, and Material-UI that provides an intuitive interface for weather-based activity planning.

## 🏗️ Architecture Overview

The frontend follows modern React patterns with clean component architecture:

```
frontend/
├── src/
│   ├── main.tsx                 # App entry point with routing
│   ├── App.tsx                  # Main app component
│   ├── types.ts                 # Shared TypeScript interfaces
│   ├── theme.ts                 # Material-UI theme configuration
│   ├── components/              # Reusable UI components
│   │   ├── LocationSearch.tsx   # Location autocomplete with debouncing
│   │   └── ActivityRankings.tsx # Activity ranking display
│   ├── pages/                   # Route-level components
│   │   ├── ActivityRankingsPage.tsx  # Main rankings view
│   │   └── ActivityDetailsPage.tsx   # Detailed activity breakdown
│   ├── graphql/                 # GraphQL query definitions
│   │   └── queries.ts           # Centralized GraphQL queries
│   └── assets/                  # Static assets
└── dist/                        # Build output
```

## 🚀 Technology Stack

- **React 19**: Latest React features with improved performance
- **TypeScript**: Full type safety with strict configuration
- **Vite**: Lightning-fast development server and build tool
- **Material-UI v6**: Comprehensive component library with consistent design
- **React Router v7**: Client-side routing for SPA navigation
- **Direct GraphQL**: Manual fetch calls for GraphQL queries (no Apollo Client)

## 🎯 Key Features

### Location Search Component

- **Debounced Autocomplete**: 300ms delay prevents excessive API calls
- **Real-time Results**: Displays location suggestions as user types
- **Error Handling**: Graceful handling of network failures
- **Keyboard Navigation**: Full accessibility support

### Activity Rankings Display

- **Dynamic Scoring**: Real-time activity rankings based on weather
- **Daily Breakdown**: Day-by-day score visualization
- **Responsive Design**: Optimized for desktop and mobile
- **Loading States**: Smooth user experience during data fetching

### Routing & Navigation

- **URL State Management**: Location and date parameters in URL
- **Deep Linking**: Shareable URLs for specific locations and dates
- **Navigation Guards**: Prevents invalid route access

## 🔧 Development Setup

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will start at **http://localhost:5173** with:

- ⚡ Hot Module Replacement (HMR)
- 🔍 TypeScript error checking
- 📱 Mobile-responsive viewport

### Available Scripts

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript compilation + Vite production build
npm run lint     # ESLint with TypeScript rules
npm run preview  # Preview production build locally
```

## 🧩 Component Architecture

### LocationSearch Component

**Purpose**: Provides typeahead search for location selection with debounced API calls

**Key Features**:

- Debounced input (300ms) to prevent excessive GraphQL requests
- Autocomplete dropdown with keyboard navigation
- Loading states and error handling
- Automatic navigation to activity rankings

**Props Interface**:

```typescript
interface Props {
  onSelect?(loc: LocationSuggestion): void;
  selected?: LocationSuggestion | null;
  autoNavigate?: boolean;
}
```

**Usage**:

```tsx
<LocationSearch
  onSelect={setSelectedLocation}
  selected={selectedLocation}
  autoNavigate={true}
/>
```

### ActivityRankings Component

**Purpose**: Displays ranked activities with scores and daily breakdowns

**Features**:

- Activity cards with overall scores
- Expandable daily score details
- Weather reasoning explanations
- Responsive grid layout

### Page Components

**ActivityRankingsPage**: Main application view combining location search and activity rankings
**ActivityDetailsPage**: Detailed view for specific activity with historical data and trends

## 📡 GraphQL Integration

### Query Management

The frontend uses manual GraphQL queries with fetch API rather than Apollo Client for simplicity:

```typescript
// Direct GraphQL query execution
const response = await fetch("http://localhost:8080/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: SEARCH_LOCATIONS,
    variables: { q: inputValue },
  }),
});
```

### Query Definitions

Centralized in `src/graphql/queries.ts`:

```typescript
export const SEARCH_LOCATIONS = `query Search($q:String!){
  searchLocations(query:$q){ name country latitude longitude timezone }
}`;

export const GET_RANKED_ACTIVITIES = `query Rank($lat:Latitude!,$lng:Longitude!){
  getRankedActivities(location:{latitude:$lat,longitude:$lng}){
    period{ start end }
    activities{ activity overallScore daily{ date score reasons } }
  }
}`;
```

### Benefits of Direct GraphQL Approach

- **Simplicity**: No additional client library complexity
- **Transparency**: Clear understanding of network requests
- **Bundle Size**: Smaller JavaScript bundle
- **Control**: Full control over request/response handling

## 🎨 Styling & Theming

### Material-UI Integration

Custom theme configuration in `src/theme.ts`:

```typescript
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
  },
  typography: {
    h1: { fontWeight: "bold" },
    // ... custom typography
  },
});
```

### Component Styling Approach

- **Material-UI Components**: Primary styling through MUI's `sx` prop
- **Consistent Spacing**: Using MUI's spacing system
- **Responsive Design**: MUI's breakpoint system for mobile optimization
- **Theme Integration**: All colors and typography through theme system

## 🔍 Type Safety

### TypeScript Configuration

Strict TypeScript setup with comprehensive type checking:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Type Definitions

Shared types in `src/types.ts`:

```typescript
export interface LocationSuggestion {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface ActivityRanking {
  activity: ActivityKind;
  overallScore: number;
  daily: DailyActivityScore[];
}
```

### GraphQL Type Integration

- Manual type definitions matching GraphQL schema
- Runtime type validation for API responses
- IntelliSense support for all GraphQL operations

## 🚀 Performance Optimizations

### Implemented Optimizations

- **Debounced Search**: Reduces API calls during typing
- **Vite HMR**: Fast development iteration
- **Component Lazy Loading**: Route-based code splitting
- **TypeScript Compilation**: Build-time error checking

### Potential Future Optimizations

- **React Query**: Caching and background refetching
- **Virtual Scrolling**: For large activity lists
- **Service Worker**: Offline functionality
- **Bundle Analysis**: Webpack bundle analyzer integration

## 🧪 Development Patterns

### Error Handling Strategy

```typescript
try {
  const response = await fetch(graphqlEndpoint, requestConfig);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0]?.message);
  // Handle success
} catch (error) {
  if (error.name !== "AbortError") {
    setError(error.message);
  }
}
```

### State Management

- **Local Component State**: React useState for component-specific data
- **URL State**: React Router for shareable application state
- **No Global State**: Simple application doesn't require Redux/Zustand

### Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Logical tab order and focus indicators
- **Color Contrast**: Meeting WCAG AA standards

## 🔧 Build & Deployment

### Build Process

1. **TypeScript Compilation**: Type checking and compilation
2. **Vite Build**: Module bundling and optimization
3. **Asset Processing**: Image optimization and hashing
4. **Output**: Static files in `/dist` directory

### Environment Configuration

```typescript
// Environment-specific API endpoints
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
```

### Production Deployment

The frontend generates static assets that can be deployed to:

- **Vercel**: Zero-config deployment with automatic builds
- **Netlify**: Static site hosting with form handling
- **AWS S3 + CloudFront**: Scalable static hosting
- **Docker**: Containerized deployment with nginx

## 🐛 Debugging & Development Tools

### Browser DevTools Integration

- **React DevTools**: Component inspection and profiling
- **TypeScript Debugging**: Source map support for debugging
- **Network Tab**: GraphQL query inspection
- **Performance Tab**: Runtime performance analysis

### Development Helpers

- **ESLint**: Code quality and consistency checking
- **TypeScript Compiler**: Real-time error detection
- **Vite Error Overlay**: In-browser error display
- **Hot Module Replacement**: Instant code updates

## 📱 Responsive Design

### Breakpoint Strategy

```typescript
// Material-UI breakpoints
xs: 0px     // Phone
sm: 600px   // Tablet portrait
md: 900px   // Tablet landscape
lg: 1200px  # Desktop
xl: 1536px  # Large desktop
```

### Mobile Optimizations

- **Touch-Friendly**: Larger touch targets for mobile
- **Optimized Typography**: Readable text sizes across devices
- **Adaptive Layouts**: Grid layouts that stack on mobile
- **Performance**: Optimized bundle size for mobile networks

This frontend demonstrates modern React development practices with emphasis on type safety, performance, and maintainable architecture patterns.
