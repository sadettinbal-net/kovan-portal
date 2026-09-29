import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.umraniyesanayisitesi.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, priority: 1.0, changeFrequency: "daily" },
    { url: `${baseUrl}/firmalar`, priority: 0.9, changeFrequency: "daily" },
    { url: `${baseUrl}/ilanlar`, priority: 0.8, changeFrequency: "daily" },
    { url: `${baseUrl}/firma-ekle`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${baseUrl}/iletisim`, priority: 0.5, changeFrequency: "monthly" },
  ];

  const { data: firmalar } = await supabase
    .from("firmalar")
    .select("id, created_at")
    .eq("onay_durumu", "onaylandi")
    .not("ad", "ilike", "(Firma%");

  const firmaPages: MetadataRoute.Sitemap = (firmalar || []).map((f) => ({
    url: `${baseUrl}/firmalar/${f.id}`,
    lastModified: f.created_at ? new Date(f.created_at) : new Date(),
    priority: 0.7,
    changeFrequency: "weekly" as const,
  }));

  return [...staticPages, ...firmaPages];
}
