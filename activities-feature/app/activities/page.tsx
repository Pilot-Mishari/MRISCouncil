import Link from "next/link";
import { getActivities } from "@/lib/activities/queries";

export default async function ActivitiesPage() {
  const activities = await getActivities();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Activities</h1>

      {activities.length === 0 ? (
        <p className="text-gray-500">No activities yet — check back soon.</p>
      ) : (
        <ul className="space-y-4">
          {activities.map((activity) => (
            <li key={activity.id} className="rounded-lg border p-4 hover:shadow-sm transition">
              <Link href={`/activities/${activity.id}`} className="block">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{activity.title}</h2>
                  <span className="text-xs uppercase tracking-wide rounded-full px-2 py-1 bg-gray-100">
                    {activity.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 capitalize">{activity.type}</p>
                {activity.description && (
                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">{activity.description}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
