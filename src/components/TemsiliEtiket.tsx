// Yapay zekâ ile üretilmiş temsili görsellerin sol alt köşesindeki küçük etiket.
// Sağ alttaki baş harf rozetiyle çakışmasın diye solda durur; görselin taşıyıcısı "relative" olmalı.
export default function TemsiliEtiket({ kucuk = false }: { kucuk?: boolean }) {
  return (
    <span
      className={`absolute left-1 bottom-1 sm:left-1.5 sm:bottom-1.5 pointer-events-none select-none rounded bg-black/40 text-white/90 font-medium leading-none backdrop-blur-[1px] ${
        kucuk ? "text-[6px] phone:text-[7px] sm:text-[9px] px-1 py-0.5" : "text-[10px] sm:text-[11px] px-1.5 py-1"
      }`}
    >
      Temsili görsel
    </span>
  );
}
