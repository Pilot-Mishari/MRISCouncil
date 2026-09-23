export type ActivityStatus = "upcoming" | "ongoing" | "completed";
export type FixtureStatus = "scheduled" | "completed" | "postponed" | "cancelled";

export interface Activity {
  id: string;
  title: string;
  type: string;
  description: string | null;
  status: ActivityStatus;
  created_at: string;
}

export interface Fixture {
  id: string;
  activity_id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string;
  status: FixtureStatus;
  notes: string | null;
}
