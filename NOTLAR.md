# Proje Notları - Kovan Portal

## 2026-10-02 - Firma WhatsApp Alanı

### Yapılanlar
- ✅ `firmalar.whatsapp` sütunu eklendi (canlı veritabanına uygulandı). Migration: `supabase/migrations/20261002010000_firma_whatsapp.sql`.
- ✅ Alan numara (05xx..., 905xx..., +90...) veya WhatsApp Business linki kabul ediyor. Sadece `wa.me`, `api.whatsapp.com`, `whatsapp.com` (ve `www.`) adreslerine izin var; başka site, `javascript:` vb. reddediliyor.
- ✅ Kontrol hem formda hem sunucuda yapılıyor (`src/lib/whatsapp.ts` → `whatsappKontrol`): Firma Ekle (`/api/firma-ekle`), firma sahibi düzenleme (`/api/firma-duzenle`), admin düzenleme (`/api/admin/firma-guncelle`).
- ✅ Firma sayfasındaki buton "WhatsApp ile Yaz" oldu (7 dil, `whatsappBtn`). Numara → `https://wa.me/90...`, link → doğrudan link. Alan boşsa mobil telefonun ilk numarası kullanılıyor.
- ✅ Formlarda alan açıklaması: "WhatsApp numarası veya WhatsApp Business linki". Mobil Telefon'daki "(WhatsApp için)" kaldırıldı.
- ✅ Düzeltilen hata: Boşluklu ("0539 836 82 86") veya virgülle birden fazla yazılmış mobil numaralarda WhatsApp/Ara butonları bozuk adrese gidiyordu; artık ilk numara düzgün alınıyor (`ilkNumara`).

---

## 2026-10-01 - Bugünkü Çalışmalar

### Yapılanlar
- ✅ Debug klasörü temizliği (`src/app/api/debug-firmalar/` silindi)
- ✅ Kategori yönetimi için yapılan deneme kodları geri alındı
- ✅ Git working tree temizlendi

### Tespit Edilen Sorun
**Admin Paneli - Kategori Düzenleme/Silme Çalışmıyor**
- **Sebep:** Supabase'de `kategoriler` ve `alt_kategoriler` tablolarında RLS açık
- Sadece SELECT politikası var
- Tarayıcıdan anon key ile UPDATE/DELETE sessizce 0 satır etkiliyor
- RLS politikalarına dokunulmayacak

### Sırada Ne Var?

### ✅ Kategoriler Veritabanına Taşındı (aynı gün, sonradan yapıldı)
- Yeni tablo `firma_kategorileri` (ad, tip, ust_kategori_id, sira, aktif). Herkes okur, yazma sadece sunucu (service role).
- 213 kategori: Sanayi Sitesi 61, Sanayi Dışı 13 ana + 42 alt, Kurumsal 12 ana + 85 alt.
- `firmalar.kategori_id` ve `firmalar.firma_tipi` eklendi; 1889 firmanın hepsi bağlandı. `sektor` yazısı duruyor (kategori adıyla eşit tutuluyor).
- 3 hastane → Kurumsal › SAĞLIK › Hastaneler. "ÇAĞ OCAĞI" yazım hatalı 43 firma → "ÇAY OCAĞI" kategorisi.
- Yönetici paneli Kategori Yönetimi yeniden yazıldı (`/api/admin/kategoriler`, yönetici kontrolü). İçinde firma/alt kategori olan kategori silinemez.
- Firma Ekle formu, firmalar sayfası süzgeci ve ana sayfa sağ menü kategorileri tablodan okuyor.
- Migration dosyaları: `supabase/migrations/20261001010000..030000`.

#### (Eski not) Kategorileri Veritabanına Taşıma Planı (yukarıda yapıldı)
Şu an kategoriler kod içinde sabit listeler halinde:
- `SEKTORLER_SITELI` (sanayi sitesi kategorileri)
- `TUM_SANAYI_DISI_ALT_KATEGORILER` (sanayi dışı kategoriler)
- `TUM_KURUMSAL_ALT_KATEGORILER` (kurumsal kategoriler)

**Hedef:** Bu listeleri veritabanına taşımak

**Gerekli Adımlar:**
1. Service role key ile çalışan admin API route'ları oluşturmak
2. İstek yapanın admin olduğunu kontrol etmek (`/api/auth/me` mantığı)
3. Kategori ekleme/düzenleme/silme işlemlerini service role ile yapmak
4. Silme politikası kararı (firmalar "DİĞER"e mi taşınsın, yoksa silme engellensin mi?)
5. Alt kategori politikası kararı (ana kategori silinince ne olsun?)

**NOT:** Bu görev kullanıcı talebi üzerine iptal edildi. İleriki bir tarihte yeniden ele alınabilir.

### 📌 Yayına Girince Yapılacaklar
- **Ana sayfa üst şerit reklamı (AdSense):** Şu an geçici olarak sağ menüdeki AdSense birimi (`7684004731`) kullanılıyor. Site yayına girince AdSense'te yatay şerit için yeni bir görüntülü reklam birimi açılacak; kullanıcı numarasını verecek → `src/components/AnasayfaBanner.tsx` içindeki `ADSENSE_SLOT` değiştirilecek.

---

## Genel Sistem Notları

### Git Senkronizasyonu
- İki bilgisayar arası senkronizasyon: dükkan PC + ev laptop
- Her oturum başında `git pull` zorunlu
- Çakışma durumunda kullanıcıya danışılacak

### Admin Yetkilendirme
- Admin kontrolü: `users` tablosunda `google_id` ile kullanıcı bulunup `role === 'admin'` kontrolü yapılıyor
- Service role key sadece sunucu tarafında kullanılıyor
- Environment variable: `SUPABASE_SERVICE_ROLE_KEY`
