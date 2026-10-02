# Proje Notları - Kovan Portal

## 2026-10-02 - Reklam Mesajları

- ✅ Reklam Ver sayfasındaki "Mesaj Gönder" → `/iletisim?konu=reklam`; formda "📢 Reklam başvurusu" yazar, mesaj `iletisim_mesajlari.konu = reklam` olarak kaydedilir (migration `20261002100000_iletisim_mesaj_konu.sql`). Mesajlar tablosu açık anahtarla okunamıyor (401).
- ✅ Yönetici paneli "📨 Reklam Mesajları" sekmesi (`/api/admin/mesajlar`): okunmamış rozeti, Reklam / Genel / Tümü süzgeci, okundu işareti, silme.
- ⏳ **E-posta:** kod hazır (konu: "📢 Reklam Başvurusu", alıcı sadettinbal@gmail.com) ama `RESEND_API_KEY` tanımlı değil. Kullanıcı resend.com'da hesap açıp anahtarı verince .env.local'e (ve yayında Vercel'e) eklenecek. Gönderen adres şimdilik onboarding@resend.dev; kovanportal.com alan adı Resend'de doğrulanınca info@kovanportal.com yapılabilir.

---

## 2026-10-02 - İlanlar 1. Aşama (güvenlik)

### Yapılanlar
- ✅ Migration `20261002060000_ilanlar_guvenlik.sql` (canlıya uygulandı): `ilanlar` tablosunda anon/authenticated yetkileri kaldırıldı (RLS politikasına dokunulmadı) → ilan verenlerin e-postaları açık anahtarla okunamıyor (401). `ilan-fotograflari` deposuna 5 MB ve sadece JPG/PNG/WEBP sınırı.
- ✅ İlan verme (`/api/ilan-ekle`): Google ile giriş zorunlu; e-posta ve ad oturumdan (formdan gelen yok sayılır); son 24 saatte en fazla 3 ilan. Kurallar `src/lib/ilanKurallari.ts`: kategori 6 türden biri, başlık 5-100, açıklama 10-3000, fiyat ≤50 karakter, telefon Türkiye numarası (0XXXXXXXXXX olarak kaydedilir).
- ✅ Fotoğraflar (`src/lib/resimKontrol.ts`): türü dosyanın ilk baytlarından anlaşılır (JPG/PNG/WEBP), her biri ≤5 MB, ilan başına ≤10; biri bile uymazsa ilan kaydedilmez. Dosya, içeriğinden anlaşılan tür ve uzantıyla kaydedilir.
- ✅ Tarayıcıda küçültme (`src/lib/resimKucult.ts`): ilan ve firma ekleme formlarında fotoğraflar seçilince en uzun kenar 1600 px, JPEG %82; konum (GPS) gibi gizli bilgiler de silinir. Toplam 4 MB'ı geçerse uyarı ve gönderim engeli.
- ✅ Yönetici: ilan silmede önce ilan, sonra fotoğraflar; silme/durum/düzenlemede 0 kayıt hatası; düzenleme sadece izinli alanları kabul eder ve aynı kurallarla kontrol eder. Bekleyen ilan sayısı sunucudan (`/api/bildirimler`).
- ✅ İlan sayfasında WhatsApp firmalardaki ortak kuralla ("9090" hatası gitti), sadece cep numarasında görünür.
- ✅ Bildirim e-postalarında kullanıcı metni kaçışlı (`src/lib/htmlKacis.ts`): ilan ekleme, firma ekleme, firma düzenleme.
- Test: 31 kontrol geçti (girişsiz/sahte e-posta/4. ilan/sahte resim/büyük dosya/11 fotoğraf/yanlış alanlar reddedildi; depo HTML ve >5 MB dosyayı doğrudan yüklemede de reddetti). Tarayıcıdaki küçültme elle denenmeli.

### 📌 İlanlar 2. Aşama
- "İlanlarım" bölümü (düzenle, satıldı olarak işaretle, sil)
- 60 günlük ilan süresi ve yenileme
- Arama motorları için ilan sayfaları (sunucuda oluşan sayfa + site haritasında tek tek ilanlar)

### 📌 Yayın öncesi
- **Fotoğrafları doğrudan depoya yükleme:** Vercel tek gönderimde ~4,5 MB'tan büyüğünü kabul etmiyor. Şimdilik tarayıcıda küçültme + 4 MB uyarısı var; kalıcı çözüm sunucunun verdiği tek kullanımlık izinle doğrudan depoya yükleme (içerik kontrolü korunarak). Firma sahibinin panelindeki ve yöneticinin fotoğraf yükleme ekranları da aynı kapsamda ele alınmalı.

## 2026-10-02 - Firma fotoğrafları: aynı kural

### Yapılanlar
- ✅ `firma-fotograflari` deposu: 5 MB + sadece JPG/PNG/WEBP (migration `20261002070000_firma_fotograf_deposu_siniri.sql`). Mevcut 23 dosya içerikten kontrol edildi; 22'si uygun.
- ✅ Fotoğraflar içeriğinden kontrol ediliyor (`resimleriKontrolEt` + `resimYukle`): firma ekleme (üye ve yönetici), firma sahibi paneli (`/api/firma-fotograf-guncelle`), yönetici fotoğraf yükleme (`/api/admin/foto-yukle`). Dosya seçme pencereleri sadece JPG/PNG/WEBP; Firma Ekle'deki GIF izni kaldırıldı.
- ✅ Firma sahibi paneli: sıra düzeltildi (kontrol → yükle → firmaya bağla → en son eskiyi sil). **Güvenlik açığı kapatıldı:** önceden gönderilen herhangi bir dosya adresi depodan siliniyordu; artık sadece o firmanın kendi detay fotoğrafları silinebilir.
- ✅ ÖZNUR OTO (5167) kart resmi 6,29 MB (5184×3456) → 0,33 MB (1600×1067) küçültüldü, `kart/5167-1790963114306.jpg` olarak bağlandı, sayfada göründüğü doğrulandı. Eski dosya `firma-5167-1777977527370.jpg` kullanıcı onayıyla silindi (önce hiçbir firma/reklam/bekleyen talepte kullanılmadığı doğrulandı).
- ✅ Reklam görselleri ayrı `reklam-gorselleri` deposunda (migration `20261002080000`): GIF/JPG/PNG/WEBP, 5 MB, herkese açık görüntüleme, yükleme kuralı yok (sadece sunucu, yönetici kontrolüyle). `/api/admin/reklam/foto` içerikten kontrol eder (GIF sadece reklamda).
- ✅ Eski `firma-resimleri` deposundaki "giriş yapan üye kendi klasörüne yükler" kuralı kaldırıldı (migration `20261002090000`); 5 dosyaya dokunulmadı. Artık depo sisteminde hiç yükleme kuralı yok; tüm yüklemeler sunucudan.
- Test: 15 + 9 kontrol geçti (üye eski depoya ve reklam deposuna doğrudan yükleyemiyor; reklam deposu HTML/SVG/5 MB üstünü reddediyor).

### 📌 Yapılacak
- **ZOR OTOMOTİV reklamı (id 13, video):** görseli `firma-fotograflari/reklam/1783870663418-228500.png` depoda yok (Ümraniye'den aktarılmamış). Kullanıcı görseli Reklam Yönetimi'nden yeniden yükleyecek.

---

## 2026-10-02 - Özel Firmalar: iki ayrı etiket

### Yapılanlar
- ✅ **⭐ Müşteri Favorisi** (otomatik): en az 3 görünür yorum ve %90+ olumlu (`src/lib/ozelFirma.ts` → `musteriFavorisiMi`, puan özeti veritabanında). Yeşil etiket.
- ✅ **💎 Özel Firma · Sponsorlu** (ücretli): yönetici Firma Yönetimi'nde başlangıç ve bitiş tarihiyle verir (`firmalar.ozel_baslangic / ozel_bitis`, migration `20261002050000_ozel_firma_sureli.sql`). Başlangıç günü 00:00, bitiş günü 23:59 (Türkiye saati). Süre kontrolü okuma anında (`sponsorluMu`, `aktifSponsorlar`); zamanlanmış iş yok, süre bitince etiket hemen kalkar. Sunucu (`/api/admin/firma-guncelle`) iki tarihi zorunlu tutar, bitiş başlangıçtan sonra olmalı; "Özel firmalığı kaldır" tarihleri siler.
- ✅ Mevcut 7 özel firma (kullanıcı kararı): 2026-10-02'den 2026-12-31 23:59'a kadar.
- ✅ Ana sayfa "Özel Firmalar": sadece süresi devam eden sponsorlular, 6'dan fazlaysa her açılışta karışık 6'sı. Hiç yoksa "💎 Firmanızı burada öne çıkarın → Reklam Ver" kutusu.
- ✅ Özel Firmalar sayfası iki bölüm: 💎 Özel Firmalar (sponsorlu) ve ⭐ Müşteri Favorileri. Konuma Göre Ara'da süresi devam eden sponsorlular başta.
- Firmalar sayfası sıralaması değişmedi (puanla öne çıkanlar + sayfa sabitleme).
- Test: 23 kontrol geçti (süresi dolan / başlamayan / kapatılan firma etiket almıyor, boş durum kutusu, 7 firmanın tarihleri bozulmadı).

### 📌 Sonra bakılacak
- **Sayfa sabitleme (`hedef_sayfa`) de ücretli olursa ona da başlangıç/bitiş süresi eklenecek.** Şimdilik süresiz; 7 özel firmanın 5'i 1. sayfaya da sabitli.

---

## 2026-10-02 - Puanlama Sistemi 2. Aşama

### Yapılanlar
- ✅ Migration `20261002040000_puanlama_asama2.sql` (canlıya uygulandı; DROP/DELETE/"or replace" yok).
- ✅ **Firma yanıtı:** `yorumlar.cevap / cevap_tarihi / cevap_guncelleme_tarihi / cevap_gizli`. Firma sahibi her yoruma tek yanıt yazar, düzenler, boş kaydederek siler (`PUT /api/yorum/cevap`, 2-1000 karakter). Firma sayfasında yorumun altında "Firma yanıtı". Yönetici gizler/gösterir (`/api/admin/yorum-cevap-gizle`); gizli yanıt ziyaretçiye hiç gönderilmez, sahip "gizlendi" notuyla görür; düzenleme/silme gizliliği kaldırmaz.
- ✅ **Şikâyet:** `yorum_sikayetleri` tablosu (RLS açık, politika yok, anon/authenticated yetkisi yok). Giriş yapmış üye ve firma sahibi sebep seçerek şikâyet eder (`POST /api/yorum/sikayet`); aynı kişi aynı yorumu bir kez (unique), kendi yorumunu ve gizli yorumu şikâyet edemez. Yönetici "🚩 Şikâyetler" sekmesinde yorumu gizler (şikâyetler "gizlendi") veya reddeder (yorum kalır, şikâyetler "reddedildi") — `/api/admin/sikayetler`. Yorum silinince şikâyetleri de silinir.
- ✅ **Panel içi bildirim:** `yorum_bildirim_gorulme` (kişi + kapsam başına son bakılan zaman; RLS açık, dışarıya kapalı). Yönetici "🔔 Yeni Yorumlar" sekmesi (rozetli), firma sahibi profil sayfasında "Yeni yorumlar" kutusu + üst menüde rozet (`/api/bildirimler`). Düzenlenen yorumlar "yeni" sayılmaz; ilk açılışta tüm yorumlar yeni görünür.
- Test: 3 geçici kullanıcıyla 34 kontrol geçti; açık anahtarla yeni tablolar okunamıyor/yazılamıyor (401).
- Yönetici tarafı elle denendi; bunun için eklenen "DENEME FİRMASI (silinecek)" (id 5434) ve 3 yorumu, 1 yanıtı, 3 şikâyeti, 1 ziyaret kaydı silindi (doğrulandı: kalan 0; toplam yorum 8, onaylı firma 1898).

### 📌 Yayın sonrası
- Yeni yorum / şikâyet için e-posta bildirimi (firma sahibine ve yöneticiye). RESEND_API_KEY ve gönderen alan adı gerekli.

---

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
- ✅ Sayfa sabitleme düzeltmesi: istenen sayfa listede yoksa sabitli firma son sayfanın başına konuyor (ör. siteli + 99'luk görünüm 19 sayfa → AYDIN AMORTİSÖR 19. sayfanın başında). Arama, sanayi sitesi ve kategori süzgeçlerinde sabitleme dikkate alınmıyor; firma normal sırasında çıkıyor. Önceden 20. sayfaya sabitli AYDIN AMORTİSÖR Kadosan listesinde ve adıyla aramada hiç görünmüyordu.

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
