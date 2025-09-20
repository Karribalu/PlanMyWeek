import { fetchWeatherApi } from "openmeteo";

/**
 * Interface for weather forecast request parameters
 */
export interface WeatherForecastParams {
  latitude: number;
  longitude: number;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  timezone?: string;
}

/**
 * Interface for daily weather data returned by the service
 */
export interface DailyWeatherData {
  date: Date;
  minTempC: number;
  maxTempC: number;
  meanTempC: number;
  snowfallCm: number;
  precipitationMm: number;
  windSpeedKph: number;
  windGustKph: number;
  waveHeightM?: number;
  cloudCoverPct: number;
  sunshineHours: number;
  humidityPct: number;
  pressureMsl: number;
  freezeLevelMeters?: number;
  // Marine weather data for surfing
  marineData?: {
    waveHeightMax: number;
    wavePeriod: number;
    waveDirection: number;
    swellWaveHeight: number;
    swellWavePeriod: number;
    swellWaveDirection: number;
    windWaveHeight: number;
    windWavePeriod: number;
    windWaveDirection: number;
  };
}

/**
 * Interface for complete weather forecast response
 */
export interface WeatherForecastResponse {
  location: {
    latitude: number;
    longitude: number;
    elevation: number;
    timezone: string;
  };
  daily: DailyWeatherData[];
  generatedAt: Date;
  provider: string;
}

/**
 * Fetches comprehensive weather data from Open-Meteo API
 */
export class WeatherService {
  /**
   * Check if location is likely coastal based on coordinates
   * This is a comprehensive heuristic covering major coastal regions worldwide
   * Could be enhanced with proper coastline distance calculations for precision
   */
  private isCoastalLocation(latitude: number, longitude: number): boolean {
    // Comprehensive coverage of global coastal regions and surfing hotspots
    const coastalRegions = [
      // === EUROPE ===
      // Atlantic Coast - Spain, Portugal, France, UK, Ireland, Norway
      {
        latMin: 35,
        latMax: 71,
        lonMin: -10,
        lonMax: 15,
        name: "Europe Atlantic",
      },
      // Mediterranean Sea - Spain, France, Italy, Greece, Turkey
      { latMin: 30, latMax: 47, lonMin: -6, lonMax: 42, name: "Mediterranean" },
      // Baltic Sea - Scandinavia, Baltic States
      { latMin: 53, latMax: 66, lonMin: 10, lonMax: 30, name: "Baltic Sea" },
      // North Sea - UK, Netherlands, Denmark, Germany
      { latMin: 51, latMax: 62, lonMin: -4, lonMax: 12, name: "North Sea" },

      // === NORTH AMERICA ===
      // US East Coast - Maine to Florida
      {
        latMin: 25,
        latMax: 45,
        lonMin: -85,
        lonMax: -65,
        name: "US East Coast",
      },
      // US West Coast - California to Washington
      {
        latMin: 32,
        latMax: 49,
        lonMin: -125,
        lonMax: -115,
        name: "US West Coast",
      },
      // US Gulf Coast - Texas to Florida
      {
        latMin: 25,
        latMax: 31,
        lonMin: -98,
        lonMax: -80,
        name: "US Gulf Coast",
      },
      // Canada East Coast - Maritimes, Newfoundland
      {
        latMin: 43,
        latMax: 60,
        lonMin: -70,
        lonMax: -52,
        name: "Canada East Coast",
      },
      // Canada West Coast - British Columbia
      {
        latMin: 48,
        latMax: 60,
        lonMin: -135,
        lonMax: -122,
        name: "Canada West Coast",
      },
      // Alaska Coast
      {
        latMin: 55,
        latMax: 72,
        lonMin: -170,
        lonMax: -130,
        name: "Alaska Coast",
      },
      // Mexico Pacific Coast
      {
        latMin: 14,
        latMax: 32,
        lonMin: -118,
        lonMax: -92,
        name: "Mexico Pacific",
      },
      // Mexico Gulf/Caribbean Coast
      {
        latMin: 16,
        latMax: 26,
        lonMin: -98,
        lonMax: -84,
        name: "Mexico Caribbean",
      },

      // === CENTRAL AMERICA & CARIBBEAN ===
      // Central America Pacific
      {
        latMin: 7,
        latMax: 18,
        lonMin: -95,
        lonMax: -77,
        name: "Central America Pacific",
      },
      // Central America Caribbean
      {
        latMin: 7,
        latMax: 18,
        lonMin: -85,
        lonMax: -77,
        name: "Central America Caribbean",
      },
      // Caribbean Islands
      {
        latMin: 10,
        latMax: 27,
        lonMin: -85,
        lonMax: -59,
        name: "Caribbean Islands",
      },

      // === SOUTH AMERICA ===
      // South America Pacific Coast - Chile, Peru, Ecuador, Colombia
      {
        latMin: -55,
        latMax: 12,
        lonMin: -85,
        lonMax: -65,
        name: "South America Pacific",
      },
      // South America Atlantic Coast - Argentina, Uruguay, Brazil
      {
        latMin: -55,
        latMax: 12,
        lonMin: -70,
        lonMax: -34,
        name: "South America Atlantic",
      },
      // Brazil Northeast Coast (extended)
      {
        latMin: -20,
        latMax: 5,
        lonMin: -45,
        lonMax: -32,
        name: "Brazil Northeast",
      },

      // === AFRICA ===
      // West Africa Atlantic - Morocco to Angola
      {
        latMin: -20,
        latMax: 35,
        lonMin: -20,
        lonMax: 20,
        name: "West Africa Atlantic",
      },
      // East Africa Indian Ocean - Somalia to South Africa
      {
        latMin: -35,
        latMax: 15,
        lonMin: 20,
        lonMax: 52,
        name: "East Africa Indian Ocean",
      },
      // South Africa Coast
      {
        latMin: -35,
        latMax: -28,
        lonMin: 15,
        lonMax: 35,
        name: "South Africa Coast",
      },
      // Madagascar
      { latMin: -26, latMax: -11, lonMin: 43, lonMax: 51, name: "Madagascar" },

      // === ASIA PACIFIC ===
      // Japan
      { latMin: 24, latMax: 46, lonMin: 123, lonMax: 146, name: "Japan" },
      // Korea
      { latMin: 33, latMax: 39, lonMin: 124, lonMax: 132, name: "Korea" },
      // China Coast
      { latMin: 18, latMax: 41, lonMin: 108, lonMax: 125, name: "China Coast" },
      // Southeast Asia - Thailand, Vietnam, Malaysia, Philippines
      {
        latMin: -10,
        latMax: 25,
        lonMin: 95,
        lonMax: 127,
        name: "Southeast Asia",
      },
      // Indonesia
      { latMin: -11, latMax: 6, lonMin: 95, lonMax: 141, name: "Indonesia" },
      // India West Coast
      {
        latMin: 8,
        latMax: 23,
        lonMin: 68,
        lonMax: 77,
        name: "India West Coast",
      },
      // India East Coast
      {
        latMin: 8,
        latMax: 22,
        lonMin: 77,
        lonMax: 88,
        name: "India East Coast",
      },
      // Sri Lanka
      { latMin: 5, latMax: 10, lonMin: 79, lonMax: 82, name: "Sri Lanka" },

      // === OCEANIA ===
      // Australia - comprehensive coverage
      { latMin: -45, latMax: -10, lonMin: 110, lonMax: 155, name: "Australia" },
      // New Zealand
      {
        latMin: -48,
        latMax: -34,
        lonMin: 166,
        lonMax: 179,
        name: "New Zealand",
      },
      // Pacific Islands - Fiji, Samoa, Tonga, etc.
      {
        latMin: -25,
        latMax: -5,
        lonMin: 160,
        lonMax: -160,
        name: "Pacific Islands South",
      },
      // Pacific Islands - Hawaii, Guam, etc.
      {
        latMin: 5,
        latMax: 25,
        lonMin: 140,
        lonMax: -140,
        name: "Pacific Islands North",
      },
      // Hawaii (specific)
      { latMin: 18, latMax: 23, lonMin: -162, lonMax: -154, name: "Hawaii" },

      // === MIDDLE EAST ===
      // Persian Gulf
      { latMin: 24, latMax: 30, lonMin: 46, lonMax: 57, name: "Persian Gulf" },
      // Red Sea
      { latMin: 12, latMax: 30, lonMin: 32, lonMax: 45, name: "Red Sea" },

      // === ARCTIC REGIONS ===
      // Greenland
      { latMin: 59, latMax: 84, lonMin: -75, lonMax: -10, name: "Greenland" },
      // Iceland
      { latMin: 63, latMax: 67, lonMin: -25, lonMax: -13, name: "Iceland" },
      // Arctic Russia
      {
        latMin: 65,
        latMax: 82,
        lonMin: 15,
        lonMax: 180,
        name: "Arctic Russia",
      },

      // === NOTABLE SURFING DESTINATIONS ===
      // Maldives
      { latMin: -1, latMax: 7, lonMin: 72, lonMax: 74, name: "Maldives" },
      // Canary Islands
      {
        latMin: 27,
        latMax: 29,
        lonMin: -18,
        lonMax: -13,
        name: "Canary Islands",
      },
      // Azores
      { latMin: 36, latMax: 40, lonMin: -32, lonMax: -24, name: "Azores" },
      // Cape Verde
      { latMin: 14, latMax: 18, lonMin: -26, lonMax: -22, name: "Cape Verde" },
      // Mentawai Islands (Indonesia)
      {
        latMin: -4,
        latMax: 0,
        lonMin: 98,
        lonMax: 101,
        name: "Mentawai Islands",
      },
      // Maldives Extended
      {
        latMin: -2,
        latMax: 8,
        lonMin: 71,
        lonMax: 75,
        name: "Maldives Extended",
      },
    ];

    const matchedRegions = coastalRegions.filter(
      (region) =>
        latitude >= region.latMin &&
        latitude <= region.latMax &&
        longitude >= region.lonMin &&
        longitude <= region.lonMax
    );

    if (matchedRegions.length > 0) {
      console.log(
        `Location identified as coastal: ${matchedRegions
          .map((r) => r.name)
          .join(", ")}`
      );
      return true;
    }

    return false;
  }

  /**
   * Fetch marine weather data for surfing predictions
   */
  private async getMarineWeatherData(
    params: WeatherForecastParams
  ): Promise<any[]> {
    if (!this.isCoastalLocation(params.latitude, params.longitude)) {
      console.log("Location not identified as coastal, skipping marine data");
      return [];
    }

    try {
      const marineUrl = "https://marine-api.open-meteo.com/v1/marine";

      const marineParams = {
        latitude: params.latitude,
        longitude: params.longitude,
        start_date: params.startDate,
        end_date: params.endDate,
        timezone: params.timezone || "auto",
        daily: [
          "wave_height_max",
          "wave_period_max",
          "wave_direction_dominant",
          "swell_wave_height_max",
          "swell_wave_period_max",
          "swell_wave_direction_dominant",
          "wind_wave_height_max",
          "wind_wave_period_max",
          "wind_wave_direction_dominant",
        ],
      };

      console.log(
        `Fetching marine data for: ${params.latitude}, ${params.longitude}, url: ${marineUrl}`
      );
      const marineResponses = await fetchWeatherApi(marineUrl, marineParams);

      if (marineResponses.length === 0) {
        console.log("No marine data available for this location");
        return [];
      }

      const marineResponse = marineResponses[0];
      const marineDaily = marineResponse.daily();

      if (!marineDaily) {
        console.log("No daily marine data available");
        return [];
      }

      // Parse marine time series
      const marineTimeRange = Array.from(
        {
          length: Math.floor(
            (Number(marineDaily.timeEnd()) - Number(marineDaily.time())) /
              marineDaily.interval()
          ),
        },
        (_, i) =>
          new Date(
            (Number(marineDaily.time()) +
              i * marineDaily.interval() +
              marineResponse.utcOffsetSeconds()) *
              1000
          )
      );

      // Extract marine variables (order must match the daily array in marineParams)
      const waveHeightMax = marineDaily.variables(0)?.valuesArray() || [];
      const wavePeriodMax = marineDaily.variables(1)?.valuesArray() || [];
      const waveDirectionDominant =
        marineDaily.variables(2)?.valuesArray() || [];
      const swellWaveHeightMax = marineDaily.variables(3)?.valuesArray() || [];
      const swellWavePeriodMax = marineDaily.variables(4)?.valuesArray() || [];
      const swellWaveDirectionDominant =
        marineDaily.variables(5)?.valuesArray() || [];
      const windWaveHeightMax = marineDaily.variables(6)?.valuesArray() || [];
      const windWavePeriodMax = marineDaily.variables(7)?.valuesArray() || [];
      const windWaveDirectionDominant =
        marineDaily.variables(8)?.valuesArray() || [];

      // Build marine data array
      const marineData = marineTimeRange.map((date, index) => ({
        date,
        waveHeightMax: waveHeightMax[index] || 0,
        wavePeriod: wavePeriodMax[index] || 0,
        waveDirection: waveDirectionDominant[index] || 0,
        swellWaveHeight: swellWaveHeightMax[index] || 0,
        swellWavePeriod: swellWavePeriodMax[index] || 0,
        swellWaveDirection: swellWaveDirectionDominant[index] || 0,
        windWaveHeight: windWaveHeightMax[index] || 0,
        windWavePeriod: windWavePeriodMax[index] || 0,
        windWaveDirection: windWaveDirectionDominant[index] || 0,
      }));

      console.log(
        `Retrieved marine data for ${marineData.length} days ${JSON.stringify(
          marineData
        )}`
      );
      return marineData;
    } catch (error) {
      console.log(
        "Failed to fetch marine data:",
        error instanceof Error ? error.message : "Unknown error"
      );
      return [];
    }
  }

  /**
   * Fetch weather forecast for activity ranking
   */
  public async getWeatherForecast(
    params: WeatherForecastParams
  ): Promise<WeatherForecastResponse> {
    // Use the forecast API instead of climate API for real-time data
    const url = "https://api.open-meteo.com/v1/forecast";

    const apiParams = {
      latitude: params.latitude,
      longitude: params.longitude,
      start_date: params.startDate,
      end_date: params.endDate,
      timezone: params.timezone || "auto",
      daily: [
        "temperature_2m_max",
        "temperature_2m_min",
        "temperature_2m_mean",
        "precipitation_sum",
        "snowfall_sum",
        "windspeed_10m_max",
        "windgusts_10m_max",
        "sunshine_duration",
        "cloudcover_mean",
        "relative_humidity_2m_mean",
        "pressure_msl_mean",
      ],
      // Add marine data if near coast (we'll try to get it, fallback if not available)
      marine: ["wave_height_max"].join(","),
    };

    try {
      const responses = await fetchWeatherApi(url, apiParams);

      if (responses.length === 0) {
        throw new Error("No weather data received from Open-Meteo API");
      }

      const response = responses[0];

      // Extract location metadata
      const latitude = response.latitude();
      const longitude = response.longitude();
      const elevation = response.elevation();
      const timezone = response.timezone();
      const utcOffsetSeconds = response.utcOffsetSeconds();

      console.log(
        `Weather data for: ${latitude}°N ${longitude}°E (${timezone})`
      );

      const daily = response.daily();
      if (!daily) {
        throw new Error("No daily weather data available");
      }

      // Parse the time series
      const timeRange = Array.from(
        {
          length: Math.floor(
            (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval()
          ),
        },
        (_, i) =>
          new Date(
            (Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) *
              1000
          )
      );

      // Extract weather variables (order must match the daily array in apiParams)
      const tempMax = daily.variables(0)?.valuesArray() || [];
      const tempMin = daily.variables(1)?.valuesArray() || [];
      const tempMean = daily.variables(2)?.valuesArray() || [];
      const precipitation = daily.variables(3)?.valuesArray() || [];
      const snowfall = daily.variables(4)?.valuesArray() || [];
      const windSpeed = daily.variables(5)?.valuesArray() || [];
      const windGusts = daily.variables(6)?.valuesArray() || [];
      const sunshine = daily.variables(7)?.valuesArray() || [];
      const cloudCover = daily.variables(8)?.valuesArray() || [];
      const humidity = daily.variables(9)?.valuesArray() || [];
      const pressure = daily.variables(10)?.valuesArray() || [];

      // Fetch marine data for coastal locations
      const marineData = await this.getMarineWeatherData(params);

      // Create a map for quick marine data lookup by date
      const marineDataMap = new Map();
      marineData.forEach((marine) => {
        const dateKey = marine.date.toISOString().split("T")[0];
        marineDataMap.set(dateKey, marine);
      });

      // Build daily weather data array
      const dailyData: DailyWeatherData[] = timeRange.map((date, index) => {
        const dateKey = date.toISOString().split("T")[0];
        const marineDayData = marineDataMap.get(dateKey);

        return {
          date,
          minTempC: tempMin[index] || 0,
          maxTempC: tempMax[index] || 0,
          meanTempC:
            tempMean[index] || (tempMin[index] + tempMax[index]) / 2 || 0,
          snowfallCm: (snowfall[index] || 0) / 10, // Convert mm to cm
          precipitationMm: precipitation[index] || 0,
          windSpeedKph: (windSpeed[index] || 0) * 3.6, // Convert m/s to km/h
          windGustKph: (windGusts[index] || 0) * 3.6, // Convert m/s to km/h
          waveHeightM: marineDayData?.waveHeightMax || undefined,
          cloudCoverPct: Math.round(cloudCover[index] || 0),
          sunshineHours: (sunshine[index] || 0) / 3600, // Convert seconds to hours
          humidityPct: Math.round(humidity[index] || 0),
          pressureMsl: pressure[index] || 1013.25, // Default to standard pressure
          freezeLevelMeters: undefined, // Could be calculated or fetched separately
          marineData: marineDayData
            ? {
                waveHeightMax: marineDayData.waveHeightMax,
                wavePeriod: marineDayData.wavePeriod,
                waveDirection: marineDayData.waveDirection,
                swellWaveHeight: marineDayData.swellWaveHeight,
                swellWavePeriod: marineDayData.swellWavePeriod,
                swellWaveDirection: marineDayData.swellWaveDirection,
                windWaveHeight: marineDayData.windWaveHeight,
                windWavePeriod: marineDayData.windWavePeriod,
                windWaveDirection: marineDayData.windWaveDirection,
              }
            : undefined,
        };
      });

      return {
        location: {
          latitude,
          longitude,
          elevation,
          timezone,
        },
        daily: dailyData,
        generatedAt: new Date(),
        provider: "Open-Meteo",
      };
    } catch (error) {
      console.error("Error fetching weather data:", error);
      throw new Error(
        `Failed to fetch weather data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Format date for Open-Meteo API (YYYY-MM-DD)
   */
  public static formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  /**
   * Get date range for the next N days
   */
  public static getDateRange(
    startDate: Date,
    days: number
  ): { startDate: string; endDate: string } {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + days - 1);

    return {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
    };
  }
}

// Export singleton instance
export const weatherService = new WeatherService();
