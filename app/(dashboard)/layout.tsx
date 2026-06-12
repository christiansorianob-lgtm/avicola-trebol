import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { BackButton } from "@/components/ui/back-button";
import { GlobalSearch } from "@/components/layout/GlobalSearch";

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
    <div className="flex h-screen bg-gradient-to-br from-[#0f172a] to-[#020617] dark:from-[#0f172a] dark:to-[#020617] light:from-slate-100 light:to-slate-50 overflow-hidden text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0 relative">
        {/* Subtle decorative background glowing orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-[150px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        
        <div className="container max-w-6xl mx-auto p-4 md:p-8 relative z-10">
          {/* Search bar */}
          <div className="mb-6 flex items-center gap-4">
            <BackButton />
            <GlobalSearch />
          </div>
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
