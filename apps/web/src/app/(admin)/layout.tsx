import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Activity, Building2, FileText, Globe, LogOut, BarChart3 } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as any).role !== "admin") redirect("/dashboard");

  const navItems = [
    { href: "/admin", label: "Pipeline Monitor", icon: Activity },
    { href: "/admin/municipalities", label: "Municipalities", icon: Globe },
    { href: "/admin/documents", label: "Documents", icon: FileText },
    { href: "/admin/pipeline", label: "Pipeline Status", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "#060a14", color: "#e2e8f0" }}>
      {/* Admin Sidebar — dark theme */}
      <aside
        className="w-56 flex flex-col shrink-0"
        style={{ background: "#0a0f1c", borderRight: "1px solid #1e293b" }}
      >
        <div className="p-4" style={{ borderBottom: "1px solid #1e293b" }}>
          <div className="text-[9px] tracking-[3px] font-bold" style={{ color: "#64748b" }}>
            PROTOKOLBASE
          </div>
          <div className="text-sm font-extrabold mt-0.5" style={{ color: "#f59e0b" }}>
            Admin Console
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-colors"
              style={{ color: "#94a3b8" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3" style={{ borderTop: "1px solid #1e293b" }}>
          <div className="flex items-center gap-2 px-2 mb-2">
            <div
              className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: "#f59e0b22", color: "#f59e0b" }}
            >
              {session.user.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="text-xs truncate" style={{ color: "#94a3b8" }}>
              {session.user.email}
            </div>
          </div>
          <div className="flex gap-2 px-2">
            <Link
              href="/dashboard"
              className="text-[10px] px-2 py-1 rounded"
              style={{ color: "#64748b", border: "1px solid #334155" }}
            >
              User view
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-[10px] px-2 py-1 rounded flex items-center gap-1"
                style={{ color: "#ef4444", border: "1px solid #ef444444" }}
              >
                <LogOut className="h-3 w-3" /> Logout
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
