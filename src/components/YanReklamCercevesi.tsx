import ReklamPanelleri, { type YanReklamKonumu } from "@/components/ReklamPanelleri";
import SabitReklamAlani from "@/components/SabitReklamAlani";

// Detay sayfalarında içeriğin sağına ve soluna reklam panelleri koyar (her tarafta "adet" kadar).
// Reklamlar Reklam Yönetimi'nden "Detay sayfası – sol / sağ" alanlarına eklenir.
// Geniş ekranlarda (1024px ve üstü) görünür, aşağı kaydırınca üst menünün hemen altında sabit kalır; telefonda gizlidir.
function ReklamSutunu({ konum, adet, kategori }: { konum: YanReklamKonumu; adet: number; kategori?: string }) {
  return (
    <div className="hidden lg:block w-56 xl:w-72 shrink-0 pt-12">
      {/* Üstteki sabit menünün altında durur; ekrana sığmazsa reklam resimleri küçültülür */}
      <SabitReklamAlani>
        <ReklamPanelleri konum={konum} adet={adet} kategori={kategori} />
      </SabitReklamAlani>
    </div>
  );
}

// kategori: firma detayında firmanın sektörü; o kategoriye özel reklam varsa o, yoksa genel reklamlar gösterilir
export default function YanReklamCercevesi({ children, adet = 3, kategori }: { children: React.ReactNode; adet?: number; kategori?: string }) {
  return (
    <div className="max-w-[1600px] mx-auto lg:px-4 flex justify-center gap-2">
      <ReklamSutunu konum="detay_sol" adet={adet} kategori={kategori} />
      <div className="flex-1 min-w-0">{children}</div>
      <ReklamSutunu konum="detay_sag" adet={adet} kategori={kategori} />
    </div>
  );
}
