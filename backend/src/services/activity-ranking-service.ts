/**
 * Activity Ranking Service
 *
 * This service implements a comprehensive algorithm to rank outd  [ActivityKind.SURFING]: {
    idealTempRange: [15, 28],
    acceptableTempRange: [10, 35],
    maxPrecipitation: 5, // Light rain okay, heavy rain problematic
    maxWindSpeed: 35, // Moderate wind can be good for waves, but too much is dangerous
    maxWindGust: 50,
    idealCloudCover: [0, 50],
    minSunshineHours: 4,
    requiresWaves: true,
    prefersDryConditions: true
  },oor activities
 * based on weather conditions. It takes weather forecast data and determines the
 * suitability of different activities for each day in the given date range.
 */
import {
  ActivityKind,
  type DailyWeatherData,
  type DailyActivityScore,
  type ActivityRanking,
  type RankedActivitiesResult,
} from "../types/index.js";

/**
 * Weather scoring criteria for each activity type
 */
interface ActivityWeatherCriteria {
  // Temperature preferences (in Celsius)
  idealTempRange: [number, number];
  acceptableTempRange: [number, number];

  // Precipitation tolerance (mm per day)
  maxPrecipitation: number;

  // Wind tolerance (km/h)
  maxWindSpeed: number;
  maxWindGust: number;

  // Cloud cover preference (0-100%)
  idealCloudCover: [number, number];

  // Minimum sunshine hours
  minSunshineHours: number;

  // Special requirements
  requiresSnow?: boolean;
  requiresWaves?: boolean;
  prefersDryConditions?: boolean;
  indoorFallback?: boolean;
}

/**
 * Activity-specific weather criteria
 */
const ACTIVITY_CRITERIA: Record<ActivityKind, ActivityWeatherCriteria> = {
  [ActivityKind.SKIING]: {
    idealTempRange: [-10, 2],
    acceptableTempRange: [-20, 8],
    maxPrecipitation: 15, // Light snow is good, heavy rain is bad
    maxWindSpeed: 25,
    maxWindGust: 40,
    idealCloudCover: [30, 80], // Some clouds for snow, but not overcast
    minSunshineHours: 2,
    requiresSnow: true,
    prefersDryConditions: false,
  },

  [ActivityKind.SURFING]: {
    idealTempRange: [15, 28],
    acceptableTempRange: [10, 35],
    maxPrecipitation: 5, // Light rain okay, heavy rain problematic
    maxWindSpeed: 30, // Moderate wind can be good for waves
    maxWindGust: 45,
    idealCloudCover: [0, 50],
    minSunshineHours: 4,
    requiresWaves: true,
    prefersDryConditions: true,
  },

  [ActivityKind.OUTDOOR_SIGHTSEEING]: {
    idealTempRange: [15, 25],
    acceptableTempRange: [5, 30],
    maxPrecipitation: 2, // Very sensitive to rain
    maxWindSpeed: 20,
    maxWindGust: 35,
    idealCloudCover: [0, 40], // Clear to partly cloudy
    minSunshineHours: 6,
    prefersDryConditions: true,
  },

  [ActivityKind.INDOOR_SIGHTSEEING]: {
    idealTempRange: [10, 30], // Less temperature sensitive
    acceptableTempRange: [-5, 40],
    maxPrecipitation: 50, // Rain actually makes this more appealing
    maxWindSpeed: 50, // Not affected by wind
    maxWindGust: 80,
    idealCloudCover: [0, 100], // Not affected by cloud cover
    minSunshineHours: 0,
    indoorFallback: true,
  },
};

export class ActivityRankingService {
  /**
   * Main method to rank activities based on weather forecast
   */
  public rankActivities(
    weatherData: DailyWeatherData[],
    requestedActivities?: ActivityKind[],
    location?: { latitude: number; longitude: number }
  ): RankedActivitiesResult {
    // Use default activities if none specified
    const activities =
      requestedActivities || (Object.keys(ACTIVITY_CRITERIA) as ActivityKind[]);

    const rankings: ActivityRanking[] = activities.map((activity) => {
      const dailyScores = weatherData.map((dayWeather) =>
        this.calculateDailyScore(activity, dayWeather, location)
      );

      const overallScore = this.calculateOverallScore(dailyScores);

      return {
        activity,
        overallScore,
        daily: dailyScores,
      };
    });

    // Sort by overall score (highest first)
    rankings.sort((a, b) => b.overallScore - a.overallScore);

    return {
      activities: rankings,
      period: {
        start: weatherData[0]?.date || new Date(),
        end: weatherData[weatherData.length - 1]?.date || new Date(),
      },
      location: location || { latitude: 0, longitude: 0 },
    };
  }

  /**
   * Calculate activity score for a single day
   */
  private calculateDailyScore(
    activity: ActivityKind,
    weather: DailyWeatherData,
    location?: { latitude: number; longitude: number }
  ): DailyActivityScore {
    const criteria = ACTIVITY_CRITERIA[activity];
    const reasons: string[] = [];
    let score = 100; // Start with perfect score and deduct points

    // Temperature scoring
    const tempScore = this.scoreTemperature(
      weather.meanTempC,
      criteria,
      reasons
    );
    score = Math.min(score, tempScore);

    // Precipitation scoring
    const precipScore = this.scorePrecipitation(
      weather.precipitationMm,
      criteria,
      reasons
    );
    score = Math.min(score, precipScore);

    // Wind scoring - pass marine data for surfing activities
    const windScore = this.scoreWind(
      weather.windSpeedKph,
      weather.windGustKph,
      criteria,
      reasons,
      activity === ActivityKind.SURFING ? weather.marineData : undefined
    );
    score = Math.min(score, windScore);

    // Cloud cover and sunshine scoring
    const sunScore = this.scoreSunshine(
      weather.cloudCoverPct,
      weather.sunshineHours,
      criteria,
      reasons
    );
    score = Math.min(score, sunScore);

    // Special requirements scoring
    const specialScore = this.scoreSpecialRequirements(
      activity,
      weather,
      location,
      reasons
    );
    score = Math.min(score, specialScore);

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    return {
      date: weather.date,
      score: Math.round(score * 100) / 100, // Round to 2 decimal places
      reasons: reasons.filter((reason) => reason.length > 0),
    };
  }

  /**
   * Score temperature suitability
   */
  private scoreTemperature(
    temp: number,
    criteria: ActivityWeatherCriteria,
    reasons: string[]
  ): number {
    const [idealMin, idealMax] = criteria.idealTempRange;
    const [acceptableMin, acceptableMax] = criteria.acceptableTempRange;

    if (temp >= idealMin && temp <= idealMax) {
      reasons.push(`Ideal temperature: ${temp}°C`);
      return 100;
    }

    if (temp >= acceptableMin && temp <= acceptableMax) {
      const distanceFromIdeal = Math.min(
        Math.abs(temp - idealMin),
        Math.abs(temp - idealMax)
      );
      const maxDistance = Math.max(
        idealMin - acceptableMin,
        acceptableMax - idealMax
      );
      const score = 100 - (distanceFromIdeal / maxDistance) * 30;
      reasons.push(`Acceptable temperature: ${temp}°C`);
      return score;
    }

    reasons.push(`Poor temperature: ${temp}°C (outside acceptable range)`);
    return Math.max(0, 40 - Math.abs(temp - (idealMin + idealMax) / 2) * 2);
  }

  /**
   * Score precipitation impact
   */
  private scorePrecipitation(
    precipitation: number,
    criteria: ActivityWeatherCriteria,
    reasons: string[]
  ): number {
    if (precipitation <= criteria.maxPrecipitation / 4) {
      if (precipitation > 0) {
        reasons.push(`Light precipitation: ${precipitation}mm`);
      }
      return 100;
    }

    if (precipitation <= criteria.maxPrecipitation) {
      const score =
        100 -
        ((precipitation - criteria.maxPrecipitation / 4) /
          (criteria.maxPrecipitation * 0.75)) *
          50;
      reasons.push(`Moderate precipitation: ${precipitation}mm`);
      return score;
    }

    reasons.push(`Heavy precipitation: ${precipitation}mm`);
    return Math.max(0, 30 - (precipitation - criteria.maxPrecipitation) * 2);
  }

  /**
   * Score wind conditions
   */
  private scoreWind(
    windSpeed: number,
    windGust: number,
    criteria: ActivityWeatherCriteria,
    reasons: string[],
    marineData?: DailyWeatherData["marineData"]
  ): number {
    // For surfing activities, use marine wind data if available
    if (marineData) {
      return this.scoreMarineWind(marineData, criteria, reasons);
    }

    // Check wind speed
    if (windSpeed > criteria.maxWindSpeed) {
      reasons.push(`High wind speed: ${windSpeed} km/h`);
      return Math.max(0, 100 - (windSpeed - criteria.maxWindSpeed) * 3);
    }

    // Check wind gusts
    if (windGust > criteria.maxWindGust) {
      reasons.push(`Strong wind gusts: ${windGust} km/h`);
      return Math.max(0, 100 - (windGust - criteria.maxWindGust) * 2);
    }

    if (windSpeed <= criteria.maxWindSpeed / 2) {
      reasons.push(`Calm wind conditions: ${windSpeed} km/h`);
      return 100;
    }

    return (
      100 -
      ((windSpeed - criteria.maxWindSpeed / 2) / (criteria.maxWindSpeed / 2)) *
        20
    );
  }

  /**
   * Score sunshine and cloud cover
   */
  private scoreSunshine(
    cloudCover: number,
    sunshineHours: number,
    criteria: ActivityWeatherCriteria,
    reasons: string[]
  ): number {
    let score = 100;

    // Check sunshine hours
    if (sunshineHours < criteria.minSunshineHours) {
      const deficit = criteria.minSunshineHours - sunshineHours;
      score -= deficit * 15; // Deduct 15 points per missing sunshine hour
      reasons.push(
        `Limited sunshine: ${sunshineHours}h (need ${criteria.minSunshineHours}h)`
      );
    } else {
      reasons.push(`Good sunshine: ${sunshineHours}h`);
    }

    // Check cloud cover
    const [idealCloudMin, idealCloudMax] = criteria.idealCloudCover;
    if (cloudCover < idealCloudMin || cloudCover > idealCloudMax) {
      const cloudDistance = Math.min(
        Math.abs(cloudCover - idealCloudMin),
        Math.abs(cloudCover - idealCloudMax)
      );
      score -= cloudDistance * 0.5; // Deduct 0.5 points per percentage point away from ideal

      if (cloudCover > 80) {
        reasons.push(`Very cloudy: ${cloudCover}%`);
      } else if (cloudCover < 20) {
        reasons.push(`Very clear: ${cloudCover}%`);
      }
    }

    return Math.max(0, score);
  }

  /**
   * Score special activity requirements
   */
  private scoreSpecialRequirements(
    activity: ActivityKind,
    weather: DailyWeatherData,
    location?: { latitude: number; longitude: number },
    reasons: string[] = []
  ): number {
    const criteria = ACTIVITY_CRITERIA[activity];

    // Skiing requires snow
    if (activity === ActivityKind.SKIING) {
      if (weather.snowfallCm > 5) {
        reasons.push(`Fresh snow: ${weather.snowfallCm}cm`);
        return 100;
      } else if (weather.snowfallCm > 0) {
        reasons.push(`Light snow: ${weather.snowfallCm}cm`);
        return 80;
      } else if (weather.meanTempC < 0 && weather.precipitationMm > 0) {
        reasons.push(`Cold with precipitation - potential for snow`);
        return 60;
      } else if (weather.meanTempC < 5) {
        reasons.push(`Cold weather - may have existing snow`);
        return 40;
      } else {
        reasons.push(`No snow and warm weather`);
        return 20;
      }
    }

    // Enhanced surfing predictions with marine data
    if (activity === ActivityKind.SURFING) {
      return this.scoreSurfingConditions(weather, reasons);
    }

    // Indoor activities benefit from poor outdoor conditions
    if (activity === ActivityKind.INDOOR_SIGHTSEEING) {
      if (weather.precipitationMm > 10 || weather.windSpeedKph > 30) {
        reasons.push(`Poor outdoor conditions - perfect for indoor activities`);
        return 100;
      } else if (weather.precipitationMm > 5 || weather.cloudCoverPct > 80) {
        reasons.push(`Overcast conditions - good for indoor activities`);
        return 85;
      }
    }

    return 100; // No special requirements or they're met
  }

  /**
   * Calculate overall score from daily scores
   */
  private calculateOverallScore(dailyScores: DailyActivityScore[]): number {
    if (dailyScores.length === 0) return 0;

    const totalScore = dailyScores.reduce((sum, day) => sum + day.score, 0);
    return Math.round((totalScore / dailyScores.length) * 100) / 100;
  }

  /**
   * Enhanced surfing condition scoring using marine weather data
   */
  private scoreSurfingConditions(
    weather: DailyWeatherData,
    reasons: string[]
  ): number {
    let score = 100;
    let hasMarineData = false;

    // Check if we have detailed marine data
    if (weather.marineData) {
      hasMarineData = true;
      const marine = weather.marineData;

      // Score wave height (most important factor)
      const waveScore = this.scoreWaveHeight(marine.waveHeightMax, reasons);
      score = Math.min(score, waveScore);

      // Score wave period (important for wave quality)
      const periodScore = this.scoreWavePeriod(marine.wavePeriod, reasons);
      score = Math.min(score, periodScore);

      // Score swell conditions (better than wind waves)
      const swellScore = this.scoreSwellConditions(marine, reasons);
      score = Math.min(score, swellScore);

      // Wind-wave relationship scoring using marine wind data
      const windWaveScore = this.scoreWindWaveRelation(marine, reasons);
      score = Math.min(score, windWaveScore);
    } else if (weather.waveHeightM !== undefined) {
      // Fallback to basic wave height if available
      hasMarineData = false;
      if (weather.waveHeightM > 1.5) {
        reasons.push(`Good waves: ${weather.waveHeightM}m`);
        score = 90;
      } else if (weather.waveHeightM > 0.8) {
        reasons.push(`Moderate waves: ${weather.waveHeightM}m`);
        score = 70;
      } else if (weather.waveHeightM > 0.3) {
        reasons.push(`Small waves: ${weather.waveHeightM}m`);
        score = 40;
      } else {
        reasons.push(`Very small waves: ${weather.waveHeightM}m`);
        score = 20;
      }
    } else {
      // No wave data available - estimate based on wind
      hasMarineData = false;
      if (weather.windSpeedKph > 20) {
        reasons.push(
          `Strong wind may generate waves: ${weather.windSpeedKph} km/h`
        );
        score = 60;
      } else if (weather.windSpeedKph > 10) {
        reasons.push(
          `Moderate wind may generate small waves: ${weather.windSpeedKph} km/h`
        );
        score = 40;
      } else {
        reasons.push(
          `Low wind - likely flat conditions: ${weather.windSpeedKph} km/h`
        );
        score = 20;
      }
    }

    // Add bonus for having detailed marine data
    if (hasMarineData) {
      reasons.push(`Detailed marine forecast available`);
      score = Math.min(100, score + 5);
    }

    return Math.max(0, score);
  }

  /**
   * Score wave height for surfing
   */
  private scoreWaveHeight(waveHeight: number, reasons: string[]): number {
    if (waveHeight >= 2.5 && waveHeight <= 4.0) {
      reasons.push(`Excellent waves: ${waveHeight.toFixed(1)}m`);
      return 100;
    } else if (waveHeight >= 1.5 && waveHeight <= 6.0) {
      reasons.push(`Good waves: ${waveHeight.toFixed(1)}m`);
      return 85;
    } else if (waveHeight >= 0.8 && waveHeight <= 8.0) {
      reasons.push(`Surfable waves: ${waveHeight.toFixed(1)}m`);
      return 70;
    } else if (waveHeight >= 0.5) {
      reasons.push(`Small waves: ${waveHeight.toFixed(1)}m`);
      return 40;
    } else if (waveHeight > 8.0) {
      reasons.push(`Dangerous large waves: ${waveHeight.toFixed(1)}m`);
      return 20;
    } else {
      reasons.push(`Flat conditions: ${waveHeight.toFixed(1)}m`);
      return 10;
    }
  }

  /**
   * Score wave period for surfing quality
   */
  private scoreWavePeriod(period: number, reasons: string[]): number {
    if (period >= 12) {
      reasons.push(
        `Long period swell: ${period.toFixed(0)}s - excellent quality`
      );
      return 100;
    } else if (period >= 8) {
      reasons.push(`Good wave period: ${period.toFixed(0)}s`);
      return 85;
    } else if (period >= 6) {
      reasons.push(`Moderate wave period: ${period.toFixed(0)}s`);
      return 70;
    } else if (period >= 4) {
      reasons.push(
        `Short wave period: ${period.toFixed(0)}s - choppy conditions`
      );
      return 50;
    } else {
      reasons.push(`Very short period: ${period.toFixed(0)}s - poor quality`);
      return 30;
    }
  }

  /**
   * Score swell vs wind wave conditions
   */
  private scoreSwellConditions(marine: any, reasons: string[]): number {
    const swellHeight = marine.swellWaveHeight;
    const windWaveHeight = marine.windWaveHeight;
    const totalWaves = marine.waveHeightMax;

    if (swellHeight > 0 && totalWaves > 0) {
      const swellRatio = swellHeight / totalWaves;

      if (swellRatio > 0.7) {
        reasons.push(
          `Clean swell conditions: ${(swellRatio * 100).toFixed(0)}% swell`
        );
        return 100;
      } else if (swellRatio > 0.4) {
        reasons.push(
          `Mixed swell and wind waves: ${(swellRatio * 100).toFixed(0)}% swell`
        );
        return 75;
      } else {
        reasons.push(
          `Mostly wind waves: ${(swellRatio * 100).toFixed(
            0
          )}% swell - choppier conditions`
        );
        return 60;
      }
    }

    return 80; // Default if we can't calculate the ratio
  }

  /**
   * Score wind-wave relationship for surfing
   */
  private scoreWindWaveRelation(
    marine: NonNullable<DailyWeatherData["marineData"]>,
    reasons: string[]
  ): number {
    // Use marine wind wave height as indicator of wind strength over water
    const windWaveHeight = marine.windWaveHeight;

    if (windWaveHeight <= 0.5) {
      reasons.push(
        `Light marine winds: ${windWaveHeight.toFixed(
          1
        )}m wind waves - clean conditions`
      );
      return 100;
    } else if (windWaveHeight <= 1.0) {
      reasons.push(
        `Moderate marine winds: ${windWaveHeight.toFixed(
          1
        )}m wind waves - slightly textured`
      );
      return 85;
    } else if (windWaveHeight <= 1.5) {
      reasons.push(
        `Strong marine winds: ${windWaveHeight.toFixed(
          1
        )}m wind waves - choppy surface`
      );
      return 60;
    } else {
      reasons.push(
        `Very strong marine winds: ${windWaveHeight.toFixed(
          1
        )}m wind waves - blown out conditions`
      );
      return 30;
    }
  }

  /**
   * Score marine wind conditions for surfing
   */
  private scoreMarineWind(
    marineData: NonNullable<DailyWeatherData["marineData"]>,
    criteria: ActivityWeatherCriteria,
    reasons: string[]
  ): number {
    const windWaveHeight = marineData.windWaveHeight;
    const windWaveDirection = marineData.windWaveDirection;
    let score = 100;

    // Wind wave height indicates wind strength over water
    // Higher wind wave height = stronger winds = potentially worse for surfing
    if (windWaveHeight > 2.0) {
      reasons.push(
        `Strong marine winds: ${windWaveHeight.toFixed(1)}m wind waves`
      );
      score -= (windWaveHeight - 2.0) * 15; // Deduct points for strong winds
    } else if (windWaveHeight > 1.0) {
      reasons.push(
        `Moderate marine winds: ${windWaveHeight.toFixed(1)}m wind waves`
      );
      score -= (windWaveHeight - 1.0) * 10;
    } else if (windWaveHeight > 0.5) {
      reasons.push(
        `Light marine winds: ${windWaveHeight.toFixed(1)}m wind waves`
      );
      score -= (windWaveHeight - 0.5) * 5;
    } else {
      reasons.push(
        `Calm marine conditions: ${windWaveHeight.toFixed(1)}m wind waves`
      );
    }

    // Wind direction affects wave quality
    // Note: This is a simplified approach. In reality, we'd need to know the coastline
    // orientation to determine if winds are onshore/offshore
    // For now, we'll use wind direction as a general indicator
    const windDirection = windWaveDirection;
    if (windDirection >= 0 && windDirection <= 360) {
      // Add direction info to reasons for user awareness
      const directionNames = [
        "N",
        "NNE",
        "NE",
        "ENE",
        "E",
        "ESE",
        "SE",
        "SSE",
        "S",
        "SSW",
        "SW",
        "WSW",
        "W",
        "WNW",
        "NW",
        "NNW",
      ];
      const directionIndex = Math.round(windDirection / 22.5) % 16;
      reasons.push(
        `Wind direction: ${
          directionNames[directionIndex]
        } (${windDirection.toFixed(0)}°)`
      );
    }

    return Math.max(0, score);
  }

  /**
   * Get default activities
   */
  public static getDefaultActivities(): ActivityKind[] {
    return [
      ActivityKind.SKIING,
      ActivityKind.SURFING,
      ActivityKind.OUTDOOR_SIGHTSEEING,
      ActivityKind.INDOOR_SIGHTSEEING,
    ];
  }
}
