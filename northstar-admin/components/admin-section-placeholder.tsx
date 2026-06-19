"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminShell } from "./admin-shell";
import { getStoredAdminToken, getStoredAdminUser } from "../lib/auth";
import type { LoggedInAdmin } from "../types/admin";

type AdminSectionPlaceholderProps = {
  eyebrow: string;
  title: string;
  message: string;
};

export function AdminSectionPlaceholder({
  eyebrow,
  title,
  message,
}: AdminSectionPlaceholderProps) {
  const router = useRouter();
  const [admin] = useState<LoggedInAdmin | null>(() => getStoredAdminUser());

  useEffect(() => {
    if (!getStoredAdminToken() || !admin) {
      router.replace("/login");
    }
  }, [admin, router]);

  if (!admin) {
    return null;
  }

  return (
    <AdminShell admin={admin}>
      <section className="rounded-[14px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">{message}</p>
      </section>
    </AdminShell>
  );
}
