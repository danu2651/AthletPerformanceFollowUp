export interface User {
  id: number;
  name: string;
  email: string;
  role: "athlete" | "coach" | "admin";
  full_name?: string;
  gender?: string;
  birth_date?: string;
  height_cm?: number;
  weight_kg?: number;
  preferred_unit?: "metric" | "imperial";
  created_at?: string;
}

export interface TrainingType {
  id: number;
  name: string;
  description?: string;
}

export interface KilometerSplit {
  kilometer_number: number;
  split_seconds: number;
  split_minutes?: number;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  recorded_at: string;
}

export interface TrainingSession {
  id: number;
  user_id: number;
  training_type_id: number;
  training_type_name?: string;
  start_point?: string;
  end_point?: string;
  distance_km?: number;
  duration_seconds: number;
  temperature_c?: number;
  training_date: string;
  notes?: string;
  altitude?: number;
  avg_speed?: number;
  avg_pace?: number;
  avg_speed_kmh?: number;
  avg_pace_seconds?: number;
  calories_burned?: number;
  created_at: string;
  updated_at?: string;
  kilometer_splits?: KilometerSplit[];
  route_points?: RoutePoint[];
}

export interface SessionFormData {
  training_type_id: number;
  start_point: string;
  end_point: string;
  distance_km: number | "";
  duration_seconds: number | "";
  temperature_c: number | "";
  training_date: string;
  notes: string;
  altitude: number | "";
  kilometer_splits: KilometerSplit[];
}

export interface DashboardSummary {
  overall: {
    total_sessions: number;
    total_distance_km: number;
    total_duration_seconds: number;
    avg_speed_kmh: number;
    best_pace_sec_per_km: number;
  };
  this_week: {
    distance_km: number;
    duration_seconds: number;
    sessions: number;
  };
  this_month: {
    distance_km: number;
    duration_seconds: number;
    sessions: number;
  };
  by_training_type: Array<{
    training_type: string;
    sessions: number;
    total_distance_km: number;
  }>;
}

export interface TrendData {
  period_start: string;
  total_distance_km: number;
  total_duration_seconds: number;
  sessions: number;
  avg_speed_kmh: number;
  avg_pace_sec_per_km: number;
}

export interface WeeklySummary {
  week_start_date: string;
  total_distance_km: number;
  total_duration_seconds: number;
  total_sessions: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: Pagination;
}
