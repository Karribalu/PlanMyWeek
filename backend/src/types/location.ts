// Location related shared types

export interface Location {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  source: string;
}
