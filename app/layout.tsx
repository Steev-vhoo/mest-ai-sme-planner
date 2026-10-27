import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "90-Day AI Plan · MEST Africa AI for SMEs",
  description:
    "Answer a few questions from the MEST Africa AI for SMEs Workshop and get a personalised 90-day AI adoption plan for your business, emailed as a PDF.",
  icons: { icon: "/mest-logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={outfit.className}>{children}</body>
    </html>
  );
}
