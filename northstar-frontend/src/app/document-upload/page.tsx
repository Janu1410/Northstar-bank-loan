"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileUp, ShieldCheck, TriangleAlert, UploadCloud } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type UploadRequestResponse = {
  success: boolean;
  message: string;
  data: {
    id: string;
    applicationId: string;
    applicantName: string;
    documentType: string;
    requestedDocument: string;
    message: string | null;
    requestStatus: string;
    uploadStatus: string;
    expiryDate: string;
    uploadedDocumentUrl: string | null;
  };
};

type UploadDocumentResponse = {
  success: boolean;
  message: string;
  data: {
    fileName: string;
    uploadedAt: string;
    filePath: string;
  };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function DocumentUploadPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const missingTokenError = token ? null : "Missing upload token.";
  const missingApiBaseUrl = API_BASE_URL
    ? null
    : "NEXT_PUBLIC_API_BASE_URL is missing.";

  const [requestData, setRequestData] = useState<UploadRequestResponse["data"] | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !API_BASE_URL) {
      return;
    }

    let isCancelled = false;

    fetch(`${API_BASE_URL}/document-requests/upload/${token}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = (await response.json()) as UploadRequestResponse;

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to validate upload link");
        }

        if (!isCancelled) {
          setRequestData(data.data);
        }
      })
      .catch((loadError) => {
        if (!isCancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to validate upload link",
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
  }, [token]);

  const handleUpload = async () => {
    if (!token) {
      setError("Missing upload token.");
      return;
    }

    if (!API_BASE_URL) {
      setError("NEXT_PUBLIC_API_BASE_URL is missing.");
      return;
    }

    if (!selectedFile) {
      setError("Please select a PDF, JPG, or PNG file.");
      return;
    }

    const formData = new FormData();
    formData.append("document", selectedFile);

    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/document-requests/upload/${token}`, {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as UploadDocumentResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to upload document");
      }

      setSuccessMessage(`Uploaded ${data.data.fileName} successfully.`);
      setSelectedFile(null);
      setRequestData((current) =>
        current
          ? {
              ...current,
              requestStatus: "UPLOADED",
              uploadStatus: "UPLOADED",
              uploadedDocumentUrl: data.data.filePath,
            }
          : current,
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload document",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <section className="relative overflow-hidden px-5 py-8 sm:px-6 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute left-[-4rem] top-10 h-44 w-44 rounded-full bg-[rgba(22,61,115,0.08)] blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute right-[-4rem] top-24 h-56 w-56 rounded-full bg-white/80 blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              <ShieldCheck className="h-4 w-4 text-[var(--brand)]" />
              Northstar Lending
            </Link>
            <p className="text-sm text-slate-500">Secure document upload</p>
          </div>

          {isLoading ? (
            <div className="grid gap-4">
              <div className="h-40 animate-pulse rounded-[18px] border border-slate-200 bg-white" />
              <div className="h-80 animate-pulse rounded-[18px] border border-slate-200 bg-white" />
            </div>
          ) : error || missingTokenError || missingApiBaseUrl ? (
            <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-6 py-5 text-sm text-rose-700">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Upload link unavailable</p>
                  <p className="mt-1">{error || missingTokenError || missingApiBaseUrl}</p>
                </div>
              </div>
            </div>
          ) : requestData ? (
            <div className="grid gap-5">
              <section className="overflow-hidden rounded-[18px] border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-6 py-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand)]">
                    Upload Request
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                    Submit your requested document
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                    Please upload the requested file using this secure link. Accepted formats are PDF, JPG, and PNG up to 5 MB.
                  </p>
                </div>

                <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Application ID
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {requestData.applicationId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Applicant
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {requestData.applicantName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Requested Document
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {requestData.requestedDocument}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Expiry Date
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {formatDate(requestData.expiryDate)}
                    </p>
                  </div>
                </div>

                {requestData.message ? (
                  <div className="border-t border-slate-200 px-6 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Message
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {requestData.message}
                    </p>
                  </div>
                ) : null}

                <div className="border-t border-slate-200 px-6 py-6">
                  <label
                    htmlFor="document-upload"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-[18px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-[var(--brand)] hover:bg-[var(--brand-tint)]"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--brand)] shadow-sm">
                      <UploadCloud className="h-7 w-7" />
                    </span>
                    <span className="mt-4 text-base font-semibold text-slate-950">
                      Choose a document to upload
                    </span>
                    <span className="mt-2 text-sm text-slate-500">
                      PDF, JPG, or PNG up to 5 MB
                    </span>
                    <span className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                      Select File
                    </span>
                  </label>
                  <input
                    id="document-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="sr-only"
                    onChange={(event) => {
                      setError(null);
                      setSuccessMessage(null);
                      setSelectedFile(event.target.files?.[0] ?? null);
                    }}
                  />

                  {selectedFile ? (
                    <div className="mt-4 flex items-center gap-3 rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                      <FileUp className="h-4 w-4 text-[var(--brand)]" />
                      <span className="font-medium">{selectedFile.name}</span>
                    </div>
                  ) : null}

                  {successMessage ? (
                    <div className="mt-4 rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {successMessage}
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => void handleUpload()}
                      disabled={isUploading || requestData.requestStatus === "APPROVED"}
                      className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {isUploading ? "Uploading..." : "Upload Document"}
                    </button>
                    {requestData.uploadedDocumentUrl ? (
                      <a
                        href={requestData.uploadedDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        View Uploaded File
                      </a>
                    ) : null}
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
