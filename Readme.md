# PlanMyWeek

A small demo app that answers a simple question: "Given the weather over the next week, which outdoor (or fallback indoor) activity is likely to be the most fun each day?"

You type a location, it fetches a 7‑day forecast, scores a handful of activities, and shows a ranked list plus daily breakdowns.

## What You Get

- Location search (mock dataset for now) with debounced suggestions
- 7‑day forecast via Open‑Meteo (no API key)
- Ranked activities (Skiing, Surfing, Outdoor Sightseeing, Indoor Sightseeing fallback)
- Simple rule‑based scoring (today) + documented path to an ML‑style approach (future)
- React + Apollo Client frontend, Apollo Server backend, all in TypeScript

## Quick Start

```bash
# Backend
cd backend
npm install
npm run dev   # GraphQL at http://localhost:8080

# Frontend (new terminal)
cd ../frontend
npm install
npm run dev   # App at http://localhost:5173
```

Visit the frontend, start typing e.g. "Aspen", "Malibu", or "Paris".

## How Ranking Works (Current Rules Engine)

Each activity gets a score per day based on weather factors that matter for it:

- Skiing: colder temps (but not extreme), snowfall, low wind
- Surfing: mild/warm temps, low precipitation, (placeholder for swell data if added)
- Outdoor Sightseeing: comfortable temp band, low rain, clearer conditions
- Indoor Sightseeing: becomes more attractive when outdoor conditions are poor

Scores are normalized to 0–100 and averaged/weighted with a few heuristics. The highest score per day tops the list.

The goal was clarity over cleverness: the logic is easy to read and easy to change.

## Future: ML‑Style Ranking (Planned)

Not implemented yet, but here’s the path so it’s explicit:

1. Feature Vector: For each (day, location) build a vector like:
   [avgTemp, minTemp, maxTemp, snowfall, rain, windSpeed, pressureTrend, dayIndex]
2. Normalization: Scale features (min‑max or z‑score) using rolling historical stats.
3. Model: Start with a linear combination per activity: score_a = W_a · X + b_a
4. Training Data: Collect user feedback (chosen activity, satisfaction rating) or derive implicit signals (time on details, re-queries).
5. Cold Start: Fall back to current rule weights until enough interactions exist.
6. Personalization: Add user preference weights (e.g. user likes colder weather) blended with model output.
7. Serving: Expose an optional argument `algorithm` in the GraphQL query (default RULES, opt into ML when ready).

Example (future) GraphQL shape:

```graphql
query GetRanked($location: String!, $algorithm: RankingAlgorithm = RULES) {
  getRankedActivities(locationName: $location, algorithm: $algorithm) {
    activity
    overallScore
    daily {
      date
      score
      reasons
    }
  }
}
```

Enum:

```graphql
enum RankingAlgorithm {
  RULES
  ML
}
```

Until an actual model exists, an "ML" mode could simply use a configurable weight map loaded from a JSON file to simulate experimentation.

## Tech Stack (Minimal but Practical)

Backend:

- Apollo Server (GraphQL)
- TypeScript ESM
- Open‑Meteo fetch + light transformation

Frontend:

- React + Vite + TypeScript
- Apollo Client
- Material‑UI (fast, accessible defaults)

## Key Design Decisions

- Schema‑First GraphQL: I write the contract first (.graphql files) so types and resolvers stay honest and the API is obvious when you crack open the repo.
- Monorepo: Backend and frontend live side‑by‑side; quicker cross‑ref when tweaking a field or adding a query.
- Open‑Meteo API: Free, rich weather data, no API key dance. Perfect for a fast demo.
- TypeScript Everywhere: Less guessing, fewer runtime surprises, smoother refactors.
- Component‑Based UI: Small, focused React components (search box, rankings list) make changes low‑risk.

## Notes on AI Assistance

I did lean on AI tools, but as accelerators—not decision makers.

Where it helped:

- Boilerplate: Typing out repetitive TypeScript interfaces and React component shells.
- GraphQL Schema Drafting: Nudged me toward clean enum and type naming.
- Ranking Logic Sketches: Provided a starting mental model for weighting factors.
- Refactoring Nits: Suggested small readability tweaks.

Where it didn’t (and shouldn’t) replace thinking:

- Choosing which weather signals matter per activity.
- Deciding normalization strategies and score bounds.
- Keeping the README concise (ironically trimmed a very AI-ish version).

Workflow in practice:

1. Prompt for a rough draft (e.g. “outline a Skiing score function factoring temp + snowfall + wind”).
2. Trim / rewrite to match real constraints and clarity.
3. Re-run TypeScript, eyeball output, adjust edge cases (null arrays, short forecast days, etc.).

Takeaway: AI sped up the scaffolding; the domain logic, simplifications, and trade‑offs were still human choices.

## Things Deliberately Left Out

- Auth & user profiles
- Real geocoding API
- DB persistence / caching layer
- Fancy error states & skeleton UIs
- Comprehensive tests (would add Jest + React Testing Library + resolver tests)
- Deployment (Docker/CI/CD) configs

These would be the next steps along with: caching weather responses, adding fuzzy search, integrating surf/snow specific APIs, and introducing the ML ranking flag.
