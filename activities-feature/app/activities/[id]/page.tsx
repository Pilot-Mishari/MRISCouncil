import { notFound } from "next/navigation";
import { getActivity, getFixturesForActivity } from "@/lib/activities/queries";

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activity = await getActivity(id);
  if (!activity) notFound();

  const fixtures = await getFixturesForActivity(id);
  const results = fixtures.filter((f) => f.status === "completed");
  const upcoming = fixtures.filter((f) => f.status !== "completed");

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">{activity.title}</h1>
      <p className="text-sm text-gray-500 capitalize mt-1">
        {activity.type} · {activity.status}
      </p>
      {activity.description && <p className="mt-4 text-gray-700">{activity.description}</p>}

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Upcoming fixtures</h2>
        {upcoming.length === 0 ? (
          <p className="text-gray-500">No upcoming fixtures.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((f) => (
              <li key={f.id} className="rounded border p-3 flex items-center justify-between">
                <span>
                  {f.home_team} vs {f.away_team}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(f.match_date).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Results</h2>
        {results.length === 0 ? (
          <p className="text-gray-500">No results yet.</p>
        ) : (
          <ul className="space-y-2">
            {results.map((f) => (
              <li key={f.id} className="rounded border p-3 flex items-center justify-between">
                <span>
                  {f.home_team} {f.home_score} – {f.away_score} {f.away_team}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(f.match_date).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
