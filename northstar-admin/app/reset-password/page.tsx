"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { apiRequest } from "../../lib/api";

type ResetTokenApiResponse = {
  success: boolean;
  message: string;
  data: {
    email: string;
    name: string;
    role: string;
  };
};

type ResetPasswordApiResponse = {
  success: boolean;
  message: string;
  data: {
    email: string;
  };
};

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [details, setDetails] = useState<ResetTokenApiResponse["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isTokenMissing = !token;

  useEffect(() => {
    if (isTokenMissing) {
      return;
    }

    let isCancelled = false;

    apiRequest<ResetTokenApiResponse>(
      `/admin/auth/reset-password/${encodeURIComponent(token)}`,
    )
      .then((response) => {
        if (!isCancelled) {
          setDetails(response.data);
        }
      })
      .catch((loadError) => {
        if (!isCancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Reset link is invalid or expired",
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
  }, [isTokenMissing, token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = await apiRequest<ResetPasswordApiResponse>(
        "/admin/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({
            token,
            password,
          }),
        },
      );

      setSuccessMessage(response.message);
      window.setTimeout(() => {
        router.replace("/login");
      }, 1500);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update password right now",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#eef3fb]">
      <div className="flex min-h-screen w-full bg-white shadow-[0_32px_80px_rgba(15,23,42,0.08)]">
        <section className="hidden lg:flex lg:w-[58%] lg:items-stretch">
          <div className="flex flex-1 flex-col justify-between bg-[linear-gradient(145deg,#14386a_0%,#1d4f92_58%,#163d73_100%)] px-10 py-10 text-white xl:px-12 xl:py-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100/90">
              Northstar Admin
            </p>
            <h1 className="mt-4 max-w-[10ch] text-[3.5rem] font-semibold tracking-[-0.07em] leading-[0.95]">
              Set your admin password securely.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-blue-100">
              Finish your first-time setup or reset your password to regain access to the admin workspace.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100/80">
                Access
              </p>
              <p className="mt-3 text-xl font-semibold">
                Password setup links are time-limited and tied to the invited admin account.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100/80">
                Security
              </p>
              <p className="mt-3 text-xl font-semibold">
                Finish setup with a personal password before accessing the Northstar Admin workspace.
              </p>
            </div>
          </div>
          </div>
        </section>

        <section className="flex w-full items-center justify-center lg:max-w-[520px]">
          <div className="w-full max-w-md">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                Password Setup
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-slate-950">
                Create your admin password
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Choose a new password to activate or restore your Northstar Admin access.
              </p>
            </div>

            {isLoading ? (
              <div className="mt-8 h-40 animate-pulse rounded-[24px] border border-slate-200 bg-slate-50" />
            ) : isTokenMissing ? (
              <div className="mt-8 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Reset link is missing or invalid.
              </div>
            ) : error && !details ? (
              <div className="mt-8 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : details ? (
              <>
                <div className="mt-8 rounded-[20px] border border-slate-200 bg-slate-50 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Account
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-950">
                    {details.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{details.email}</p>
                  <p className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                    {details.role.replace("_", " ")}
                  </p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-[52px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                      placeholder="Choose a secure password"
                      minLength={8}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="h-[52px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                      placeholder="Re-enter your password"
                      minLength={8}
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  {error ? (
                    <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {error}
                    </div>
                  ) : null}

                  {successMessage ? (
                    <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {successMessage}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_40px_rgba(22,61,115,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Updating Password..." : "Set Password"}
                  </button>
                </form>
              </>
            ) : null}

            <div className="mt-6">
              <Link
                href="/login"
                className="text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-hover)]"
              >
                Back to admin login
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
