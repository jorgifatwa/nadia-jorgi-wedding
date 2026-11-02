import type { Metadata } from "next";
import "./globals.css";

const TITLE = "The Wedding of Nadia & Jorgi";
const DESCRIPTION = "Sabtu, 5 Desember 2026 · Menara BP Jamsostek, Jakarta Selatan. Kami mengundang Anda untuk hadir dan memberikan doa restu.";

// Link previews (WhatsApp, Instagram, ...) need absolute image URLs. NEXT_PUBLIC_SITE_URL sets the public address
// (e.g. a custom domain); on Vercel the production domain is used automatically. The share image itself is
// app/opengraph-image.jpg.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Nadia & Jorgi",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full bg-[#0a140e] text-[#f5efe6] selection:bg-[#800020] selection:text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
