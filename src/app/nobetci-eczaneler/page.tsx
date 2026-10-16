import Link from "next/link";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

// Nöbetçi eczaneler: liste her sabah veritabanında otomatik yenilenir
// (public.nobetci_eczaneler_guncelle, pg_cron ile 10:15 / 12:15 / 15:15 Türkiye saati).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nöbetçi Eczaneler | Kovan Portal",
  description: "Türkiye'nin 81 ilinde bugünün nöbetçi eczaneleri: adres, telefon ve yol tarifi. Liste her gün otomatik güncellenir.",
};

type Eczane = {
  kaynak_id: string | null;
  il: string;
  ilce: string | null;
  semt: string | null;
  ad: string;
  adres: string | null;
  tarif: string | null;
  telefon: string | null;
  telefon2: string | null;
  enlem: number | null;
  boylam: number | null;
  nobet_baslangic: string | null;
  nobet_bitis: string | null;
};

type Il = { il: string; il_slug: string; sayi: number };

interface PageProps {
  searchParams: Promise<{ il?: string; ilce?: string }>;
}

const VARSAYILAN_IL = "istanbul";

// Türkçe harfleri sadeleştirip karşılaştırma için anahtar üretir (ilçe süzgeci)
function anahtar(s: string) {
  return s
    .toLocaleLowerCase("tr")
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// "istanbul" → "İSTANBUL" gibi büyük harfle gelen adları "İstanbul" biçimine çevirir
function duzgunAd(s: string) {
  return s
    .toLocaleLowerCase("tr")
    .split(/(\s+|-|\/)/)
    .map((p) => (p.trim() ? p.charAt(0).toLocaleUpperCase("tr") + p.slice(1) : p))
    .join("");
}

function telefonBicim(t: string | null) {
  if (!t) return null;
  let d = t.replace(/\D/g, "");
  if (d.startsWith("90") && d.length === 12) d = d.slice(2);
  if (d.length === 10) d = "0" + d;
  if (d.length !== 11) return { yazi: t, ara: t };
  return { yazi: `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}`, ara: d };
}

function tarihSaat(iso: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "long",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function yolTarifi(e: Eczane) {
  if (e.enlem && e.boylam) return `https://www.google.com/maps/dir/?api=1&destination=${e.enlem},${e.boylam}`;
  const q = [e.ad, e.adres, e.ilce, e.il].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export default async function NobetciEczanelerPage(props: PageProps) {
  const sp = await props.searchParams;
  const ilSlug = (sp.il || VARSAYILAN_IL).toLowerCase();
  const ilceSecili = sp.ilce || "";

  const [{ data: illerHam }, { data: liste }, { data: durum }] = await Promise.all([
    supabase.from("nobetci_eczane_iller2").select("il, il_slug, sayi"),
    supabase
      .from("nobetci_eczane_listesi")
      .select("kaynak_id, il, ilce, semt, ad, adres, tarif, telefon, telefon2, enlem, boylam, nobet_baslangic, nobet_bitis")
      .eq("il_slug", ilSlug)
      .order("ilce")
      .order("ad")
      .range(0, 1999),
    supabase.from("nobetci_eczane_durum").select("son_basarili, kayit_sayisi").eq("id", 1).maybeSingle(),
  ]);

  const iller = ((illerHam as Il[]) || []).sort((a, b) => a.il.localeCompare(b.il, "tr"));
  const eczaneler = (liste as Eczane[]) || [];
  const ilAdi = duzgunAd(iller.find((i) => i.il_slug === ilSlug)?.il || eczaneler[0]?.il || ilSlug);

  // İlçeler ve sayıları
  const ilceSayilari = new Map<string, { ad: string; sayi: number }>();
  for (const e of eczaneler) {
    const ad = duzgunAd(e.ilce || "Merkez");
    const k = anahtar(ad);
    const v = ilceSayilari.get(k);
    if (v) v.sayi++;
    else ilceSayilari.set(k, { ad, sayi: 1 });
  }
  const ilceler = [...ilceSayilari.entries()].sort((a, b) => a[1].ad.localeCompare(b[1].ad, "tr"));
  const gosterilen = ilceSecili ? eczaneler.filter((e) => anahtar(duzgunAd(e.ilce || "Merkez")) === ilceSecili) : eczaneler;

  // Nöbet süresi: kaynakta varsa ilk kayıttan, yoksa "bugün"
  const ornek = eczaneler.find((e) => e.nobet_baslangic && e.nobet_bitis);
  const sonGuncelleme = durum?.son_basarili ? tarihSaat(durum.son_basarili) : null;

  const ilceLink = (k?: string) =>
    `/nobetci-eczaneler?il=${encodeURIComponent(ilSlug)}${k ? `&ilce=${encodeURIComponent(k)}` : ""}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-[#1a3a6b]">Ana Sayfa</Link>
        <span className="mx-2">›</span>
        <Link href="/firmalar?kategori=Eczaneler" className="hover:text-[#1a3a6b]">Eczaneler</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">Nöbetçi Eczaneler</span>
      </nav>

      <div className="bg-[#1a3a6b] rounded-xl p-5 sm:p-6 mb-4 text-white">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <span aria-hidden="true">🌙</span> {ilAdi} Nöbetçi Eczaneler
        </h1>
        <p className="opacity-90 text-sm mt-1">
          {ornek
            ? <>Nöbet: {tarihSaat(ornek.nobet_baslangic!)} – {tarihSaat(ornek.nobet_bitis!)}</>
            : <>Bugünün nöbetçi eczaneleri</>}
        </p>
        {sonGuncelleme && <p className="opacity-70 text-xs mt-1">Liste güncellendi: {sonGuncelleme}</p>}
      </div>

      {/* İl seçimi */}
      <form method="get" action="/nobetci-eczaneler" className="bg-white border border-[#dde3ec] rounded-lg px-4 py-3 mb-4 flex flex-wrap items-center gap-2">
        <label htmlFor="il" className="text-sm font-medium text-[#1a3a6b]">İl:</label>
        <select
          id="il"
          name="il"
          defaultValue={ilSlug}
          className="border border-[#dde3ec] rounded px-2 py-1.5 text-sm min-w-[180px] flex-1 sm:flex-none"
        >
          {iller.length === 0 && <option value={ilSlug}>{ilAdi}</option>}
          {iller.map((i) => (
            <option key={i.il_slug} value={i.il_slug}>
              {duzgunAd(i.il)} ({i.sayi})
            </option>
          ))}
        </select>
        <button type="submit" className="bg-[#1a3a6b] text-white text-sm px-4 py-1.5 rounded hover:bg-[#244a85]">
          Göster
        </button>
      </form>

      {eczaneler.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-5 text-sm text-yellow-900">
          <p className="font-semibold mb-1">Nöbetçi eczane listesi şu an gösterilemiyor.</p>
          <p>
            Liste her sabah otomatik olarak yenilenir. Bu arada güncel bilgi için e-Devlet&apos;teki
            &quot;Nöbetçi Eczane Sorgulama&quot; hizmetini ya da ilinizin eczacı odasının sitesini kullanabilirsiniz.
          </p>
        </div>
      ) : (
        <>
          {/* İlçe süzgeci */}
          {ilceler.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              <Link
                href={ilceLink()}
                className={`px-3 py-1 rounded-full text-xs font-medium ${!ilceSecili ? "bg-[#1a3a6b] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                Tümü ({eczaneler.length})
              </Link>
              {ilceler.map(([k, v]) => (
                <Link
                  key={k}
                  href={ilceLink(k)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${ilceSecili === k ? "bg-[#1a3a6b] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  {v.ad} ({v.sayi})
                </Link>
              ))}
            </div>
          )}

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gosterilen.map((e, i) => {
              const tel = telefonBicim(e.telefon);
              const tel2 = telefonBicim(e.telefon2);
              return (
                <li key={e.kaynak_id || i} className="bg-white border border-[#dde3ec] border-l-4 border-l-red-600 rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-bold text-[#1a3a6b] leading-tight">{e.ad}</h2>
                    <span className="text-[11px] bg-red-50 text-red-700 border border-red-200 rounded px-1.5 py-0.5 whitespace-nowrap">
                      {duzgunAd(e.ilce || "Merkez")}
                    </span>
                  </div>
                  {e.adres && <p className="text-sm text-gray-700">📍 {e.adres}</p>}
                  {e.tarif && <p className="text-xs text-gray-500">🧭 {e.tarif}</p>}
                  <div className="flex flex-wrap gap-2 mt-auto pt-1">
                    {tel && (
                      <a href={`tel:${tel.ara}`} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-1.5 rounded">
                        📞 {tel.yazi}
                      </a>
                    )}
                    {tel2 && tel2.ara !== tel?.ara && (
                      <a href={`tel:${tel2.ara}`} className="bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 text-sm px-3 py-1.5 rounded">
                        📞 {tel2.yazi}
                      </a>
                    )}
                    <a
                      href={yolTarifi(e)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-100 hover:bg-gray-200 text-[#1a3a6b] text-sm font-medium px-3 py-1.5 rounded"
                    >
                      🗺️ Yol Tarifi
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <p className="text-xs text-gray-500 mt-6">
        Nöbetçi eczane bilgileri eczacı odalarının yayınladığı listelerden otomatik olarak alınır. Gitmeden önce telefonla
        teyit etmeniz önerilir. Acil durumda{" "}
        <a href="tel:112" className="underline font-semibold text-red-700">112</a>&apos;yi arayın.
      </p>
    </div>
  );
}
