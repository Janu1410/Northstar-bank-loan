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
  AdminDocumentRequestListItem,
  AdminDocumentRequestsResponse,
  LoggedInAdmin,
} from "../../types/admin";

type AdminDocumentRequestsApiResponse = {
  success: boolean;
  message: string;
  data: AdminDocumentRequestsResponse;
};

type SendDocumentRequestApiResponse = {
  success: boolean;
  message: string;
  data: AdminDocumentRequestListItem | AdminDocumentRequestListItem[];
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

function ViewUploadIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[13px] w-[13px]" aria-hidden="true">
      <path d="M2.75 10c1.45-2.7 4.3-4.75 7.25-4.75S15.8 7.3 17.25 10c-1.45 2.7-4.3 4.75-7.25 4.75S4.2 12.7 2.75 10Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 7.8A2.2 2.2 0 1 0 10 12.2 2.2 2.2 0 0 0 10 7.8Z" />
    </svg>
  );
}

function ApproveIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[13px] w-[13px]" aria-hidden="true">
      <path d="m5.5 10 2.6 2.6 6.4-6.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RejectIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[13px] w-[13px]" aria-hidden="true">
      <path d="m6 6 8 8" strokeLinecap="round" />
      <path d="m14 6-8 8" strokeLinecap="round" />
    </svg>
  );
}

function KpiIcon({
  type,
}: {
  type: "pending" | "uploaded" | "approved" | "rejected" | "expired";
}) {
  const iconClassName = "h-5 w-5";

  if (type === "pending") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
        <path d="M21 11.5a8.5 8.5 0 1 1-2.38-5.91" />
        <path d="M21 4.5v5h-5" />
        <path d="M12 7.5v4.25l2.75 1.75" />
      </svg>
    );
  }

  if (type === "uploaded") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
        <path d="M12 15.25V5.5" strokeLinecap="round" />
        <path d="m8.5 9 3.5-3.5L15.5 9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.75 15.75v1.75A1.75 1.75 0 0 0 7.5 19.25h9a1.75 1.75 0 0 0 1.75-1.75v-1.75" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "approved") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
        <path d="M12 3.75 18.75 6v5.86c0 4.2-2.56 7.98-6.75 9.64-4.19-1.66-6.75-5.44-6.75-9.64V6L12 3.75Z" />
        <path d="m9.25 11.75 1.9 1.9 3.6-4.1" />
      </svg>
    );
  }

  if (type === "rejected") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
        <path d="m8 8 8 8" strokeLinecap="round" />
        <path d="m16 8-8 8" strokeLinecap="round" />
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
      <path d="M7.5 4.75h9a1.75 1.75 0 0 1 1.75 1.75v11a1.75 1.75 0 0 1-1.75 1.75h-9a1.75 1.75 0 0 1-1.75-1.75v-11A1.75 1.75 0 0 1 7.5 4.75Z" />
      <path d="M8.75 8.75h6.5" strokeLinecap="round" />
      <path d="M8.75 12h4.5" strokeLinecap="round" />
      <path d="M8.75 15.25h3" strokeLinecap="round" />
    </svg>
  );
}

const requestStatusOptions = [
  { label: "All request statuses", value: "ALL" },
  { label: "Requested", value: "REQUESTED" },
  { label: "Uploaded", value: "UPLOADED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Expired", value: "EXPIRED" },
] as const;

const uploadStatusOptions = [
  { label: "All upload statuses", value: "ALL" },
  { label: "Not uploaded", value: "NOT_UPLOADED" },
  { label: "Uploaded", value: "UPLOADED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Expired", value: "EXPIRED" },
] as const;

const documentTypeOptions = [
  { label: "Government ID", value: "GOVERNMENT_ID" },
  { label: "Proof of Address", value: "PROOF_OF_ADDRESS" },
  { label: "Income Proof", value: "INCOME_PROOF" },
  { label: "Bank Statement", value: "BANK_STATEMENT" },
  { label: "Employment Verification", value: "EMPLOYMENT_VERIFICATION" },
  { label: "Other", value: "OTHER" },
] as const;

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

function getRequestStatusClasses(status: string) {
  if (status === "APPROVED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "REJECTED") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "EXPIRED") {
    return "border-slate-300 bg-slate-100 text-slate-600";
  }

  if (status === "UPLOADED") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function getUploadStatusClasses(status: string) {
  if (status === "APPROVED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "REJECTED") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "UPLOADED") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "EXPIRED") {
    return "border-slate-300 bg-slate-100 text-slate-600";
  }

  return "border-slate-200 bg-white text-slate-600";
}

const pillButtonBaseClassName =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold transition duration-200 ease-out active:translate-y-[1px] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4";

const primaryPillButtonClassName = `${pillButtonBaseClassName} bg-[var(--brand)] text-white shadow-[0_16px_34px_rgba(22,61,115,0.18)] hover:-translate-y-0.5 hover:bg-[var(--brand-hover)] hover:shadow-[0_20px_40px_rgba(22,61,115,0.24)] focus-visible:ring-[rgba(22,61,115,0.18)]`;

const neutralPillButtonClassName = `${pillButtonBaseClassName} border border-slate-200 bg-white text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)] focus-visible:ring-[rgba(148,163,184,0.18)]`;

const successPillButtonClassName = `${pillButtonBaseClassName} bg-emerald-600 text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)] hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_18px_36px_rgba(5,150,105,0.28)] focus-visible:ring-[rgba(16,185,129,0.18)]`;

const dangerPillButtonClassName = `${pillButtonBaseClassName} bg-rose-600 text-white shadow-[0_14px_30px_rgba(225,29,72,0.22)] hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-[0_18px_36px_rgba(225,29,72,0.28)] focus-visible:ring-[rgba(244,63,94,0.18)]`;

const paginationSecondaryButtonClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)] active:translate-y-[1px] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(148,163,184,0.18)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 disabled:opacity-50 disabled:shadow-none";

const paginationPrimaryButtonClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(22,61,115,0.18)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[var(--brand-hover)] hover:shadow-[0_20px_40px_rgba(22,61,115,0.24)] active:translate-y-[1px] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(22,61,115,0.18)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 disabled:opacity-50 disabled:shadow-none";

export default function DocumentRequestsPage() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [documentData, setDocumentData] =
    useState<AdminDocumentRequestsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [requestStatus, setRequestStatus] = useState("ALL");
  const [uploadStatus, setUploadStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [sendForm, setSendForm] = useState({
    applicationId: "",
    documentType: "GOVERNMENT_ID",
    message: "",
    expiresInDays: "7",
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

    if (requestStatus !== "ALL") {
      query.set("requestStatus", requestStatus);
    }

    if (uploadStatus !== "ALL") {
      query.set("uploadStatus", uploadStatus);
    }

    apiRequest<AdminDocumentRequestsApiResponse>(
      `/admin/document-requests?${query.toString()}`,
      { token },
    )
      .then((response) => {
        if (!isCancelled) {
          setDocumentData(response.data);
        }
      })
      .catch((loadError) => {
        if (!isCancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load document requests",
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
  }, [admin, appliedSearch, isHydrated, page, requestStatus, router, uploadStatus]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#f3f6fb] px-5 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
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

  const loadDocumentRequests = async () => {
    const token = getStoredAdminToken();

    if (!token || !admin) {
      clearAdminSession();
      router.replace("/login");
      return;
    }

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

      if (requestStatus !== "ALL") {
        query.set("requestStatus", requestStatus);
      }

      if (uploadStatus !== "ALL") {
        query.set("uploadStatus", uploadStatus);
      }

      const response = await apiRequest<AdminDocumentRequestsApiResponse>(
        `/admin/document-requests?${query.toString()}`,
        { token },
      );

      setDocumentData(response.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load document requests",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setError(null);
    setIsLoading(true);
    setPage(1);
    setAppliedSearch(searchInput);
  };

  const handleResetFilters = () => {
    setError(null);
    setIsLoading(true);
    setSearchInput("");
    setAppliedSearch("");
    setRequestStatus("ALL");
    setUploadStatus("ALL");
    setPage(1);
  };

  const handleSendDocumentRequest = async () => {
    if (isSendingRequest) {
      return;
    }

    const token = getStoredAdminToken();

    if (!token) {
      clearAdminSession();
      router.replace("/login");
      return;
    }

    setError(null);
    setActionMessage(null);
    setIsSendingRequest(true);

    try {
      const response = await apiRequest<SendDocumentRequestApiResponse>(
        "/admin/document-requests/send",
        {
          method: "POST",
          token,
          body: JSON.stringify({
            applicationId: sendForm.applicationId.trim(),
            documentType: sendForm.documentType,
            message: sendForm.message.trim(),
            expiresInDays: Number(sendForm.expiresInDays),
          }),
        },
      );

      const createdRequest = Array.isArray(response.data)
        ? response.data[0]
        : response.data;

      setActionMessage(
        response.message ||
          `Secure document request prepared for ${createdRequest.applicationId}.`,
      );
      setIsSendModalOpen(false);
      setSendForm({
        applicationId: "",
        documentType: "GOVERNMENT_ID",
        message: "",
        expiresInDays: "7",
      });
      await loadDocumentRequests();
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send document request",
      );
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleUpdateRequest = async (
    documentRequestId: string,
    action: "APPROVE" | "REJECT" | "REREQUEST",
  ) => {
    const token = getStoredAdminToken();

    if (!token) {
      clearAdminSession();
      router.replace("/login");
      return;
    }

    try {
      await apiRequest<SendDocumentRequestApiResponse>(
        `/admin/document-requests/${documentRequestId}`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({ action }),
        },
      );

      setActionMessage(
        `Document request ${action.toLowerCase().replace("_", " ")} successfully.`,
      );
      await loadDocumentRequests();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update document request",
      );
    }
  };

  return (
    <AdminShell admin={admin}>
      {isLoading ? (
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
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
      ) : documentData ? (
        <div className="grid gap-4">
          {actionMessage ? (
            <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
              {actionMessage}
            </div>
          ) : null}

          <AdminKpiStrip
            columnsClassName="md:grid-cols-2 xl:grid-cols-5"
            items={[
              {
                label: "Pending Requests",
                value: documentData.kpis.pendingDocumentRequests,
                icon: <KpiIcon type="pending" />,
              },
              {
                label: "Uploaded Documents",
                value: documentData.kpis.uploadedDocuments,
                icon: <KpiIcon type="uploaded" />,
              },
              {
                label: "Approved Documents",
                value: documentData.kpis.approvedDocuments,
                icon: <KpiIcon type="approved" />,
              },
              {
                label: "Rejected Documents",
                value: documentData.kpis.rejectedDocuments,
                icon: <KpiIcon type="rejected" />,
              },
              {
                label: "Expired Links",
                value: documentData.kpis.expiredUploadLinks,
                icon: <KpiIcon type="expired" />,
              },
            ]}
          />

          <section className="overflow-hidden rounded-[14px] border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                    Collect Documents
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    Missing document request workspace
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Send secure token links, review uploads, and manage approvals or re-requests from one queue.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSendModalOpen(true)}
                  className={`${primaryPillButtonClassName} h-[46px] px-5 text-sm`}
                >
                  Send Document Request
                </button>
              </div>
            </div>

            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_240px_240px_auto]">
                <div>
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Application ID, applicant, or document name"
                    className="h-[46px] w-full rounded-[12px] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                  />
                </div>
                <div>
                  <select
                    value={requestStatus}
                    onChange={(event) => {
                      setError(null);
                      setIsLoading(true);
                      setRequestStatus(event.target.value);
                      setPage(1);
                    }}
                    className="h-[46px] w-full rounded-[12px] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                  >
                    {requestStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={uploadStatus}
                    onChange={(event) => {
                      setError(null);
                      setIsLoading(true);
                      setUploadStatus(event.target.value);
                      setPage(1);
                    }}
                    className="h-[46px] w-full rounded-[12px] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                  >
                    {uploadStatusOptions.map((option) => (
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
                    className={`${primaryPillButtonClassName} h-[46px] px-5 text-sm`}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className={`${neutralPillButtonClassName} h-[46px] w-[46px] text-slate-700`}
                    aria-label="Reset filters"
                    title="Reset filters"
                  >
                    <ResetIcon />
                  </button>
                </div>
              </div>
            </div>

            {documentData.documentRequests.length > 0 ? (
              <>
                <div className="w-full overflow-x-auto">
                  <table className="min-w-[1420px] bg-white">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        <th className="px-5 py-3 sm:px-6">Application ID</th>
                        <th className="px-5 py-3 sm:px-6">Applicant Name</th>
                        <th className="px-5 py-3 sm:px-6">Requested Document</th>
                        <th className="px-5 py-3 sm:px-6">Request Status</th>
                        <th className="px-5 py-3 sm:px-6">Upload Status</th>
                        <th className="px-5 py-3 sm:px-6">Requested Date</th>
                        <th className="px-5 py-3 sm:px-6">Expiry Date</th>
                        <th className="px-5 py-3 sm:px-6">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentData.documentRequests.map((request) => (
                        <tr
                          key={request.id}
                          className="border-b border-slate-100 last:border-b-0"
                        >
                          <td className="px-5 py-3 text-sm font-semibold text-slate-950 sm:px-6">
                            {request.applicationId}
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-700 sm:px-6">
                            {request.applicantName}
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-700 sm:px-6">
                            {request.requestedDocument}
                          </td>
                          <td className="px-5 py-3 sm:px-6">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getRequestStatusClasses(
                                request.requestStatus,
                              )}`}
                            >
                              {formatLabel(request.requestStatus)}
                            </span>
                          </td>
                          <td className="px-5 py-3 sm:px-6">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getUploadStatusClasses(
                                request.uploadStatus,
                              )}`}
                            >
                              {formatLabel(request.uploadStatus)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-600 sm:px-6">
                            {formatDate(request.requestedDate)}
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-600 sm:px-6">
                            {formatDate(request.expiryDate)}
                          </td>
                          <td className="px-5 py-3 sm:px-6">
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <a
                                href={request.uploadedDocumentUrl || "#"}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="View uploaded document"
                                title="View Upload"
                                className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition duration-200 ease-out active:translate-y-[1px] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(148,163,184,0.16)] ${
                                  request.uploadedDocumentUrl
                                    ? "border border-slate-200 bg-white text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)]"
                                    : "pointer-events-none border border-slate-100 bg-slate-50 text-slate-300"
                                }`}
                              >
                                <ViewUploadIcon />
                              </a>
                              <button
                                type="button"
                                onClick={() => void handleUpdateRequest(request.id, "APPROVE")}
                                disabled={request.uploadStatus !== "UPLOADED"}
                                aria-label="Approve document"
                                title="Approve"
                                className={`${successPillButtonClassName} h-9 w-9 disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 disabled:bg-emerald-200 disabled:text-white disabled:shadow-none`}
                              >
                                <ApproveIcon />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleUpdateRequest(request.id, "REJECT")}
                                aria-label="Reject document"
                                title="Reject"
                                className={`${dangerPillButtonClassName} h-9 w-9`}
                              >
                                <RejectIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-sm text-slate-500">
                    Showing page {documentData.pagination.page} of{" "}
                    {Math.max(documentData.pagination.totalPages, 1)} with{" "}
                    {documentData.pagination.total} total document requests
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={documentData.pagination.page <= 1}
                      onClick={() =>
                        {
                          setError(null);
                          setIsLoading(true);
                          setPage((currentPage) => Math.max(currentPage - 1, 1));
                        }
                      }
                      className={paginationSecondaryButtonClassName}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={
                        documentData.pagination.page >=
                        documentData.pagination.totalPages
                      }
                      onClick={() => {
                        setError(null);
                        setIsLoading(true);
                        setPage((currentPage) => currentPage + 1);
                      }}
                      className={paginationPrimaryButtonClassName}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="px-5 py-12 text-center sm:px-6">
                <p className="text-base font-semibold text-slate-950">
                  No document requests found
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Send a secure document request to begin collecting missing files.
                </p>
              </div>
            )}
          </section>

          {isSendModalOpen ? (
            <div className="fixed inset-0 z-40 bg-slate-950/20 px-4 py-4 sm:px-6">
              <div className="mx-auto max-w-xl rounded-[18px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                      Send Request
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      Send secure document link
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSendingRequest) {
                        setIsSendModalOpen(false);
                      }
                    }}
                    className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)] active:translate-y-[1px] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(148,163,184,0.18)]"
                    aria-label="Close"
                    disabled={isSendingRequest}
                  >
                    x
                  </button>
                </div>

                <div className="mt-6 grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Application ID
                    </label>
                    <input
                      value={sendForm.applicationId}
                      onChange={(event) =>
                        setSendForm((current) => ({
                          ...current,
                          applicationId: event.target.value,
                        }))
                      }
                      className="h-[46px] w-full rounded-[12px] border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Document Type
                    </label>
                    <select
                      value={sendForm.documentType}
                      onChange={(event) =>
                        setSendForm((current) => ({
                          ...current,
                          documentType: event.target.value,
                        }))
                      }
                      className="h-[46px] w-full rounded-[12px] border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                    >
                      {documentTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Custom Message
                      </label>
                      <input
                        value={sendForm.message}
                        onChange={(event) =>
                          setSendForm((current) => ({
                            ...current,
                            message: event.target.value,
                          }))
                        }
                        placeholder="Optional note for the borrower"
                        className="h-[46px] w-full rounded-[12px] border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Expiry Days
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={sendForm.expiresInDays}
                        onChange={(event) =>
                          setSendForm((current) => ({
                            ...current,
                            expiresInDays: event.target.value,
                          }))
                        }
                        className="h-[46px] w-full rounded-[12px] border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleSendDocumentRequest}
                    className={`${primaryPillButtonClassName} px-5 py-3 text-sm disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 disabled:opacity-60 disabled:shadow-none`}
                    disabled={
                      isSendingRequest ||
                      !sendForm.applicationId.trim() ||
                      !sendForm.documentType
                    }
                  >
                    {isSendingRequest ? "Sending..." : "Send Request"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSendingRequest) {
                        setIsSendModalOpen(false);
                      }
                    }}
                    className={`${neutralPillButtonClassName} px-5 py-3 text-sm disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 disabled:opacity-60 disabled:shadow-none`}
                    disabled={isSendingRequest}
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
