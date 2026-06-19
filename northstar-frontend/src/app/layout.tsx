import type { Metadata } from "next";
import "./globals.css";

const frontendAppUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  title: "Northstar Lending | Personal Loans with 24-Hour Funding",
  description:
    "Northstar Lending offers fast, secure unsecured personal loans up to $10,000 with fixed APR pricing, no upfront fees, and a streamlined online application.",
  metadataBase: frontendAppUrl ? new URL(frontendAppUrl) : undefined,
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
