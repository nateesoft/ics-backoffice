import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICS Backoffice - Bug Tracker",
  description: "Issue tracking system",
  manifest: "/ics-backoffice/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="manifest" href="/ics-backoffice/manifest.json" />
        <link rel="apple-touch-icon" href="/ics-backoffice/icons/icon.svg" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ICS Backoffice" />
      </head>
      <body className="min-h-full bg-slate-50">{children}</body>
    </html>
  );
}
