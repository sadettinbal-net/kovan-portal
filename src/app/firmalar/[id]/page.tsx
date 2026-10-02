import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { translations } from "@/lib/translations";
import type { Lang } from "@/lib/translations";
import { getKategoriResim } from "@/lib/kategoriResim";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = parseInt((await params).id);
  const { data: firma } = await supabase
    .from("firmalar")
    .select("ad, sektor, sanayi_sitesi, adres")
    .eq("id", id)
    .single();

  if (!firma) return { title: "Firma Bulunamadı" };

  return {
    title: `${firma.ad} — Kovan Portal`,
    description: `${firma.ad} firması hakkında bilgi alın. Sektör: ${firma.sektor}. ${firma.sanayi_sitesi} bölgesinde hizmet vermektedir.`,
    alternates: {
      canonical: `/firmalar/${id}`,
    },
  };
}

function firmaBasHarfleri(ad: string): string {
  return ad
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join(" ");
}

export default async function FirmaKartPage({ params }: PageProps) {
  const id = parseInt((await params).id);
  const lang = ((await cookies()).get("lang")?.value ?? "tr") as Lang;
  const t = translations[lang];

  const { data: firma } = await supabase
    .from("firmalar")
    .select("id, ad, sektor, sanayi_sitesi, il_adi, ilce_adi, adres, telefon, mobil_telefon, hizmetler, ozel_firma, fotograf_url, onay_durumu, yorum_sayisi, ortalama_puan")
    .eq("id", id)
    .single();

  if (!firma || firma.onay_durumu !== "onaylandi") notFound();

  // Puan özeti veritabanında hesaplanıp firma kaydında tutuluyor (gizli yorumlar sayılmaz)
  const yorumSayisi: number = firma.yorum_sayisi ?? 0;
  const ortalamaPuan: number | null = yorumSayisi > 0 && firma.ortalama_puan != null ? Number(firma.ortalama_puan) : null;

  const basHarfler = firmaBasHarfleri(firma.ad);
  const resimUrl = firma.fotograf_url || getKategoriResim(firma.sektor);

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#1a3a6b]">{t.breadHome}</Link>
        <span className="mx-2">›</span>
        <Link href="/firmalar" className="hover:text-[#1a3a6b]">{t.breadCompanies}</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">{firma.ad}</span>
      </nav>

      {/* Firma kartı */}
      <div
        className={`bg-white rounded-xl border overflow-hidden shadow-sm ${
          firma.ozel_firma ? "border-[#e8a020]" : "border-[#dde3ec]"
        }`}
      >
        {firma.ozel_firma && (
          <div className="bg-[#e8a020] text-white text-xs font-semibold px-4 py-1.5 flex items-center gap-1">
            ⭐ {t.featuredBadge}
          </div>
        )}

        {/* Görsel */}
        <div className="relative h-48 bg-gradient-to-br from-[#eaf3ff] to-[#d0e6ff] overflow-hidden select-none">
          <Image
            src={resimUrl}
            alt={firma.sektor || "Kovan Portal"}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 576px"
            priority
          />
          <span className="absolute bottom-2 right-2 text-white font-black text-2xl bg-[#1a3a6b]/70 px-2 py-1 rounded">
            {basHarfler}
          </span>
        </div>

        <div className="p-5">
          <h1 className="text-xl font-bold text-[#1a3a6b] mb-4">{firma.ad}</h1>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>🏷️</span>
              <span>{firma.sektor}</span>
            </div>
            {firma.sanayi_sitesi && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>🏭</span>
                <span>{firma.sanayi_sitesi}</span>
              </div>
            )}
            {(firma.ilce_adi || firma.il_adi) && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>🗺️</span>
                <span>{[firma.ilce_adi, firma.il_adi].filter(Boolean).join(" / ")}</span>
              </div>
            )}
            {firma.adres && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <span>📍</span>
                <span>{firma.adres}</span>
              </div>
            )}
            {firma.telefon && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📞</span>
                <a href={`tel:${firma.telefon}`} className="text-green-700 font-medium hover:underline">
                  {firma.telefon}
                </a>
              </div>
            )}
            {ortalamaPuan !== null && (
              <div className="flex items-center gap-1.5 text-sm">
                <span>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className={i <= Math.round(ortalamaPuan) ? "text-yellow-400" : "text-gray-300"}>
                      {i <= Math.round(ortalamaPuan) ? "⭐" : "☆"}
                    </span>
                  ))}
                </span>
                <span className="font-bold text-[#1a3a6b]">{ortalamaPuan} / 5</span>
                <span className="text-gray-400 text-xs">({yorumSayisi})</span>
              </div>
            )}
          </div>

          {/* Detay butonu */}
          <Link
            href={`/firma/${firma.id}`}
            className="block w-full text-center bg-[#1a3a6b] hover:bg-[#2554a0] text-white font-semibold py-3 rounded-lg transition-colors text-sm"
          >
            Firma Detaylarını Gör →
          </Link>

          <div className="mt-3 text-center">
            <Link href="/firmalar" className="text-xs text-gray-400 hover:text-[#1a3a6b]">
              ← Tüm firmalara dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
