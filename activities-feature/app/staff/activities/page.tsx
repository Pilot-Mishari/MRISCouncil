import Link from "next/link";
import { getActivities } from "@/lib/activities/queries";
import { createActivity, deleteActivity } from "@/lib/activities/actions";

export default async function StaffActivitiesPage() {
  const activities = await getActivities();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Manage Activities</h1>

      <form action={createActivity} className="rounded-lg border p-4 mb-8 space-y-3">
        <h2 className="font-semibold">Add a new activity</h2>
        <input
          name="title"
          required
          placeholder="e.g. Inter-house Football Tournament"
          className="w-full rounded border px-3 py-2"
        />
        <input
          name="type"
          placeholder="Type (football, basketball, chess...)"
          className="w-full rounded border px-3 py-2"
        />
        <textarea
          name="description"
          placeholder="Description (optional)"
          className="w-full rounded border px-3 py-2"
        />
        <button type="submit" className="rounded bg-black text-white px-4 py-2">
          Create activity
        </button>
      </form>

      <ul className="space-y-3">
        {activities.map((a) => (
          <li key={a.id} className="rounded border p-4 flex items-center justify-between">
            <div>
              <Link href={`/staff/activities/${a.id}`} className="font-semibold hover:underline">
                {a.title}
              </Link>
              <p className="text-sm text-gray-500 capitalize">
                {a.type} · {a.status}
              </p>
            </div>
            <form action={deleteActivity.bind(null, a.id)}>
              <button type="submit" className="text-red-600 text-sm">
                Delete
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
