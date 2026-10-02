# Proje Notları - Kovan Portal

## 2026-10-02 - Puanlama Sistemi 1. Aşama

### Yapılanlar
- ✅ Migration `20261002030000_puanlama_asama1.sql` (canlıya uygulandı, tek işlem; DROP / "or replace" yok).
- ✅ **E-posta gizliliği:** `yorumlar` tablosunda anon/authenticated yetkileri kaldırıldı (RLS politikasına dokunulmadı). Açık anahtarla okuma artık `401 permission denied`. Tüm okuma/yazma sunucuda service role ile.
- ✅ **Puan özeti veritabanında:** `firmalar.yorum_sayisi / ortalama_puan / olumlu_yuzde`; `yorumlar` değişince `yorumlar_puan_ozeti` tetikleyicisi `firma_puan_ozeti_guncelle()` ile yeniden hesaplar (gizli yorumlar sayılmaz). Sayfalar artık tüm yorumları çekmiyor → 1000 satır sınırı yok.
- ✅ `yorumlar.gizli` (yönetici gizler; sitede görünmez, puana katılmaz) ve `yorumlar.guncelleme_tarihi` ("düzenlendi").
- ✅ Üye: `/api/yorum` POST/PATCH/DELETE — kendi değerlendirmesini ekler, düzenler, siler; firma sayfasında "Sizin değerlendirmeniz" kartı (7 dil). Kurallar `src/lib/yorumlar.ts`: sadece onaylı firmaya, sahibi kendine puan veremez, puan 1-5 tam sayı, yorum 10-2000 karakter.
- ✅ Yönetici: sahte isimle yorum ekleme ve yorum düzenleme KALDIRILDI (`/api/admin/yorum-ekle`, `/api/admin/yorum-guncelle`, eski `/api/yorum-ekle` silindi). Sadece Gizle/Göster (`/api/admin/yorum-gizle`) ve Sil; listede e-posta ve "Gizli" etiketi görünür (`/api/admin/yorumlar`).
- ✅ Firmalar sıralamasında öne çıkma: en az 3 yorum + %75 olumlu (`ONE_CIKMA_EN_AZ_YORUM`). Özel Firmalar: en az 3 yorum + %90 olumlu, veritabanı özetinden.
- Test: 2 geçici kullanıcı + test firmalarıyla 41 kontrol + sıralama testi geçti; firma silinince yorumlar tetikleyiciyle hatasız silindi. Test kayıtları temizlendi.

### 📌 Puanlama 2. Aşama (sonraya bırakıldı)
- Yeni yorum bildirimi (firma sahibine ve yöneticiye e-posta)
- Firma sahibinin yorumlara cevap yazabilmesi
- Yorum şikâyet ("bildir") butonu

- ✅ Firmalar sayfası: öne çıkanlar (≥3 yorum, %75+ olumlu) her gün 1. sayfanın başında sabit; günlük sayfa kaydırma (her gece 1→2, 2→3, ..., son→1) sadece geri kalan firmalara uygulanıyor. Yöneticinin `hedef_sayfa` ile sabitlediği firmalar yine kendi sayfalarının en başında (öne çıkanlardan da önce). Test: 1892 firmanın tamamı sayfalarda tam birer kez görünüyor.

---

## 2026-10-02 - Firma WhatsApp Alanı

### Yapılanlar
- ✅ `firmalar.whatsapp` sütunu eklendi (canlı veritabanına uygulandı). Migration: `supabase/migrations/20261002010000_firma_whatsapp.sql`.
- ✅ Alan numara (05xx..., 905xx..., +90...) veya WhatsApp Business linki kabul ediyor. Sadece `wa.me`, `api.whatsapp.com`, `whatsapp.com` (ve `www.`) adreslerine izin var; başka site, `javascript:` vb. reddediliyor.
- ✅ Kontrol hem formda hem sunucuda yapılıyor (`src/lib/whatsapp.ts` → `whatsappKontrol`): Firma Ekle (`/api/firma-ekle`), firma sahibi düzenleme (`/api/firma-duzenle`), admin düzenleme (`/api/admin/firma-guncelle`).
- ✅ Firma sayfasındaki buton "WhatsApp ile Yaz" oldu (7 dil, `whatsappBtn`). Numara → `https://wa.me/90...`, link → doğrudan link. Alan boşsa mobil telefonun ilk numarası kullanılıyor.
- ✅ Formlarda alan açıklaması: "WhatsApp numarası veya WhatsApp Business linki". Mobil Telefon'daki "(WhatsApp için)" kaldırıldı.
- ✅ Düzeltilen hata: Boşluklu ("0539 836 82 86") veya virgülle birden fazla yazılmış mobil numaralarda WhatsApp/Ara butonları bozuk adrese gidiyordu; artık ilk numara düzgün alınıyor (`ilkNumara`).

## 2026-10-02 - Firma Silme ve Yayından Kaldırma

### Sorunun tespiti
- Admin silme zaten sunucuda, admin kontrolü + service role ile yapılıyordu (RLS sebebi değildi). Son 24 saatte Supabase'e hiç firma silme isteği ulaşmamıştı; istek sitede takılıyordu, kesin sebep bulunamadı. Yeni sürümde her hata ekranda yazıyor.
- Eski koddaki hatalar: fotoğraflar firmadan ÖNCE siliniyordu (silme başarısızsa fotoğraflar gidiyordu); silinen satır sayısına bakılmıyordu; firma sahibi silmesinde `kullanici_email` boş olan firmayı giriş yapmış herkes silebiliyordu.

### Yapılanlar
- ✅ `onay_durumu`na `'pasif'` eklendi (migration `20261002020000_firma_pasif_durumu.sql`, tek ifade, canlıya uygulandı). RLS'e dokunulmadı: mevcut SELECT politikası herkese sadece `onaylandi` gösterdiği için pasif firma sitede her yerden kendiliğinden kayboluyor.
- ✅ Ortak sunucu kodu `src/lib/firmaSilme.ts`: önce firma silinir, silinen satır 0 ise hata, fotoğraflar ancak sonra silinir. Ad kontrolü `src/lib/firmaAdEslesme.ts` (hem pencere hem sunucu).
- ✅ Onay penceresi `src/components/FirmaSilPenceresi.tsx`: bağlı yorum/fotoğraf/ziyaret sayısını gösterir, firma adı aynen yazılmadan silmez (7 dil).
- ✅ Admin: "⏸ Yayından kaldır" / "↩ Yayına geri al" (`/api/admin/firma-durum`, artık `pasif` kabul ediyor ve 0 satır kontrolü var) + "🗑️ Kalıcı sil" (`/api/admin/firma-sil`).
- ✅ Firma sahibi (`/profil`): "Yayından kaldır", "Tekrar yayına gönder" (pasif → beklemede, yönetici onaylayınca yayına girer), "Kalıcı sil" (`/api/firma-sil-kullanici` GET/DELETE/PATCH). Sahip artık onaylı firmasını da kalıcı silebiliyor.
- Kalıcı silmede: yorumlar/puanlar CASCADE ile silinir; ziyaret kayıtları kalır (`firma_id` NULL); kart + detay fotoğrafları Storage'dan silinir; firma_talepleri/ilanlar/reklamlar etkilenmez.

### 📌 Sonra bakılacak
- **Sahipsiz 3 fotoğraf:** `firma-fotograflari` deposunda hiçbir firmanın `fotograf_url`/`detay_fotograflar` alanında geçmeyen 3 dosya var (toplam 23 dosyadan). Kullanıcı isteğiyle şimdilik dokunulmadı; ileride temizlenebilir.
- `firma-durum` route'unda: yeniden gönderilmiş (`yeniden_gonderildi`) bir firma reddedilirse kayıt siliniyor ama fotoğrafları Storage'da kalıyor (eski davranış, değiştirilmedi).

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
