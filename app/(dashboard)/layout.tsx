import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    // NextAuth might fail if env vars are not set
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {/* pb-16 for mobile bottom nav */}
        <div className="container max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
