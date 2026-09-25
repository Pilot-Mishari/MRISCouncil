import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export default async function ActivitiesPage() {
  const supabase = await supabaseServer();
  const { data: activities } = await supabase.from("activities").select("*").order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto px-4 py-14">
      <h2 className="text-4xl font-black uppercase text-blue-900 dark:text-blue-100">Activities</h2>
      <p className="mt-2 text-blue-700 dark:text-blue-300">Tournaments, leagues, and everything else going on right now.</p>

      <div className="mt-10 grid gap-4">
        {activities?.map((a) => (
          <Link key={a.id} href={`/activities/${a.id}`} className="card bar-left before:bg-blue-600 p-6 block hover:before:bg-blue-400">
            <div className="flex justify-between items-start">
              <h4 className="font-black">{a.title}</h4>
              <span className="text-[.65rem] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">{a.status}</span>
            </div>
            <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mt-1">{a.type}</p>
            {a.description && <p className="text-sm text-blue-700/70 dark:text-blue-300/70 mt-2">{a.description}</p>}
          </Link>
        ))}
        {!activities?.length && <p className="text-blue-700/70 dark:text-blue-300/70">Nothing posted yet — check back soon.</p>}
      </div>
    </div>
  );
}