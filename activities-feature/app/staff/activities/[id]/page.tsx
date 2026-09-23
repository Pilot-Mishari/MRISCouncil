import { notFound } from "next/navigation";
import { getActivity, getFixturesForActivity } from "@/lib/activities/queries";
import {
  addFixture,
  recordResult,
  deleteFixture,
  updateActivityStatus,
} from "@/lib/activities/actions";

export default async function StaffActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activity = await getActivity(id);
  if (!activity) notFound();

  const fixtures = await getFixturesForActivity(id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">{activity.title}</h1>

      <form action={updateActivityStatus.bind(null, id)} className="mt-3 flex items-center gap-2">
        <select name="status" defaultValue={activity.status} className="rounded border px-2 py-1">
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
        <button type="submit" className="text-sm rounded bg-black text-white px-3 py-1">
          Update status
        </button>
      </form>

      <form action={addFixture.bind(null, id)} className="rounded-lg border p-4 my-8 space-y-3">
        <h2 className="font-semibold">Add a fixture</h2>
        <div className="flex gap-2">
          <input
            name="home_team"
            required
            placeholder="Home team"
            className="w-full rounded border px-3 py-2"
          />
          <input
            name="away_team"
            required
            placeholder="Away team"
            className="w-full rounded border px-3 py-2"
          />
        </div>
        <input
          name="match_date"
          type="datetime-local"
          required
          className="w-full rounded border px-3 py-2"
        />
        <button type="submit" className="rounded bg-black text-white px-4 py-2">
          Add fixture
        </button>
      </form>

      <h2 className="font-semibold mb-3">Fixtures</h2>
      <ul className="space-y-3">
        {fixtures.map((f) => (
          <li key={f.id} className="rounded border p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {f.home_team} vs {f.away_team}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(f.match_date).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 capitalize">
              {f.status}
              {f.status === "completed" && ` — ${f.home_score} : ${f.away_score}`}
            </p>

            {f.status !== "completed" && (
              <form
                action={recordResult.bind(null, f.id, id)}
                className="mt-3 flex items-center gap-2"
              >
                <input
                  name="home_score"
                  type="number"
                  min="0"
                  required
                  placeholder="Home"
                  className="w-20 rounded border px-2 py-1"
                />
                <span>–</span>
                <input
                  name="away_score"
                  type="number"
                  min="0"
                  required
                  placeholder="Away"
                  className="w-20 rounded border px-2 py-1"
                />
                <button type="submit" className="text-sm rounded bg-black text-white px-3 py-1">
                  Save result
                </button>
              </form>
            )}

            <form action={deleteFixture.bind(null, f.id, id)} className="mt-2">
              <button type="submit" className="text-red-600 text-xs">
                Remove fixture
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
