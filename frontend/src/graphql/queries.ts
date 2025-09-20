import { gql } from "@apollo/client";

export const SEARCH_LOCATIONS = gql`
  query SearchLocations($q: String!) {
    searchLocations(query: $q) {
      name
      country
      latitude
      longitude
      timezone
    }
  }
`;

export const GET_RANKED_ACTIVITIES = gql`
  query GetRankedActivities($lat: Latitude!, $lng: Longitude!) {
    getRankedActivities(location: { latitude: $lat, longitude: $lng }) {
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
`;
