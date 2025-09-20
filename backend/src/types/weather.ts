// Weather related shared TypeScript interfaces
// These are consumed by services and GraphQL resolvers

export interface WeatherForecastParams {
  latitude: number;
  longitude: number;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  timezone?: string;
}

export interface MarineWeatherData {
  waveHeightMax: number;
  wavePeriod: number;
  waveDirection: number;
  swellWaveHeight: number;
  swellWavePeriod: number;
  swellWaveDirection: number;
  windWaveHeight: number;
  windWavePeriod: number;
  windWaveDirection: number;
}

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
  marineData?: MarineWeatherData; // Marine weather data for surfing
}

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
