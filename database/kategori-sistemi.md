# İŞLETME KATEGORİ SİSTEMİ

## 🎯 Tasarım Yaklaşımı

### Seçenek 1: Hiyerarşik Kategori Sistemi (ÖNERİLEN)
```
Ana Kategori → Alt Kategori → İşletme
```

**Örnek:**
- Sağlık
  - Eczane
  - Diş Kliniği
  - Özel Poliklinik
- Gıda
  - Bakkal
  - Market
  - Kasap
  - Manav

### Seçenek 2: Etiket (Tag) Sistemi
```
Her işletme birden fazla etiket alabilir
```

**Örnek:**
- "Mehmet Eczanesi" → [Sağlık, Eczane, 7/24, Reçeteli İlaç]

---

## 📋 ÖNERİLEN ANA KATEGORİLER

### 1. SAĞLIK
- Eczane
- Diş Kliniği
- Özel Poliklinik
- Laboratuvar
- Tıbbi Malzeme
- Optik

### 2. GIDA
- Bakkal
- Market
- Süpermarket
- Kasap
- Manav
- Kuruyemiş
- Pastane
- Fırın
- Şarküteri

### 3. OTOMOTİV
- Oto Tamir
- Oto Elektrik
- Oto Yıkama
- Lastikçi
- Boyacı
- Mekanik
- Oto Cam
- Oto Aksesuar

### 4. İNŞAAT & YAPI
- Hırdavat
- Boya Badana
- Elektrik Malzemeleri
- Tesisat
- Nalburiye
- Demir Doğrama
- PVC Doğrama

### 5. ELEKTRONİK & TEKNOLOJİ
- Bilgisayar Servisi
- Cep Telefonu Servisi
- Beyaz Eşya Servisi
- Elektronik Tamiri

### 6. GİYİM & AKSESUARarı
- Giyim Mağazası
- Ayakkabı Mağazası
- Çanta & Aksesuar
- Tuhafiye
- Terzi

### 7. EV & YAŞAM
- Mobilya
- Ev Tekstili
- Züccaciye
- Hediyelik Eşya
- Kırtasiye

### 8. GÜZELLİK & KİŞİSEL BAKIM
- Kuaför (Erkek)
- Kuaför (Kadın)
- Berber
- Güzellik Salonu
- Masaj & SPA

### 9. EĞİTİM
- Dershane
- Kurs Merkezi
- Anaokulu
- Kreş
- Özel Öğretmen

### 10. PROFESYONEL HİZMETLER
- Avukat
- Muhasebe
- Danışmanlık
- Emlak
- Sigorta
- Çeviri

### 11. SANAYİ & ÜRETİM
- Elektrik (Bobinaj)
- Torna
- Kaynak
- Metal İşleme
- Boru İşleme
- Plastik İşleme
- Ahşap İşleme

### 12. YEME & İÇME
- Restoran
- Kafe
- Fast Food
- Çay Ocağı
- Kebapçı
- Pideci

### 13. EĞLENCE & SOSYAL
- Spor Salonu
- Sinema
- Kütüphane
- Internet Kafe

### 14. TAŞIMACILIK
- Kargo
- Nakliyat
- Taksi Durağı

### 15. DİĞER HİZMETLER
- Kuaför
- Temizlik
- Kuru Temizleme
- Çilingir
- Anahtar

---

## 🗄️ VERİTABANI TASARIMI

### Yaklaşım 1: Basit (Mevcut Yapı)
```sql
-- dukkanlar tablosunda kategori sütunu mevcut
dukkanlar
  - kategori (VARCHAR) - Örn: "Oto Elektrik"
```

### Yaklaşım 2: Ayrı Kategori Tablosu (ÖNERİLEN)
```sql
-- Ana kategoriler tablosu
kategoriler
  - id
  - kategori_adi (Örn: "Otomotiv")
  - icon (Emoji veya icon adı)
  - renk

-- Alt kategoriler tablosu
alt_kategoriler
  - id
  - kategori_id (FK → kategoriler)
  - alt_kategori_adi (Örn: "Oto Elektrik")
  - icon
  - renk

-- dukkanlar tablosunda güncelleme
dukkanlar
  - alt_kategori_id (FK → alt_kategoriler)
```

### Yaklaşım 3: Çoklu Etiket Sistemi
```sql
-- Etiketler tablosu
etiketler
  - id
  - etiket_adi (Örn: "7/24", "Reçeteli İlaç", "Ücretsiz Teslimat")
  - kategori_id (FK → kategoriler, opsiyonel)

-- İşletme-Etiket ilişki tablosu
dukkan_etiketler
  - dukkan_id (FK → dukkanlar)
  - etiket_id (FK → etiketler)
```

---

## 🎨 UI/UX ÖNERİLERİ

### 1. Ana Sayfada Kategori Filtreleme
```
[Tümü] [Sağlık] [Gıda] [Otomotiv] [Sanayi] ...
```

### 2. Kategori Kartları
```
┌─────────────────┐
│   🏥 SAĞLIK    │
│   123 İşletme   │
└─────────────────┘
```

### 3. Arama + Kategori Kombinasyonu
```
[🔍 Ara: "eczane"] [📍 İl: İstanbul] [📂 Kategori: Sağlık]
```

---

## 📊 İMPLEMENTASYON ADIMLARI

1. ✅ Mevcut yapıyı kontrol et
2. ⬜ Kategori listesi oluştur
3. ⬜ Veritabanı tabloları oluştur
4. ⬜ Kategori verilerini import et
5. ⬜ Frontend'e kategori seçimi ekle
6. ⬜ Filtreleme mantığı ekle
7. ⬜ Test et

---

## 💡 SONRAKI ADIMLAR

1. Hangi yaklaşımı tercih ediyorsunuz?
   - Basit (mevcut yapıyı kullan)
   - Hiyerarşik (ana + alt kategori)
   - Etiket sistemi

2. Kategori listesine eklemek istediğiniz özel kategoriler var mı?

3. İşletmeler birden fazla kategoride olabilecek mi?
