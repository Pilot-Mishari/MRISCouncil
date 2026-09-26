"use client";
import { useState } from "react";
import { leadership, departments, classReps, type Member } from "@/lib/team-data";

const Avatar = ({ name, size = "w-11 h-11 text-sm" }: { name: string; size?: string }) => (
  <div className={`${size} rounded-full grid place-items-center font-black text-white bg-blue-600 shrink-0`}>
    {name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
  </div>
);

export default function TeamPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto px-4 py-14">
      <h2 className="text-4xl font-black uppercase text-blue-900 dark:text-blue-100">Meet Our Team</h2>
      <p className="mt-2 text-blue-700 dark:text-blue-300">The students who represent your interests and run MRIS's community programmes.</p>

      <h3 className="mt-12 font-black uppercase text-sm text-blue-700 dark:text-blue-300 tracking-widest">Leadership</h3>
      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        {leadership.map((m) => (
          <div key={m.name} className="card p-5 flex items-center gap-3">
            <Avatar name={m.name} size="w-14 h-14 text-lg" />
            <div>
              <p className="font-black">{m.name}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">{m.role}</p>
              {m.bio && <p className="text-xs text-blue-700/70 dark:text-blue-300/70 mt-1">{m.bio}</p>}
            </div>
          </div>
        ))}
      </div>

      <h3 className="mt-12 font-black uppercase text-sm text-blue-700 dark:text-blue-300 tracking-widest">Departments</h3>
      <div className="mt-4 grid gap-3">
        {departments.map((d) => (
          <div key={d.name} className="card p-5">
            <button onClick={() => setOpen(open === d.name ? null : d.name)} className="w-full flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {d.heads.map((h) => <Avatar key={h.name} name={h.name} size="w-9 h-9 text-xs border-2 border-white dark:border-[#0a0f1e]" />)}
                </div>
                <span className="font-black uppercase text-sm">{d.name}</span>
              </div>
              <span className="text-xs font-bold text-blue-600">{open === d.name ? "Hide" : "View team"}</span>
            </button>

            {open === d.name && (
              <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-900 space-y-2">
                {[...d.heads, ...d.members].map((m) => (
                  <div key={m.name} className="flex items-center gap-3">
                    <Avatar name={m.name} />
                    <div>
                      <p className="font-bold text-sm">{m.name}</p>
                      <p className="text-xs text-blue-700/70 dark:text-blue-300/70">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <h3 className="mt-12 font-black uppercase text-sm text-blue-700 dark:text-blue-300 tracking-widest">Class Representatives</h3>
      <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {classReps.map((r) => (
          <div key={r.name} className="card p-4 flex items-center gap-3">
            <Avatar name={r.name} />
            <div>
              <p className="font-bold text-sm">{r.name}</p>
              <p className="text-xs text-blue-700/70 dark:text-blue-300/70">{r.grade}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}