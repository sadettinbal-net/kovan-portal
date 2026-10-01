"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FIRMA_TIPI, TIP_ADI, kategoriGruplari, type FirmaKategorisi, type KategoriTipi } from "@/lib/firmaKategorileri";

// Firmalar sayfası: kategori süzgeci. Liste firma_kategorileri tablosundan gelir (firması olmayan kategoriler de görünür).
// Seçim adresi ?kategori=<ad>&firma_tipi=<tip> olarak değiştirir; diğer süzgeçler (il, site, arama) korunur.
export default function KategoriSuzgeci({ kategoriler }: { kategoriler: FirmaKategorisi[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kategori = searchParams.get("kategori") || "";
  const firmaTipi = searchParams.get("firma_tipi") || "";
  const secili = kategori ? `${firmaTipi}|${kategori}` : "";

  function sec(deger: string) {
    const q = new URLSearchParams(searchParams.toString());
    q.delete("sayfa");
    if (deger) {
      const [tip, ad] = [deger.slice(0, deger.indexOf("|")), deger.slice(deger.indexOf("|") + 1)];
      q.set("kategori", ad);
      q.set("firma_tipi", tip);
    } else {
      q.delete("kategori");
      q.delete("firma_tipi");
    }
    const s = q.toString();
    router.push(`/firmalar${s ? `?${s}` : ""}`);
  }

  const tipler: KategoriTipi[] = ["sanayi_sitesi", "sanayi_disi", "kurumsal"];

  return (
    <select
      value={secili}
      onChange={(e) => sec(e.target.value)}
      aria-label="Kategori seçin"
      className="border border-[#dde3ec] rounded px-2 py-1.5 text-xs bg-white outline-none focus:border-[#1a3a6b] max-w-[16rem]"
    >
      <option value="">Tüm kategoriler</option>
      {/* Seçili kategori listede yoksa (ör. eski bir bağlantı) yine de görünsün */}
      {secili && !kategoriler.some((k) => `${FIRMA_TIPI[k.tip]}|${k.ad}` === secili) && <option value={secili}>{kategori}</option>}
      {tipler.map((tip) => (
        <optgroup key={tip} label={TIP_ADI[tip]}>
          {kategoriGruplari(kategoriler, tip).flatMap(({ ana, altlar }) => [
            <option key={ana.id} value={`${FIRMA_TIPI[tip]}|${ana.ad}`}>
              {ana.ad}
            </option>,
            ...altlar.map((a) => (
              <option key={a.id} value={`${FIRMA_TIPI[tip]}|${a.ad}`}>
                {"   └ "}
                {a.ad}
              </option>
            )),
          ])}
        </optgroup>
      ))}
    </select>
  );
}
