import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Korbach Odoo CRM Dashboard",
  description: "Interactive dashboard for Odoo CRM",
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

