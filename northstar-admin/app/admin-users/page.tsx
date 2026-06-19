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
  AdminRole,
  AdminUserListItem,
  AdminUsersResponse,
  LoggedInAdmin,
} from "../../types/admin";

type AdminUsersApiResponse = {
  success: boolean;
  message: string;
  data: AdminUsersResponse;
};

type AdminUserMutationApiResponse = {
  success: boolean;
  message: string;
  data: AdminUserListItem;
};

const roleDescriptions: Record<AdminRole, string[]> = {
  STANDARD_AGENT: [
    "View and manage applications",
    "Update application status",
    "Request documents and follow-ups",
    "Cannot approve, decline, or manage staff",
  ],
  MANAGER: [
    "Full access across the admin workspace",
    "Approve and decline loan applications",
    "Create and manage staff accounts",
    "Access reports and audit views",
  ],
};

function KpiIcon({
  type,
}: {
  type: "total" | "manager" | "agent" | "inactive";
}) {
  const iconClassName = "h-5 w-5";

  if (type === "total") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
        <path d="M7.5 7.25a3.25 3.25 0 1 1 0 6.5 3.25 3.25 0 0 1 0-6.5Z" />
        <path d="M16.5 8.25a2.25 2.25 0 1 1 0 4.5" />
        <path d="M3.75 18a4.75 4.75 0 0 1 7.54-3.83" strokeLinecap="round" />
        <path d="M14.25 16.75h6" strokeLinecap="round" />
        <path d="M17.25 13.75v6" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "manager") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
        <path d="m6.75 16.5 3-9 2.25 4 2.25-6 3 11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 19.25h14" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "agent") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
        <path d="M12 5.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
        <path d="M5.25 19a6.75 6.75 0 0 1 13.5 0" strokeLinecap="round" />
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

function ViewIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[13px] w-[13px]" aria-hidden="true">
      <path d="M2.75 10c1.45-2.7 4.3-4.75 7.25-4.75S15.8 7.3 17.25 10c-1.45 2.7-4.3 4.75-7.25 4.75S4.2 12.7 2.75 10Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 7.8A2.2 2.2 0 1 0 10 12.2 2.2 2.2 0 0 0 10 7.8Z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[13px] w-[13px]" aria-hidden="true">
      <path d="M4.75 14.5V16h1.5L14.9 7.35l-1.5-1.5L4.75 14.5Z" strokeLinejoin="round" />
      <path d="m12.6 6.65 1.5 1.5" strokeLinecap="round" />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[13px] w-[13px]" aria-hidden="true">
      <path d="M10 3.5v5" strokeLinecap="round" />
      <path d="M6.2 5.6a5.5 5.5 0 1 0 7.6 0" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="m6 6 8 8" strokeLinecap="round" />
      <path d="m14 6-8 8" strokeLinecap="round" />
    </svg>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatRole(value: AdminRole) {
  return value === "MANAGER" ? "Manager" : "Standard Agent";
}

function getRoleBadgeClassName(role: AdminRole) {
  return role === "MANAGER"
    ? "border-blue-200 bg-blue-50 text-blue-700"
    : "border-slate-200 bg-white text-slate-700";
}

function getStatusBadgeClassName(isActive: boolean) {
  return isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";
}

const primaryButtonClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-full bg-[var(--brand)] px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(22,61,115,0.18)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[var(--brand-hover)] hover:shadow-[0_18px_36px_rgba(22,61,115,0.24)] active:translate-y-[1px] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(22,61,115,0.18)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 disabled:opacity-50 disabled:shadow-none";

const secondaryButtonClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)] active:translate-y-[1px] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(148,163,184,0.18)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 disabled:opacity-50 disabled:shadow-none";

const iconButtonClassName =
  "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-[var(--brand)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)] active:translate-y-[1px] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(22,61,115,0.14)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";

export default function AdminUsersPage() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [adminUsersData, setAdminUsersData] = useState<AdminUsersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUserListItem | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<AdminUserListItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    role: "STANDARD_AGENT" as AdminRole,
  });
  const [editForm, setEditForm] = useState({
    name: "",
    role: "STANDARD_AGENT" as AdminRole,
    isActive: true,
  });

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

  const reloadAdminUsers = async () => {
    const token = getStoredAdminToken();

    if (!token || !admin) {
      clearAdminSession();
      router.replace("/login");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();

      if (appliedSearch.trim()) {
        query.set("search", appliedSearch.trim());
      }

      const response = await apiRequest<AdminUsersApiResponse>(
        `/admin/users${query.toString() ? `?${query.toString()}` : ""}`,
        { token },
      );

      setAdminUsersData(response.data);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load admin users";

      setError(message);

      if (message.toLowerCase().includes("unauthorized")) {
        clearAdminSession();
        router.replace("/login");
        return;
      }

      if (message.toLowerCase().includes("access denied")) {
        router.replace("/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const token = getStoredAdminToken();

    if (!token || !admin) {
      router.replace("/login");
      return;
    }

    if (admin.role !== "MANAGER") {
      router.replace("/dashboard");
      return;
    }

    let isCancelled = false;
    const query = new URLSearchParams();

    if (appliedSearch.trim()) {
      query.set("search", appliedSearch.trim());
    }

    apiRequest<AdminUsersApiResponse>(
      `/admin/users${query.toString() ? `?${query.toString()}` : ""}`,
      { token },
    )
      .then((response) => {
        if (!isCancelled) {
          setAdminUsersData(response.data);
        }
      })
      .catch((loadError) => {
        if (isCancelled) {
          return;
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : "Unable to load admin users";

        setError(message);

        if (message.toLowerCase().includes("unauthorized")) {
          clearAdminSession();
          router.replace("/login");
          return;
        }

        if (message.toLowerCase().includes("access denied")) {
          router.replace("/dashboard");
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
  }, [admin, appliedSearch, isHydrated, router]);

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

  if (!admin || admin.role !== "MANAGER") {
    return null;
  }

  const handleApplySearch = () => {
    setActionMessage(null);
    setIsLoading(true);
    setError(null);
    setAppliedSearch(searchInput);
  };

  const handleOpenEditModal = (item: AdminUserListItem) => {
    setEditingAdmin(item);
    setEditForm({
      name: item.name,
      role: item.role,
      isActive: item.isActive,
    });
  };

  const handleCreateAdmin = async () => {
    const token = getStoredAdminToken();

    if (!token) {
      clearAdminSession();
      router.replace("/login");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setActionMessage(null);

    try {
      const response = await apiRequest<AdminUserMutationApiResponse>("/admin/users", {
        method: "POST",
        token,
        body: JSON.stringify(createForm),
      });

      setActionMessage(response.message);
      setIsAddModalOpen(false);
      setCreateForm({
        name: "",
        email: "",
        role: "STANDARD_AGENT",
      });
      await reloadAdminUsers();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create admin account",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAdmin = async () => {
    if (!editingAdmin) {
      return;
    }

    const token = getStoredAdminToken();

    if (!token) {
      clearAdminSession();
      router.replace("/login");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setActionMessage(null);

    try {
      const response = await apiRequest<AdminUserMutationApiResponse>(
        `/admin/users/${encodeURIComponent(editingAdmin.id)}`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify(editForm),
        },
      );

      setActionMessage(response.message);
      setEditingAdmin(null);
      await reloadAdminUsers();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update admin account",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: AdminUserListItem) => {
    const token = getStoredAdminToken();

    if (!token) {
      clearAdminSession();
      router.replace("/login");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setActionMessage(null);

    try {
      const response = await apiRequest<AdminUserMutationApiResponse>(
        `/admin/users/${encodeURIComponent(item.id)}`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({
            isActive: !item.isActive,
          }),
        },
      );

      setActionMessage(response.message);
      await reloadAdminUsers();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update admin status",
      );
    } finally {
      setIsSubmitting(false);
    }
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
      ) : adminUsersData ? (
        <div className="grid gap-4">
          {actionMessage ? (
            <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
              {actionMessage}
            </div>
          ) : null}

          <AdminKpiStrip
            columnsClassName="md:grid-cols-2 xl:grid-cols-4"
            items={[
              {
                label: "Total Admins",
                value: adminUsersData.kpis.totalAdmins,
                icon: <KpiIcon type="total" />,
              },
              {
                label: "Managers",
                value: adminUsersData.kpis.managers,
                icon: <KpiIcon type="manager" />,
              },
              {
                label: "Standard Agents",
                value: adminUsersData.kpis.standardAgents,
                icon: <KpiIcon type="agent" />,
              },
              {
                label: "Inactive Users",
                value: adminUsersData.kpis.inactiveUsers,
                icon: <KpiIcon type="inactive" />,
              },
            ]}
          />

          <section className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                    Team Access Control
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    Employee management for the admin dashboard
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm text-slate-500">
                    Create staff accounts, assign roles, deactivate access safely, and send first-time admin access by email.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className={`${primaryButtonClassName} h-[46px] px-5`}
                >
                  + Add Admin
                </button>
              </div>
            </div>

            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-3 lg:flex-row">
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by name, email, or role"
                  className="h-[46px] w-full rounded-[12px] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleApplySearch}
                    className={`${primaryButtonClassName} h-[46px] px-5`}
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setIsLoading(true);
                      setError(null);
                      setAppliedSearch("");
                    }}
                    className={`${secondaryButtonClassName} h-[46px] px-5`}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {adminUsersData.admins.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      <th className="px-5 py-4 sm:px-6">Name</th>
                      <th className="px-5 py-4 sm:px-6">Email</th>
                      <th className="px-5 py-4 sm:px-6">Role</th>
                      <th className="px-5 py-4 sm:px-6">Status</th>
                      <th className="px-5 py-4 sm:px-6">Last Login</th>
                      <th className="px-5 py-4 sm:px-6">Created Date</th>
                      <th className="px-5 py-4 sm:px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsersData.admins.map((item) => {
                      const isCurrentAdmin = item.id === admin.id;

                      return (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 last:border-b-0"
                        >
                          <td className="px-5 py-4 sm:px-6">
                            <div>
                              <p className="font-semibold text-slate-950">
                                {item.name}
                                {isCurrentAdmin ? " (You)" : ""}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Created by {item.createdByName || "System seed"}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-700 sm:px-6">
                            {item.email}
                          </td>
                          <td className="px-5 py-4 sm:px-6">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getRoleBadgeClassName(
                                item.role,
                              )}`}
                            >
                              {formatRole(item.role)}
                            </span>
                          </td>
                          <td className="px-5 py-4 sm:px-6">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClassName(
                                item.isActive,
                              )}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">
                            {formatDate(item.lastLoginAt)}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedAdmin(item)}
                                className={iconButtonClassName}
                                title="View admin details"
                                aria-label={`View ${item.name}`}
                              >
                                <ViewIcon />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                className={iconButtonClassName}
                                title="Edit admin account"
                                aria-label={`Edit ${item.name}`}
                              >
                                <EditIcon />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleToggleStatus(item)}
                                disabled={isSubmitting || isCurrentAdmin}
                                className={iconButtonClassName}
                                title={item.isActive ? "Disable account" : "Activate account"}
                                aria-label={item.isActive ? `Disable ${item.name}` : `Activate ${item.name}`}
                              >
                                <PowerIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-12 text-center sm:px-6">
                <p className="text-base font-semibold text-slate-950">
                  No admin users found
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Add a staff account to start assigning access to the admin dashboard.
                </p>
              </div>
            )}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            {(["MANAGER", "STANDARD_AGENT"] as const).map((role) => (
              <div
                key={role}
                className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                  {formatRole(role)}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {role === "MANAGER"
                    ? "Manager-level accounts can oversee staff, control access, and approve or decline borrower applications."
                    : "Standard agents are limited to day-to-day application workflows without access to higher-risk management controls."}
                </p>
                <div className="mt-4 space-y-2">
                  {roleDescriptions[role].map((item) => (
                    <div
                      key={item}
                      className="rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {isAddModalOpen ? (
            <div className="fixed inset-0 z-40 bg-slate-950/20 px-4 py-4 sm:px-6">
              <div className="mx-auto max-w-2xl rounded-[18px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                      Add Admin
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      Create staff dashboard access
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSubmitting) {
                        setIsAddModalOpen(false);
                      }
                    }}
                    className={iconButtonClassName}
                    aria-label="Close add admin modal"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="mt-6 grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Full Name
                    </label>
                    <input
                      value={createForm.name}
                      onChange={(event) =>
                        setCreateForm((current) => ({ ...current, name: event.target.value }))
                      }
                      className="h-[46px] w-full rounded-[12px] border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(event) =>
                        setCreateForm((current) => ({ ...current, email: event.target.value }))
                      }
                      className="h-[46px] w-full rounded-[12px] border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Role
                    </label>
                    <select
                      value={createForm.role}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          role: event.target.value as AdminRole,
                        }))
                      }
                      className="h-[46px] w-full rounded-[12px] border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                    >
                      <option value="MANAGER">Manager</option>
                      <option value="STANDARD_AGENT">Standard Agent</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => void handleCreateAdmin()}
                    disabled={
                      isSubmitting ||
                      !createForm.name.trim() ||
                      !createForm.email.trim()
                    }
                    className={`${primaryButtonClassName} h-11 px-5`}
                  >
                    {isSubmitting ? "Creating..." : "Create & Send Access"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSubmitting) {
                        setIsAddModalOpen(false);
                      }
                    }}
                    className={`${secondaryButtonClassName} h-11 px-5`}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {selectedAdmin ? (
            <div className="fixed inset-0 z-40 bg-slate-950/20 px-4 py-4 sm:px-6">
              <div className="mx-auto max-w-3xl rounded-[18px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                      Admin Profile
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      {selectedAdmin.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAdmin(null)}
                    className={iconButtonClassName}
                    aria-label="Close admin profile"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="grid gap-4 px-6 py-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <section className="rounded-[14px] border border-slate-200 bg-slate-50/70 p-5">
                    <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-700">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Full Name
                        </p>
                        <p className="mt-1 font-semibold text-slate-950">
                          {selectedAdmin.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Role
                        </p>
                        <p className="mt-1">{formatRole(selectedAdmin.role)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Email
                        </p>
                        <p className="mt-1">{selectedAdmin.email}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Status
                        </p>
                        <p className="mt-1">{selectedAdmin.status}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Last Login
                        </p>
                        <p className="mt-1">{formatDate(selectedAdmin.lastLoginAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Created Date
                        </p>
                        <p className="mt-1">{formatDate(selectedAdmin.createdAt)}</p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[14px] border border-slate-200 bg-white p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                      Access Summary
                    </p>
                    <div className="mt-4 space-y-2">
                      {roleDescriptions[selectedAdmin.role].map((item) => (
                        <div
                          key={item}
                          className="rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          ) : null}

          {editingAdmin ? (
            <div className="fixed inset-0 z-40 bg-slate-950/20 px-4 py-4 sm:px-6">
              <div className="mx-auto max-w-2xl rounded-[18px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                      Edit Admin
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      Update staff access
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSubmitting) {
                        setEditingAdmin(null);
                      }
                    }}
                    className={iconButtonClassName}
                    aria-label="Close edit admin modal"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="mt-6 grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Full Name
                    </label>
                    <input
                      value={editForm.name}
                      onChange={(event) =>
                        setEditForm((current) => ({ ...current, name: event.target.value }))
                      }
                      className="h-[46px] w-full rounded-[12px] border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Role
                      </label>
                      <select
                        value={editForm.role}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            role: event.target.value as AdminRole,
                          }))
                        }
                        disabled={editingAdmin.id === admin.id}
                        className="h-[46px] w-full rounded-[12px] border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)] disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <option value="MANAGER">Manager</option>
                        <option value="STANDARD_AGENT">Standard Agent</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Status
                      </label>
                      <select
                        value={editForm.isActive ? "ACTIVE" : "INACTIVE"}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            isActive: event.target.value === "ACTIVE",
                          }))
                        }
                        disabled={editingAdmin.id === admin.id}
                        className="h-[46px] w-full rounded-[12px] border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)] disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {editingAdmin.id === admin.id ? (
                    <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      Your own manager role and active status cannot be changed from this screen.
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSaveAdmin()}
                    disabled={isSubmitting || !editForm.name.trim()}
                    className={`${primaryButtonClassName} h-11 px-5`}
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSubmitting) {
                        setEditingAdmin(null);
                      }
                    }}
                    className={`${secondaryButtonClassName} h-11 px-5`}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </AdminShell>
  );
}
