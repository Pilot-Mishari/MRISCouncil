import ProtectedRoute from "@/components/ProtectedRoute";
import VolunteeringPanel from "@/components/panels/VolunteeringPanel";

export default async function DepartmentDashboard({ params }: { params: Promise<{ department: string }> }) {
  const { department } = await params;
  return (
    <ProtectedRoute department={department}>
      <div className="max-w-4xl mx-auto px-4 py-14">
        <h1 className="font-black uppercase text-3xl text-blue-900 dark:text-blue-100 capitalize">{department} dashboard</h1>
        <div className="mt-8"><VolunteeringPanel /></div>
      </div>
    </ProtectedRoute>
  );
}