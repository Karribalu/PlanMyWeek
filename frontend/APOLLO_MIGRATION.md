# Apollo Client Migration Summary

## Overview

Successfully migrated the PlanMyWeek frontend from manual fetch-based GraphQL calls to Apollo Client with dynamic environment-based URLs. All legacy `fetch` utilities have been removed; data access is now standardized through Apollo React hooks (`useQuery`, `useLazyQuery`).

## Changes Made

### 1. Environment Configuration

- **Created `.env` files**:
  - `.env` - Default environment variables
  - `.env.development` - Development-specific config (localhost:8080)
  - `.env.production` - Production-specific config (placeholder URL)
- **Updated `vite-env.d.ts`** - Added TypeScript definitions for `VITE_GRAPHQL_URL`

### 2. Apollo Client Setup

- **Created `src/apollo/client.ts`** - Apollo Client configuration with dynamic URL from environment
- **Updated `src/main.tsx`** - Wrapped app with ApolloProvider

### 3. GraphQL Queries Migration

- **Updated `src/graphql/queries.ts`** - Converted string-based queries to `gql` tagged templates:
  - `SEARCH_LOCATIONS` - Location search query
  - `GET_RANKED_ACTIVITIES` - Activity ranking query

### 4. Component Updates

#### ActivityDetailsPage.tsx

- Replaced manual fetch with `useQuery` hook
- Simplified state management (removed manual loading/error states)
- Updated error handling to use Apollo's error format
- Removed AbortController logic (Apollo handles this internally)

#### ActivityRankingsPage.tsx

- Replaced manual fetch with `useQuery` hook
- Updated data access to use Apollo's data structure
- Simplified state management and error handling

#### LocationSearch.tsx

- Replaced manual fetch with `useLazyQuery` hook for on-demand searching
- Updated debounced search logic to trigger Apollo queries
- Simplified error handling using Apollo's error management

## Benefits

### 1. **Dynamic Environment URLs**

- GraphQL endpoint now configurable via environment variables
- Easy deployment across different environments (dev/staging/prod)
- No hardcoded URLs in the codebase

### 2. **Better Developer Experience**

- Automatic caching and request deduplication
- Built-in loading and error states
- Better TypeScript integration
- Reduced boilerplate code

### 3. **Improved Performance**

- Intelligent caching reduces network requests
- Automatic request optimization
- Background refetching capabilities

### 4. **Enhanced Error Handling**

- Unified error handling across all GraphQL operations
- Better error reporting and debugging
- Automatic retry mechanisms

## Required Dependencies

Make sure to install the following packages:

```bash
npm install @apollo/client graphql
```

## Environment Variables

Set the following environment variable in your deployment:

- `VITE_GRAPHQL_URL` - The GraphQL endpoint URL (e.g., "http://localhost:8080/" for development)

## Usage

The application now automatically uses the GraphQL URL from environment variables. No code changes needed when deploying to different environments - just update the environment variable.

### Development

```env
VITE_GRAPHQL_URL=http://localhost:8080/
```

### Production

```env
VITE_GRAPHQL_URL=https://your-production-api.com/graphql
```

## Post-Migration Verification Checklist

- [x] All previous direct `fetch` calls removed
- [x] Application renders rankings & search successfully
- [x] Apollo DevTools shows normalized cache entries
- [x] Location search re-queries only on changed input (debounced)
- [x] Activity rankings query skipped when no location selected
- [x] Environment override works via `VITE_GRAPHQL_URL`

## Follow-Up Improvement Opportunities

1. Type Generation

- Add GraphQL Code Generator to auto-generate TypeScript types & hooks.

2. Error Link / Retry Link

- Centralize logging & implement exponential backoff for transient failures.

3. Fragment Usage

- Introduce shared fragments to reduce duplication across future queries.

4. Field Policies

- Configure custom merge / pagination strategies when list fields are added.

5. Testing Utilities

- Add a custom `renderWithApollo` helper for component tests using `MockedProvider`.

## Summary

Apollo Client adoption reduced boilerplate, introduced caching, and prepared the codebase for future scalability (pagination, optimistic UI, subscriptions). Further enhancements (type generation & custom links) can be layered in incrementally without refactoring existing components.
