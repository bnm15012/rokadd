import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rokadd | Daily Cash Flow Analyzer",
  description: "Smart inventory and cash flow management for retail businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" style={{ colorScheme: 'light' }}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
