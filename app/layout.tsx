import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skill-Driven Resume Analyzer",
  description: "Skill orchestration demo with Next.js and Supabase"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
