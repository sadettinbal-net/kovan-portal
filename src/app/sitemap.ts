import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, priority: 1.0, changeFrequency: "daily" },
    { url: `${baseUrl}/firmalar`, priority: 0.9, changeFrequency: "daily" },
    { url: `${baseUrl}/ilanlar`, priority: 0.8, changeFrequency: "daily" },
    { url: `${baseUrl}/firma-ekle`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${baseUrl}/iletisim`, priority: 0.5, changeFrequency: "monthly" },
  ];

  // Supabase tek sorguda en fazla 1000 satır döndürür; bütün firmalar 1000'lik parçalarla çekilir
  const firmalar: { id: number; created_at: string | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase
      .from("firmalar")
      .select("id, created_at")
      .eq("onay_durumu", "onaylandi")
      .not("ad", "ilike", "(Firma%")
      .order("id")
      .range(from, from + 999);
    firmalar.push(...(data || []));
    if (!data || data.length < 1000) break;
  }

  const firmaPages: MetadataRoute.Sitemap = firmalar.map((f) => ({
    url: `${baseUrl}/firmalar/${f.id}`,
    lastModified: f.created_at ? new Date(f.created_at) : new Date(),
    priority: 0.7,
    changeFrequency: "weekly" as const,
  }));

  return [...staticPages, ...firmaPages];
}
