import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InterviewAI — AI-Powered Mock Interviews",
  description: "Practice interviews with real-time AI feedback. Land your dream job.",
  keywords: ["mock interview", "AI interview", "interview practice", "job preparation"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#020617] antialiased">{children}</body>
    </html>
  );
}
