"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { MouseEvent } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  HandCoins,
  LockKeyhole,
  Menu,
  PenSquare,
  ShieldCheck,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Reviews", href: "#reviews" },
  { label: "FAQ", href: "#faq" },
  { label: "Loan Status", href: "/loan-status" },
];

const trustBenefits = [
  "24-Hour Funding",
  "Fixed 10% APR",
  "No Upfront Fees",
  "All Credit Tiers Accepted",
];

const trustSignals = [
  { icon: LockKeyhole, label: "SSL Secured" },
  { icon: ShieldCheck, label: "256-bit Encryption" },
  { icon: Zap, label: "Fast Approval Process" },
  { icon: Sparkles, label: "Available Nationwide" },
];

const howItWorksSteps = [
  {
    title: "Apply Online",
    description:
      "Start with a secure digital application that takes only a few minutes to complete.",
    icon: FileText,
  },
  {
    title: "Verify Details",
    description:
      "Confirm identity, income, and bank information through our protected verification flow.",
    icon: BadgeCheck,
  },
  {
    title: "Admin Review",
    description:
      "Our lending team reviews your file, checks eligibility, and prepares the next step.",
    icon: ClipboardCheck,
  },
  {
    title: "Sign Agreement",
    description:
      "Review the final terms carefully and sign your agreement when approval is ready.",
    icon: PenSquare,
  },
  {
    title: "Get Funded",
    description:
      "Funds are released quickly once your file is complete and all confirmations are cleared.",
    icon: HandCoins,
  },
];

const testimonials = [
  {
    quote:
      "The process was simple and fast. I received clear updates throughout.",
    name: "Verified Applicant",
    detail: "Personal loan applicant",
    highlight: "Clear updates",
  },
  {
    quote:
      "Everything felt professional from application to verification. The steps were easy to follow.",
    name: "Northstar Customer",
    detail: "Approved borrower",
    highlight: "Professional process",
  },
  {
    quote:
      "I appreciated how secure and organized the experience felt. It never felt confusing.",
    name: "Approved Borrower",
    detail: "Returning applicant",
    highlight: "Secure experience",
  },
];

const securityHighlights = [
  {
    title: "Bank-Level Encryption",
    description: "256-bit encrypted data protection.",
    icon: ShieldCheck,
  },
  {
    title: "Secure Verification",
    description: "Protected identity verification process.",
    icon: BadgeCheck,
  },
  {
    title: "Privacy First",
    description: "Information handled according to industry standards.",
    icon: LockKeyhole,
  },
  {
    title: "SSL Protected",
    description: "All communications encrypted in transit.",
    icon: Zap,
  },
];

const faqItems = [
  {
    category: "Application",
    question: "Can I apply with bad credit?",
    answer:
      "Yes. Northstar Lending welcomes a wide range of credit profiles. Approval depends on the full application review, including income, identity, and banking verification.",
  },
  {
    category: "Application",
    question: "How much can I borrow?",
    answer:
      "Qualified applicants may request between $2,000 and $10,000, depending on eligibility and final review outcomes.",
  },
  {
    category: "Application",
    question: "What information do I need to apply?",
    answer:
      "Most applicants should be prepared to provide legal identity details, contact information, income details, and secure banking information for verification.",
  },
  {
    category: "Funding",
    question: "Is there any upfront fee?",
    answer:
      "No. We do not charge upfront application or processing fees to begin your loan request.",
  },
  {
    category: "Funding",
    question: "How fast can I get funded?",
    answer:
      "Many eligible files move quickly, and funding may occur within 24 hours after final approval and agreement completion.",
  },
  {
    category: "Funding",
    question: "When does funding begin after approval?",
    answer:
      "Funding timelines depend on final review completion, signed agreements, and any required verification checkpoints after approval.",
  },
  {
    category: "Security",
    question: "Is collateral required?",
    answer:
      "No collateral is required. The product is structured as an unsecured personal loan application process.",
  },
  {
    category: "Security",
    question: "How is my information protected?",
    answer:
      "Applicant information is handled through encrypted transmission, secure verification workflows, and privacy-conscious data practices.",
  },
  {
    category: "Security",
    question: "Is bank verification secure?",
    answer:
      "Yes. Bank verification is designed to confirm account ownership and application details through a protected process.",
  },
  {
    category: "Loan Status",
    question: "How do I check my loan status?",
    answer:
      "Use the Loan Status page with your application ID and last name to view your current stage, next action, and funding progress.",
  },
  {
    category: "Loan Status",
    question: "What do status updates mean?",
    answer:
      "Status updates show where your file is in the review process, such as submitted, verification pending, ready for agreement, or funded.",
  },
  {
    category: "Loan Status",
    question: "Can I track my application after bank verification?",
    answer:
      "Yes. After bank verification, you can continue tracking your loan journey using the same application ID and last name.",
  },
];

const faqCategories = ["Application", "Funding", "Security", "Loan Status"] as const;

const footerLinkGroups = [
  {
    title: "Explore",
    links: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Reviews", href: "#reviews" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Applications",
    links: [
      { label: "Apply Now", href: "/apply" },
      { label: "Loan Status", href: "/loan-status" },
      { label: "Bank Verification", href: "/bank-verification" },
    ],
  },
];

  export default function HomePage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [selectedFaqCategory, setSelectedFaqCategory] =
      useState<(typeof faqCategories)[number]>("Application");
  const [openFaqQuestion, setOpenFaqQuestion] = useState<string | null>(null);

  const scrollToAnchor = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith("#")) {
      return;
    }

    event.preventDefault();

    if (href === "#home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const element = document.querySelector(href);
    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filteredFaqItems = faqItems.filter(
    (item) => item.category === selectedFaqCategory,
  );

  return (
    <main
      id="home"
      className="min-h-screen bg-[#f4f7fb] text-slate-900"
    >
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
        <div className="section-shell">
          <div className="flex h-16 items-center justify-between gap-4 lg:h-[72px]">
            <a
              href="#home"
              onClick={scrollToAnchor("#home")}
              className="flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
              aria-label="Northstar Lending home"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 shadow-[0_14px_32px_rgba(15,23,42,0.16)] lg:h-11 lg:w-11">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 48 48"
                  className="h-5 w-5 text-white lg:h-6 lg:w-6"
                  fill="none"
                >
                  <path
                    d="M24 6 37 11v11c0 8.3-5.4 15.4-13 17.8C16.4 37.4 11 30.3 11 22V11l13-5Z"
                    fill="currentColor"
                    opacity="0.16"
                  />
                  <path
                    d="M24 6 37 11v11c0 8.3-5.4 15.4-13 17.8C16.4 37.4 11 30.3 11 22V11l13-5Z"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18 30V18l12 12V18"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--brand)] sm:text-xs">
                  Northstar
                </span>
                <span className="text-base font-semibold tracking-[-0.03em] text-slate-950 lg:text-lg">
                  Lending
                </span>
              </span>
            </a>

            <nav
              aria-label="Primary navigation"
              className="hidden items-center justify-center gap-8 lg:flex"
            >
              {navItems.map((item) =>
                item.href.startsWith("#") ? (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={scrollToAnchor(item.href)}
                    className="text-sm font-medium text-slate-600 transition hover:text-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm font-medium text-slate-600 transition hover:text-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </nav>

            <div className="hidden lg:block">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold !text-white shadow-[0_16px_34px_rgba(22,61,115,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--brand-hover)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
              >
                Apply Now
              </Link>
            </div>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:border-slate-300 lg:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen ? (
            <div
              id="mobile-nav"
              className="border-t border-slate-200 py-4 lg:hidden"
            >
              <nav aria-label="Mobile navigation" className="flex flex-col gap-2">
                {navItems.map((item) =>
                  item.href.startsWith("#") ? (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(event) => {
                        setMobileMenuOpen(false);
                        scrollToAnchor(item.href)(event);
                      }}
                      className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                    >
                      {item.label}
                    </Link>
                  ),
                )}
                <Link
                  href="/apply"
                  className="mt-2 inline-flex items-center justify-center rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold !text-white shadow-[0_18px_40px_rgba(22,61,115,0.18)] hover:bg-[var(--brand-hover)] hover:!text-white"
                >
                  Apply Now
                </Link>
              </nav>
            </div>
          ) : null}
        </div>
      </header>

      <section className="relative flex min-h-[calc(100svh-64px)] items-center overflow-hidden py-10 sm:py-12 lg:min-h-[calc(100svh-72px)] lg:py-12">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-slate-200"
        />
        <div
          aria-hidden="true"
          className="absolute right-[-8rem] top-14 h-64 w-64 rounded-full bg-[rgba(22,61,115,0.08)] blur-3xl lg:h-80 lg:w-80"
        />
        <div
          aria-hidden="true"
          className="absolute left-[-7rem] top-1/3 h-48 w-48 rounded-full bg-white/70 blur-3xl lg:h-64 lg:w-64"
        />
        <div className="relative mx-auto w-full max-w-[84rem] px-8">
          <div className="mx-auto max-w-[70rem]">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-center lg:gap-8">
              <div className="max-w-[42rem] lg:-ml-3">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--brand-soft)] bg-[var(--brand-tint)]/80 px-4 py-2 text-sm font-medium text-[var(--brand-deep)] shadow-sm">
                  <ShieldCheck className="h-4 w-4 text-[var(--brand)]" />
                  Trusted unsecured lending with bank-grade protection
                </div>

                <h1 className="balance-text max-w-[12ch] text-[2.9rem] font-semibold tracking-[-0.08em] text-slate-950 sm:max-w-[13ch] sm:text-[3.8rem] lg:max-w-[15ch] lg:text-[4.8rem] lg:leading-[0.97]">
                  Get Up to $10,000 Personal Loans with 24-Hour Funding
                </h1>

                <p className="mt-4 max-w-[46rem] text-lg leading-7 text-slate-600 lg:text-[1.1rem]">
                  Fast, secure, unsecured personal loans with a fixed 10% APR. No
                  collateral. No upfront fees. All credit tiers welcome.
                </p>

                <ul className="mt-6 grid max-w-[42rem] gap-x-6 gap-y-3 text-sm font-medium text-slate-700 sm:grid-cols-2 sm:text-[15px]">
                  {trustBenefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      {benefit}
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/apply"
                    className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-7 py-3.5 text-base font-semibold !text-white shadow-[0_18px_40px_rgba(22,61,115,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--brand-hover)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
                  >
                    Start Your Application
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <a
                    href="#how-it-works"
                    onClick={scrollToAnchor("#how-it-works")}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-900 shadow-sm transition duration-200 hover:border-[var(--brand-soft)] hover:bg-[var(--brand-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
                  >
                    How It Works
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </a>
                </div>

                <div className="mt-6 grid max-w-[50rem] gap-x-5 gap-y-3 text-sm text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
                  {trustSignals.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-[var(--brand)]" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <aside className="relative lg:pl-6">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-8 h-[78%] rounded-full bg-[radial-gradient(circle_at_center,rgba(90,145,255,0.18)_0%,rgba(90,145,255,0.08)_42%,rgba(255,255,255,0)_76%)] blur-2xl"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-10 bottom-8 h-20 rounded-full bg-[rgba(22,61,115,0.08)] blur-3xl"
                />
                <Image
                  src="/hero-banking-illustration-transparent-clean.png"
                  alt="Northstar Lending banking illustration"
                  width={1313}
                  height={1094}
                  priority
                  className="relative z-10 ml-auto h-auto w-[112%] max-w-none object-contain drop-shadow-[0_32px_65px_rgba(72,110,190,0.18)] lg:w-[116%]"
                />
              </aside>
            </div>
          </div>
          </div>
        </section>

        <section id="how-it-works" className="py-16 sm:py-20">
          <div className="section-shell">
            <div className="mx-auto max-w-[1320px]">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                  How It Works
                </p>
                <h2 className="mt-3 text-[2.4rem] font-semibold tracking-[-0.06em] text-slate-950 sm:text-[3.2rem] sm:leading-[0.98]">
                  <span className="block">A lending process built</span>
                  <span className="block">to feel clear, secure, and fast.</span>
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Every step is designed to move your application forward with the confidence and polish you would expect from a trusted nationwide lender.
                </p>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {howItWorksSteps.map(({ title, description, icon: Icon }, index) => (
                  <article
                    key={title}
                    className="group rounded-[16px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-1 hover:border-[var(--brand-soft)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-tint)] text-[var(--brand)]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Step {index + 1}
                      </span>
                    </div>

                    <h3 className="mt-6 text-xl font-semibold tracking-[-0.04em] text-slate-950">
                      {title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="reviews" className="pb-16 sm:pb-20">
          <div className="section-shell">
            <div className="mx-auto max-w-[1320px]">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                  Reviews
                </p>
                <h2 className="mt-3 text-[2.25rem] font-semibold tracking-[-0.06em] text-slate-950 sm:text-[3rem] sm:leading-[0.98]">
                  Real applicant feedback from a secure, straightforward process.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Testimonials centered on communication, confidence, and a smoother application experience.
                </p>
              </div>

              <div className="mt-10 grid gap-4 lg:grid-cols-3">
                {testimonials.map(({ quote, name, detail, highlight }) => (
                  <article
                    key={quote}
                    className="rounded-[18px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-tint)] text-sm font-semibold text-[var(--brand)]">
                          {name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{name}</p>
                          <p className="mt-1 text-sm text-slate-500">{detail}</p>
                        </div>
                      </div>
                      <span className="inline-flex rounded-full bg-[var(--brand-tint)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                        {highlight}
                      </span>
                    </div>

                    <div className="mt-5 flex items-center gap-1 text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                    </div>

                    <blockquote className="mt-5 text-lg leading-8 text-slate-700">
                      &ldquo;{quote}&rdquo;
                    </blockquote>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-20">
          <div className="section-shell">
            <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[20px] border border-[rgba(137,180,255,0.18)] bg-[linear-gradient(135deg,#12325f_0%,#173f78_52%,#102d57_100%)] px-6 py-8 text-white shadow-[0_28px_70px_rgba(22,61,115,0.2)] sm:px-8 sm:py-10 lg:px-10">
              <div
                aria-hidden="true"
                className="absolute -left-12 top-10 h-44 w-44 rounded-full bg-[rgba(144,195,255,0.12)] blur-3xl"
              />
              <div
                aria-hidden="true"
                className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[rgba(255,255,255,0.07)] blur-3xl"
              />

              <div className="relative">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100/90">
                    Security & Privacy
                  </p>
                  <h2 className="mt-3 text-[2.25rem] font-semibold tracking-[-0.06em] text-white sm:text-[3rem] sm:leading-[0.98]">
                    Built for a secure lending experience from start to finish.
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
                    Every application step is protected with modern encryption, secure verification, and privacy-conscious handling of sensitive information.
                  </p>
                </div>

                <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {securityHighlights.map(({ title, description, icon: Icon }) => (
                    <article
                      key={title}
                      className="rounded-[16px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 text-blue-100">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-white">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-blue-100">
                        {description}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="pb-16 sm:pb-20">
          <div className="section-shell">
            <div className="mx-auto max-w-[1320px] px-1 sm:px-0">
              <div className="grid gap-10 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
                <div className="max-w-md">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                    FAQ
                  </p>
                  <h2 className="mt-3 text-[2.25rem] font-semibold tracking-[-0.06em] text-slate-950 sm:text-[3rem] sm:leading-[0.98]">
                    Answers built for confident borrowing decisions.
                  </h2>
                  <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                    Explore key lending questions by category and review the details that matter before you apply.
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
                    {faqCategories.map((category) => {
                      const isActive = category === selectedFaqCategory;

                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setSelectedFaqCategory(category);
                            setOpenFaqQuestion(null);
                          }}
                          className={`inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 ${
                            isActive
                              ? "bg-[var(--brand)] text-white shadow-[0_14px_30px_rgba(22,61,115,0.18)]"
                              : "border border-slate-200 bg-white text-slate-600 hover:border-[var(--brand-soft)] hover:bg-[var(--brand-tint)] hover:text-[var(--brand)]"
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 space-y-3">
                    {filteredFaqItems.map(({ question, answer }) => {
                      const isOpen = openFaqQuestion === question;

                      return (
                        <div
                          key={question}
                          className={`overflow-hidden rounded-[16px] border transition duration-200 ${
                            isOpen
                              ? "border-[var(--brand-soft)] bg-[var(--brand-tint)]/55 shadow-[0_16px_38px_rgba(15,23,42,0.05)]"
                              : "border-slate-200 bg-[#fcfdff] hover:border-[var(--brand-soft)]"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqQuestion(isOpen ? null : question)}
                            className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                            aria-expanded={isOpen}
                          >
                            <div
                              className={`text-base font-semibold transition duration-200 sm:text-[1.05rem] ${
                                isOpen ? "text-[var(--brand)]" : "text-slate-950"
                              }`}
                            >
                              {question}
                            </div>
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition duration-200 ${
                                isOpen
                                  ? "border-[var(--brand-soft)] bg-white text-[var(--brand)]"
                                  : "border-slate-200 bg-white text-slate-400"
                              }`}
                            >
                              <ChevronDown
                                className={`h-4 w-4 transition duration-200 ${
                                  isOpen ? "rotate-180" : ""
                                }`}
                              />
                            </span>
                          </button>

                          {isOpen ? (
                            <div className="border-t border-slate-100 px-5 py-5 sm:px-6 sm:py-6">
                              <p className="max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">
                                {answer}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-20">
          <div className="section-shell">
            <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[20px] border border-[rgba(137,180,255,0.18)] bg-[linear-gradient(135deg,#14386a_0%,#1d4f92_58%,#163d73_100%)] px-6 py-10 text-white shadow-[0_28px_70px_rgba(22,61,115,0.22)] sm:px-8 sm:py-12 lg:px-12 lg:py-14">
              <div
                aria-hidden="true"
                className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-[rgba(255,255,255,0.08)] blur-3xl"
              />
              <div
                aria-hidden="true"
                className="absolute bottom-[-4rem] left-[-2rem] h-48 w-48 rounded-full bg-[rgba(144,195,255,0.14)] blur-3xl"
              />

              <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100/90">
                    Ready When You Are
                  </p>
                  <h2 className="mt-3 text-[2.3rem] font-semibold tracking-[-0.06em] text-white sm:text-[3.15rem] sm:leading-[0.98]">
                    Ready to start your application?
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
                    Apply online in minutes. No upfront fees. Secure process.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/apply"
                    className="inline-flex items-center justify-center rounded-full bg-[#dce8fb] px-7 py-3.5 text-base font-semibold !text-[var(--brand-deep)] shadow-[0_18px_40px_rgba(9,25,48,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#cdddf8] hover:!text-[var(--brand-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand)]"
                  >
                    Apply Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    href="/loan-status"
                    className="inline-flex items-center justify-center rounded-full border border-white/24 bg-white/10 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand)]"
                  >
                    Check Loan Status
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white">
          <div className="section-shell">
            <div className="mx-auto max-w-[1320px] py-12 sm:py-14">
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.7fr))] lg:gap-12">
                <div className="max-w-xl">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 shadow-[0_14px_32px_rgba(15,23,42,0.16)]">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 48 48"
                        className="h-6 w-6 text-white"
                        fill="none"
                      >
                        <path
                          d="M24 6 37 11v11c0 8.3-5.4 15.4-13 17.8C16.4 37.4 11 30.3 11 22V11l13-5Z"
                          fill="currentColor"
                          opacity="0.16"
                        />
                        <path
                          d="M24 6 37 11v11c0 8.3-5.4 15.4-13 17.8C16.4 37.4 11 30.3 11 22V11l13-5Z"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M18 30V18l12 12V18"
                          stroke="currentColor"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
                        Northstar
                      </span>
                      <span className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                        Lending
                      </span>
                    </div>
                  </div>

                  <p className="mt-5 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
                    Northstar Lending provides a secure, modern application experience built around transparency, faster updates, and borrower confidence.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
                    {trustSignals.map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-[var(--brand)]" />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {footerLinkGroups.map((group) => (
                  <div key={group.title}>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {group.title}
                    </p>
                    <div className="mt-5 flex flex-col gap-3">
                      {group.links.map((link) =>
                        link.href.startsWith("#") ? (
                          <a
                            key={link.href}
                            href={link.href}
                            onClick={scrollToAnchor(link.href)}
                            className="text-sm font-medium text-slate-600 transition hover:text-[var(--brand)]"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-slate-600 transition hover:text-[var(--brand)]"
                          >
                            {link.label}
                          </Link>
                        ),
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <p>© 2026 Northstar Lending. All rights reserved.</p>
                <p>Secure lending experience with bank-grade protection.</p>
              </div>
            </div>
          </div>
        </footer>
  
        <section id="loan-status" className="sr-only">
          <h2>Loan Status</h2>
        </section>
    </main>
  );
}
