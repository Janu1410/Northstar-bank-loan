"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "../../lib/api";
import { getStoredAdminToken, storeAdminSession } from "../../lib/auth";
import type { AdminLoginResponse } from "../../types/admin";

type LoginApiResponse = {
  success: boolean;
  message: string;
  data: AdminLoginResponse;
};

type ForgotPasswordApiResponse = {
  success: boolean;
  message: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    if (getStoredAdminToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await apiRequest<LoginApiResponse>("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      storeAdminSession(response.data.token, response.data.admin);
      router.replace("/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to sign in right now",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your admin email first, then use forgot password.");
      return;
    }

    setError(null);
    setResetMessage(null);
    setIsResetSubmitting(true);

    try {
      const response = await apiRequest<ForgotPasswordApiResponse>(
        "/admin/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({ email }),
        },
      );

      setResetMessage(response.message);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to send password reset email",
      );
    } finally {
      setIsResetSubmitting(false);
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
            <h1 className="mt-4 max-w-[11ch] text-[3.5rem] font-semibold tracking-[-0.07em] leading-[0.95]">
              Manage every application with confidence.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-blue-100">
              Secure access for internal operations, application oversight, and verification progress tracking.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100/80">
                Operations
              </p>
              <p className="mt-3 text-xl font-semibold">Track submissions and review milestone movement.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100/80">
                Access
              </p>
              <p className="mt-3 text-xl font-semibold">Use your authorized admin email and password to continue.</p>
            </div>
          </div>
          </div>
        </section>

        <section className="flex w-full items-center justify-center lg:max-w-[520px]">
          <div className="w-full max-w-md">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                Admin Login
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-slate-950">
                Sign in to Northstar Admin
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Access the internal dashboard for application activity, verification progress, and operational review.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-[52px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                  placeholder="admin@northstar.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleForgotPassword()}
                    disabled={isResetSubmitting}
                    className="text-sm font-medium text-[var(--brand)] transition hover:text-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isResetSubmitting ? "Sending..." : "Forgot password?"}
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-[52px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              {resetMessage ? (
                <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {resetMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_40px_rgba(22,61,115,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
