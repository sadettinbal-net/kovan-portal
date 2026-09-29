# ⚠️ Google OAuth Hata Çözümü - redirect_uri_mismatch

## Aldığınız Hata:
```
Hata 400: redirect_uri_mismatch
Erişim engellendi: Bu uygulama tarafından gönderilen istek geçersiz
```

---

## 🔍 Sorun Nedir?

Google Cloud Console'da kayıtlı redirect URI'lar ile kodun kullandığı URI eşleşmiyor.

**Kodun kullandığı URI:** `https://umraniyesanayisitesi.com/api/auth/callback`

---

## ✅ HIZLI ÇÖZÜM (3 Adım)

### 1️⃣ Google Cloud Console Ayarları

1. [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials) sayfasını açın
2. OAuth 2.0 Client ID'nizi bulun ve tıklayın (isminde "Web client" yazıyor olabilir)
3. **Authorized redirect URIs** bölümüne AYNEN şu URI'ları ekleyin:

```
https://umraniyesanayisitesi.com/api/auth/callback
```

Eğer www ile de erişilebiliyorsa bunu da ekleyin:
```
https://www.umraniyesanayisitesi.com/api/auth/callback
```

Test için localhost da ekleyin (opsiyonel):
```
http://localhost:3000/api/auth/callback
```

4. **SAVE** butonuna basın
5. **Client ID** ve **Client Secret**'i kopyalayın

### 2️⃣ Vercel Environment Variables

1. [Vercel Dashboard](https://vercel.com/dashboard) açın
2. **umraniye-sanayi-sitesi** projesine gidin
3. **Settings** > **Environment Variables**
4. Şu değişkenlerin olduğundan emin olun:

```bash
GOOGLE_CLIENT_ID=sizin-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=sizin-client-secret
NEXT_PUBLIC_SITE_URL=https://umraniyesanayisitesi.com
```

⚠️ **ÖNEMLİ:**
- `NEXT_PUBLIC_SITE_URL` sonunda **/** olmamalı
- `https://` ile başlamalı
- `www.` varsa veya yoksa ona göre ayarlayın

5. **Save** butonuna basın

### 3️⃣ Vercel'de Redeploy

1. Vercel Dashboard'da **Deployments** sekmesine gidin
2. En son deployment'ın yanındaki **⋯** (üç nokta) tıklayın
3. **Redeploy** seçin
4. 1-2 dakika bekleyin

---

## 🧪 Test

1. `https://umraniyesanayisitesi.com` açın
2. **Giriş Yap** > **Google ile Devam Et**
3. Google hesabı seçin
4. İzinleri onaylayın
5. ✅ Ana sayfaya yönlendirilmelisiniz!

---

## 🔍 Hala Çalışmıyorsa Kontrol Edin

### A) Domain Kontrolü
Sitenize hangi URL ile erişiyorsunuz?
- ✅ `https://umraniyesanayisitesi.com`
- ✅ `https://www.umraniyesanayisitesi.com`

Her iki durumda da redirect URI aynı olmalı!

### B) Vercel Domain Ayarları
1. Vercel > **Settings** > **Domains**
2. Ana domain'iniz hangisi?
   - Eğer `umraniyesanayisitesi.com` ise → `NEXT_PUBLIC_SITE_URL=https://umraniyesanayisitesi.com`
   - Eğer `www.umraniyesanayisitesi.com` ise → `NEXT_PUBLIC_SITE_URL=https://www.umraniyesanayisitesi.com`

### C) Google Cloud Console Kontrol
1. Credentials sayfasında OAuth Client ID'ye tıklayın
2. **Authorized redirect URIs** listesinde şunlar var mı:

```
https://umraniyesanayisitesi.com/api/auth/callback
```

Tam olarak bu formatta olmalı!

---

## 📸 Ekran Görüntüsü ile Adımlar

### Google Cloud Console'da Nasıl Görünmeli:

```
Application type: Web application
Name: Ümraniye Sanayi Sitesi

Authorized JavaScript origins:
https://umraniyesanayisitesi.com

Authorized redirect URIs:
https://umraniyesanayisitesi.com/api/auth/callback
```

---

## ⚡ Alternatif Çözüm: Yeni OAuth Client Oluşturun

Eğer yukarıdakiler çalışmazsa, sıfırdan yeni bir OAuth Client oluşturun:

### Adım 1: Google Cloud Console
1. [Console](https://console.cloud.google.com/apis/credentials) açın
2. **+ CREATE CREDENTIALS** > **OAuth client ID**
3. **Application type**: Web application
4. **Name**: Umraniye Sanayi OAuth v2
5. **Authorized redirect URIs** > **+ ADD URI**:
   ```
   https://umraniyesanayisitesi.com/api/auth/callback
   ```
6. **CREATE**
7. **Client ID** ve **Client Secret** kopyalayın

### Adım 2: Vercel Environment Variables
1. Eski `GOOGLE_CLIENT_ID` ve `GOOGLE_CLIENT_SECRET`'i silin
2. Yeni değerleri ekleyin
3. **Redeploy**

---

## 🎯 Özet Kontrol Listesi

- [ ] Google Cloud Console > OAuth Client > Redirect URIs eklendi
- [ ] Redirect URI: `https://umraniyesanayisitesi.com/api/auth/callback` (www olup olmadığını kontrol edin!)
- [ ] Vercel > `GOOGLE_CLIENT_ID` doğru
- [ ] Vercel > `GOOGLE_CLIENT_SECRET` doğru
- [ ] Vercel > `NEXT_PUBLIC_SITE_URL` doğru (sonunda / yok, www varsa ekli)
- [ ] Vercel'de redeploy yapıldı
- [ ] 2-3 dakika beklendi (deployment tamamlanması için)
- [ ] Test edildi

---

## 💡 Sık Sorulan Sorular

**S: www var mı yok mu?**
C: Vercel Settings > Domains bölümünden ana domain'inize bakın. Ona göre ayarlayın.

**S: Redeploy ne zaman biter?**
C: Genelde 1-2 dakika. Deployments sekmesinden "Ready" yazısını bekleyin.

**S: Hala çalışmıyor?**
C: Tarayıcı cache'ini temizleyin (Ctrl+Shift+Delete) ve inkognito modda deneyin.

---

**Bu adımları yaptıktan sonra Google login çalışmalı! 🎉**
