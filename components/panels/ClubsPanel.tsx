"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function ClubsPanel() {
  const supabase = supabaseBrowser();
  const [tab, setTab] = useState<"clubs" | "applications">("clubs");
  const [clubs, setClubs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [newClub, setNewClub] = useState({ name: "", description: "", founder: "", co_founder: "" });

  const refreshClubs = async () => {
    const { data } = await supabase.from("clubs").select("*").order("name");
    setClubs(data ?? []);
  };
  const refreshApplications = async () => {
    const { data } = await supabase.from("club_applications").select("*").order("created_at", { ascending: false });
    setApplications(data ?? []);
  };
  useEffect(() => { refreshClubs(); refreshApplications(); }, []);

  const addClub = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("clubs").insert(newClub);
    setNewClub({ name: "", description: "", founder: "", co_founder: "" });
    refreshClubs();
  };

  const startEdit = (c: any) => { setEditingId(c.id); setEditForm(c); };
  const saveEdit = async () => {
    await supabase.from("clubs").update({
      name: editForm.name, description: editForm.description, founder: editForm.founder, co_founder: editForm.co_founder,
    }).eq("id", editingId);
    setEditingId(null);
    refreshClubs();
  };
  const removeClub = async (id: string) => { await supabase.from("clubs").delete().eq("id", id); refreshClubs(); };

  const accept = async (app: any) => {
    await supabase.from("clubs").insert({
      name: app.club_name, description: app.description, founder: app.founder, co_founder: app.co_founder,
    });
    await supabase.from("club_applications").update({ status: "accepted" }).eq("id", app.id);
    refreshClubs(); refreshApplications();
  };
  const reject = async (id: string) => {
    await supabase.from("club_applications").update({ status: "rejected" }).eq("id", id);
    refreshApplications();
  };

  const pending = applications.filter((a) => a.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button onClick={() => setTab("clubs")} className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg ${tab === "clubs" ? "bg-blue-900 text-white" : "border"}`}>All clubs</button>
        <button onClick={() => setTab("applications")} className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg relative ${tab === "applications" ? "bg-blue-900 text-white" : "border"}`}>
          Applications {pending.length > 0 && <span className="ml-1 bg-warn text-white rounded-full px-1.5">{pending.length}</span>}
        </button>
      </div>

      {tab === "clubs" && (
        <div className="space-y-6">
          <form onSubmit={addClub} className="card p-6 space-y-3">
            <h3 className="font-black uppercase text-sm">Add club</h3>
            <input placeholder="Name" value={newClub.name} onChange={(e) => setNewClub({ ...newClub, name: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
            <input placeholder="Description" value={newClub.description} onChange={(e) => setNewClub({ ...newClub, description: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
            <input placeholder="Founder" value={newClub.founder} onChange={(e) => setNewClub({ ...newClub, founder: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
            <input placeholder="Co-founder (optional)" value={newClub.co_founder} onChange={(e) => setNewClub({ ...newClub, co_founder: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
            <button className="bg-blue-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm">Add</button>
          </form>

          <div className="card p-6 divide-y">
            {clubs.map((c) => (
              <div key={c.id} className="py-4">
                {editingId === c.id ? (
                  <div className="space-y-2">
                    <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm bg-transparent" />
                    <input value={editForm.description ?? ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm bg-transparent" />
                    <input value={editForm.founder} onChange={(e) => setEditForm({ ...editForm, founder: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm bg-transparent" />
                    <input value={editForm.co_founder ?? ""} onChange={(e) => setEditForm({ ...editForm, co_founder: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm bg-transparent" />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="text-xs font-bold bg-blue-900 text-white px-3 py-1.5 rounded-lg">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs font-bold border px-3 py-1.5 rounded-lg">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">{c.name}</p>
                      <p className="text-xs text-blue-700/70">{c.founder}{c.co_founder ? ` & ${c.co_founder}` : ""}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(c)} className="text-xs font-bold border rounded-lg px-3 py-1.5">Edit</button>
                      <button onClick={() => removeClub(c.id)} className="text-xs font-bold text-bad">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "applications" && (
        <div className="card p-6 divide-y">
          {applications.map((a) => (
            <div key={a.id} className="py-4">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <p className="font-bold">{a.club_name}</p>
                  {a.description && <p className="text-sm text-blue-700/70 dark:text-blue-300/70 mt-1">{a.description}</p>}
                  <p className="text-xs text-blue-700/70 mt-1">Founder: {a.founder}{a.co_founder ? ` & ${a.co_founder}` : ""}</p>
                  <p className="text-xs text-blue-700/70">Applied by {a.applicant_name}{a.applicant_school_id ? ` (${a.applicant_school_id})` : ""}{a.contact ? ` · ${a.contact}` : ""}</p>
                </div>
                {a.status === "pending" ? (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => accept(a)} className="text-xs font-bold bg-ok text-white px-3 py-1.5 rounded-lg">Accept</button>
                    <button onClick={() => reject(a.id)} className="text-xs font-bold bg-bad text-white px-3 py-1.5 rounded-lg">Reject</button>
                  </div>
                ) : (
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full shrink-0 ${a.status === "accepted" ? "text-ok" : "text-bad"}`}>{a.status}</span>
                )}
              </div>
            </div>
          ))}
          {!applications.length && <p className="text-sm text-blue-700/70">No applications yet.</p>}
        </div>
      )}
    </div>
  );
}