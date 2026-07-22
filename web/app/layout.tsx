import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const image = new URL("/og.png", base).toString();

  return {
    metadataBase: base,
    title: "Ledgerly — Personal Finance Copilot",
    description: "Understand your spending, forecast what comes next, and build a budget that fits.",
    openGraph: {
      title: "Ledgerly — Personal Finance Copilot",
      description: "See where your money is going.",
      images: [{ url: image, width: 1733, height: 907, alt: "Ledgerly finance dashboard" }],
    },
    twitter: { card: "summary_large_image", title: "Ledgerly", description: "See where your money is going.", images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
