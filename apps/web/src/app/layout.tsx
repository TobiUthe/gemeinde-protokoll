import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProtokolBase — Swiss Municipal Protocols",
  description:
    "Search and browse protocols from 2,100+ Swiss municipalities. Structured data, full-text search, and real-time notifications.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
