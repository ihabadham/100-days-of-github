import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "100 Days of GitHub Challenge",
  description:
    "Track your daily GitHub contributions and maintain your coding streak with the 100 Days of GitHub Challenge",
  generator: "Next.js",
  keywords:
    "github, coding challenge, streak tracker, 100 days of code, github contributions",
  authors: [{ name: "GitHub Challenge Tracker" }],
  openGraph: {
    title: "100 Days of GitHub Challenge",
    description:
      "Track your daily GitHub contributions and maintain your coding streak",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo.svg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
