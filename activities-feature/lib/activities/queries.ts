// NOTE: adjust this import to wherever your existing Supabase server client lives.
import { createClient } from "@/lib/supabase/server";
import type { Activity, Fixture } from "@/lib/types/activities";

export async function getActivities(): Promise<Activity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getActivity(id: string): Promise<Activity | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("id", id)
    .single();

  return data;
}

export async function getFixturesForActivity(activityId: string): Promise<Fixture[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fixtures")
    .select("*")
    .eq("activity_id", activityId)
    .order("match_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
