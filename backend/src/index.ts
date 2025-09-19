import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { getWeatherForecast } from "./services/weather-service.js";
import { gql } from "apollo-server-express";
import { typeDefs as scalarTypeDefs } from "graphql-scalars";

import { getAllGraphQLFiles } from "./services/utils.js";
import { readFileSync } from "fs";
const allGraphQLFiles = getAllGraphQLFiles();
const customTypeDefs = allGraphQLFiles
  .map((item) => {
    console.log("Loading GraphQL schema file:", item);
    return gql(readFileSync(item, "utf-8"));
  })
  .join("\n");

const typeDefs = [...scalarTypeDefs, customTypeDefs];

// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const books = [
  {
    title: "The Awakening",
    author: "Kate Chopin",
  },
  {
    title: "City of Glass",
    author: "Paul Auster",
  },
];
// Simple in-memory mock dataset for now. Replace with a real geocoding service later.
const mockLocations = [
  {
    name: "New York City",
    country: "US",
    latitude: 40.7128,
    longitude: -74.006,
    timezone: "America/New_York",
    source: "mock",
  },
  {
    name: "Newark",
    country: "US",
    latitude: 40.7357,
    longitude: -74.1724,
    timezone: "America/New_York",
    source: "mock",
  },
  {
    name: "New Delhi",
    country: "IN",
    latitude: 28.6139,
    longitude: 77.209,
    timezone: "Asia/Kolkata",
    source: "mock",
  },
  {
    name: "Newcastle",
    country: "GB",
    latitude: 54.9783,
    longitude: -1.6178,
    timezone: "Europe/London",
    source: "mock",
  },
  {
    name: "New Orleans",
    country: "US",
    latitude: 29.9511,
    longitude: -90.0715,
    timezone: "America/Chicago",
    source: "mock",
  },
  {
    name: "Newport",
    country: "US",
    latitude: 41.4901,
    longitude: -71.3128,
    timezone: "America/New_York",
    source: "mock",
  },
];

const resolvers = {
  Query: {
    searchLocations: (
      _: unknown,
      { query, limit }: { query: string; limit: number }
    ) => {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      return mockLocations
        .filter((l) => l.name.toLowerCase().includes(q))
        .slice(0, Math.min(limit ?? 5, 20));
    },
  },
};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
const { url } = await startStandaloneServer(server, {
  listen: { port: 8080 },
});

console.log(`🚀  Server ready at: ${url}`);
