    "use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function TeamPanel() {
  const supabase = supabaseBrowser();
  const [team, setTeam] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", role: "", department_slug: "", bio: "", sort_order: "0" });

  const refresh = async () => {
    const { data } = await supabase.from("team_members").select("*").order("sort_order");
    setTeam(data ?? []);
    const { data: d } = await supabase.from("departments").select("*");
    setDepartments(d ?? []);
  };
  useEffect(() => { refresh(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("team_members").insert({
      name: form.name, role: form.role, department_slug: form.department_slug || null,
      bio: form.bio || null, sort_order: Number(form.sort_order) || 0,
    });
    setForm({ name: "", role: "", department_slug: "", bio: "", sort_order: "0" });
    refresh();
  };

  const remove = async (id: string) => { await supabase.from("team_members").delete().eq("id", id); refresh(); };

  return (
    <div className="space-y-8">
      <form onSubmit={add} className="card p-6 space-y-3">
        <h3 className="font-black uppercase text-sm">Add team member</h3>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
        <input placeholder="Role (e.g. President)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
        <select value={form.department_slug} onChange={(e) => setForm({ ...form, department_slug: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent">
          <option value="">No department (general council)</option>
          {departments.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
        </select>
        <input placeholder="Short bio (optional)" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
        <input type="number" placeholder="Display order (0 = first)" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
        <button className="bg-blue-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm">Add</button>
      </form>

      <div className="card p-6 divide-y">
        {team.map((m) => (
          <div key={m.id} className="py-3 flex justify-between items-center">
            <div>
              <p className="font-bold">{m.name}</p>
              <p className="text-xs text-blue-700/70">{m.role}</p>
            </div>
            <button onClick={() => remove(m.id)} className="text-xs font-bold text-bad">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}