"use client";

import Link from "next/link";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Landmark,
  LoaderCircle,
  PhoneCall,
  Wallet,
  XCircle,
} from "lucide-react";
import { Suspense, useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useSearchParams } from "next/navigation";

import { api } from "../../lib/api";

const statusLookupSchema = z.object({
  applicationId: z
    .string()
    .trim()
    .min(1, "Enter your application ID")
    .regex(/^NS-\d{4}-[A-Z0-9]{5,}$/, "Enter a valid Northstar application ID"),
  lastName: z.string().trim().min(2, "Enter your last name"),
});

type StatusLookupData = z.infer<typeof statusLookupSchema>;

type StatusHistoryEntry = {
  status: string;
  note: string | null;
  createdAt: string;
};

type ApplicationStatusResponse = {
  applicationId: string;
  customerName: string;
  amountRequested: number;
  currentStatus: string;
  bankVerificationStatus: string;
  submittedAt: string;
  statusHistory: StatusHistoryEntry[];
};

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]";

const stageMeta: Record<
  string,
  {
    title: string;
    description: string;
    icon: typeof Clock3;
  }
> = {
  APPLICATION_SUBMITTED: {
    title: "Application submitted",
    description: "Your request is in our system and ready for verification review.",
    icon: Clock3,
  },
  PHONE_VERIFICATION_PENDING: {
    title: "Phone confirmation pending",
    description: "The file is moving forward and waiting for final contact confirmation.",
    icon: PhoneCall,
  },
  SIGN_LOAN_AGREEMENT: {
    title: "Ready for agreement",
    description: "Your loan terms are prepared and ready for signature.",
    icon: CheckCircle2,
  },
  VERIFICATION_DEPOSIT_RETURN: {
    title: "Verification deposit return",
    description: "We are confirming the verification deposit flow with your bank account.",
    icon: Landmark,
  },
  FUNDED: {
    title: "Funds released",
    description: "Your application has been approved and funds have been issued.",
    icon: Wallet,
  },
  DECLINED: {
    title: "Application closed",
    description: "The review has ended and this application is no longer progressing.",
    icon: XCircle,
  },
};

const orderedStages = [
  "APPLICATION_SUBMITTED",
  "PHONE_VERIFICATION_PENDING",
  "SIGN_LOAN_AGREEMENT",
  "VERIFICATION_DEPOSIT_RETURN",
  "FUNDED",
];

function formatDateTime(value?: string | null) {
  if (!value) return "Not available yet";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function getStageIndex(status: string) {
  const index = orderedStages.indexOf(status);
  return index >= 0 ? index : 0;
}

function getStageStatus(currentStatus: string, stageStatus: string) {
  if (currentStatus === "DECLINED") {
    return stageStatus === "APPLICATION_SUBMITTED" ? "complete" : "upcoming";
  }

  const currentIndex = getStageIndex(currentStatus);
  const stageIndex = getStageIndex(stageStatus);

  if (stageIndex < currentIndex) return "complete";
  if (stageIndex === currentIndex) return "current";
  return "upcoming";
}

function getApplicationStatusBadge(status: string) {
  switch (status) {
    case "FUNDED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "DECLINED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "PHONE_VERIFICATION_PENDING":
    case "SIGN_LOAN_AGREEMENT":
    case "VERIFICATION_DEPOSIT_RETURN":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-white text-slate-700";
  }
}

function getNextStepCopy(result: ApplicationStatusResponse | null) {
  if (!result) return "Enter your application ID and last name to view live progress.";

  if (result.bankVerificationStatus !== "COMPLETED") {
    return "Complete or retry secure bank verification to keep the review moving forward.";
  }

  switch (result.currentStatus) {
    case "PHONE_VERIFICATION_PENDING":
      return "Our team may contact you shortly to confirm phone details and finalize the file.";
    case "SIGN_LOAN_AGREEMENT":
      return "Watch for your agreement package and review the terms when it becomes available.";
    case "VERIFICATION_DEPOSIT_RETURN":
      return "Check your account for the verification deposit and complete the return confirmation.";
    case "FUNDED":
      return "Your funds have been released. Keep your application ID for future support requests.";
    case "DECLINED":
      return "If you believe this result is incorrect, contact support with your application ID.";
    default:
      return "Your application is in queue and waiting for the next review checkpoint.";
  }
}

function getEstimatedCompletion(result: ApplicationStatusResponse | null) {
  if (!result) return "Check status after lookup";

  if (result.currentStatus === "FUNDED") return "Completed";
  if (result.currentStatus === "DECLINED") return "Closed";
  if (result.bankVerificationStatus !== "COMPLETED") return "1-2 business days after verification";

  switch (result.currentStatus) {
    case "PHONE_VERIFICATION_PENDING":
      return "Within 1-2 business days";
    case "SIGN_LOAN_AGREEMENT":
      return "Same day after agreement";
    case "VERIFICATION_DEPOSIT_RETURN":
      return "1-3 business days";
    default:
      return "Under active review";
  }
}

function LoanStatusPageContent() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ApplicationStatusResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultApplicationId = useMemo(
    () => (searchParams.get("applicationId") ?? "").trim().toUpperCase(),
    [searchParams],
  );
  const defaultLastName = useMemo(
    () => (searchParams.get("lastName") ?? "").trim(),
    [searchParams],
  );

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<StatusLookupData>({
    resolver: zodResolver(statusLookupSchema),
    defaultValues: {
      applicationId: defaultApplicationId,
      lastName: defaultLastName,
    },
  });
  const enteredLastName = useWatch({
    control,
    name: "lastName",
  });

  const resetLookup = () => {
    setResult(null);
    setSubmitError(null);
  };

  const lookupStatus = (values: StatusLookupData) => {
    setSubmitError(null);

    startTransition(async () => {
      try {
        const response = await api.post("/applications/status", {
          applicationId: values.applicationId.trim().toUpperCase(),
          lastName: values.lastName.trim(),
        });

        setResult(response.data?.data ?? null);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (typeof error.response?.data?.message === "string") {
            setSubmitError(error.response.data.message);
            return;
          }

          if (error.code === "ECONNABORTED") {
            setSubmitError("The status service took too long to respond. Please try again.");
            return;
          }

          if (!error.response) {
            setSubmitError(
              "Unable to connect to the application server. Check that the backend is running and your API URL is correct.",
            );
            return;
          }
        }

        setSubmitError("We could not fetch your loan status right now. Please try again.");
      }
    });
  };

  const onSubmit = handleSubmit(lookupStatus);

  useEffect(() => {
    setValue("applicationId", defaultApplicationId, { shouldValidate: false });
    setValue("lastName", defaultLastName, { shouldValidate: false });

    const parsed = statusLookupSchema.safeParse({
      applicationId: defaultApplicationId,
      lastName: defaultLastName,
    });

    if (!parsed.success) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      lookupStatus(parsed.data);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [defaultApplicationId, defaultLastName, setValue]);

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-5 py-8 text-slate-900 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-[1320px]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {!result ? (
          <section className="mt-6 mx-auto max-w-4xl rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="flex flex-col gap-6">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                  Track Your Application
                </p>
                <h1 className="mt-3 max-w-[14ch] text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-[3.6rem] sm:leading-[0.98]">
                  Follow your loan status with clarity.
                </h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
                  Check your current stage, understand the next action, and keep your application moving with one secure view.
                </p>
              </div>
            </div>

            <form className="mt-8 max-w-xl space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Application ID</label>
                <input
                  className={inputClassName}
                  placeholder="NS-2026-ABCDE"
                  autoComplete="off"
                  spellCheck={false}
                  {...register("applicationId")}
                  onChange={(event) =>
                    setValue("applicationId", event.target.value.toUpperCase(), {
                      shouldValidate: true,
                    })
                  }
                />
                {errors.applicationId?.message ? (
                  <p className="mt-2 text-sm text-rose-600">{errors.applicationId.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Last Name</label>
                <input
                  className={inputClassName}
                  placeholder="Enter your last name"
                  autoComplete="family-name"
                  {...register("lastName")}
                />
                {errors.lastName?.message ? (
                  <p className="mt-2 text-sm text-rose-600">{errors.lastName.message}</p>
                ) : null}
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-7 py-3.5 text-base font-semibold text-white shadow-[0_18px_40px_rgba(22,61,115,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[220px]"
                >
                  {isPending ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Loading Status
                    </>
                  ) : (
                    <>
                      Track Application
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {submitError ? (
              <div className="mt-5 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {submitError}
              </div>
            ) : null}
          </section>
        ) : null}

        {result ? (
          <section className="mt-6 space-y-6">
            <div className="flex flex-col gap-4 rounded-[22px] border border-slate-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand)]">
                  Application Status
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-3xl">
                  Track your live loan progress.
                </h1>
              </div>

              <button
                type="button"
                onClick={resetLookup}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[var(--brand-soft)] hover:bg-[var(--brand-tint)] hover:text-[var(--brand)]"
              >
                Track Another Application
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
                <p className="text-sm font-medium text-slate-500">Application ID</p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  {result.applicationId}
                </p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
                <p className="text-sm font-medium text-slate-500">Current Status</p>
                <div className="mt-3">
                  <span
                    className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${getApplicationStatusBadge(
                      result.currentStatus,
                    )}`}
                  >
                    {stageMeta[result.currentStatus]?.title ?? result.currentStatus}
                  </span>
                </div>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
                <p className="text-sm font-medium text-slate-500">Estimated Completion</p>
                <p className="mt-3 text-xl font-semibold text-slate-950">
                  {getEstimatedCompletion(result)}
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
              <div className="space-y-6">
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                    Current Loan Journey
                  </p>
                  <div className="mt-8 space-y-4">
                    {orderedStages.map((stageStatus) => {
                      const meta = stageMeta[stageStatus];
                      const state = getStageStatus(result.currentStatus, stageStatus);

                      return (
                        <div
                          key={stageStatus}
                          className={`rounded-[18px] border px-5 py-4 ${
                            state === "complete"
                              ? "border-emerald-200 bg-emerald-50"
                              : state === "current"
                                ? "border-[var(--brand-soft)] bg-[var(--brand-tint)]"
                                : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <span
                              className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full ${
                                state === "complete"
                                  ? "bg-emerald-600 text-white"
                                  : state === "current"
                                    ? "bg-[var(--brand)] text-white"
                                    : "border border-slate-200 bg-white text-slate-400"
                              }`}
                            >
                              {state === "complete" ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : state === "current" ? (
                                <span className="h-2.5 w-2.5 rounded-full bg-current" />
                              ) : (
                                <span className="h-2.5 w-2.5 rounded-full bg-current/60" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-lg font-semibold text-slate-950">{meta.title}</p>
                              <p className="mt-1 text-sm leading-6 text-slate-600">{meta.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <aside className="space-y-6">
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                    Next Action
                  </p>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    {getNextStepCopy(result)}
                  </p>

                  {result.bankVerificationStatus !== "COMPLETED" ? (
                    <Link
                      href={`/bank-verification?applicationId=${encodeURIComponent(
                        result.applicationId,
                      )}&lastName=${encodeURIComponent(enteredLastName || defaultLastName)}`}
                      className="mt-6 inline-flex items-center rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)]"
                    >
                      Complete Bank Verification
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  ) : null}
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                    Application Details
                  </p>
                  <div className="mt-6 space-y-5">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <span className="text-sm text-slate-500">Requested Amount</span>
                      <span className="text-sm font-semibold text-slate-950">
                        {formatCurrency(result.amountRequested)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <span className="text-sm text-slate-500">Application ID</span>
                      <span className="text-sm font-semibold text-slate-950">
                        {result.applicationId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-500">Submission Date</span>
                      <span className="text-sm font-semibold text-slate-950">
                        {formatDateTime(result.submittedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default function LoanStatusPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f4f7fb]" />}>
      <LoanStatusPageContent />
    </Suspense>
  );
}
