import { config } from "dotenv";
import { existsSync } from "fs";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { gql } from "apollo-server-express";
import { typeDefs as scalarTypeDefs } from "graphql-scalars";

// Load environment variables based on NODE_ENV with fallback
const environment = process.env.NODE_ENV || "local";
const envFile = `./dist/environments/.env.${environment}`;
const fallbackEnvFile = "./dist/environments/.env";

// Try to load the environment-specific file first, fallback to base .env
if (existsSync(envFile)) {
  config({ path: envFile });
  console.log(`Loaded environment configuration from: ${envFile}`);
} else {
  config({ path: fallbackEnvFile });
  console.log(
    `Environment file ${envFile} not found, loaded from: ${fallbackEnvFile}`
  );
}

// Import location service AFTER environment variables are loaded
import { getLocationService } from "./services/location-service.js";

import { getAllGraphQLFiles } from "./services/utils.js";
import { readFileSync } from "fs";
const allGraphQLFiles = getAllGraphQLFiles();
const customTypeDefs = allGraphQLFiles.map((item) => {
  console.log("Loading GraphQL schema file:", item);
  return gql(readFileSync(item, "utf-8"));
});

const typeDefs = [...scalarTypeDefs, ...customTypeDefs];

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

const resolvers = {
  Query: {
    searchLocations: (
      _: unknown,
      { query, limit }: { query: string; limit: number }
    ) => {
      return getLocationService().searchLocations(query, limit);
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
