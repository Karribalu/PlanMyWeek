# PlanMyWeek Backend

A GraphQL Apollo Server that provides weather-based activity rankings to help users plan their week. Built with TypeScript, Apollo Server, and the Open-Meteo weather API.

> Frontend Integration: The React client now uses Apollo Client for all GraphQL operations (caching, error handling, devtools). No changes required server-side—schema and resolvers remain fully compatible.

## 🏗️ Architecture Overview

The backend follows a **schema-first GraphQL approach** with modular architecture:

```
backend/
├── src/
│   ├── index.ts                 # Apollo Server setup & main resolvers
│   ├── resources/               # GraphQL schema definitions
│   │   ├── schema.graphql       # Root queries
│   │   ├── activities.graphql   # Activity types & ranking results
│   │   ├── location.graphql     # Location search & inputs
│   │   └── weather.graphql      # Weather data types
│   ├── services/                # Business logic services
│   │   ├── activity-ranking-service.ts  # Core ranking algorithm
│   │   ├── weather-service.ts           # Open-Meteo API integration
│   │   ├── location-service.ts          # Location search (mock data)
│   │   └── utils.ts                     # Schema file discovery
│   ├── types/                   # TypeScript type definitions
│   └── environments/            # Environment-specific configuration
└── dist/                        # Compiled output (auto-generated)
```

### Key Design Decisions

- **Schema-First GraphQL**: Schema definitions in `.graphql` files are automatically loaded and combined
- **TypeScript ESM**: Full ES modules support with strict typing
- **Modular Services**: Clear separation between data fetching, business logic, and API layer
- **Weather API Integration**: Open-Meteo provides comprehensive forecast data without API keys
- **Mock Location Data**: In-memory location search for development (easily replaceable with real geocoding)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation & Setup

```bash
# Install dependencies
npm install

# Build the project (compiles TypeScript + copies schema files)
npm run build

# Start the server (production mode)
npm start

# Development mode with auto-reload
npm run dev
```

The server will start at **http://localhost:8080** with GraphQL Playground available for testing.

## 📊 API Documentation

### GraphQL Endpoint

**URL**: `http://localhost:8080/`  
**Method**: POST  
**Content-Type**: application/json

### Core Queries

#### 1. `getRankedActivities` - Get activity rankings for a location

**Purpose**: Returns ranked activities (skiing, surfing, sightseeing) based on weather forecasts

```graphql
query GetRankedActivities(
  $location: LocationInput!
  $range: DateRangeInput
  $activities: [ActivityKind!]
) {
  getRankedActivities(
    location: $location
    range: $range
    activities: $activities
  ) {
    period {
      start
      end
    }
    location {
      latitude
      longitude
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
```

**Parameters**:

- `location` (**required**): Either location name OR coordinates
  - `name: String` - City name (e.g., "New York")
  - `latitude: Float` & `longitude: Float` - Exact coordinates
  - `timezone: String` - Optional timezone override
- `range` (optional): Date range for forecast
  - `start: Date` - Start date (defaults to today)
  - `end: Date` - End date (defaults to 7 days from start)
- `activities` (optional): Specific activities to rank
  - Available: `SKIING`, `SURFING`, `OUTDOOR_SIGHTSEEING`, `INDOOR_SIGHTSEEING`
  - Default: All activities

**Response Structure**:

```typescript
{
  period: { start: "2025-09-20", end: "2025-09-26" },
  location: { latitude: 40.7128, longitude: -74.0060 },
  activities: [
    {
      activity: "OUTDOOR_SIGHTSEEING",
      overallScore: 8.5,
      daily: [
        {
          date: "2025-09-20",
          score: 9.2,
          reasons: ["Perfect temperature (22°C)", "Clear skies", "No precipitation"]
        },
        // ... more days
      ]
    },
    // ... more activities
  ]
}
```

#### 2. `searchLocations` - Location search with autocomplete

**Purpose**: Provides location search for user input with typeahead support

```graphql
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
```

**Parameters**:

- `query` (**required**): Search term (e.g., "New Y")
- `limit` (optional): Max results (default: 5)

**Example**:

```json
{
  "query": "searchLocations",
  "variables": { "query": "San Francisco", "limit": 5 }
}
```

#### 3. `getWeatherForecast` - Raw weather data

**Purpose**: Returns detailed weather forecast without activity ranking

```graphql
query GetWeatherForecast($location: LocationInput!, $range: DateRangeInput) {
  getWeatherForecast(location: $location, range: $range) {
    generatedAt
    provider
    daily {
      date
      minTempC
      maxTempC
      precipitationMm
      snowfallCm
      windSpeedKph
      windGustKph
      cloudCoverPct
      sunshineHours
      humidityPct
      # ... more weather variables
    }
    location {
      latitude
      longitude
      elevation
      timezone
    }
  }
}
```

### Activity Ranking Algorithm

The ranking system evaluates each activity against weather conditions using weighted criteria:

#### Skiing

- **Ideal Temperature**: -10°C to 2°C
- **Snow Requirement**: Positive snowfall score
- **Wind Tolerance**: Up to 25 km/h
- **Key Factors**: Temperature, snowfall, wind conditions

#### Surfing

- **Ideal Temperature**: 15°C to 28°C
- **Wave Requirement**: Marine data (wave height, period)
- **Wind Preference**: Moderate offshore winds
- **Key Factors**: Temperature, precipitation, wind, wave conditions

#### Outdoor Sightseeing

- **Ideal Temperature**: 15°C to 25°C
- **Weather Sensitivity**: Low precipitation tolerance (≤2mm)
- **Clear Sky Preference**: 0-40% cloud cover
- **Key Factors**: Temperature, precipitation, sunshine hours

#### Indoor Sightseeing

- **Weather Independent**: High scores during poor outdoor weather
- **Inverse Relationship**: Better when outdoor conditions are poor
- **All-Weather Activity**: Minimal weather constraints

### Score Calculation

Each activity receives a daily score (0-10) based on:

1. **Temperature fit** (30% weight)
2. **Precipitation impact** (25% weight)
3. **Wind conditions** (20% weight)
4. **Cloud cover/sunshine** (15% weight)
5. **Special conditions** (10% weight - snow, waves, etc.)

**Overall Score** = Average of all daily scores in the period

## 🔧 Configuration

### Environment Variables

Create `.env` files in `src/environments/`:

```bash
# .env.local (development)
NODE_ENV=local
PORT=8080
LOG_LEVEL=debug

# .env.production
NODE_ENV=production
PORT=8080
LOG_LEVEL=info
```

### Build Process

The build process involves:

1. **TypeScript Compilation**: `src/` → `dist/`
2. **Schema Copy**: `src/resources/*.graphql` → `dist/resources/`
3. **Environment Copy**: `src/environments/` → `dist/environments/`

This ensures GraphQL schemas are available at runtime after compilation.

## 🛠️ Development

### Available Scripts

```bash
npm run compile        # TypeScript compilation only
npm run build         # Full build (compile + copy resources)
npm run start         # Production start
npm run start:dev     # Development start
npm run dev           # Watch mode with auto-reload
```

### Adding New Activity Types

1. **Add to enum** in `src/resources/activities.graphql`:

```graphql
enum ActivityKind {
  SKIING
  SURFING
  OUTDOOR_SIGHTSEEING
  INDOOR_SIGHTSEEING
  NEW_ACTIVITY # Add here
}
```

2. **Define criteria** in `activity-ranking-service.ts`:

```typescript
[ActivityKind.NEW_ACTIVITY]: {
  idealTempRange: [10, 20],
  acceptableTempRange: [5, 25],
  maxPrecipitation: 5,
  // ... other criteria
}
```

3. **Implement scoring logic** in the ranking service

### Extending Location Data

Currently uses mock data in `src/index.ts`. To integrate real geocoding:

1. Replace `mockLocations` array with API calls
2. Update `location-service.ts` with geocoding provider
3. Maintain the same interface for seamless integration

## 🧪 Testing

### Manual Testing with GraphQL Playground

1. Start the server: `npm run dev`
2. Open `http://localhost:8080/` in browser
3. Try sample queries:

```graphql
# Search for locations
{
  searchLocations(query: "San Francisco") {
    name
    country
    latitude
    longitude
  }
}

# Get activity rankings
{
  getRankedActivities(location: { name: "Aspen" }) {
    activities {
      activity
      overallScore
    }
  }
}
```

### cURL Examples

```bash
# Location search
curl -X POST http://localhost:8080/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ searchLocations(query: \"Paris\") { name country latitude longitude } }"
  }'

# Activity rankings
curl -X POST http://localhost:8080/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ getRankedActivities(location: {name: \"Chamonix\"}) { activities { activity overallScore } } }"
  }'
```

## 🚨 Error Handling

The API provides structured error responses:

```json
{
  "errors": [
    {
      "message": "Location not found: InvalidCity",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["getRankedActivities"]
    }
  ],
  "data": null
}
```

Common error scenarios:

- **Invalid location**: Location name not found in search
- **Invalid coordinates**: Latitude/longitude outside valid ranges
- **Weather API failure**: Open-Meteo service unavailable
- **Invalid date range**: End date before start date

## 🔄 Dependencies

### Core Dependencies

- **@apollo/server**: GraphQL server implementation
- **graphql**: GraphQL query language support
- **graphql-scalars**: Custom scalar types (Date, Latitude, Longitude)
- **openmeteo**: Weather data API client
- **dotenv**: Environment variable management

### Development Dependencies

- **typescript**: Type checking and compilation
- **nodemon**: Development auto-reload
- **@types/node**: Node.js type definitions

## 📈 Performance Considerations

- **Weather API Caching**: Consider implementing Redis cache for weather data
- **Location Search**: Mock data provides instant results; real geocoding may need caching
- **GraphQL Efficiency**: Schema-first approach enables optimal query planning
- **Memory Usage**: Activity ranking algorithm processes data in-memory for speed

## 🚀 Production Deployment

For production deployment:

1. **Build optimization**: `npm run build`
2. **Environment setup**: Configure production `.env` file
3. **Process management**: Use PM2 or similar for process monitoring
4. **Monitoring**: Add logging and metrics for API performance
5. **Security**: Implement rate limiting and request validation

The server is designed to be stateless and horizontally scalable.
