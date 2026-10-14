"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { leadership, departments, classReps } from "@/lib/team-data";

type Department = (typeof departments)[number];

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("");

const Avatar = ({ name, size = "w-11 h-11 text-sm" }: { name: string; size?: string }) => (
  <div className={`${size} rounded-full grid place-items-center font-black text-white bg-blue-600 shrink-0`}>
    {initials(name)}
  </div>
);

/* Full-screen panel with the whole department: heads (with their descriptions) and every member. */
function DepartmentSheet({ dept, onClose }: { dept: Department; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null; // the card that opened this panel
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // page doesn't scroll behind the panel
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // the close button is the only focusable thing inside, so keep focus on it
      if (e.key === "Tab") { e.preventDefault(); closeRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus();
    };
  }, [onClose]);

  const total = dept.heads.length + dept.members.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dept-title"
      className="sheet-in fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-white dark:bg-[#0a0f1e]"
    >
      <div className="sticky top-0 z-10 border-b border-blue-100 bg-white/90 backdrop-blur-xl dark:border-blue-900 dark:bg-[#0a0f1e]/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-300">Department · {total} students</p>
            <h2 id="dept-title" className="text-2xl font-black uppercase text-blue-900 dark:text-blue-100">{dept.name}</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-blue-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-900 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-100 dark:hover:bg-blue-900/30"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            Close
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <h3 className="text-sm font-black uppercase tracking-widest text-blue-700 dark:text-blue-300">{dept.heads.length > 1 ? "Heads" : "Head"}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {dept.heads.map((h) => (
            <div key={h.name} className="card flex flex-col items-center p-6 text-center">
              <Avatar name={h.name} size="w-24 h-24 text-3xl" />
              <p className="mt-4 font-black">{h.name}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-300">{h.role}</p>
              {h.description && <p className="mt-3 text-sm text-blue-700/80 dark:text-blue-300/80">{h.description}</p>}
            </div>
          ))}
        </div>

        {dept.members.length > 0 && (
          <>
            <h3 className="mt-12 text-sm font-black uppercase tracking-widest text-blue-700 dark:text-blue-300">Team</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {dept.members.map((m) => (
                <div key={m.name} className="card flex items-center gap-4 p-4">
                  <Avatar name={m.name} size="w-14 h-14 text-base" />
                  <div>
                    <p className="text-sm font-bold">{m.name}</p>
                    <p className="text-xs text-blue-700/70 dark:text-blue-300/70">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [open, setOpen] = useState<string | null>(null);
  const openDept = departments.find((d) => d.name === open) ?? null;
  const closeSheet = useCallback(() => setOpen(null), []); // stable, so the panel's effect doesn't re-run

  return (
    <div className="max-w-4xl mx-auto px-4 py-14">
      <h1 className="text-4xl font-black uppercase text-blue-900 dark:text-blue-100">Meet Our Team</h1>
      <p className="mt-2 text-blue-700 dark:text-blue-300">The students who represent your interests and run MRIS&apos;s community programmes.</p>

      <h2 className="mt-12 font-black uppercase text-sm text-blue-700 dark:text-blue-300 tracking-widest">Leadership</h2>
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

      <h2 className="mt-12 font-black uppercase text-sm text-blue-700 dark:text-blue-300 tracking-widest">Departments</h2>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {departments.map((d) => (
          <button
            key={d.name}
            type="button"
            onClick={() => setOpen(d.name)}
            aria-haspopup="dialog"
            className="card card-hover group flex min-h-44 flex-col justify-between p-5 text-left hover:border-blue-400 dark:hover:border-blue-500"
          >
            {/* top: department name */}
            <span className="text-xl font-black uppercase leading-tight text-blue-900 dark:text-blue-100">
              {d.name}
              <span className="sr-only">. Heads: {d.heads.map((h) => h.name).join(" and ")}</span>
            </span>

            {/* bottom: the heads' initials + a hint that the card opens */}
            <span className="mt-6 flex items-end justify-between gap-3">
              <span className="flex gap-2" aria-hidden="true">
                {d.heads.map((h) => <Avatar key={h.name} name={h.name} size="w-11 h-11 text-sm" />)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-300">
                View team
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
            </span>
          </button>
        ))}
      </div>

      {openDept && <DepartmentSheet dept={openDept} onClose={closeSheet} />}

      <h2 className="mt-12 font-black uppercase text-sm text-blue-700 dark:text-blue-300 tracking-widest">Class Representatives</h2>
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