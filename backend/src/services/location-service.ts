interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
  address?: {
    country?: string;
    country_code?: string;
    state?: string;
    city?: string;
    town?: string;
    village?: string;
  };
}

interface Location {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  source: string;
}

/**
 * Service for searching locations using OpenStreetMap's Nominatim API
 */
export class LocationService {
  private readonly baseUrl: string;
  private readonly userAgent = "PlanMyWeek/1.0 (weather-activity-ranking)";

  constructor() {
    this.baseUrl =
      process.env.PLACES_API_URL || "https://nominatim.openstreetmap.org";
  }

  /**
   * Search for locations using the Nominatim geocoding API
   * @param query - The search query string
   * @param limit - Maximum number of results to return (default: 5, max: 20)
   * @returns Promise<Location[]> - Array of location results
   */
  async searchLocations(query: string, limit: number = 5): Promise<Location[]> {
    console.log("Using Places API URL:", this.baseUrl);
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return [];
    }

    // Ensure limit is within reasonable bounds
    const safeLimit = Math.min(Math.max(limit, 1), 20);

    try {
      const searchUrl = new URL("/search", this.baseUrl);
      searchUrl.searchParams.set("q", trimmedQuery);
      searchUrl.searchParams.set("format", "json");
      searchUrl.searchParams.set("limit", safeLimit.toString());
      searchUrl.searchParams.set("addressdetails", "1");
      searchUrl.searchParams.set("dedupe", "1");
      // Focus on places that are cities, towns, or administrative areas
      searchUrl.searchParams.set("featuretype", "city");

      const response = await fetch(searchUrl.toString(), {
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Nominatim API returned ${response.status}: ${response.statusText}`
        );
      }

      const data: NominatimResponse[] = await response.json();

      return data.map(this.transformNominatimResult);
    } catch (error) {
      console.error("Error searching locations:", error);
      // Return empty array on error to gracefully handle API failures
      return [];
    }
  }

  /**
   * Transform a Nominatim API response into our Location format
   */
  private transformNominatimResult(result: NominatimResponse): Location {
    // Extract city/place name from display_name
    const displayParts = result.display_name.split(", ");
    const placeName = displayParts.slice(0, 3).join(", "); // Take first 3 parts for brevity

    // Get country from address or fall back to last part of display_name
    const country =
      result.address?.country_code?.toUpperCase() ||
      result.address?.country ||
      displayParts[displayParts.length - 1] ||
      "Unknown";

    // Convert coordinates to numbers
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);

    return {
      name: placeName,
      country: country,
      latitude: latitude,
      longitude: longitude,
      source: "nominatim",
    };
  }
}

// Lazy-loaded singleton instance
let _locationServiceInstance: LocationService | null = null;

export function getLocationService(): LocationService {
  if (!_locationServiceInstance) {
    _locationServiceInstance = new LocationService();
  }
  return _locationServiceInstance;
}

// Export the lazy-loaded instance for backward compatibility
export const locationService = getLocationService();
