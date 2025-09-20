// Activity related shared types
export enum ActivityKind {
  SKIING = "SKIING",
  SURFING = "SURFING",
  OUTDOOR_SIGHTSEEING = "OUTDOOR_SIGHTSEEING",
  INDOOR_SIGHTSEEING = "INDOOR_SIGHTSEEING",
}

export interface DailyActivityScore {
  date: Date;
  score: number; // 0-100 scale
  reasons: string[];
}

export interface ActivityRanking {
  activity: ActivityKind;
  overallScore: number; // Average of all daily scores
  daily: DailyActivityScore[];
}

export interface RankedActivitiesResult {
  activities: ActivityRanking[];
  period: {
    start: Date;
    end: Date;
  };
  location: {
    latitude: number;
    longitude: number;
  };
}
