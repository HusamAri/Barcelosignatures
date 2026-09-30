import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barceló Signatures",
  description: "Central email signature management for Barceló Hotel Group Türkiye",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
