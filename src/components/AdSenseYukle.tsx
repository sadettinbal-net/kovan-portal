"use client";

import Script from "next/script";
import { useCerezOnay } from "@/lib/cerezOnay";

// Google AdSense betiği yalnızca ziyaretçi çerez bandında "Kabul Et" dediyse yüklenir (KVKK açık rıza).
// Reddeden veya henüz seçim yapmayan ziyaretçide Google'a hiçbir istek gönderilmez.
export default function AdSenseYukle({ client }: { client: string }) {
  const onay = useCerezOnay();
  if (onay !== "kabul" || client.includes("XXXX")) return null;
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
