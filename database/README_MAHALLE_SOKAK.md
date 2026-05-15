# Mahalle ve Sokak Verisi

## 📊 Veri Seti Bilgileri

Bu klasörde Türkiye'nin tüm mahalle ve sokak verileri bulunmaktadır.

**Kaynak**: https://github.com/emreuenal/turkiye-il-ilce-sokak-mahalle-veri-tabani

### Veri İçeriği:
- **81 il**
- **970 ilçe**
- **74.276 mahalle/köy/mezra**
- **1.148.699 sokak/cadde/bulvar**

### Dosya Bilgisi:
- **Dosya**: `06_mahalle_sokak_data.sql`
- **Boyut**: 87MB
- **Satır Sayısı**: 1.172.741
- **Format**: PostgreSQL
- **Tarih**: 11 Mayıs 2020

## 🚀 Kullanım

### Supabase'e Import Etme:

**⚠️ DİKKAT**: Bu dosya çok büyük olduğu için Supabase SQL Editor'da çalıştırılamayabilir.

### Alternatif Yöntemler:

#### 1. Supabase CLI ile Import (Önerilir)
```bash
supabase db push --file database/06_mahalle_sokak_data.sql
```

#### 2. pgAdmin ile Import
1. Supabase bağlantı bilgilerini al
2. pgAdmin'de yeni bağlantı oluştur
3. Tools → Restore... → SQL dosyasını seç

#### 3. Parçalara Bölme (Gerekirse)
```bash
# Dosyayı 10MB'lık parçalara böl
split -b 10M database/06_mahalle_sokak_data.sql database/part_

# Her parçayı ayrı ayrı import et
```

## 📋 Tablo Yapısı

### iller
```sql
CREATE TABLE public.iller (
    il_id integer PRIMARY KEY,
    il_adi varchar
);
```

### ilceler
```sql
CREATE TABLE public.ilceler (
    ilce_id integer PRIMARY KEY,
    ilce_adi varchar,
    il_id integer,
    il_adi varchar
);
```

### mahalleler
```sql
CREATE TABLE public.mahalleler (
    mahalle_id integer PRIMARY KEY,
    mahalle_adi varchar,
    ilce_id integer,
    ilce_adi varchar,
    il_id integer,
    il_adi varchar
);
```

### sokaklar
```sql
CREATE TABLE public.sokaklar (
    sokak_id integer PRIMARY KEY,
    sokak_adi varchar,
    mahalle_id integer,
    mahalle_adi varchar,
    ilce_id integer,
    ilce_adi varchar,
    il_id integer,
    il_adi varchar,
    csbm varchar,
    latitude double precision,
    longitude double precision
);
```

## ⚙️ Entegrasyon Notları

Bu veriler mevcut `iller` ve `ilceler` tablolarıyla çakışabilir.

**Öneriler:**
1. Yeni tablo isimleri kullan: `mahalleler_detay`, `sokaklar_detay`
2. Mevcut tablolarla foreign key bağlantısı kur
3. Arama fonksiyonlarını yeni tablolara göre güncelle

## 🔗 İlgili Dosyalar

- `01_insert_iller.sql` - Mevcut il verileri (81 il)
- `02_insert_ilceler_fixed.sql` - Mevcut ilçe verileri (957 ilçe)
- `04_insert_istanbul_sanayi_siteleri.sql` - İstanbul sanayi siteleri
- `05_insert_istanbul_oto_sanayi_siteleri.sql` - İstanbul oto sanayi siteleri

## 📝 Notlar

- Dosya boyutu nedeniyle Git'e eklenmeyebilir
- İndirmek için kaynak GitHub repo'sunu kullanın
- Supabase Free Tier limitlerine dikkat edin (500MB veritabanı)
