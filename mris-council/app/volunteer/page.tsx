"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function VolunteerPage() {
  const supabase = supabaseBrowser();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [schoolId, setSchoolId] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, string>>({});

  const refresh = async () => {
    const { data: o } = await supabase.rpc("list_opportunities");
    const { data: l } = await supabase.rpc("leaderboard", { p_limit: 10 });
    setOpportunities(o ?? []);
    setLeaderboard(l ?? []);
  };
  useEffect(() => { refresh(); }, []);

  const apply = async (oppId: string) => {
    const id = (schoolId[oppId] ?? "").trim();
    if (!id) return;
    const { data, error } = await supabase.rpc("apply_to_opportunity", { p_opportunity: oppId, p_school_id: id });
    if (error) { setStatus({ ...status, [oppId]: "Something went wrong." }); return; }
    const labels: Record<string, string> = {
      ok: "You're in! See you there.", already: "You already applied.",
      full: "This one's full.", closed: "Applications are closed.", not_found: "No student with that ID.",
    };
    setStatus({ ...status, [oppId]: labels[data as string] ?? data });
    if (data === "ok") refresh();
  };

  const podium = leaderboard.slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 py-14">
      <h2 className="text-4xl font-black uppercase text-blue-900 dark:text-blue-100">Volunteering</h2>
      <p className="mt-2 text-blue-700 dark:text-blue-300 max-w-xl">
        Enter your school ID to apply. Staff confirm your hours after each event.
      </p>

      <section className="mt-10 grid gap-4">
        {opportunities.map((o) => (
          <div key={o.id} className="card bar-left before:bg-warn p-6">
            <h4 className="font-black">{o.title}</h4>
            <p className="text-[.7rem] font-extrabold uppercase tracking-widest text-blue-600 mt-1">{o.event_date}</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">{o.department_name} · {o.location}</p>
            {o.description && <p className="text-sm text-blue-700/70 dark:text-blue-300/70 mt-1">{o.description}</p>}
            <p className="text-xs font-bold uppercase text-blue-700/70 mt-3">
              {o.applied}{o.slots ? ` / ${o.slots}` : ""} applied
            </p>

            {o.applications_open ? (
              <div className="mt-4 flex gap-2">
                <input placeholder="Your school ID" value={schoolId[o.id] ?? ""}
                  onChange={(e) => setSchoolId({ ...schoolId, [o.id]: e.target.value })}
                  className="border rounded-lg px-3 py-2 text-sm bg-transparent flex-1" />
                <button onClick={() => apply(o.id)} className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-bold">Apply</button>
              </div>
            ) : (
              <p className="mt-4 text-xs font-bold text-bad">Applications closed</p>
            )}
            {status[o.id] && <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">{status[o.id]}</p>}
          </div>
        ))}
      </section>

      <section className="mt-16 card p-6">
        <h3 className="font-black uppercase text-blue-900 dark:text-blue-100">Leaderboard</h3>
        <p className="text-sm text-blue-700/70 dark:text-blue-300/70 mb-6">Top volunteers ranked by verified hours.</p>
        <div className="grid grid-cols-3 gap-2.5 items-end mb-6">
          {[podium[1], podium[0], podium[2]].map((p, i) => p && (
            <div key={p.student_name} className={`text-center border border-blue-100 dark:border-blue-900 rounded-2xl p-3.5 ${i === 1 ? "pt-5 pb-5 border-warn" : ""}`}>
              <div className={`mx-auto mb-2 rounded-full grid place-items-center font-black text-white bg-blue-600 ${i === 1 ? "w-[54px] h-[54px] bg-gradient-to-br from-[#f7b500] to-[#ff8a00]" : "w-11 h-11"}`}>
                {p.student_name[0]}
              </div>
              <div className="text-xs font-extrabold truncate">{p.student_name}</div>
              <div className="text-lg font-black text-blue-600">{p.hours}</div>
            </div>
          ))}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-blue-700/60 dark:text-blue-300/60 text-[.68rem] uppercase tracking-widest border-b-2 border-blue-100 dark:border-blue-900">
              <th className="py-2.5">#</th><th>Name</th><th>Hours</th><th>Events</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((r, i) => (
              <tr key={r.student_name} className="border-b border-blue-100 dark:border-blue-900">
                <td className="py-3">{i + 1}</td><td className="font-bold">{r.student_name}</td>
                <td className="font-black text-blue-600">{r.hours}</td><td className="text-blue-700/70">{r.events}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}