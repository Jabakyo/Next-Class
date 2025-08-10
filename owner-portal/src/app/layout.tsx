import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Owner Portal - Schedule Verification",
  description: "Owner portal for managing schedule verifications",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}