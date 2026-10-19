"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Allow users to access the login page without authentication
    if (pathname === "/login") {
      setAuthorized(true);
      return;
    }

    // Check for the saved JWT token
    const token = localStorage.getItem("token");

    if (!token) {
      setAuthorized(false);
      router.replace("/login");
      return;
    }

    setAuthorized(true);
  }, [pathname, router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Checking authentication...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}