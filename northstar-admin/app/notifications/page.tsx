"use client";

import { useEffect, useMemo, useState } from "react";
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
  AdminNotificationDetail,
  AdminNotificationsResponse,
  LoggedInAdmin,
} from "../../types/admin";

type AdminNotificationsApiResponse = {
  success: boolean;
  message: string;
  data: AdminNotificationsResponse;
};

type AdminNotificationDetailApiResponse = {
  success: boolean;
  message: string;
  data: AdminNotificationDetail;
};

function ViewIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-[13px] w-[13px]"
      aria-hidden="true"
    >
      <path
        d="M2.75 10c1.45-2.7 4.3-4.75 7.25-4.75S15.8 7.3 17.25 10c-1.45 2.7-4.3 4.75-7.25 4.75S4.2 12.7 2.75 10Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 7.8A2.2 2.2 0 1 0 10 12.2 2.2 2.2 0 0 0 10 7.8Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m6 6 8 8" strokeLinecap="round" />
      <path d="m14 6-8 8" strokeLinecap="round" />
    </svg>
  );
}

function KpiIcon({ type }: { type: "total" | "email" | "sms" | "failed" }) {
  const iconClassName = "h-5 w-5";

  if (type === "total") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
        <path d="M5.25 7.25h13.5A1.75 1.75 0 0 1 20.5 9v8a1.75 1.75 0 0 1-1.75 1.75H5.25A1.75 1.75 0 0 1 3.5 17V9a1.75 1.75 0 0 1 1.75-1.75Z" />
        <path d="m4.5 9.25 7.5 5 7.5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "email") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
        <path d="M4.75 6.25h14.5A1.75 1.75 0 0 1 21 8v8a1.75 1.75 0 0 1-1.75 1.75H4.75A1.75 1.75 0 0 1 3 16V8a1.75 1.75 0 0 1 1.75-1.75Z" />
        <path d="m4 8 8 5.25L20 8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "sms") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
        <path d="M7 5.25h10A3.75 3.75 0 0 1 20.75 9v4A3.75 3.75 0 0 1 17 16.75h-5.25l-3.75 2.5v-2.5H7A3.75 3.75 0 0 1 3.25 13V9A3.75 3.75 0 0 1 7 5.25Z" />
        <path d="M8.5 10.5h7" strokeLinecap="round" />
        <path d="M8.5 13h4.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
      <path d="m8 8 8 8" strokeLinecap="round" />
      <path d="m16 8-8 8" strokeLinecap="round" />
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
    </svg>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getChannelClasses(channel: string) {
  return channel === "SMS"
    ? "border-blue-200 bg-blue-50 text-blue-700"
    : "border-slate-200 bg-white text-slate-700";
}

function getStatusClasses(status: string) {
  if (status === "SENT") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "FAILED") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

const primaryButtonClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-full bg-[var(--brand)] px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(22,61,115,0.18)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[var(--brand-hover)] hover:shadow-[0_18px_36px_rgba(22,61,115,0.24)] active:translate-y-[1px] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(22,61,115,0.18)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 disabled:opacity-50 disabled:shadow-none";

const secondaryButtonClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)] active:translate-y-[1px] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(148,163,184,0.18)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 disabled:opacity-50 disabled:shadow-none";

const iconButtonClassName =
  "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-[var(--brand)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)] active:translate-y-[1px] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(22,61,115,0.14)]";

export default function NotificationsPage() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [notificationsData, setNotificationsData] =
    useState<AdminNotificationsResponse | null>(null);
  const [selectedNotification, setSelectedNotification] =
    useState<AdminNotificationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsHydrated(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const admin = useMemo<LoggedInAdmin | null>(
    () => (isHydrated ? getStoredAdminUser() : null),
    [isHydrated],
  );

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const token = getStoredAdminToken();

    if (!token || !admin) {
      router.replace("/login");
      return;
    }

    let isCancelled = false;

    const query = new URLSearchParams({
      page: String(page),
      limit: "10",
    });

    if (appliedSearch.trim()) {
      query.set("search", appliedSearch.trim());
    }

    apiRequest<AdminNotificationsApiResponse>(
      `/admin/notifications?${query.toString()}`,
      { token },
    )
      .then((response) => {
        if (!isCancelled) {
          setNotificationsData(response.data);
        }
      })
      .catch((loadError) => {
        if (!isCancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load notifications",
          );
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [admin, appliedSearch, isHydrated, page, router]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#f3f6fb] px-5 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-[14px] border border-slate-200 bg-white"
              />
            ))}
          </div>
          <div className="h-[520px] animate-pulse rounded-[14px] border border-slate-200 bg-white" />
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  const handleApplyFilters = () => {
    setError(null);
    setIsLoading(true);
    setPage(1);
    setAppliedSearch(searchInput);
  };

  const handleViewNotification = async (notificationId: string) => {
    const token = getStoredAdminToken();

    if (!token) {
      clearAdminSession();
      router.replace("/login");
      return;
    }

    setSelectedNotification(null);
    setDetailError(null);
    setIsDetailLoading(true);

    try {
      const response = await apiRequest<AdminNotificationDetailApiResponse>(
        `/admin/notifications/${encodeURIComponent(notificationId)}`,
        { token },
      );

      setSelectedNotification(response.data);
    } catch (loadError) {
      setDetailError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load notification detail",
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedNotification(null);
    setDetailError(null);
    setIsDetailLoading(false);
  };

  return (
    <AdminShell admin={admin}>
      {isLoading ? (
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-[14px] border border-slate-200 bg-white"
              />
            ))}
          </div>
          <div className="h-[520px] animate-pulse rounded-[14px] border border-slate-200 bg-white" />
        </div>
      ) : error ? (
        <div className="rounded-[14px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : notificationsData ? (
        <div className="grid gap-4">
          <AdminKpiStrip
            columnsClassName="md:grid-cols-2 xl:grid-cols-4"
            items={[
              {
                label: "Total Notifications",
                value: notificationsData.kpis.totalNotifications,
                icon: <KpiIcon type="total" />,
              },
              {
                label: "Emails Sent",
                value: notificationsData.kpis.emailsSent,
                icon: <KpiIcon type="email" />,
              },
              {
                label: "SMS Sent",
                value: notificationsData.kpis.smsSent,
                icon: <KpiIcon type="sms" />,
              },
              {
                label: "Failed Notifications",
                value: notificationsData.kpis.failedNotifications,
                icon: <KpiIcon type="failed" />,
              },
            ]}
          />

          <section className="overflow-hidden rounded-[14px] border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                    Notifications
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    Delivery history and status updates
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Track application submission messages, document requests, reminder loops, and borrower status notifications.
                  </p>
                </div>

                <div className="flex gap-3">
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Application ID, applicant, type, recipient"
                    className="h-[46px] w-full min-w-[280px] rounded-[12px] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    className={`${primaryButtonClassName} h-[46px]`}
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>

            {notificationsData.notifications.length > 0 ? (
              <>
                <div className="w-full overflow-x-auto">
                  <table className="min-w-[1180px] bg-white">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        <th className="px-5 py-3 sm:px-6">Application ID</th>
                        <th className="px-5 py-3 sm:px-6">Applicant</th>
                        <th className="px-5 py-3 sm:px-6">Type</th>
                        <th className="px-5 py-3 sm:px-6">Channel</th>
                        <th className="px-5 py-3 sm:px-6">Status</th>
                        <th className="px-5 py-3 sm:px-6">Sent Date</th>
                        <th className="px-5 py-3 sm:px-6">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notificationsData.notifications.map((notification) => (
                        <tr
                          key={notification.id}
                          className="border-b border-slate-100 last:border-b-0"
                        >
                          <td className="px-5 py-3 text-sm font-semibold text-slate-950 sm:px-6">
                            {notification.applicationId}
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-700 sm:px-6">
                            {notification.applicantName}
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-700 sm:px-6">
                            {notification.type}
                          </td>
                          <td className="px-5 py-3 sm:px-6">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getChannelClasses(
                                notification.channel,
                              )}`}
                            >
                              {notification.channel}
                            </span>
                          </td>
                          <td className="px-5 py-3 sm:px-6">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                notification.status,
                              )}`}
                            >
                              {notification.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-600 sm:px-6">
                            {formatDate(notification.sentDate)}
                          </td>
                          <td className="px-5 py-3 sm:px-6">
                            <button
                              type="button"
                              onClick={() => void handleViewNotification(notification.id)}
                              className={iconButtonClassName}
                              aria-label={`View notification ${notification.id}`}
                              title="View"
                            >
                              <ViewIcon />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-sm text-slate-500">
                    Showing page {notificationsData.pagination.page} of{" "}
                    {Math.max(notificationsData.pagination.totalPages, 1)} with{" "}
                    {notificationsData.pagination.total} total notifications
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={notificationsData.pagination.page <= 1}
                      onClick={() =>
                        setPage((currentPage) => Math.max(currentPage - 1, 1))
                      }
                      className={`${secondaryButtonClassName} px-4 py-2 text-sm`}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={
                        notificationsData.pagination.page >=
                        notificationsData.pagination.totalPages
                      }
                      onClick={() => setPage((currentPage) => currentPage + 1)}
                      className={`${primaryButtonClassName} px-4 py-2 disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 disabled:opacity-50 disabled:shadow-none`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="px-5 py-12 text-center sm:px-6">
                <p className="text-base font-semibold text-slate-950">
                  No notifications found
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Notification activity will appear here as application events are generated.
                </p>
              </div>
            )}
          </section>

          {selectedNotification || isDetailLoading || detailError ? (
            <div className="fixed inset-0 z-40 bg-slate-950/20 px-4 py-4 sm:px-6">
              <div className="mx-auto max-w-3xl rounded-[18px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                      Notification Detail
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      Borrower delivery record
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={closeDetails}
                    className={iconButtonClassName}
                    aria-label="Close details"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="px-6 py-6">
                  {isDetailLoading ? (
                    <div className="grid gap-4">
                      <div className="h-16 animate-pulse rounded-[14px] border border-slate-200 bg-slate-50" />
                      <div className="h-48 animate-pulse rounded-[14px] border border-slate-200 bg-slate-50" />
                    </div>
                  ) : detailError ? (
                    <div className="rounded-[14px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                      {detailError}
                    </div>
                  ) : selectedNotification ? (
                    <div className="grid gap-4">
                      <section className="grid gap-4 rounded-[14px] border border-slate-200 bg-slate-50/60 p-5 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Application ID
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            {selectedNotification.applicationId}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Applicant
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            {selectedNotification.applicantName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Channel
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {selectedNotification.channel}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Notification Type
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {formatLabel(selectedNotification.type)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Status
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {selectedNotification.status}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Sent Date
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {formatDate(selectedNotification.sentDate)}
                          </p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Recipient
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {selectedNotification.recipient}
                          </p>
                        </div>
                      </section>

                      <section className="rounded-[14px] border border-slate-200 bg-white p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Subject
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {selectedNotification.subject || "No subject"}
                        </p>
                      </section>

                      <section className="rounded-[14px] border border-slate-200 bg-white p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Message Content
                        </p>
                        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-700">
                          {selectedNotification.message}
                        </pre>
                      </section>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </AdminShell>
  );
}
