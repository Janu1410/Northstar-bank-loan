"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { clearAdminSession, getStoredAdminToken, storeAdminUser } from "../lib/auth";
import { apiRequest } from "../lib/api";
import type { LoggedInAdmin } from "../types/admin";

type AdminShellProps = {
  admin: LoggedInAdmin;
  children: ReactNode;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard", roles: ["MANAGER", "STANDARD_AGENT"] },
  { label: "Applications", href: "/applications", roles: ["MANAGER", "STANDARD_AGENT"] },
  { label: "Document Requests", href: "/document-requests", roles: ["MANAGER", "STANDARD_AGENT"] },
  { label: "Notifications", href: "/notifications", roles: ["MANAGER", "STANDARD_AGENT"] },
  { label: "Admin Users", href: "/admin-users", roles: ["MANAGER"] },
] as const;

const managerOnlyRoutes = new Set(["/admin-users"]);

const sectionMetaByPath: Record<
  string,
  { eyebrow: string; title: string; badge?: string }
> = {
  "/dashboard": {
    eyebrow: "Dashboard",
    title: "Dashboard Overview",
    badge: "Overview",
  },
  "/applications": {
    eyebrow: "Applications",
    title: "Applications",
  },
  "/document-requests": {
    eyebrow: "Document Requests",
    title: "Document Requests",
  },
  "/notifications": {
    eyebrow: "Notifications",
    title: "Notifications",
  },
  "/admin-users": {
    eyebrow: "Admin Users",
    title: "Admin Users",
  },
};

type ProfileApiResponse = {
  success: boolean;
  admin: LoggedInAdmin;
};

export function AdminShell({ admin, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionAdmin, setSessionAdmin] = useState(admin);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const sectionMeta =
    sectionMetaByPath[pathname] ?? {
      eyebrow: "Admin Workspace",
      title: "Northstar Admin",
    };
  const adminInitials = sessionAdmin.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(sessionAdmin.role),
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    const token = getStoredAdminToken();

    if (!token) {
      return;
    }

    let isCancelled = false;

    apiRequest<ProfileApiResponse>("/admin/profile/me", { token })
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setSessionAdmin(response.admin);
        storeAdminUser(response.admin);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        clearAdminSession();
        router.replace("/login");
      });

    return () => {
      isCancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (
      managerOnlyRoutes.has(pathname) &&
      sessionAdmin.role !== "MANAGER"
    ) {
      router.replace("/dashboard");
    }
  }, [pathname, router, sessionAdmin.role]);

  const handleLogout = () => {
    setIsProfileOpen(false);
    clearAdminSession();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-[280px] shrink-0 border-r border-slate-200 bg-white/95 px-6 py-8 lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand)] text-sm font-semibold text-white shadow-[0_16px_32px_rgba(22,61,115,0.2)]">
              NS
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brand)]">
                Northstar
              </p>
              <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                Admin
              </p>
            </div>
          </div>

          <nav className="mt-8 flex flex-1 flex-col gap-2">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  pathname === item.href
                    ? "bg-[var(--brand)] text-white shadow-[0_16px_34px_rgba(22,61,115,0.18)]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[var(--brand)]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white/85 px-5 py-2.5 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand)]">
                  {sectionMeta.eyebrow}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {sectionMeta.title}
                  </h1>
                  {sectionMeta.badge ? (
                    <span className="inline-flex rounded-full bg-[var(--brand-tint)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                      {sectionMeta.badge}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((open) => !open)}
                  className="group flex items-center gap-3 rounded-full border border-slate-200/80 bg-white px-2 py-1.5 transition hover:border-[var(--brand-soft)]"
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#173f78_0%,#244e8f_100%)] text-sm font-semibold text-white">
                    {adminInitials}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm font-semibold text-slate-900">
                      {sessionAdmin.name}
                    </span>
                    <span className="block text-xs uppercase tracking-[0.18em] text-slate-400">
                      {sessionAdmin.role.replace("_", " ")}
                    </span>
                  </span>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-hover:bg-[var(--brand-tint)] group-hover:text-[var(--brand)] ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="m5.5 7.5 4.5 4.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>

                {isProfileOpen ? (
                  <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-[296px] overflow-hidden rounded-[18px] border border-slate-200/90 bg-white">
                    <div className="bg-[linear-gradient(135deg,rgba(22,61,115,0.08)_0%,rgba(22,61,115,0.02)_100%)] px-5 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--brand)]">
                        Admin Profile
                      </p>
                    </div>
                    <div className="px-5 py-5">
                      <div className="flex items-center gap-4">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#173f78_0%,#244e8f_100%)] text-base font-semibold text-white">
                          {adminInitials}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-slate-950">
                            {sessionAdmin.name}
                          </p>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {sessionAdmin.email}
                          </p>
                          <p className="mt-2 inline-flex rounded-full bg-[var(--brand-tint)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                            {sessionAdmin.role.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 px-5 py-4">
                      <p className="mb-3 text-xs text-slate-500">
                        Signed in to Northstar Admin workspace
                      </p>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[var(--brand-hover)]"
                      >
                        Log Out
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-4 sm:px-6 lg:px-8 lg:py-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
