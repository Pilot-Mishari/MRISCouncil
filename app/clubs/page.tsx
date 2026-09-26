"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function ClubsPage() {
  const supabase = supabaseBrowser();
  const [clubs, setClubs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ club_name: "", description: "", founder: "", co_founder: "", applicant_name: "", applicant_school_id: "", contact: "" });
  const [status, setStatus] = useState("");

  useEffect(() => {
    supabase.from("clubs").select("*").order("name").then(({ data }) => setClubs(data ?? []));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("club_applications").insert(form);
    if (error) { setStatus(error.message); return; }
    setStatus("Application sent — the Clubs team will get back to you.");
    setForm({ club_name: "", description: "", founder: "", co_founder: "", applicant_name: "", applicant_school_id: "", contact: "" });
    setShowForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-14">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div>
          <h2 className="text-4xl font-black uppercase text-blue-900 dark:text-blue-100">Clubs</h2>
          <p className="mt-2 text-blue-700 dark:text-blue-300">Every club running at MRIS right now.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm">
          {showForm ? "Cancel" : "Start a club"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card p-6 mt-6 space-y-3">
          <h3 className="font-black uppercase text-sm">Apply to start a club</h3>
          <input placeholder="Club name" required value={form.club_name} onChange={(e) => setForm({ ...form, club_name: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
          <input placeholder="Founder (your name)" required value={form.founder} onChange={(e) => setForm({ ...form, founder: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
          <input placeholder="Co-founder (optional)" value={form.co_founder} onChange={(e) => setForm({ ...form, co_founder: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
          <input placeholder="Your school ID" value={form.applicant_school_id} onChange={(e) => setForm({ ...form, applicant_school_id: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
          <input placeholder="Contact (email or phone)" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-transparent" />
          <button className="bg-blue-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm">Submit application</button>
          {status && <p className="text-sm text-blue-700 dark:text-blue-300">{status}</p>}
        </form>
      )}
      {!showForm && status && <p className="mt-4 text-sm text-blue-700 dark:text-blue-300">{status}</p>}

      <div className="mt-10 grid md:grid-cols-2 gap-4">
        {clubs.map((c) => (
          <div key={c.id} className="card p-6">
            <h4 className="font-black">{c.name}</h4>
            {c.description && <p className="text-sm text-blue-700/70 dark:text-blue-300/70 mt-2">{c.description}</p>}
            <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mt-3">
              Founded by {c.founder}{c.co_founder ? ` & ${c.co_founder}` : ""}
            </p>
          </div>
        ))}
        {!clubs.length && <p className="text-blue-700/70 dark:text-blue-300/70">No clubs listed yet.</p>}
      </div>
    </div>
  );
}