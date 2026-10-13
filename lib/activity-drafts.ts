import type { SupabaseClient } from "@supabase/supabase-js";

export interface DraftTeam {
  id: string; // real id, or "tmp-..." for teams that only exist in the draft
  name: string;
  group_name: string | null;
  played: number; won: number; drawn: number; lost: number;
  goals_for: number; goals_against: number; goal_difference: number; points: number;
}

export interface DraftFixture {
  id: string; 
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string; 
  location: string | null;
  status: string;
}

export interface DraftData { teams: DraftTeam[]; fixtures: DraftFixture[] }

const localKey = (activityId: string) => `mris-activity-draft:${activityId}`;

export async function loadDraft(supabase: SupabaseClient, activityId: string): Promise<{ draft: DraftData | null; shared: boolean }> {
  const { data, error } = await supabase.from("activity_drafts").select("data").eq("activity_id", activityId).maybeSingle();
  if (!error) return { draft: (data?.data as DraftData) ?? null, shared: true };
  try {
    const raw = localStorage.getItem(localKey(activityId));
    return { draft: raw ? (JSON.parse(raw) as DraftData) : null, shared: false };
  } catch {
    return { draft: null, shared: false };
  }
}

export async function saveDraft(supabase: SupabaseClient, activityId: string, draft: DraftData, shared: boolean) {
  if (shared) {
    const { error } = await supabase.from("activity_drafts").upsert({ activity_id: activityId, data: draft, updated_at: new Date().toISOString() });
    if (error) console.error("Saving draft failed:", error);
    return;
  }
  try { localStorage.setItem(localKey(activityId), JSON.stringify(draft)); } catch { /* storage full or blocked */ }
}

export async function clearDraft(supabase: SupabaseClient, activityId: string, shared: boolean) {
  if (shared) {
    const { error } = await supabase.from("activity_drafts").delete().eq("activity_id", activityId);
    if (error) console.error("Clearing draft failed:", error);
    return;
  }
  try { localStorage.removeItem(localKey(activityId)); } catch { /* ignore */ }
}