import type { Metadata, Viewport } from "next";
import "./globals.css";
import Script from "next/script";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import ZiyaretTakip from "@/components/ZiyaretTakip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { OnlineProvider } from "@/contexts/OnlineContext";
import type { Lang } from "@/lib/translations";
import { SITE_ADI, SITE_SLOGAN, SITE_URL } from "@/lib/site";

// AdSense yayıncı ID'nizi buraya da girin (VideoReklam.tsx ile aynı olmalı)
const ADSENSE_CLIENT = "ca-pub-8884760724680185";

export const viewport: Viewport = {
  themeColor: "#1a3a6b",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_ADI} - ${SITE_SLOGAN}`,
  description:
    "Türkiye'deki sanayi sitelerindeki firmaları, ustaları ve ilanları tek platformda bulun. Oto tamir, kaporta, boya, elektrik ve daha fazlası.",
  keywords:
    "sanayi sitesi, firma rehberi, oto tamir, kaporta, boyacı, oto elektrik, usta, sanayi ilanları",
  manifest: "/manifest.json",
  appleWebApp: {
    statusBarStyle: "default",
    title: SITE_ADI,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = ((await cookies()).get("lang")?.value ?? "tr") as Lang;

  return (
    <html lang={lang}>
      <body className="min-h-screen flex flex-col bg-[#f4f6f9]" suppressHydrationWarning>
        {!ADSENSE_CLIENT.includes("XXXX") && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        )}
        <LanguageProvider initial={lang}>
          <OnlineProvider>
          <ZiyaretTakip />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer lang={lang} />
          <CookieBanner />
          </OnlineProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
