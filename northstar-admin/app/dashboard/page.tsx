"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminKpiStrip } from "../../components/admin-kpi-strip";
import { AdminShell } from "../../components/admin-shell";
import { apiRequest } from "../../lib/api";
import {
  clearAdminSession,
  getStoredAdminToken,
  getStoredAdminUser,
} from "../../lib/auth";
import type {
  AdminDashboardResponse,
  AdminProfile,
  LoggedInAdmin,
} from "../../types/admin";

type ProfileApiResponse = {
  success: boolean;
  admin: AdminProfile;
};

type DashboardApiResponse = {
  success: boolean;
  message: string;
  data: AdminDashboardResponse;
};

const statusLabels: Record<string, string> = {
  APPLICATION_SUBMITTED: "Application Submitted",
  PHONE_VERIFICATION_PENDING: "Phone Confirmation Pending",
  SIGN_LOAN_AGREEMENT: "Ready For Agreement",
  VERIFICATION_DEPOSIT_RETURN: "Verification Deposit Return",
  FUNDED: "Funded",
  DECLINED: "Declined",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({ value }: { value: string }) {
  const classes =
    value === "FUNDED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : value === "PHONE_VERIFICATION_PENDING"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : value === "DECLINED"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-white text-slate-600";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>
      {statusLabels[value] ?? value}
    </span>
  );
}

function KpiIcon({ type }: { type: "applications" | "queue" | "verified" | "funded" }) {
  const iconClassName = "h-5 w-5 text-[var(--brand)]";

  if (type === "applications") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
        <path d="M8 3.75h6l4.25 4.25V19.5A1.5 1.5 0 0 1 16.75 21h-9.5a1.5 1.5 0 0 1-1.5-1.5v-14A1.5 1.5 0 0 1 7.25 4h.75Z" />
        <path d="M14 3.75V8h4.25" />
        <path d="M8.75 12h6.5" />
        <path d="M8.75 15.5h6.5" />
      </svg>
    );
  }

  if (type === "queue") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
        <path d="M21 11.5a8.5 8.5 0 1 1-2.38-5.91" />
        <path d="M21 4.5v5h-5" />
        <path d="M12 7.5v4.25l2.75 1.75" />
      </svg>
    );
  }

  if (type === "verified") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
        <path d="M12 3.75 18.75 6v5.86c0 4.2-2.56 7.98-6.75 9.64-4.19-1.66-6.75-5.44-6.75-9.64V6L12 3.75Z" />
        <path d="m9.25 11.75 1.9 1.9 3.6-4.1" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
      <path d="M12 3.75c4.56 0 8.25 3.13 8.25 7s-3.69 7-8.25 7-8.25-3.13-8.25-7 3.69-7 8.25-7Z" />
      <path d="M12 6.75v10.5" />
      <path d="M15.25 8.75c-.56-.7-1.72-1.25-3.1-1.25-1.92 0-3.4 1.03-3.4 2.5 0 1.36 1.05 2.07 3.2 2.45 2.16.39 3.3 1.01 3.3 2.55 0 1.51-1.54 2.75-3.69 2.75-1.55 0-2.95-.54-3.8-1.45" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [admin] = useState<LoggedInAdmin | null>(() => getStoredAdminUser());
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getStoredAdminToken();

    if (!token || !admin) {
      router.replace("/login");
      return;
    }

    const loadDashboard = async () => {
      try {
        await apiRequest<ProfileApiResponse>("/admin/profile/me", {
          token,
        });

        const dashboardResponse = await apiRequest<DashboardApiResponse>(
          "/admin/applications/dashboard",
          {
            token,
          },
        );

        setDashboard(dashboardResponse.data);
      } catch (loadError) {
        clearAdminSession();
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load admin dashboard",
        );
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, [admin, router]);

  if (!admin) {
    return null;
  }

  return (
    <AdminShell admin={admin}>
      {isLoading ? (
        <div className="grid gap-6">
          <div className="grid gap-4 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-[14px] border border-slate-200 bg-white"
              />
            ))}
          </div>
          <div className="h-[420px] animate-pulse rounded-[14px] border border-slate-200 bg-white" />
        </div>
      ) : error ? (
        <div className="rounded-[14px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : dashboard ? (
        <div className="grid gap-4">
          <AdminKpiStrip
            columnsClassName="sm:grid-cols-2 xl:grid-cols-4"
            items={[
              {
                label: "Total Applications",
                value: dashboard.overview.totalApplications,
                icon: <KpiIcon type="applications" />,
              },
              {
                label: "Phone Confirmation Queue",
                value: dashboard.overview.pendingPhoneConfirmation,
                icon: <KpiIcon type="queue" />,
              },
              {
                label: "Completed Verifications",
                value: dashboard.overview.completedBankVerifications,
                icon: <KpiIcon type="verified" />,
              },
              {
                label: "Funded Applications",
                value: dashboard.overview.fundedApplications,
                icon: <KpiIcon type="funded" />,
              },
            ]}
          />

          <section>
            <div className="rounded-[14px] border border-slate-200 bg-white shadow-[0_22px_55px_rgba(15,23,42,0.05)]">
              <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                  Recent Applications
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Latest borrower activity
                </h2>
              </div>

              <div className="overflow-x-auto">
                {dashboard.recentApplications.length > 0 ? (
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        <th className="px-5 py-4 sm:px-6">Applicant</th>
                        <th className="px-5 py-4 sm:px-6">Amount</th>
                        <th className="px-5 py-4 sm:px-6">Status</th>
                        <th className="px-5 py-4 sm:px-6">Bank Verification</th>
                        <th className="px-5 py-4 sm:px-6">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentApplications.map((application) => (
                        <tr
                          key={application.applicationId}
                          className="border-b border-slate-100 last:border-b-0"
                        >
                          <td className="px-5 py-4 sm:px-6">
                            <div>
                              <p className="font-semibold text-slate-950">
                                {application.applicantName}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {application.applicationId}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-slate-950 sm:px-6">
                            {formatCurrency(application.amountRequested)}
                          </td>
                          <td className="px-5 py-4 sm:px-6">
                            <StatusBadge value={application.currentStatus} />
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">
                            {application.bankVerificationStatus}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">
                            {formatDate(application.submittedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-5 py-10 text-center sm:px-6">
                    <p className="text-base font-semibold text-slate-950">
                      No recent applications yet
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      New borrower activity will appear here automatically as soon as applications start coming in.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </AdminShell>
  );
}
