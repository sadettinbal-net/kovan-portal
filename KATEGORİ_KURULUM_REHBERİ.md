# 🚀 KATEGORİ SİSTEMİ KURULUM REHBERİ

## Adım 1: Supabase Dashboard'a Girin

1. https://supabase.com/dashboard adresine gidin
2. Projenizi seçin (`kovan-portal`)
3. Sol menüden **SQL Editor** sekmesine tıklayın

## Adım 2: Tabloları Oluşturun

1. SQL Editor'da **New Query** butonuna tıklayın
2. `database/11_create_kategori_tables.sql` dosyasının içeriğini kopyalayıp yapıştırın
3. **Run** butonuna tıklayın (veya Ctrl+Enter)
4. Başarılı mesajını görmelisiniz

## Adım 3: Kategori Verilerini Ekleyin

1. Yeni bir query açın (**New Query**)
2. `database/12_insert_kategoriler.sql` dosyasının içeriğini kopyalayıp yapıştırın
3. **Run** butonuna tıklayın
4. **15 ana kategori** ve **135 alt kategori** eklenecek

## Adım 4: Kontrol Edin

Sol menüden **Table Editor** sekmesine gidin ve şu tabloları görmeli siniz:

- ✅ `kategoriler` (15 kayıt)
- ✅ `alt_kategoriler` (135 kayıt)
- ✅ `dukkanlar` (yeni sütun: `alt_kategori_id`)

## Adım 5: Test Edin

Terminalden şu komutu çalıştırın:

```bash
node --env-file=.env.local database/test-kategoriler.js
```

Bu komut kategori verilerini kontrol edip ekranda gösterecek.

## ⚠️ Sorun mu var?

Eğer tablolar oluşturulamazsa:

1. Supabase projenizin **Database** > **Tables** bölümünden mevcut tabloları kontrol edin
2. `kategoriler` veya `alt_kategoriler` tablosu zaten varsa, önce silin
3. SQL'i tekrar çalıştırın

---

## 📋 ÖZET

```
11_create_kategori_tables.sql  → Tabloları oluştur
12_insert_kategoriler.sql      → Verileri ekle
test-kategoriler.js            → Test et
```

Kurulum tamamlandıktan sonra Frontend'e kategori seçimi ekleyeceğiz! 🎯
