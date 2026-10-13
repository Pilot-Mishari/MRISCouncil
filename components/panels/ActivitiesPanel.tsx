"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { clearDraft } from "@/lib/activity-drafts";
import ActivityDraftEditor from "./ActivityDraftEditor";
import { useFeedback } from "@/components/Feedback";

export default function ActivitiesPanel() {
  const supabase = supabaseBrowser();
  const { confirm, notify } = useFeedback();
  const [activities, setActivities] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [newActivity, setNewActivity] = useState({ title: "", type: "", description: "" });

  const refresh = async () => {
    const { data } = await supabase.from("activities").select("*").order("created_at", { ascending: false });
    setActivities(data ?? []);
  };
  useEffect(() => { refresh(); }, []);

  const addActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: newActivity.title.trim(),
      type: newActivity.type.trim(),
      description: newActivity.description.trim(),
      status: "upcoming",
    };

    const { error } = await supabase.from("activities").insert(payload);
    if (error) {
      console.error("Add activity failed:", error);
      notify(error.message, "error");
      return;
    }

    setNewActivity({ title: "", type: "", description: "" });
    refresh();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("activities").update({ status }).eq("id", id);
    if (error) {
      console.error("Update status failed:", error);
      notify(error.message, "error");
      return;
    }
    refresh();
  };
  const removeActivity = async (a: any) => {
    const ok = await confirm({
      title: `Delete “${a.title}”?`,
      message: "It will disappear from the public site. This can’t be undone.",
      confirmLabel: "Delete activity",
      danger: true,
    });
    if (!ok) return;
    const id = a.id;
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) {
      console.error("Delete activity failed:", error);
      notify(error.message, "error");
      return;
    }
    await clearDraft(supabase, id, true); // drop any unpublished draft for this activity
    await clearDraft(supabase, id, false);
    refresh();
  };

  const toggleDetail = (activityId: string) => setOpenId((current) => (current === activityId ? null : activityId));

  return (
    <div className="space-y-8">
      <form onSubmit={addActivity} className="card p-6 space-y-3">
        <h3 className="font-black uppercase text-sm">Add activity</h3>
        <input placeholder="Title (e.g. Inter-house Football Tournament)" value={newActivity.title} onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
        <input placeholder="Type (football, basketball, chess...)" value={newActivity.type} onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
        <input placeholder="Description (optional)" value={newActivity.description} onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
        <button className="bg-blue-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm">Add</button>
      </form>

      <div className="space-y-4">
        {activities.map((a) => (
          <div key={a.id} className="card p-6">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div>
                <p className="font-bold">{a.title}</p>
                <p className="text-xs text-blue-700/70 uppercase tracking-widest">{a.type}</p>
              </div>
              <div className="flex gap-2 items-center">
                <select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)} className="text-xs border rounded-lg px-2 py-1 bg-transparent">
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
                <button onClick={() => toggleDetail(a.id)} className="text-xs font-bold border rounded-lg px-3 py-1.5">
                  {openId === a.id ? "Hide" : "Manage"}
                </button>
                <button onClick={() => removeActivity(a)} className="text-xs font-bold text-bad">Delete</button>
              </div>
            </div>

            {openId === a.id && <ActivityDraftEditor activityId={a.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}