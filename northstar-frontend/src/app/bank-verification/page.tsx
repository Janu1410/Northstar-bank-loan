"use client";

import Link from "next/link";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  LoaderCircle,
  Landmark,
  LockKeyhole,
  OctagonAlert,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useSearchParams } from "next/navigation";

import { api } from "../../lib/api";

const applicationIdSchema = z.object({
  applicationId: z
    .string()
    .trim()
    .min(1, "Enter your application ID")
    .regex(/^NS-\d{4}-[A-Z0-9]{5,}$/, "Enter a valid Northstar application ID"),
});

type VerificationFormData = z.infer<typeof applicationIdSchema>;

type VerificationSession = {
  id: string;
  provider: string | null;
  status: "PENDING" | "COMPLETED" | "FAILED";
  verifiedAt: string | null;
  createdAt: string;
  applicationId: string;
  applicationStatus: string;
};

type VerificationLaunch = {
  provider: string | null;
  launchToken: string;
  expiresInSeconds: number;
};

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]";

function formatDateTime(value?: string | null) {
  if (!value) return "Not available yet";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getReadableStatus(status: VerificationSession["status"] | "IDLE") {
  switch (status) {
    case "PENDING":
      return "Verification in progress";
    case "COMPLETED":
      return "Verified successfully";
    case "FAILED":
      return "Verification failed";
    default:
      return "Ready to begin";
  }
}

function getStatusBadgeClass(status: VerificationSession["status"] | "IDLE") {
  switch (status) {
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "FAILED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-white text-slate-600";
  }
}

export default function BankVerificationPage() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [session, setSession] = useState<VerificationSession | null>(null);
  const [launch, setLaunch] = useState<VerificationLaunch | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [providerOpen, setProviderOpen] = useState(false);

  const defaultApplicationId = useMemo(
    () => (searchParams.get("applicationId") ?? "").trim().toUpperCase(),
    [searchParams],
  );
  const applicantLastName = useMemo(
    () => (searchParams.get("lastName") ?? "").trim(),
    [searchParams],
  );

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<VerificationFormData>({
    resolver: zodResolver(applicationIdSchema),
    defaultValues: {
      applicationId: defaultApplicationId,
    },
  });

  const applicationId = useWatch({
    control,
    name: "applicationId",
  });

  useEffect(() => {
    setValue("applicationId", defaultApplicationId, { shouldValidate: false });
  }, [defaultApplicationId, setValue]);

  const verificationStatus = session?.status ?? "IDLE";
  const isCompleted = verificationStatus === "COMPLETED";
  const isFailed = verificationStatus === "FAILED";
  const canLaunchProvider = verificationStatus === "PENDING" && Boolean(launch);

  const withFriendlyError = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
      if (typeof error.response?.data?.message === "string") {
        return error.response.data.message;
      }

      if (error.code === "ECONNABORTED") {
        return "The verification service took too long to respond. Please try again.";
      }

      if (!error.response) {
        return "Unable to connect to the verification service. Check that the backend is running and your API URL is correct.";
      }
    }

    return fallback;
  };

  const startVerification = handleSubmit((values) => {
    setSubmitError(null);
    setProviderOpen(false);

    startTransition(async () => {
      try {
        const response = await api.post("/bank-verification/launch", {
          applicationId: values.applicationId.trim().toUpperCase(),
        });

        const payload = response.data?.data;
        setSession(payload?.verification ?? null);
        setLaunch(payload?.launch ?? null);
      } catch (error) {
        setSubmitError(
          withFriendlyError(
            error,
            "We could not start your verification session. Please review the application ID and try again.",
          ),
        );
      }
    });
  });

  const handleProviderCallback = (outcome: "SUCCESS" | "FAILED") => {
    const parsed = applicationIdSchema.safeParse({
      applicationId,
    });

    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? "Enter a valid application ID.");
      return;
    }

    if (!launch?.launchToken) {
      setSubmitError("Start a verification session before launching secure bank link.");
      return;
    }

    setSubmitError(null);

    startTransition(async () => {
      try {
        const response = await api.post("/bank-verification/callback", {
          applicationId: parsed.data.applicationId.trim().toUpperCase(),
          launchToken: launch.launchToken,
          outcome,
        });

        setSession(response.data?.data ?? null);
        setProviderOpen(false);
      } catch (error) {
        setSubmitError(
          withFriendlyError(
            error,
            "We could not process the provider callback right now. Please try again in a moment.",
          ),
        );
      }
    });
  };

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-5 py-8 text-slate-900 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/apply"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Application
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.05)] sm:p-8 lg:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
              <Landmark className="h-7 w-7" />
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
              Secure Bank Verification
            </p>
            <h1 className="mt-4 max-w-[12ch] text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl">
              Confirm your banking details through a protected flow.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              Enter your application ID to start secure bank verification.
            </p>

            <form className="mt-10" onSubmit={startVerification}>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Application ID
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
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
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex min-w-[220px] items-center justify-center rounded-2xl bg-[var(--brand)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending && !session ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Starting Session
                    </>
                  ) : (
                    <>
                      Begin Verification
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
              {errors.applicationId?.message ? (
                <p className="mt-2 text-sm text-rose-600">{errors.applicationId.message}</p>
              ) : null}
            </form>

            {submitError ? (
              <div className="mt-6 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {submitError}
              </div>
            ) : null}

            {isCompleted ? (
              <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-800">
                  Bank verification is complete
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-700">
                  You can now track your loan status and see what happens next in the review process.
                </p>
                <Link
                  href={`/loan-status?applicationId=${encodeURIComponent(
                    session?.applicationId || applicationId || defaultApplicationId,
                  )}&lastName=${encodeURIComponent(applicantLastName)}`}
                  className="mt-4 inline-flex items-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Track Loan Status
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            ) : null}

            {launch ? (
              <div className="mt-6 rounded-[24px] border border-[var(--brand-soft)] bg-[var(--brand-tint)] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Secure provider handoff is ready
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Launch token expires in about {Math.round(launch.expiresInSeconds / 60)} minutes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProviderOpen(true)}
                    disabled={isPending || !canLaunchProvider}
                    className="inline-flex items-center justify-center rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Launch Secure Bank Link
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_26px_60px_rgba(15,23,42,0.16)] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
                    Live Session Status
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                    {getReadableStatus(verificationStatus)}
                  </h2>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                    verificationStatus,
                  )}`}
                >
                  {verificationStatus}
                </span>
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-300">Application reference</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {session?.applicationId || applicationId || "Waiting for input"}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-300">Provider</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {session?.provider || "Not created"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-300">Verified at</p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {formatDateTime(session?.verifiedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                Verification
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Session details
              </h3>

              <div className="mt-6 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Session created</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {formatDateTime(session?.createdAt)}
                </p>
                <p className="mt-4 text-sm text-slate-500">Application lifecycle status</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {session?.applicationStatus || "Unknown"}
                </p>
                <p className="mt-4 text-sm text-slate-500">Launch token state</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {launch ? "Issued and ready" : "Not issued"}
                </p>
              </div>

              <div className="mt-4 text-sm text-slate-500">
                {isCompleted
                  ? "The provider callback returned a successful verification outcome."
                  : isFailed
                    ? "The latest provider callback returned a failed verification outcome."
                    : canLaunchProvider
                      ? "The session is active and ready for secure provider handoff."
                      : "Start a verification session first to issue a provider launch token."}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {providerOpen && launch ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                  Simulated Provider Window
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                  Secure bank-link handoff
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  This modal represents the external provider experience. In production,
                  this is where Plaid Link or another hosted bank verification tool
                  would take over and then return a verified callback to your backend.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProviderOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                aria-label="Close provider window"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <Landmark className="h-5 w-5 text-[var(--brand)]" />
                <p className="mt-3 text-sm font-semibold text-slate-950">Connected flow</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Simulates the external verification provider window.
                </p>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <LockKeyhole className="h-5 w-5 text-[var(--brand)]" />
                <p className="mt-3 text-sm font-semibold text-slate-950">Short-lived token</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Launch token is signed server-side and expires automatically.
                </p>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <LockKeyhole className="h-5 w-5 text-[var(--brand)]" />
                <p className="mt-3 text-sm font-semibold text-slate-950">Callback finalization</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Backend decides success or failure after callback verification.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Application ID</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {session?.applicationId || applicationId}
              </p>
              <p className="mt-4 text-sm text-slate-500">Provider</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {launch.provider || "PLAID"}
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => handleProviderCallback("SUCCESS")}
                disabled={isPending}
                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[var(--brand)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Processing Callback
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Simulate Successful Return
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleProviderCallback("FAILED")}
                disabled={isPending}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <OctagonAlert className="mr-2 h-4 w-4" />
                Simulate Failed Return
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
