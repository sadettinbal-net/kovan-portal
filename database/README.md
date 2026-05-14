# Veritabanı Kurulum Rehberi

Bu klasör Türkiye'nin tüm il ve ilçelerini Supabase veritabanına eklemek için SQL scriptlerini içerir.

## 📋 İçerik

- `01_insert_iller.sql` - Türkiye'nin 81 ilini ekler
- `02_insert_ilceler.sql` - Tüm illerin ilçelerini ekler (957 ilçe)

## 🚀 Kurulum Adımları

### 1. Supabase Dashboard'a Giriş Yapın
1. [Supabase Dashboard](https://app.supabase.com)'a gidin
2. Projenizi seçin

### 2. SQL Editor'ı Açın
1. Sol menüden **SQL Editor** seçeneğine tıklayın
2. **New query** butonuna tıklayın

### 3. İlleri Ekleyin
1. `01_insert_iller.sql` dosyasının içeriğini kopyalayın
2. SQL Editor'a yapıştırın
3. Sağ alt köşedeki **RUN** butonuna tıklayın
4. "Success. No rows returned" mesajını görmelisiniz
5. 81 il başarıyla eklenmiştir

### 4. İlçeleri Ekleyin
1. `02_insert_ilceler.sql` dosyasının içeriğini kopyalayın
2. SQL Editor'a yapıştırın
3. **RUN** butonuna tıklayın
4. "İller ve ilçeler başarıyla eklendi!" mesajını görmelisiniz
5. 957 ilçe başarıyla eklenmiştir

## ✅ Kontrol

Verilerin doğru eklendiğini kontrol etmek için:

```sql
-- İl sayısını kontrol et
SELECT COUNT(*) as il_sayisi FROM iller;
-- Sonuç: 81 olmalı

-- İlçe sayısını kontrol et
SELECT COUNT(*) as ilce_sayisi FROM ilceler;
-- Sonuç: 957 olmalı

-- Örnek: İstanbul'un ilçelerini listele
SELECT i.sehir_adi, il.ilce_adi
FROM iller i
JOIN ilceler il ON i.id = il.sehir_id
WHERE i.sehir_adi = 'İstanbul'
ORDER BY il.ilce_adi;
```

## 📊 Veritabanı Yapısı

### `iller` Tablosu
```sql
CREATE TABLE iller (
  id SERIAL PRIMARY KEY,
  sehir_adi VARCHAR(50) NOT NULL
);
```

### `ilceler` Tablosu
```sql
CREATE TABLE ilceler (
  id SERIAL PRIMARY KEY,
  sehir_id INTEGER REFERENCES iller(id),
  ilce_adi VARCHAR(50) NOT NULL
);
```

## ⚠️ Önemli Notlar

- Scriptler `ON CONFLICT DO NOTHING` kullanır, bu yüzden birden fazla çalıştırılabilir
- İlleri eklemeden önce ilçeleri eklemeyin (foreign key hatası alırsınız)
- Veriler Türkiye İstatistik Kurumu (TÜİK) kaynaklarına göre hazırlanmıştır

## 🎯 Sıradaki Adımlar

İl ve ilçeler eklendikten sonra:
1. Sanayi sitelerini ekleyin
2. Dükkanları ekleyin
3. Web uygulamasını test edin

## 💡 İpuçları

- SQL scriptleri büyük olduğu için kopyala-yapıştır işlemi birkaç saniye sürebilir
- Hata alırsanız, tabloların mevcut olduğundan emin olun
- Supabase ücretsiz planında veri limiti vardır, bunu göz önünde bulundurun
