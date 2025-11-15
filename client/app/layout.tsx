import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Predictify - Claim Your Web3 Identity",
  description:
    "Simplify your Predictify experience with .poly domains — your name, your reputation, your data identity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
