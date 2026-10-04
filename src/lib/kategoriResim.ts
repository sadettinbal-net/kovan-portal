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
  // Önce PNG ara, yoksa JPG ara
  const pngPath = path.join(process.cwd(), "public", "kategori-kartlar", `${slug}.png`);
  const jpgPath = path.join(process.cwd(), "public", "kategori-kartlar", `${slug}.jpg`);

  let result: string;
  if (fs.existsSync(pngPath)) {
    result = `/kategori-kartlar/${slug}.png`;
  } else if (fs.existsSync(jpgPath)) {
    result = `/kategori-kartlar/${slug}.jpg`;
  } else {
    result = "/kart-varsayilan.png";
  }

  CACHE.set(sektor, result);
  return result;
}
