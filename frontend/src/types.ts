export interface LocationSuggestion {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string | null;
}

export interface DailyActivityScoreUI {
  date: string; // ISO string
  score: number; // 0-100
  reasons: string[];
}

export interface ActivityRankingUI {
  activity: string; // ActivityKind enum string
  overallScore: number;
  daily: DailyActivityScoreUI[];
}

export interface RankedActivitiesResultUI {
  activities: ActivityRankingUI[];
  period: { start: string; end: string };
  location: { latitude: number; longitude: number };
}
