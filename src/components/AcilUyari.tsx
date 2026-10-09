import type { SaglikUyarisi } from "@/lib/firmaKategorileri";

// Sağlık kategorisi listelerinde ve sağlık firmalarının detayında gösterilen 112 uyarısı
export default function AcilUyari({
  tur,
  detay = false,
  className = "",
}: {
  tur: Exclude<SaglikUyarisi, null>;
  detay?: boolean; // tek firma sayfasında "Bu listedeki firmalar" yerine "Bu firma" yazar
  className?: string;
}) {
  return (
    <div role="note" className={`bg-red-50 border border-red-200 border-l-4 border-l-red-600 rounded-lg px-4 py-3 ${className}`}>
      <p className="text-sm text-red-800 font-semibold flex items-start gap-2">
        <span aria-hidden="true">🚑</span>
        <span>
          {tur === "ambulans" &&
            (detay ? "Bu firma özel ambulans hizmetidir. " : "Bu listedeki firmalar özel ambulans hizmetidir. ")}
          Acil durumda{" "}
          <a href="tel:112" className="underline font-bold text-red-700 hover:text-red-900">
            112
          </a>
          {tur === "ambulans" ? " Acil Çağrı Merkezi'ni arayın." : "'yi arayın."}
        </span>
      </p>
      <p className="text-xs text-red-700/80 mt-1 pl-6">Bu site bağımsız bir rehberdir; bilgiler değişmiş olabilir.</p>
    </div>
  );
}
