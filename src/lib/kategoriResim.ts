import fs from "fs";
import path from "path";

function normSektor(s: string): string {
  return s
    .replace(/İ/g, "i").replace(/I/g, "i")
    .replace(/Ş/g, "s").replace(/Ğ/g, "g")
    .replace(/Ü/g, "u").replace(/Ö/g, "o")
    .replace(/Ç/g, "c")
    .replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/ü/g, "u").replace(/ö/g, "o")
    .replace(/ç/g, "c").replace(/ı/g, "i")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const CACHE = new Map<string, string>();

export function getKategoriResim(sektor: string): string {
  if (!sektor) return "/kart-varsayilan.png";
  const cached = CACHE.get(sektor);
  if (cached) return cached;

  const slug = normSektor(sektor);
  const imgPath = path.join(process.cwd(), "public", "kategori-kartlar", `${slug}.png`);
  const result = fs.existsSync(imgPath)
    ? `/kategori-kartlar/${slug}.png`
    : "/kart-varsayilan.png";

  CACHE.set(sektor, result);
  return result;
}
