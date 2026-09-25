import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import ActivityTabs from "@/components/ActivityTabs";

export default async function ActivityDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: activity } = await supabase.from("activities").select("*").eq("id", id).single();
  if (!activity) notFound();

  const { data: teams } = await supabase.from("teams").select("*").eq("activity_id", id).order("name");
  const { data: fixtures } = await supabase.from("fixtures").select("*").eq("activity_id", id).order("match_date");
  const upcoming = (fixtures ?? []).filter((f) => f.status !== "completed");
  const past = (fixtures ?? []).filter((f) => f.status === "completed");

  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <h2 className="text-3xl font-black uppercase text-blue-900 dark:text-blue-100">{activity.title}</h2>
      <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mt-1">{activity.type} · {activity.status}</p>
      {activity.description && <p className="mt-4 text-blue-700 dark:text-blue-300">{activity.description}</p>}

      <ActivityTabs teams={teams ?? []} upcoming={upcoming} past={past} />
    </div>
  );
}