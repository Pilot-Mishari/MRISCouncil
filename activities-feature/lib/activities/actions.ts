"use server";

// NOTE: adjust this import to wherever your existing Supabase server client lives.
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login"); // TODO: point this at your actual staff login route
  }

  // TODO: if you have a staff/role table, check it here too, e.g.:
  // const { data: profile } = await supabase
  //   .from("profiles")
  //   .select("role")
  //   .eq("id", user.id)
  //   .single();
  // if (profile?.role !== "staff") redirect("/");

  return { supabase, user };
}

export async function createActivity(formData: FormData) {
  const { supabase } = await requireStaff();

  const title = formData.get("title") as string;
  const type = formData.get("type") as string;
  const description = formData.get("description") as string;

  const { error } = await supabase.from("activities").insert({
    title,
    type: type || "general",
    description: description || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/activities");
  revalidatePath("/staff/activities");
}

export async function updateActivityStatus(activityId: string, formData: FormData) {
  const { supabase } = await requireStaff();
  const status = formData.get("status") as string;

  const { error } = await supabase
    .from("activities")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", activityId);

  if (error) throw new Error(error.message);

  revalidatePath("/activities");
  revalidatePath(`/staff/activities/${activityId}`);
}

export async function deleteActivity(activityId: string) {
  const { supabase } = await requireStaff();

  const { error } = await supabase.from("activities").delete().eq("id", activityId);
  if (error) throw new Error(error.message);

  revalidatePath("/activities");
  revalidatePath("/staff/activities");
}

export async function addFixture(activityId: string, formData: FormData) {
  const { supabase } = await requireStaff();

  const home_team = formData.get("home_team") as string;
  const away_team = formData.get("away_team") as string;
  const match_date = formData.get("match_date") as string;

  const { error } = await supabase.from("fixtures").insert({
    activity_id: activityId,
    home_team,
    away_team,
    match_date,
    status: "scheduled",
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/activities/${activityId}`);
  revalidatePath(`/staff/activities/${activityId}`);
}

export async function recordResult(fixtureId: string, activityId: string, formData: FormData) {
  const { supabase } = await requireStaff();

  const home_score = Number(formData.get("home_score"));
  const away_score = Number(formData.get("away_score"));

  const { error } = await supabase
    .from("fixtures")
    .update({
      home_score,
      away_score,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", fixtureId);

  if (error) throw new Error(error.message);

  revalidatePath(`/activities/${activityId}`);
  revalidatePath(`/staff/activities/${activityId}`);
}

export async function deleteFixture(fixtureId: string, activityId: string) {
  const { supabase } = await requireStaff();

  const { error } = await supabase.from("fixtures").delete().eq("id", fixtureId);
  if (error) throw new Error(error.message);

  revalidatePath(`/activities/${activityId}`);
  revalidatePath(`/staff/activities/${activityId}`);
}
