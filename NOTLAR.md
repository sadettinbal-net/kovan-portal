# Proje Notları - Kovan Portal

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

#### 1. Kategorileri Veritabanına Taşıma Planı (ERTELENDİ)
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
