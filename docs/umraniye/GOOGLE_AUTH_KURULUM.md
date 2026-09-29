# Google OAuth Kurulum Rehberi

## ⚠️ ÖNEMLİ: Google Giriş Hatası Düzeltme

Google ile giriş yaparken hata alıyorsanız, aşağıdaki adımları sırasıyla takip edin:

---

## 1️⃣ Supabase'de `users` Tablosunu Oluşturun

### Adımlar:
1. [Supabase Dashboard](https://supabase.com/dashboard) açın
2. Projenizi seçin
3. Sol menüden **SQL Editor** seçin
4. **New query** butonuna tıklayın
5. `supabase_migration_users.sql` dosyasının içeriğini yapıştırın
6. **Run** butonuna basın

✅ `users` tablosu oluşturuldu!

---

## 2️⃣ Google Cloud Console Ayarları

### Google OAuth Client ID ve Secret Alma:

1. [Google Cloud Console](https://console.cloud.google.com/) açın
2. Proje seçin veya yeni proje oluşturun
3. Sol menüden **APIs & Services** > **Credentials** seçin
4. **+ CREATE CREDENTIALS** > **OAuth client ID** tıklayın
5. **Application type**: Web application
6. **Name**: Ümraniye Sanayi Sitesi OAuth
7. **Authorized redirect URIs** ekleyin:
   ```
   https://umraniyesanayisitesi.com/api/auth/callback
   http://localhost:3000/api/auth/callback (test için)
   ```
8. **CREATE** butonuna basın
9. **Client ID** ve **Client Secret** kopyalayın

---

## 3️⃣ Vercel Environment Variables

### Adımlar:
1. [Vercel Dashboard](https://vercel.com) açın
2. **umraniye-sanayi-sitesi** projesini seçin
3. **Settings** > **Environment Variables** gidin
4. Aşağıdaki değişkenleri ekleyin:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# Site URL
NEXT_PUBLIC_SITE_URL=https://umraniyesanayisitesi.com

# Supabase (zaten var olmalı)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

5. **Save** butonuna basın
6. **Redeploy** yapın (Settings > Deployments > en son deployment'ın yanındaki ... > Redeploy)

---

## 4️⃣ Supabase Authentication Ayarları

### Adımlar:
1. Supabase Dashboard > **Authentication** > **Providers**
2. **Google** provider'ı açın
3. **Enable Google provider** aktif edin
4. **Client ID** ve **Client Secret** girin (Google Cloud Console'dan aldıklarınız)
5. **Callback URL** olarak şunu kullanın:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
6. **Save** butonuna basın

---

## 5️⃣ Test

### Lokal Test (Opsiyonel):
```bash
cd umraniye-sanayi-sitesi
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` açın ve Google ile giriş test edin.

### Production Test:
1. `https://umraniyesanayisitesi.com` açın
2. **Giriş Yap** butonuna tıklayın
3. **Google ile Devam Et** seçin
4. Google hesabınızı seçin
5. İzinleri onaylayın
6. Ana sayfaya yönlendirilmelisiniz ✅

---

## 🔍 Hata Ayıklama

Eğer hata alırsanız, URL'deki error parametresine bakın:

### Yaygın Hatalar:

#### `error=invalid_state`
- **Sebep**: CSRF koruması - cookie'ler düzgün ayarlanmamış
- **Çözüm**: Vercel'de `NEXT_PUBLIC_SITE_URL` doğru mu kontrol edin

#### `error=no_code`
- **Sebep**: Google'dan authorization code gelmedi
- **Çözüm**: Google Cloud Console'da redirect URI'ları kontrol edin

#### `error=token_failed`
- **Sebep**: Google'dan token alınamadı
- **Çözüm**: `GOOGLE_CLIENT_SECRET` doğru mu kontrol edin

#### `error=session_failed`
- **Sebep**: Supabase session oluşturulamadı
- **Çözüm**:
  1. Supabase'de Google provider aktif mi?
  2. `users` tablosu oluşturuldu mu?

---

## 📝 Notlar

- Google OAuth callback URL'si mutlaka `https://umraniyesanayisitesi.com/api/auth/callback` olmalı
- Vercel environment variables ekledikten sonra mutlaka **redeploy** yapın
- `users` tablosu yoksa Google login çalışmaz
- KVKK onay modalı otomatik gösterilir

---

## ✅ Kontrol Listesi

- [ ] Supabase'de `users` tablosu oluşturuldu
- [ ] Google Cloud Console'da OAuth Client ID oluşturuldu
- [ ] Redirect URI eklendi: `https://umraniyesanayisitesi.com/api/auth/callback`
- [ ] Vercel'de `GOOGLE_CLIENT_ID` eklendi
- [ ] Vercel'de `GOOGLE_CLIENT_SECRET` eklendi
- [ ] Vercel'de `NEXT_PUBLIC_SITE_URL` eklendi
- [ ] Supabase'de Google provider aktif edildi
- [ ] Vercel'de redeploy yapıldı
- [ ] Production'da test edildi

**Hepsini yaptıysanız, Google ile giriş artık çalışmalı! 🎉**
