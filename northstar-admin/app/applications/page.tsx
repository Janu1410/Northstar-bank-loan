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
  AdminApplicationDetail,
  AdminApplicationsResponse,
  LoggedInAdmin,
} from "../../types/admin";

type AdminApplicationsApiResponse = {
  success: boolean;
  message: string;
  data: AdminApplicationsResponse;
};

type AdminApplicationDetailApiResponse = {
  success: boolean;
  message: string;
  data: AdminApplicationDetail;
};

type AdminApplicationActionApiResponse = {
  success: boolean;
  message: string;
  data: AdminApplicationDetail;
};

function ResetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 3.1-6.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 4.5v4.7h4.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ViewIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <path
        d="M2.75 12c1.7-3.2 5.1-5.75 9.25-5.75S19.55 8.8 21.25 12c-1.7 3.2-5.1 5.75-9.25 5.75S4.45 15.2 2.75 12Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z"
        fill="currentColor"
        stroke="none"
      />
      <path
        d="M12 10.45a1.55 1.55 0 0 1 1.52 1.22"
        stroke="white"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ActionStatusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[13px] w-[13px]" aria-hidden="true">
      <path d="M4 10h12" strokeLinecap="round" />
      <path d="M10 4v12" strokeLinecap="round" />
    </svg>
  );
}

function ActionDocumentIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[13px] w-[13px]" aria-hidden="true">
      <path d="M6 3.75h5l3.25 3.25V15a1.25 1.25 0 0 1-1.25 1.25h-7A1.25 1.25 0 0 1 4.75 15V5A1.25 1.25 0 0 1 6 3.75Z" />
      <path d="M11 3.75V7h3.25" />
    </svg>
  );
}

function ActionApproveIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[13px] w-[13px]" aria-hidden="true">
      <path d="m5.5 10 2.6 2.6 6.4-6.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActionDeclineIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[13px] w-[13px]" aria-hidden="true">
      <path d="m6 6 8 8" strokeLinecap="round" />
      <path d="m14 6-8 8" strokeLinecap="round" />
    </svg>
  );
}

function AgreementIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[13px] w-[13px]" aria-hidden="true">
      <path d="M6 3.75h5l3.25 3.25V15a1.25 1.25 0 0 1-1.25 1.25h-7A1.25 1.25 0 0 1 4.75 15V5A1.25 1.25 0 0 1 6 3.75Z" />
      <path d="M11 3.75V7h3.25" />
      <path d="M7.25 10h5.5" strokeLinecap="round" />
      <path d="M7.25 12.75h4" strokeLinecap="round" />
    </svg>
  );
}

function AgreementStatusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path d="M8 3.75h6l4.25 4.25V19.5A1.5 1.5 0 0 1 16.75 21h-9.5a1.5 1.5 0 0 1-1.5-1.5v-14A1.5 1.5 0 0 1 7.25 4H8Z" />
      <path d="M14 3.75V8h4.25" />
      <path d="m8.75 14 2 2 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AgreementTimelineIcon({
  type,
}: {
  type: "generated" | "signed" | "view";
}) {
  const iconClassName = "h-4 w-4";

  if (type === "generated") {
    return (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName} aria-hidden="true">
        <path d="M6 3.75v2.5" strokeLinecap="round" />
        <path d="M14 3.75v2.5" strokeLinecap="round" />
        <path d="M4.75 7h10.5" strokeLinecap="round" />
        <path d="M6.25 5h7.5A1.5 1.5 0 0 1 15.25 6.5v8A1.5 1.5 0 0 1 13.75 16h-7.5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 6.25 5Z" />
      </svg>
    );
  }

  if (type === "signed") {
    return (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName} aria-hidden="true">
        <path d="m4.5 13.5 3 2 8-8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.75 5.75h6.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName} aria-hidden="true">
      <path d="M2.75 10c1.45-2.7 4.3-4.75 7.25-4.75S15.8 7.3 17.25 10c-1.45 2.7-4.3 4.75-7.25 4.75S4.2 12.7 2.75 10Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 7.8A2.2 2.2 0 1 0 10 12.2 2.2 2.2 0 0 0 10 7.8Z" />
    </svg>
  );
}

function KpiIcon({
  type,
}: {
  type: "applications" | "new" | "review" | "queue";
}) {
  const iconClassName = "h-5 w-5";

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

  if (type === "new") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
        <path d="M12 5.25v13.5" strokeLinecap="round" />
        <path d="M5.25 12h13.5" strokeLinecap="round" />
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      </svg>
    );
  }

  if (type === "review") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
        <path d="M12 3.75 18.75 6v5.86c0 4.2-2.56 7.98-6.75 9.64-4.19-1.66-6.75-5.44-6.75-9.64V6L12 3.75Z" />
        <path d="m9.25 11.75 1.9 1.9 3.6-4.1" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
      <path d="M21 11.5a8.5 8.5 0 1 1-2.38-5.91" />
      <path d="M21 4.5v5h-5" />
      <path d="M12 7.5v4.25l2.75 1.75" />
    </svg>
  );
}

const statusOptions = [
  { label: "All statuses", value: "ALL" },
  { label: "Submitted", value: "APPLICATION_SUBMITTED" },
  { label: "Phone pending", value: "PHONE_VERIFICATION_PENDING" },
  { label: "Ready for agreement", value: "SIGN_LOAN_AGREEMENT" },
  { label: "Deposit return", value: "VERIFICATION_DEPOSIT_RETURN" },
  { label: "Funded", value: "FUNDED" },
  { label: "Declined", value: "DECLINED" },
] as const;

const bankVerificationOptions = [
  { label: "All bank statuses", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Completed", value: "COMPLETED" },
] as const;

const managerStatusOptions = [
  { label: "Application Submitted", value: "APPLICATION_SUBMITTED" },
  { label: "Phone Verification Pending", value: "PHONE_VERIFICATION_PENDING" },
  { label: "Sign Loan Agreement", value: "SIGN_LOAN_AGREEMENT" },
  { label: "Verification Deposit & Return", value: "VERIFICATION_DEPOSIT_RETURN" },
  { label: "Funded", value: "FUNDED" },
  { label: "Declined", value: "DECLINED" },
] as const;

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

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length !== 10) {
    return value;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getApplicationStatusClasses(status: string) {
  if (status === "FUNDED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "DECLINED") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (
    status === "PHONE_VERIFICATION_PENDING" ||
    status === "SIGN_LOAN_AGREEMENT" ||
    status === "VERIFICATION_DEPOSIT_RETURN"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-white text-slate-600";
}

function getBankStatusClasses(status: string) {
  if (status === "COMPLETED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-white text-slate-600";
}

function formatYesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function getAgreementStatusClasses(status: string) {
  if (status === "SIGNED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "GENERATED") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-200 bg-white text-slate-600";
}

function getAgreementStatusSummary(status: string) {
  if (status === "SIGNED") {
    return {
      title: "Agreement signed and complete",
      description:
        "The borrower has completed the agreement step and the document is ready for review.",
      panelClassName:
        "border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(255,255,255,0.98))]",
      iconWrapClassName: "bg-emerald-100 text-emerald-700",
    };
  }

  if (status === "GENERATED") {
    return {
      title: "Agreement generated and ready",
      description:
        "The agreement has been prepared. Open the document to verify details or follow up for signature.",
      panelClassName:
        "border-blue-200 bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(255,255,255,0.98))]",
      iconWrapClassName: "bg-blue-100 text-blue-700",
    };
  }

  return {
    title: "Agreement not generated yet",
    description:
      "Create the agreement to prepare the borrower for the next step and unlock the document preview.",
    panelClassName:
      "border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))]",
    iconWrapClassName: "bg-slate-100 text-slate-600",
  };
}

function getAgreementAccessSummary(agreementUrl: string | null) {
  if (agreementUrl) {
    return {
      title: "Borrower signing link is active",
      description:
        "Open the live agreement flow to review exactly what the borrower sees before signing.",
      actionLabel: "Open Signing Page",
    };
  }

  return {
    title: "Signing link unavailable",
    description:
      "Generate the agreement first to create a borrower-facing signing page and preview link.",
    actionLabel: "Signing Page Unavailable",
  };
}

const actionButtonBaseClassName =
  "inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-sm font-semibold transition duration-200 ease-out active:translate-y-[1px] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4";

const approveActionButtonClassName = `${actionButtonBaseClassName} bg-emerald-600 text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)] hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_18px_36px_rgba(5,150,105,0.28)] focus-visible:ring-[rgba(16,185,129,0.18)]`;

const declineActionButtonClassName = `${actionButtonBaseClassName} bg-rose-600 text-white shadow-[0_14px_30px_rgba(225,29,72,0.22)] hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-[0_18px_36px_rgba(225,29,72,0.28)] focus-visible:ring-[rgba(244,63,94,0.18)]`;

const primaryButtonClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-full bg-[var(--brand)] px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(22,61,115,0.18)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[var(--brand-hover)] hover:shadow-[0_18px_36px_rgba(22,61,115,0.24)] active:translate-y-[1px] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(22,61,115,0.18)]";

const secondaryButtonClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)] active:translate-y-[1px] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(148,163,184,0.18)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 disabled:opacity-50 disabled:shadow-none";

export default function ApplicationsPage() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [applicationsData, setApplicationsData] =
    useState<AdminApplicationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [bankVerification, setBankVerification] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedApplication, setSelectedApplication] =
    useState<AdminApplicationDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailActionMessage, setDetailActionMessage] = useState<string | null>(null);
  const [detailActionLoading, setDetailActionLoading] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState("APPLICATION_SUBMITTED");

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

    const loadApplications = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams({
          page: String(page),
          limit: "10",
        });

        if (appliedSearch.trim()) {
          query.set("search", appliedSearch.trim());
        }

        if (status !== "ALL") {
          query.set("status", status);
        }

        if (bankVerification !== "ALL") {
          query.set("bankVerification", bankVerification);
        }

        const response = await apiRequest<AdminApplicationsApiResponse>(
          `/admin/applications?${query.toString()}`,
          { token },
        );

        setApplicationsData(response.data);
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Unable to load admin applications";

        setError(message);

        if (
          message.toLowerCase().includes("unauthorized") ||
          message.toLowerCase().includes("token") ||
          message.toLowerCase().includes("forbidden")
        ) {
          clearAdminSession();
          router.replace("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadApplications();
  }, [admin, appliedSearch, bankVerification, isHydrated, page, router, status]);

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
          <div className="h-[540px] animate-pulse rounded-[14px] border border-slate-200 bg-white" />
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedSearch(searchInput);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setAppliedSearch("");
    setStatus("ALL");
    setBankVerification("ALL");
    setPage(1);
  };

  const handleViewDetails = async (applicationId: string) => {
    const token = getStoredAdminToken();

    if (!token) {
      clearAdminSession();
      router.replace("/login");
      return;
    }

    setSelectedApplication(null);
    setDetailError(null);
    setDetailActionMessage(null);
    setIsDetailLoading(true);

    try {
      const response = await apiRequest<AdminApplicationDetailApiResponse>(
        `/admin/applications/${encodeURIComponent(applicationId)}`,
        { token },
      );

      setSelectedApplication(response.data);
      setNextStatus(response.data.currentStatus);
    } catch (loadError) {
      setDetailError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load application details",
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedApplication(null);
    setDetailError(null);
    setDetailActionMessage(null);
    setDetailActionLoading(null);
    setIsDetailLoading(false);
  };

  const syncApplicationInList = (detail: AdminApplicationDetail) => {
    setApplicationsData((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        applications: current.applications.map((application) =>
          application.applicationId === detail.applicationId
            ? {
                ...application,
                currentStatus: detail.currentStatus,
                bankVerificationStatus: detail.bankVerificationStatus,
                updatedAt: detail.updatedAt,
              }
            : application,
        ),
      };
    });
  };

  const handleApplicationAction = async ({
    actionKey,
    requestPath,
    method,
    body,
  }: {
    actionKey: string;
    requestPath: string;
    method: "PATCH" | "POST";
    body?: Record<string, string>;
  }) => {
    const token = getStoredAdminToken();

    if (!token || !selectedApplication) {
      clearAdminSession();
      router.replace("/login");
      return;
    }

    setDetailError(null);
    setDetailActionMessage(null);
    setDetailActionLoading(actionKey);

    try {
      const response = await apiRequest<AdminApplicationActionApiResponse>(
        requestPath,
        {
          method,
          token,
          body: body ? JSON.stringify(body) : undefined,
        },
      );

      setSelectedApplication(response.data);
      setNextStatus(response.data.currentStatus);
      syncApplicationInList(response.data);
      setDetailActionMessage(response.message);
    } catch (actionError) {
      setDetailError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to update application",
      );
    } finally {
      setDetailActionLoading(null);
    }
  };

  const agreementStatusSummary = selectedApplication
    ? getAgreementStatusSummary(selectedApplication.agreementStatus)
    : null;
  const agreementAccessSummary = selectedApplication
    ? getAgreementAccessSummary(selectedApplication.agreementUrl)
    : null;
  const recentOperationalActivity = selectedApplication
    ? [
        ...selectedApplication.internalNotes.map((item) => ({
          ...item,
          category: "Internal Note",
        })),
        ...selectedApplication.auditActivity.map((item) => ({
          ...item,
          category: "Audit Activity",
        })),
      ]
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        )
        .slice(0, 6)
    : [];

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
          <div className="h-[540px] animate-pulse rounded-[14px] border border-slate-200 bg-white" />
        </div>
      ) : error ? (
        <div className="rounded-[14px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : applicationsData ? (
        <div className="grid gap-4">
          <AdminKpiStrip
            columnsClassName="md:grid-cols-2 xl:grid-cols-4"
            items={[
              {
                label: "Total Applications",
                value: applicationsData.kpis.totalApplications,
                icon: <KpiIcon type="applications" />,
              },
              {
                label: "New Today",
                value: applicationsData.kpis.newApplicationsToday,
                icon: <KpiIcon type="new" />,
              },
              {
                label: "Awaiting Review",
                value: applicationsData.kpis.awaitingReview,
                icon: <KpiIcon type="review" />,
              },
              {
                label: "Phone Queue",
                value: applicationsData.kpis.phoneVerificationQueue,
                icon: <KpiIcon type="queue" />,
              },
            ]}
          />

          <section className="overflow-hidden rounded-[14px] border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                Applications Workspace
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Review and filter borrower applications
              </h2>
            </div>

            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_220px_220px_auto]">
                <div>
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Application ID, applicant, email, or phone"
                    className="h-[46px] w-full rounded-[12px] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                  />
                </div>

                <div>
                  <select
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value);
                      setPage(1);
                    }}
                    className="h-[46px] w-full rounded-[12px] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={bankVerification}
                    onChange={(event) => {
                      setBankVerification(event.target.value);
                      setPage(1);
                    }}
                    className="h-[46px] w-full rounded-[12px] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                  >
                    {bankVerificationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end gap-3">
                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    className={`${primaryButtonClassName} h-[46px]`}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className={`${secondaryButtonClassName} h-[46px] w-[46px]`}
                    aria-label="Reset filters"
                    title="Reset filters"
                  >
                    <ResetIcon />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1">
                  Bank pending: {applicationsData.kpis.bankVerificationPending}
                </span>
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1">
                  Verified: {applicationsData.kpis.completedVerifications}
                </span>
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1">
                  Funded: {applicationsData.kpis.fundedApplications}
                </span>
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1">
                  Declined: {applicationsData.kpis.declinedApplications}
                </span>
              </div>
            </div>

            {applicationsData.applications.length > 0 ? (
              <>
                <div className="border-t border-slate-200 bg-slate-50/40">
                  <div className="w-full overflow-x-auto">
                    <table className="min-w-[1680px] bg-white">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          <th className="px-5 py-3 sm:px-6">Application ID</th>
                          <th className="px-5 py-3 sm:px-6">Applicant</th>
                          <th className="px-5 py-3 sm:px-6">Loan Amount</th>
                          <th className="px-5 py-3 sm:px-6">Employment Status</th>
                          <th className="px-5 py-3 sm:px-6">Credit Tier</th>
                          <th className="px-5 py-3 sm:px-6">Bank Verification</th>
                          <th className="px-5 py-3 sm:px-6">Current Status</th>
                          <th className="px-5 py-3 sm:px-6">Submitted Date</th>
                          <th className="px-5 py-3 sm:px-6">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applicationsData.applications.map((application) => (
                          <tr
                            key={application.id}
                            className="border-b border-slate-100 last:border-b-0"
                          >
                            <td className="px-5 py-3 text-sm font-semibold text-slate-950 sm:px-6">
                              {application.applicationId}
                            </td>
                            <td className="px-5 py-3 text-sm font-semibold text-slate-950 sm:px-6">
                              {application.applicantName}
                            </td>
                            <td className="px-5 py-3 text-sm font-semibold text-slate-950 sm:px-6">
                              {formatCurrency(application.amountRequested)}
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-600 sm:px-6">
                              {formatLabel(application.employmentStatus)}
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-600 sm:px-6">
                              {formatLabel(application.creditTier)}
                            </td>
                            <td className="px-5 py-3 sm:px-6">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getBankStatusClasses(
                                  application.bankVerificationStatus,
                                )}`}
                              >
                                {application.bankVerificationStatus}
                              </span>
                            </td>
                            <td className="px-5 py-3 sm:px-6">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getApplicationStatusClasses(
                                  application.currentStatus,
                                )}`}
                              >
                                {formatLabel(application.currentStatus)}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-600 sm:px-6">
                              {formatDate(application.submittedAt)}
                            </td>
                            <td className="px-5 py-3 sm:px-6">
                            <button
                              type="button"
                              onClick={() =>
                                void handleViewDetails(application.applicationId)
                              }
                              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-transparent text-slate-500 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:text-[var(--brand)] hover:shadow-[0_12px_26px_rgba(15,23,42,0.1)] active:translate-y-[1px] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(22,61,115,0.14)]"
                              aria-label={`View details for ${application.applicationId}`}
                              title="View details"
                            >
                              <ViewIcon />
                            </button>
                          </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-sm text-slate-500">
                    Showing page {applicationsData.pagination.page} of{" "}
                    {Math.max(applicationsData.pagination.totalPages, 1)} with{" "}
                    {applicationsData.pagination.total} total applications
                  </p>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={applicationsData.pagination.page <= 1}
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
                        applicationsData.pagination.page >=
                        applicationsData.pagination.totalPages
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
                  No applications matched your filters
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Try changing the search, status, or bank verification filters.
                </p>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {selectedApplication || isDetailLoading || detailError ? (
        <div className="fixed inset-0 z-40 bg-slate-950/20 px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex h-full w-full max-w-[1380px] flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-[#f8fafd] shadow-[0_28px_70px_rgba(15,23,42,0.16)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                  Application Details
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  {selectedApplication?.applicationId ?? "Loading details"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className={`${secondaryButtonClassName} h-10 w-10 text-slate-500`}
                aria-label="Close details"
              >
                x
              </button>
            </div>

            {detailActionMessage ? (
              <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-3 text-sm text-emerald-700">
                {detailActionMessage}
              </div>
            ) : null}

            {isDetailLoading ? (
              <div className="m-6 h-48 animate-pulse rounded-[14px] border border-slate-200 bg-slate-50" />
            ) : detailError && !selectedApplication ? (
              <div className="m-6 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {detailError}
              </div>
            ) : selectedApplication ? (
              <div className="grid min-h-0 flex-1 gap-6 overflow-hidden lg:grid-cols-[390px_minmax(0,1fr)]">
                <aside className="overflow-y-auto border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 lg:border-b-0 lg:border-r">
                  <section className="rounded-[18px] border border-slate-200 bg-[linear-gradient(135deg,rgba(22,61,115,0.08)_0%,rgba(255,255,255,0.96)_100%)] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                      Application Summary
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                      {formatCurrency(selectedApplication.amountRequested)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedApplication.applicationId}
                    </p>
                    <div className="mt-4 grid gap-3 text-sm text-slate-700">
                      <div className="flex items-center justify-between gap-4 rounded-[12px] border border-white/70 bg-white/80 px-3 py-3">
                        <span className="text-slate-500">Current Status</span>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getApplicationStatusClasses(
                            selectedApplication.currentStatus,
                          )}`}
                        >
                          {formatLabel(selectedApplication.currentStatus)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-[12px] border border-white/70 bg-white/80 px-3 py-3">
                        <span className="text-slate-500">Bank Verification</span>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getBankStatusClasses(
                            selectedApplication.bankVerificationStatus,
                          )}`}
                        >
                          {formatLabel(selectedApplication.bankVerificationStatus)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-[12px] border border-white/70 bg-white/80 px-3 py-3">
                        <span className="text-slate-500">Submitted</span>
                        <span className="text-right">{formatDate(selectedApplication.submittedAt)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-[12px] border border-white/70 bg-white/80 px-3 py-3">
                        <span className="text-slate-500">Updated</span>
                        <span className="text-right">{formatDate(selectedApplication.updatedAt)}</span>
                      </div>
                    </div>
                  </section>

                  <section className="mt-5 rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Status Management
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Move the application forward when verification or review is complete.
                    </p>
                    <div className="mt-4 rounded-[16px] border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Current Status
                      </p>
                      <div className="mt-2">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getApplicationStatusClasses(
                            selectedApplication.currentStatus,
                          )}`}
                        >
                          {formatLabel(selectedApplication.currentStatus)}
                        </span>
                      </div>
                      <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Select New Status
                      </label>
                      <select
                        value={nextStatus}
                        onChange={(event) => setNextStatus(event.target.value)}
                        className="mt-2 h-[44px] w-full rounded-[12px] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                      >
                        {managerStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          void handleApplicationAction({
                            actionKey: "status",
                            requestPath: `/admin/applications/${encodeURIComponent(
                              selectedApplication.applicationId,
                            )}/status`,
                            method: "PATCH",
                            body: { status: nextStatus },
                          })
                        }
                        disabled={detailActionLoading !== null}
                        className={`${primaryButtonClassName} mt-4 h-[46px] w-full gap-2 disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 disabled:opacity-50 disabled:shadow-none`}
                      >
                        <ActionStatusIcon />
                        {detailActionLoading === "status" ? "Updating..." : "Update Status"}
                      </button>
                    </div>
                  </section>

                  <section className="mt-5 rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Manager Decision
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Final decision controls are limited to manager-level approval authority.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          void handleApplicationAction({
                            actionKey: "approve",
                            requestPath: `/admin/applications/${encodeURIComponent(
                              selectedApplication.applicationId,
                            )}/decision`,
                            method: "PATCH",
                            body: { decision: "APPROVE" },
                          })
                        }
                        disabled={detailActionLoading !== null || admin.role !== "MANAGER"}
                        className={`${approveActionButtonClassName} h-11 w-full gap-2 rounded-[14px] disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 disabled:opacity-50 disabled:shadow-none`}
                      >
                        <ActionApproveIcon />
                        <span className="text-sm">Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void handleApplicationAction({
                            actionKey: "decline",
                            requestPath: `/admin/applications/${encodeURIComponent(
                              selectedApplication.applicationId,
                            )}/decision`,
                            method: "PATCH",
                            body: { decision: "DECLINE" },
                          })
                        }
                        disabled={detailActionLoading !== null || admin.role !== "MANAGER"}
                        className={`${declineActionButtonClassName} h-11 w-full gap-2 rounded-[14px] disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 disabled:opacity-50 disabled:shadow-none`}
                      >
                        <ActionDeclineIcon />
                        <span className="text-sm">Decline</span>
                      </button>
                    </div>
                  </section>

                  <section className="mt-5 rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Activity Timeline
                    </h3>
                    <div className="mt-4 space-y-3">
                      {selectedApplication.timeline.map((item) => (
                        <div
                          key={`${item.status}-${item.label}`}
                          className={`rounded-[14px] border px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.03)] ${
                            item.completed
                              ? "border-emerald-200 bg-emerald-50/60"
                              : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 h-2.5 w-2.5 rounded-full ${
                                item.completed ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                            />
                            <div>
                              <p className="text-sm font-semibold text-slate-950">
                                {item.label}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">{item.note}</p>
                              <p className="mt-2 text-xs text-slate-400">
                                {item.createdAt ? formatDate(item.createdAt) : "Pending"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </aside>

                <div className="overflow-y-auto p-6">
                  <div className="grid gap-4 xl:grid-cols-2">
                    <section className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)] xl:col-span-2">
                      <div className="bg-[linear-gradient(135deg,rgba(22,61,115,0.08)_0%,rgba(255,255,255,0.95)_100%)] px-5 py-5 sm:px-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                              Borrower Overview
                            </p>
                            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                              {selectedApplication.applicantName}
                            </h3>
                            <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
                              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1">
                                {selectedApplication.email}
                              </span>
                              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1">
                                {formatPhone(selectedApplication.phone)}
                              </span>
                              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1">
                                DOB: {formatDate(selectedApplication.dateOfBirth)}
                              </span>
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-[14px] border border-white/70 bg-white/90 px-4 py-3 text-sm shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Credit Tier
                              </p>
                              <p className="mt-2 font-semibold text-slate-950">
                                {formatLabel(selectedApplication.creditTier)}
                              </p>
                            </div>
                            <div className="rounded-[14px] border border-white/70 bg-white/90 px-4 py-3 text-sm shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Employment
                              </p>
                              <p className="mt-2 font-semibold text-slate-950">
                                {formatLabel(selectedApplication.employmentStatus)}
                              </p>
                            </div>
                            <div className="rounded-[14px] border border-white/70 bg-white/90 px-4 py-3 text-sm shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Bank Status
                              </p>
                              <p className="mt-2 font-semibold text-slate-950">
                                {formatLabel(selectedApplication.bankVerificationStatus)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Mailing Address
                          </p>
                          <p className="mt-2 text-sm leading-7 text-slate-700">
                            {selectedApplication.mailingAddress}
                          </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[14px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Requested Amount
                            </p>
                            <p className="mt-2 text-base font-semibold text-slate-950">
                              {formatCurrency(selectedApplication.amountRequested)}
                            </p>
                          </div>
                          <div className="rounded-[14px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Monthly Income
                            </p>
                            <p className="mt-2 text-base font-semibold text-slate-950">
                              {selectedApplication.monthlyGrossIncome !== null
                                ? formatCurrency(selectedApplication.monthlyGrossIncome)
                                : "Not available"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)] xl:col-span-2">
                      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,rgba(22,61,115,0.07)_0%,rgba(255,255,255,0.98)_100%)] px-5 py-5 sm:px-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex items-start gap-3">
                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(22,61,115,0.08)] text-[var(--brand)]">
                              <AgreementStatusIcon />
                            </span>
                            <div>
                              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Loan Agreement
                              </h3>
                              <p className="mt-2 text-xl font-semibold leading-8 text-slate-950">
                                {agreementStatusSummary?.title}
                              </p>
                              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                {agreementAccessSummary?.description}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`inline-flex self-start rounded-full border px-3 py-1 text-xs font-semibold ${getAgreementStatusClasses(
                              selectedApplication.agreementStatus,
                            )}`}
                          >
                            {formatLabel(selectedApplication.agreementStatus)}
                          </span>
                        </div>
                      </div>

                      <div className="px-5 py-5 sm:px-6">
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                          <div>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-[14px] border border-slate-200 bg-slate-50/80 px-4 py-3">
                                <div className="flex items-center gap-2 text-slate-500">
                                  <AgreementTimelineIcon type="generated" />
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                                    Generated
                                  </span>
                                </div>
                                <p className="mt-2 text-sm font-semibold text-slate-950">
                                  {selectedApplication.agreementGeneratedAt
                                    ? formatDate(selectedApplication.agreementGeneratedAt)
                                    : "Not generated yet"}
                                </p>
                              </div>
                              <div className="rounded-[14px] border border-slate-200 bg-slate-50/80 px-4 py-3">
                                <div className="flex items-center gap-2 text-slate-500">
                                  <AgreementTimelineIcon type="signed" />
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                                    Signature
                                  </span>
                                </div>
                                <p className="mt-2 text-sm font-semibold text-slate-950">
                                  {selectedApplication.agreementSignedAt
                                    ? "Completed"
                                    : "Awaiting borrower"}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {selectedApplication.agreementSignedAt
                                    ? formatDate(selectedApplication.agreementSignedAt)
                                    : "Waiting for confirmation"}
                                </p>
                              </div>
                              <div className="rounded-[14px] border border-slate-200 bg-slate-50/80 px-4 py-3">
                                <div className="flex items-center gap-2 text-slate-500">
                                  <AgreementTimelineIcon type="view" />
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                                    Access
                                  </span>
                                </div>
                                <p className="mt-2 text-sm font-semibold text-slate-950">
                                  {selectedApplication.agreementUrl
                                    ? "Signing page live"
                                    : "Link unavailable"}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {selectedApplication.agreementUrl
                                    ? "Borrower can review now"
                                    : "Generate package first"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 rounded-[16px] border border-slate-200 bg-slate-50/80 p-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Next Step
                              </p>
                              <p className="mt-2 text-sm leading-6 text-slate-700">
                                {selectedApplication.agreementSignedAt
                                  ? "The agreement is finished. Review the signed flow and continue the application to the next milestone."
                                  : selectedApplication.agreementGeneratedAt
                                    ? "The package is live. Open the signing page, confirm the borrower journey, and follow up until signature is complete."
                                    : "Generate the agreement package to unlock the borrower signing page and move this file forward."}
                              </p>

                              <div className="mt-4 flex flex-wrap gap-2">
                                <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                                  {selectedApplication.agreementGeneratedAt ? "Package ready" : "Not generated"}
                                </span>
                                <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                                  {selectedApplication.agreementSignedAt ? "Signed" : "Awaiting signature"}
                                </span>
                                <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                                  {selectedApplication.agreementUrl ? "Borrower link active" : "No live link"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-[16px] border border-slate-200 bg-slate-50/80 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Agreement Workspace
                            </p>
                            <p className="mt-2 text-base font-semibold text-slate-950">
                              {agreementAccessSummary?.title}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {selectedApplication.agreementSignedAt
                                ? "The signed agreement is ready for final review and downstream processing."
                                : selectedApplication.agreementGeneratedAt
                                  ? "Use the live borrower signing page to validate the experience and help the customer complete signature."
                                  : "Create the first agreement package to prepare the customer-facing signing flow."}
                            </p>

                            <div className="mt-4 grid gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  void handleApplicationAction({
                                    actionKey: "agreement",
                                    requestPath: `/admin/applications/${encodeURIComponent(
                                      selectedApplication.applicationId,
                                    )}/agreement/generate`,
                                    method: "POST",
                                  })
                                }
                                disabled={detailActionLoading !== null}
                                className={`${primaryButtonClassName} h-12 w-full justify-center gap-2 whitespace-nowrap rounded-[14px] px-4 disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 disabled:opacity-50 disabled:shadow-none`}
                              >
                                <AgreementIcon />
                                <span className="text-sm">
                                  {detailActionLoading === "agreement"
                                    ? "Generating..."
                                    : selectedApplication.agreementGeneratedAt
                                      ? "Refresh Agreement Package"
                                      : "Generate Agreement Package"}
                                </span>
                              </button>
                              <a
                                href={selectedApplication.agreementUrl || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className={`${secondaryButtonClassName} h-12 w-full justify-center gap-2 whitespace-nowrap rounded-[14px] px-4 ${selectedApplication.agreementUrl ? "" : "pointer-events-none opacity-50 shadow-none"}`}
                              >
                                <ActionDocumentIcon />
                                <span className="text-sm">
                                  {selectedApplication.agreementUrl
                                    ? "Open Borrower Signing Page"
                                    : "Signing Page Unavailable"}
                                </span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Borrower Contact
                      </h3>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm text-slate-700">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Full Name
                          </p>
                          <p className="mt-1 font-medium text-slate-950">
                            {selectedApplication.applicantName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Date of Birth
                          </p>
                          <p className="mt-1">{formatDate(selectedApplication.dateOfBirth)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Email
                          </p>
                          <p className="mt-1">{selectedApplication.email}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Phone
                          </p>
                          <p className="mt-1">{formatPhone(selectedApplication.phone)}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Address
                          </p>
                          <p className="mt-1">{selectedApplication.mailingAddress}</p>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Employment Snapshot
                      </h3>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm text-slate-700">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Employment Status
                          </p>
                          <p className="mt-1">{formatLabel(selectedApplication.employmentStatus)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Credit Tier
                          </p>
                          <p className="mt-1">{formatLabel(selectedApplication.creditTier)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Monthly Gross Income
                          </p>
                          <p className="mt-1">
                            {selectedApplication.monthlyGrossIncome !== null
                              ? formatCurrency(selectedApplication.monthlyGrossIncome)
                              : "Not available"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Employer
                          </p>
                          <p className="mt-1">{selectedApplication.employerName || "Not available"}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Employer Phone
                          </p>
                          <p className="mt-1">
                            {selectedApplication.employerPhone
                              ? formatPhone(selectedApplication.employerPhone)
                              : "Not available"}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Banking Snapshot
                      </h3>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm text-slate-700">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Account Type
                          </p>
                          <p className="mt-1">
                            {selectedApplication.accountType
                              ? formatLabel(selectedApplication.accountType)
                              : "Not available"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Account Number
                          </p>
                          <p className="mt-1">{selectedApplication.maskedAccountNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Bank Account Age
                          </p>
                          <p className="mt-1">
                            {selectedApplication.bankAccountAge
                              ? formatLabel(selectedApplication.bankAccountAge)
                              : "Not available"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Verification Status
                          </p>
                          <p className="mt-1">{formatLabel(selectedApplication.bankVerificationStatus)}</p>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Consent Summary
                      </h3>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm text-slate-700">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Credit Assessment Consent
                          </p>
                          <p className="mt-1">{formatYesNo(selectedApplication.creditAssessmentConsent)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            TCPA Consent
                          </p>
                          <p className="mt-1">{formatYesNo(selectedApplication.tcpaConsent)}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Consent Captured
                          </p>
                          <p className="mt-1">
                            {selectedApplication.consentDate
                              ? formatDate(selectedApplication.consentDate)
                              : "Not available"}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] xl:col-span-2">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Operational Activity
                          </h3>
                          <p className="mt-2 text-sm text-slate-500">
                            Latest notes and system events relevant to this application.
                          </p>
                        </div>
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                          {recentOperationalActivity.length} recent items
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        {recentOperationalActivity.length > 0 ? (
                          recentOperationalActivity.map((item) => (
                            <div
                              key={`${item.category}-${item.type}-${item.createdAt}`}
                              className="rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                  {item.category}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {formatDate(item.createdAt)}
                                </span>
                              </div>
                              <p className="mt-3 text-sm font-semibold text-slate-950">
                                {item.type}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-slate-600">
                                {item.detail || "Activity recorded"}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500 lg:col-span-2">
                            No internal notes or audit events recorded yet.
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
