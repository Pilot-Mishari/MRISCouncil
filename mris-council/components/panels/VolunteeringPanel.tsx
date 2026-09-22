"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import StudentSearchPicker from "@/components/StudentSearchPicker";

export default function VolunteeringPanel() {
  const supabase = supabaseBrowser();
  const { department } = useAuth();
  const [allDepartments, setAllDepartments] = useState<{ slug: string; name: string }[]>([]);
  const [opps, setOpps] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", description: "", event_date: "", location: "", slots: "", department_slug: department ?? "" });
  const [log, setLog] = useState<{ student: any; hours: string; event: string }>({ student: null, hours: "", event: "" });
  const [msg, setMsg] = useState("");

  const refresh = async () => {
    const { data } = await supabase.from("opportunities").select("*, applications(count)").order("event_date", { ascending: false });
    setOpps(data ?? []);
    if (department === "council") {
      const { data: d } = await supabase.from("departments").select("*");
      setAllDepartments(d ?? []);
    }
  };
  useEffect(() => { refresh(); }, [department]);

  const addOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = department === "council" ? form.department_slug : department;
    const { error } = await supabase.from("opportunities").insert({
      title: form.title, description: form.description, event_date: form.event_date,
      location: form.location, slots: form.slots ? Number(form.slots) : null, department_slug: target,
    });
    setMsg(error ? error.message : "Opportunity added.");
    if (!error) { setForm({ title: "", description: "", event_date: "", location: "", slots: "", department_slug: department ?? "" }); refresh(); }
  };

  const toggleOpen = async (o: any) => {
    await supabase.from("opportunities").update({ applications_open: !o.applications_open }).eq("id", o.id);
    refresh();
  };

  const remove = async (id: string) => { await supabase.from("opportunities").delete().eq("id", id); refresh(); };

  const logHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!log.student) { setMsg("Pick a student from search results first."); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("volunteer_hours").insert({
      student_id: log.student.id, hours: Number(log.hours), event: log.event,
      department_slug: department, logged_by: user?.id,
    });
    setMsg(error ? error.message : "Hours logged.");
    if (!error) setLog({ student: null, hours: "", event: "" });
  };

  return (
    <div className="space-y-10">
      <form onSubmit={addOpportunity} className="card p-6 space-y-3">
        <h3 className="font-black uppercase text-sm">Add opportunity</h3>
        {department === "council" && (
          <select value={form.department_slug} onChange={(e) => setForm({ ...form, department_slug: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent">
            <option value="">Post as which department?</option>
            {allDepartments.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
          </select>
        )}
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
        <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
        <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
        <input type="number" placeholder="Slots (optional)" value={form.slots} onChange={(e) => setForm({ ...form, slots: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
        <button className="bg-blue-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm">Add</button>
      </form>

      <div className="card p-6">
        <h3 className="font-black uppercase text-sm mb-4">Your opportunities</h3>
        <div className="divide-y">
          {opps.map((o) => (
            <div key={o.id} className="py-3 flex flex-wrap justify-between items-center gap-2">
              <div>
                <p className="font-bold">{o.title}</p>
                <p className="text-xs text-blue-700/70">{o.event_date} · {o.location}</p>
                <p className="text-xs mt-1">
                  <span className="font-bold text-blue-600">{o.applications[0]?.count ?? 0}</span> applied{o.slots ? ` / ${o.slots}` : ""}
                  {" · "}<span className={o.applications_open ? "text-ok" : "text-bad"}>{o.applications_open ? "Open" : "Closed"}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleOpen(o)} className="text-xs font-bold border rounded-lg px-3 py-1.5">
                  {o.applications_open ? "Close applications" : "Reopen"}
                </button>
                <button onClick={() => remove(o.id)} className="text-xs font-bold text-bad">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={logHours} className="card p-6 space-y-3">
        <h3 className="font-black uppercase text-sm">Log hours</h3>
        <StudentSearchPicker onSelect={(s) => setLog({ ...log, student: s })} />
        <input placeholder="Event" value={log.event} onChange={(e) => setLog({ ...log, event: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
        <input type="number" step="0.5" placeholder="Hours" value={log.hours} onChange={(e) => setLog({ ...log, hours: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
        <button className="bg-blue-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm">Log</button>
      </form>
      {msg && <p className="text-sm text-blue-700 dark:text-blue-300">{msg}</p>}
    </div>
  );
}