"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Landmark,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { z } from "zod";

import { api } from "../../lib/api";

const employmentStatusOptions = [
  "EMPLOYED",
  "SELF_EMPLOYED",
  "UNEMPLOYED",
  "RETIRED",
  "STUDENT",
] as const;

const accountTypeOptions = ["CHECKING", "SAVINGS"] as const;

const bankAccountAgeOptions = [
  "LESS_THAN_6_MONTHS",
  "SIX_TO_TWELVE_MONTHS",
  "MORE_THAN_1_YEAR",
] as const;

const creditTierOptions = [
  "EXCELLENT",
  "GOOD",
  "FAIR",
  "POOR",
  "BAD",
  "UNKNOWN",
] as const;

const applicationSchema = z
  .object({
    amountRequested: z.coerce
      .number()
      .min(2000, "Minimum loan amount is $2,000")
      .max(10000, "Maximum loan amount is $10,000"),
    firstName: z.string().min(2, "Enter your first name"),
    lastName: z.string().min(2, "Enter your last name"),
    dateOfBirth: z.string().min(1, "Enter your date of birth"),
    ssn: z.string().regex(/^\d{9}$/, "Enter a valid 9-digit SSN or ITIN"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(10, "Enter a valid phone number"),
    mailingAddress: z.string().min(10, "Enter your address"),
    employmentStatus: z.enum(employmentStatusOptions, {
      message: "Select your employment status",
    }),
    monthlyGrossIncome: z.coerce
      .number()
      .min(1000, "Monthly income must be at least $1,000"),
    employerName: z.string().optional(),
    employerPhone: z.string().optional(),
    accountType: z.enum(accountTypeOptions, {
      message: "Select your account type",
    }),
    routingNumber: z.string().regex(/^\d{9}$/, "Enter a valid 9-digit routing number"),
    accountNumber: z.string().min(6, "Enter a valid account number"),
    bankAccountAge: z.enum(bankAccountAgeOptions, {
      message: "Select bank account age",
    }),
    creditTier: z.enum(creditTierOptions, {
      message: "Select your credit tier",
    }),
    referenceName: z.string().min(2, "Enter a reference name"),
    referencePhone: z.string().min(10, "Enter a valid reference phone"),
    referenceRelationship: z.string().min(2, "Enter the relationship"),
    creditAssessmentConsent: z.boolean(),
    tcpaConsent: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.employmentStatus === "EMPLOYED") {
      if (!values.employerName || values.employerName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["employerName"],
          message: "Enter your employer name",
        });
      }

      if (!values.employerPhone || values.employerPhone.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["employerPhone"],
          message: "Enter a valid employer phone",
        });
      }
    }

    if (!values.creditAssessmentConsent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["creditAssessmentConsent"],
        message: "Credit assessment consent is required",
      });
    }

    if (!values.tcpaConsent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tcpaConsent"],
        message: "TCPA consent is required",
      });
    }
  });

type ApplicationFormInput = z.input<typeof applicationSchema>;
type ApplicationFormData = z.output<typeof applicationSchema>;

type SubmissionSuccess = {
  applicationId: string;
  currentStatus: string;
  createdAt: string;
  lastName: string;
  email: string;
  notificationDelivery?: {
    email: string;
  };
};

const fieldLabels: Record<keyof ApplicationFormData, string> = {
  amountRequested: "Loan amount",
  firstName: "First name",
  lastName: "Last name",
  dateOfBirth: "Date of birth",
  ssn: "SSN / ITIN",
  email: "Email",
  phone: "Phone",
  mailingAddress: "Address",
  employmentStatus: "Employment status",
  monthlyGrossIncome: "Monthly gross income",
  employerName: "Employer name",
  employerPhone: "Employer phone",
  accountType: "Account type",
  routingNumber: "Routing number",
  accountNumber: "Account number",
  bankAccountAge: "Bank account age",
  creditTier: "Credit tier",
  referenceName: "Reference name",
  referencePhone: "Reference phone",
  referenceRelationship: "Relationship",
  creditAssessmentConsent: "Credit assessment consent",
  tcpaConsent: "TCPA consent",
};

const steps = [
  {
    number: 1,
    fields: [
      "amountRequested",
      "firstName",
      "lastName",
      "dateOfBirth",
      "ssn",
      "email",
      "phone",
      "mailingAddress",
    ] as const,
  },
  {
    number: 2,
    fields: [
      "employmentStatus",
      "monthlyGrossIncome",
      "employerName",
      "employerPhone",
    ] as const,
  },
  {
    number: 3,
    fields: [
      "accountType",
      "routingNumber",
      "accountNumber",
      "bankAccountAge",
      "creditTier",
    ] as const,
  },
  {
    number: 4,
    fields: [
      "referenceName",
      "referencePhone",
      "referenceRelationship",
    ] as const,
  },
  {
    number: 5,
    fields: ["creditAssessmentConsent", "tcpaConsent"] as const,
  },
];

const stepLabels = ["Personal", "Employment", "Banking", "Reference", "Review"] as const;

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(22,61,115,0.08)]";

const labelClassName = "mb-2 block text-sm font-medium text-slate-700";

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatSsn(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 text-sm text-rose-600">{message}</p>;
}

function InputShell({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400">
        {icon}
      </span>
      {children}
    </div>
  );
}

export default function ApplyPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationSummary, setValidationSummary] = useState<string[]>([]);
  const [submission, setSubmission] = useState<SubmissionSuccess | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    control,
    formState: { errors },
  } = useForm<ApplicationFormInput, unknown, ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      amountRequested: 5000,
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      ssn: "",
      email: "",
      phone: "",
      mailingAddress: "",
      employmentStatus: undefined,
      monthlyGrossIncome: 3000,
      employerName: "",
      employerPhone: "",
      accountType: undefined,
      routingNumber: "",
      accountNumber: "",
      bankAccountAge: undefined,
      creditTier: undefined,
      referenceName: "",
      referencePhone: "",
      referenceRelationship: "",
      creditAssessmentConsent: false,
      tcpaConsent: false,
    },
  });

  const amountRequested = useWatch({ control, name: "amountRequested" });
  const employmentStatus = useWatch({ control, name: "employmentStatus" });
  const ssn = useWatch({ control, name: "ssn" });
  const phone = useWatch({ control, name: "phone" });
  const employerPhone = useWatch({ control, name: "employerPhone" });
  const routingNumber = useWatch({ control, name: "routingNumber" });
  const accountNumber = useWatch({ control, name: "accountNumber" });
  const referencePhone = useWatch({ control, name: "referencePhone" });
  const creditAssessmentConsent = useWatch({
    control,
    name: "creditAssessmentConsent",
  });
  const tcpaConsent = useWatch({ control, name: "tcpaConsent" });

  const nextStep = async () => {
    const valid = await trigger([...steps[currentStep].fields]);
    if (!valid) return;
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const prevStep = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const buildValidationSummary = (formErrors: FieldErrors<ApplicationFormInput>) => {
    return Object.entries(formErrors).map(([fieldName, fieldError]) => {
      const key = fieldName as keyof ApplicationFormInput;
      const message =
        fieldError && typeof fieldError === "object" && "message" in fieldError
          ? fieldError.message
          : "";

      return `${fieldLabels[key]}${typeof message === "string" && message ? `: ${message}` : ""}`;
    });
  };

  const goToFirstInvalidStep = (formErrors: FieldErrors<ApplicationFormInput>) => {
    const firstInvalidIndex = steps.findIndex((step) =>
      step.fields.some((field) => field in formErrors),
    );

    if (firstInvalidIndex >= 0) {
      setCurrentStep(firstInvalidIndex);
    }
  };

  const onSubmit = handleSubmit(
    (values) => {
      setSubmitError(null);
      setValidationSummary([]);

      startTransition(async () => {
        try {
          const payload = {
            ...values,
            ssn: values.ssn.replace(/\D/g, ""),
            phone: values.phone.replace(/\D/g, ""),
            employerPhone:
              values.employmentStatus === "EMPLOYED"
                ? (values.employerPhone ?? "").replace(/\D/g, "")
                : "",
            employerName:
              values.employmentStatus === "EMPLOYED"
                ? values.employerName ?? ""
                : "",
            referencePhone: values.referencePhone.replace(/\D/g, ""),
            routingNumber: values.routingNumber.replace(/\D/g, ""),
            accountNumber: values.accountNumber.replace(/\D/g, ""),
          };

          const response = await api.post("/applications", payload);
          setSubmission({
            ...(response.data?.data ?? response.data),
            email: values.email.trim(),
            lastName: values.lastName.trim(),
          });
        } catch (error: unknown) {
          let message =
            "We could not submit your application. Please review the form and try again.";

          if (axios.isAxiosError(error)) {
            if (typeof error.response?.data?.message === "string") {
              message = error.response.data.message;
            } else if (error.code === "ECONNABORTED") {
              message =
                "The request timed out while connecting to the server. Please try again.";
            } else if (!error.response) {
              message =
                "Unable to connect to the application server. Make sure the backend is running and NEXT_PUBLIC_API_BASE_URL is correct.";
            }
          }

          setSubmitError(message);
        }
      });
    },
    (formErrors) => {
      setSubmitError(null);
      setValidationSummary(buildValidationSummary(formErrors));
      goToFirstInvalidStep(formErrors);
    },
  );

  if (submission) {
    return (
      <main className="min-h-screen bg-[#f4f7fb] px-5 py-14 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.05)] sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
            Application Submitted Successfully
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl">
            Your application has been received.
          </h1>
          <div className="mt-8 rounded-[22px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm text-slate-500">Your Application ID:</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              {submission.applicationId}
            </p>
          </div>
          <div className="mt-6 rounded-[22px] border border-[var(--brand-soft)] bg-[var(--brand-tint)] p-5">
            <p className="text-sm font-semibold text-slate-950">Next Step:</p>
            <p className="mt-2 text-base leading-7 text-slate-600">
              Complete secure bank verification.
            </p>
          </div>
          <div className="mt-6 rounded-[22px] border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-900">Confirmation Email:</p>
            <p className="mt-2 text-base leading-7 text-emerald-800">
              A successful application confirmation has been sent to {submission.email}.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/bank-verification?applicationId=${encodeURIComponent(submission.applicationId)}&lastName=${encodeURIComponent(submission.lastName)}`}
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold !text-white transition hover:bg-[var(--brand-hover)] hover:!text-white"
            >
              Continue to Bank Verification
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex max-w-[1320px] flex-col px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--brand)] transition hover:text-[var(--brand-hover)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div>
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.04)] sm:p-5 lg:p-6">
            <div className="border-b border-slate-200 pb-4">
              <h1 className="text-[1.9rem] font-semibold tracking-[-0.06em] text-slate-950 sm:text-[2.2rem]">
                Apply for a Personal Loan
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4 text-[var(--brand)]" />
                  Secure Application
                </span>
                <span>256-Bit Encryption</span>
                <span>No Upfront Fees</span>
                <span>24-Hour Funding</span>
              </div>
            </div>

            <div className="mt-4 sm:hidden">
              <p className="text-sm font-semibold text-[var(--brand)]">
                Step {currentStep + 1} of {steps.length}
              </p>
              <p className="mt-1 text-sm text-slate-500">{stepLabels[currentStep]}</p>
            </div>

            <div className="mt-4 hidden items-center gap-3 lg:flex">
              {steps.map((step, index) => {
                const active = currentStep === index;
                const complete = currentStep > index;

                return (
                  <div key={step.number} className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                          active
                            ? "bg-[var(--brand)] text-white"
                            : complete
                              ? "bg-emerald-600 text-white"
                              : "border border-slate-200 bg-white text-slate-500"
                        }`}
                      >
                        {complete ? <Check className="h-4 w-4" /> : step.number}
                      </span>
                      <span className={`text-sm font-medium ${active ? "text-[var(--brand)]" : "text-slate-500"}`}>
                        {stepLabels[index]}
                      </span>
                    </div>
                    {index < steps.length - 1 ? (
                      <div className={`h-px flex-1 ${complete ? "bg-emerald-500" : "bg-slate-200"}`} />
                    ) : null}
                  </div>
                );
              })}
            </div>

            <form className="pt-5" onSubmit={onSubmit}>
              {validationSummary.length > 0 ? (
                <div className="mb-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-semibold text-slate-950">Please complete the following before submitting:</p>
                  <ul className="mt-2 space-y-1 text-slate-700">
                    {validationSummary.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                {currentStep === 0 ? (
                  <section>
                    <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-950">
                      Personal Information
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-slate-500">
                      Provide your legal information exactly as it appears on official documents.
                    </p>

                    <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Loan Amount</p>
                          <p className="mt-2 text-[2rem] font-semibold tracking-[-0.06em] text-slate-950">
                            ${Number(amountRequested || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-sm text-slate-500">
                          <span>$2,000</span>
                          <span className="mx-3 text-slate-300">-</span>
                          <span>$10,000</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="2000"
                        max="10000"
                        step="500"
                        className="slider mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200"
                        {...register("amountRequested")}
                      />
                      <ErrorText message={errors.amountRequested?.message} />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelClassName}>First Name</label>
                        <InputShell icon={<User className="h-4 w-4" />}>
                          <input className={`${inputClassName} h-[52px] pl-11`} {...register("firstName")} />
                        </InputShell>
                        <ErrorText message={errors.firstName?.message} />
                      </div>
                      <div>
                        <label className={labelClassName}>Last Name</label>
                        <InputShell icon={<User className="h-4 w-4" />}>
                          <input className={`${inputClassName} h-[52px] pl-11`} {...register("lastName")} />
                        </InputShell>
                        <ErrorText message={errors.lastName?.message} />
                      </div>
                      <div>
                        <label className={labelClassName}>Date of Birth</label>
                        <InputShell icon={<CalendarDays className="h-4 w-4" />}>
                          <input type="date" className={`${inputClassName} h-[52px] pl-11`} {...register("dateOfBirth")} />
                        </InputShell>
                        <ErrorText message={errors.dateOfBirth?.message} />
                      </div>
                      <div>
                        <label className={labelClassName}>SSN / ITIN</label>
                        <InputShell icon={<ShieldCheck className="h-4 w-4" />}>
                          <input
                            className={`${inputClassName} h-[52px] pl-11`}
                            value={formatSsn(ssn || "")}
                            onChange={(event) =>
                              setValue("ssn", event.target.value.replace(/\D/g, ""), {
                                shouldValidate: true,
                              })
                            }
                            placeholder="123-45-6789"
                          />
                        </InputShell>
                        <ErrorText message={errors.ssn?.message} />
                      </div>
                      <div>
                        <label className={labelClassName}>Email Address</label>
                        <InputShell icon={<Mail className="h-4 w-4" />}>
                          <input type="email" className={`${inputClassName} h-[52px] pl-11`} {...register("email")} />
                        </InputShell>
                        <ErrorText message={errors.email?.message} />
                      </div>
                      <div>
                        <label className={labelClassName}>Phone Number</label>
                        <InputShell icon={<Phone className="h-4 w-4" />}>
                          <input
                            className={`${inputClassName} h-[52px] pl-11`}
                            value={formatPhone(phone || "")}
                            onChange={(event) =>
                              setValue("phone", event.target.value.replace(/\D/g, ""), {
                                shouldValidate: true,
                              })
                            }
                            placeholder="(555) 123-4567"
                          />
                        </InputShell>
                        <ErrorText message={errors.phone?.message} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClassName}>Current Address</label>
                        <InputShell icon={<MapPin className="h-4 w-4" />}>
                          <textarea
                            className={`${inputClassName} min-h-[96px] resize-none pl-11`}
                            {...register("mailingAddress")}
                          />
                        </InputShell>
                        <ErrorText message={errors.mailingAddress?.message} />
                      </div>
                    </div>
                  </section>
                ) : null}

                {currentStep === 1 ? (
                  <section>
                    <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-950">
                      Employment Information
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-slate-500">
                      Share your current income and work details for underwriting review.
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelClassName}>Employment Status</label>
                        <select className={`${inputClassName} h-[52px]`} {...register("employmentStatus")}>
                          <option value="">Select status</option>
                          <option value="EMPLOYED">Employed</option>
                          <option value="SELF_EMPLOYED">Self-Employed</option>
                          <option value="UNEMPLOYED">Unemployed</option>
                          <option value="RETIRED">Retired</option>
                          <option value="STUDENT">Student</option>
                        </select>
                        <ErrorText message={errors.employmentStatus?.message} />
                      </div>
                      <div>
                        <label className={labelClassName}>Monthly Gross Income</label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                          <input type="number" className={`${inputClassName} h-[52px] pl-8`} {...register("monthlyGrossIncome")} />
                        </div>
                        <ErrorText message={errors.monthlyGrossIncome?.message} />
                      </div>
                      {employmentStatus === "EMPLOYED" ? (
                        <>
                          <div>
                            <label className={labelClassName}>Employer Name</label>
                            <InputShell icon={<BriefcaseBusiness className="h-4 w-4" />}>
                              <input className={`${inputClassName} h-[52px] pl-11`} {...register("employerName")} />
                            </InputShell>
                            <ErrorText message={errors.employerName?.message} />
                          </div>
                          <div>
                            <label className={labelClassName}>Employer Phone</label>
                            <InputShell icon={<Phone className="h-4 w-4" />}>
                              <input
                                className={`${inputClassName} h-[52px] pl-11`}
                                value={formatPhone(employerPhone || "")}
                                onChange={(event) =>
                                  setValue("employerPhone", event.target.value.replace(/\D/g, ""), {
                                    shouldValidate: true,
                                  })
                                }
                                placeholder="(555) 987-6543"
                              />
                            </InputShell>
                            <ErrorText message={errors.employerPhone?.message} />
                          </div>
                        </>
                      ) : null}
                    </div>
                  </section>
                ) : null}

                {currentStep === 2 ? (
                  <section>
                    <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-950">
                      Banking Information
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-slate-500">
                      Use the bank account intended for funding and verification.
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelClassName}>Account Type</label>
                        <select className={`${inputClassName} h-[52px]`} {...register("accountType")}>
                          <option value="">Select account type</option>
                          <option value="CHECKING">Checking</option>
                          <option value="SAVINGS">Savings</option>
                        </select>
                        <ErrorText message={errors.accountType?.message} />
                      </div>
                      <div>
                        <label className={labelClassName}>Routing Number</label>
                        <InputShell icon={<Landmark className="h-4 w-4" />}>
                          <input
                            className={`${inputClassName} h-[52px] pl-11`}
                            maxLength={9}
                            {...register("routingNumber")}
                            onChange={(event) =>
                              setValue("routingNumber", event.target.value.replace(/\D/g, "").slice(0, 9), {
                                shouldValidate: true,
                              })
                            }
                            value={routingNumber || ""}
                          />
                        </InputShell>
                        <ErrorText message={errors.routingNumber?.message} />
                      </div>
                      <div>
                        <label className={labelClassName}>Account Number</label>
                        <InputShell icon={<CreditCard className="h-4 w-4" />}>
                          <input
                            className={`${inputClassName} h-[52px] pl-11`}
                            {...register("accountNumber")}
                            onChange={(event) =>
                              setValue("accountNumber", event.target.value.replace(/\D/g, "").slice(0, 17), {
                                shouldValidate: true,
                              })
                            }
                            value={accountNumber || ""}
                          />
                        </InputShell>
                        <ErrorText message={errors.accountNumber?.message} />
                      </div>
                      <div>
                        <label className={labelClassName}>Bank Account Age</label>
                        <select className={`${inputClassName} h-[52px]`} {...register("bankAccountAge")}>
                          <option value="">Select bank account age</option>
                          <option value="LESS_THAN_6_MONTHS">Less than 6 months</option>
                          <option value="SIX_TO_TWELVE_MONTHS">6-12 months</option>
                          <option value="MORE_THAN_1_YEAR">More than 1 year</option>
                        </select>
                        <ErrorText message={errors.bankAccountAge?.message} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClassName}>Credit Tier</label>
                        <select className={`${inputClassName} h-[52px]`} {...register("creditTier")}>
                          <option value="">Select credit tier</option>
                          <option value="EXCELLENT">Excellent</option>
                          <option value="GOOD">Good</option>
                          <option value="FAIR">Fair</option>
                          <option value="POOR">Poor</option>
                          <option value="BAD">Bad</option>
                          <option value="UNKNOWN">Unknown</option>
                        </select>
                        <ErrorText message={errors.creditTier?.message} />
                      </div>
                    </div>
                  </section>
                ) : null}

                {currentStep === 3 ? (
                  <section>
                    <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-950">
                      Reference Information
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-slate-500">
                      Add one personal reference we can contact if additional verification is needed.
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelClassName}>Reference Name</label>
                        <InputShell icon={<User className="h-4 w-4" />}>
                          <input className={`${inputClassName} h-[52px] pl-11`} {...register("referenceName")} />
                        </InputShell>
                        <ErrorText message={errors.referenceName?.message} />
                      </div>
                      <div>
                        <label className={labelClassName}>Reference Phone</label>
                        <InputShell icon={<Phone className="h-4 w-4" />}>
                          <input
                            className={`${inputClassName} h-[52px] pl-11`}
                            value={formatPhone(referencePhone || "")}
                            onChange={(event) =>
                              setValue("referencePhone", event.target.value.replace(/\D/g, ""), {
                                shouldValidate: true,
                              })
                            }
                          />
                        </InputShell>
                        <ErrorText message={errors.referencePhone?.message} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClassName}>Relationship</label>
                        <InputShell icon={<User className="h-4 w-4" />}>
                          <input className={`${inputClassName} h-[52px] pl-11`} {...register("referenceRelationship")} />
                        </InputShell>
                        <ErrorText message={errors.referenceRelationship?.message} />
                      </div>
                    </div>
                  </section>
                ) : null}

                {currentStep === 4 ? (
                  <section>
                    <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-950">
                      Review & Consent
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-slate-500">
                      Confirm your authorizations before we submit the application for review.
                    </p>
                    <div className="mt-4 space-y-3">
                      <label
                        className={`block rounded-[18px] border p-4 transition ${
                          creditAssessmentConsent
                            ? "border-[var(--brand)] bg-[var(--brand-tint)]"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-slate-300"
                            {...register("creditAssessmentConsent")}
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              I authorize Northstar Lending to perform a credit assessment.
                            </p>
                          </div>
                        </div>
                      </label>
                      <ErrorText message={errors.creditAssessmentConsent?.message} />

                      <label
                        className={`block rounded-[18px] border p-4 transition ${
                          tcpaConsent
                            ? "border-[var(--brand)] bg-[var(--brand-tint)]"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-slate-300"
                            {...register("tcpaConsent")}
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              I consent to receive calls, SMS messages, prerecorded calls, automatic dialer communication, and emails related to my application.
                            </p>
                          </div>
                        </div>
                      </label>
                      <ErrorText message={errors.tcpaConsent?.message} />
                    </div>

                    {submitError ? (
                      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {submitError}
                      </div>
                    ) : null}
                  </section>
                ) : null}
              </div>

              <div className="mt-5 border-t border-slate-200 pt-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="hidden items-center gap-3 text-sm text-slate-500 md:flex">
                    <LockKeyhole className="h-4 w-4 text-[var(--brand)]" />
                    Your information is encrypted and protected.
                  </div>

                  <div className="sticky bottom-3 z-20 flex w-full flex-col gap-3 rounded-[22px] border border-slate-200 bg-white/96 p-3 shadow-[0_16px_34px_rgba(15,23,42,0.10)] backdrop-blur md:static md:w-auto md:flex-row md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
                    {currentStep > 0 ? (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous
                      </button>
                    ) : null}

                    {currentStep < steps.length - 1 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-7 py-3.5 text-base font-semibold text-white shadow-[0_18px_40px_rgba(22,61,115,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--brand-hover)]"
                      >
                        Continue
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-7 py-3.5 text-base font-semibold text-white shadow-[0_18px_40px_rgba(22,61,115,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isPending ? "Submitting..." : "Submit Application"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
