import type { Metadata } from "next";
import "./globals.css";

export const metadata = {
  title: "Gas Fee Optimizer",
  description: "Optimize Ethereum transaction timing",
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