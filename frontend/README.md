# PlanMyWeek Frontend

A modern React application built with TypeScript, Vite, Material-UI, and Apollo Client that provides an intuitive interface for weather-based activity planning.

## 🏗️ Architecture Overview

The frontend follows modern React patterns with clean component architecture:

```
frontend/
├── src/
│   ├── main.tsx                 # App entry point with routing & ApolloProvider
│   ├── App.tsx                  # Main app component
│   ├── types.ts                 # Shared TypeScript interfaces
│   ├── theme.ts                 # Material-UI theme configuration
│   ├── components/              # Reusable UI components
│   │   ├── LocationSearch.tsx   # Location autocomplete with debouncing
│   │   └── ActivityRankings.tsx # Activity ranking display
│   ├── pages/                   # Route-level components
│   │   ├── ActivityRankingsPage.tsx  # Main rankings view
│   │   └── ActivityDetailsPage.tsx   # Detailed activity breakdown
│   ├── graphql/                 # GraphQL operations (queries & fragments)
│   │   └── queries.ts           # Centralized GraphQL operations (gql)
│   ├── apollo/                  # Apollo Client setup
│   │   └── client.ts            # Apollo client instance & cache config
│   └── assets/                  # Static assets
└── dist/                        # Build output
```

## 🚀 Technology Stack

- **React 19**: Latest React features with improved performance
- **TypeScript**: Full type safety with strict configuration
- **Vite**: Lightning-fast development server and build tool
- **Material-UI v6**: Comprehensive component library with consistent design
- **React Router v7**: Client-side routing for SPA navigation
- **Apollo Client**: Typed GraphQL queries with caching, error handling & devtools

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

### GraphQL Integration (Apollo Client)

The frontend now uses **Apollo Client** for all GraphQL communication, replacing manual fetch logic.

#### Apollo Client Setup

`src/apollo/client.ts`:

```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

const httpLink = createHttpLink({ uri: import.meta.env.VITE_GRAPHQL_URL });

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
```

`src/main.tsx` wraps the app with `ApolloProvider` so hooks like `useQuery` are available across the component tree.

#### Defining Operations

`src/graphql/queries.ts` uses `gql` tagged templates:

```typescript
import { gql } from "@apollo/client";

export const SEARCH_LOCATIONS = gql`
  query SearchLocations($query: String!, $limit: Int) {
    searchLocations(query: $query, limit: $limit) {
      name
      country
      latitude
      longitude
      timezone
      source
    }
  }
`;

export const GET_RANKED_ACTIVITIES = gql`
  query GetRankedActivities($latitude: Latitude!, $longitude: Longitude!) {
    getRankedActivities(
      location: { latitude: $latitude, longitude: $longitude }
    ) {
      period {
        start
        end
      }
      activities {
        activity
        overallScore
        daily {
          date
          score
          reasons
        }
      }
    }
  }
`;
```

#### Using Queries in Components

```tsx
import { useQuery } from "@apollo/client";
import { GET_RANKED_ACTIVITIES } from "../graphql/queries";

const { data, loading, error } = useQuery(GET_RANKED_ACTIVITIES, {
  variables: { latitude: 40.7128, longitude: -74.006 },
  skip: !selectedLocation,
});
```

For on-demand queries (e.g. typeahead search) `useLazyQuery` is used:

```tsx
const [runSearch, { data, loading, error }] = useLazyQuery(SEARCH_LOCATIONS);

// inside debounced effect
runSearch({ variables: { query: value, limit: 5 } });
```

#### Benefits of Apollo Client

- **Caching**: Normalized in-memory cache reduces redundant requests
- **Declarative Data**: Hooks manage loading & error lifecycle
- **DevTools Support**: Inspect queries, cache & performance
- **Environment Flexibility**: Endpoint configured via `VITE_GRAPHQL_URL`
- **Extensibility**: Easy to add pagination, reactive variables, fragments

#### Environment Variable

Configure the GraphQL endpoint in an `.env` file:

```
VITE_GRAPHQL_URL=http://localhost:8080/
```

For production deployments override with the deployed API URL.

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

Shared types remain in `src/types.ts`. Optionally, future improvement could generate TypeScript types automatically using a GraphQL code generator (e.g. `@graphql-codegen/cli`) to ensure strong coupling with the schema. Currently we hand-maintain the minimal interfaces required by UI components.

### GraphQL Type Integration

- Apollo Client returns typed data when paired with generated types (future enhancement)
- Manual interfaces align with GraphQL schema enums & object shapes
- Stronger type-safety can be added with code generation in a follow-up iteration

## 🚀 Performance Optimizations

### Implemented Optimizations

- **Apollo Caching**: Eliminates duplicate network requests
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

This frontend demonstrates modern React development practices with emphasis on type safety, performance, Apollo-powered data management, and maintainable architecture patterns.
