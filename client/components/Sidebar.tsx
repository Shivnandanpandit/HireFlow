"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "▦" },
  { name: "Candidates", href: "/candidates", icon: "♙" },
  { name: "Hiring Pipeline", href: "/pipeline", icon: "⇄" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const router = useRouter();

  // FIX: Clear the saved session and redirect to login
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white p-5">
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-indigo-600">
          HireFlow
        </h1>

        <p className="mt-1 text-xs text-slate-500">Applicant Tracking System</p>
      </div>

      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Workspace
      </p>

      <nav className="space-y-2">
        {navigation.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="mb-4 rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">
            HireFlow Workspace
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Manage your recruitment process in one place.
          </p>
        </div>

        {/* FIX: Add logout functionality */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <span className="text-lg">↪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
