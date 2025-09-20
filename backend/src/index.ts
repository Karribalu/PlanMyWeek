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
import { weatherService, WeatherService } from "./services/weather-service.js";
import {
  ActivityRankingService,
  ActivityKind,
} from "./services/activity-ranking-service.js";

import { getAllGraphQLFiles } from "./services/utils.js";
import { readFileSync } from "fs";
const allGraphQLFiles = getAllGraphQLFiles();
const customTypeDefs = allGraphQLFiles.map((item) => {
  console.log("Loading GraphQL schema file:", item);
  return gql(readFileSync(item, "utf-8"));
});

const typeDefs = [...scalarTypeDefs, ...customTypeDefs];

// Create activity ranking service instance
const activityRankingService = new ActivityRankingService();

const resolvers = {
  Query: {
    searchLocations: (
      _: unknown,
      { query, limit }: { query: string; limit: number }
    ) => {
      return getLocationService().searchLocations(query, limit);
    },

    getRankedActivities: async (
      _: unknown,
      {
        location,
        range,
        activities,
      }: {
        location: {
          name?: string;
          latitude?: number;
          longitude?: number;
          timezone?: string;
        };
        range?: {
          start: Date;
          end: Date;
        };
        activities?: ActivityKind[];
      }
    ) => {
      try {
        console.log("getRankedActivities called with:", {
          location,
          range,
          activities,
        });

        // Resolve location coordinates
        let lat: number, lng: number, timezone: string | undefined;

        if (location.latitude && location.longitude) {
          lat = location.latitude;
          lng = location.longitude;
          timezone = location.timezone;
        } else if (location.name) {
          // Search for location by name
          const locations = await getLocationService().searchLocations(
            location.name,
            1
          );
          if (locations.length === 0) {
            throw new Error(`Location not found: ${location.name}`);
          }
          lat = locations[0].latitude;
          lng = locations[0].longitude;
          timezone = locations[0].timezone;
        } else {
          throw new Error(
            "Either location coordinates or name must be provided"
          );
        }

        // Set default date range if not provided (7 days starting today)
        const startDate = range?.start || new Date();
        const endDate =
          range?.end ||
          (() => {
            const end = new Date(startDate);
            end.setDate(startDate.getDate() + 6); // 7 days total
            return end;
          })();

        console.log(
          `Fetching weather for: ${lat}, ${lng} from ${
            startDate.toISOString().split("T")[0]
          } to ${endDate.toISOString().split("T")[0]}`
        );

        // Fetch weather data
        const weatherData = await weatherService.getWeatherForecast({
          latitude: lat,
          longitude: lng,
          startDate: WeatherService.formatDate(startDate),
          endDate: WeatherService.formatDate(endDate),
          timezone: timezone || "auto",
        });

        console.log(
          `Retrieved weather data for ${weatherData.daily.length} days`
        );

        // Rank activities based on weather
        const rankedActivities = activityRankingService.rankActivities(
          weatherData.daily,
          activities,
          { latitude: lat, longitude: lng }
        );

        console.log(`Ranked ${rankedActivities.activities.length} activities`);

        return rankedActivities;
      } catch (error) {
        console.error("Error in getRankedActivities:", error);
        throw new Error(
          `Failed to get ranked activities: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },

    getWeatherForecast: async (
      _: unknown,
      {
        location,
        range,
      }: {
        location: {
          name?: string;
          latitude?: number;
          longitude?: number;
          timezone?: string;
        };
        range?: {
          start: Date;
          end: Date;
        };
      }
    ) => {
      try {
        // Resolve location coordinates (similar logic as above)
        let lat: number, lng: number, timezone: string | undefined;

        if (location.latitude && location.longitude) {
          lat = location.latitude;
          lng = location.longitude;
          timezone = location.timezone;
        } else if (location.name) {
          const locations = await getLocationService().searchLocations(
            location.name,
            1
          );
          if (locations.length === 0) {
            throw new Error(`Location not found: ${location.name}`);
          }
          lat = locations[0].latitude;
          lng = locations[0].longitude;
          timezone = locations[0].timezone;
        } else {
          throw new Error(
            "Either location coordinates or name must be provided"
          );
        }

        // Set default date range if not provided
        const startDate = range?.start || new Date();
        const endDate =
          range?.end ||
          (() => {
            const end = new Date(startDate);
            end.setDate(startDate.getDate() + 6);
            return end;
          })();

        // Fetch weather data
        const weatherData = await weatherService.getWeatherForecast({
          latitude: lat,
          longitude: lng,
          startDate: WeatherService.formatDate(startDate),
          endDate: WeatherService.formatDate(endDate),
          timezone: timezone || "auto",
        });

        return weatherData;
      } catch (error) {
        console.error("Error in getWeatherForecast:", error);
        throw new Error(
          `Failed to get weather forecast: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 8080 },
});

console.log(`🚀  Server ready at: ${url}`);
