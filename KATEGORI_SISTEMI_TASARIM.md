# 🎯 İŞLETME KATEGORİ SİSTEMİ TASARIMI

## 📐 Seçilen Yaklaşım: **Hiyerarşik Kategori Sistemi**

### Neden Bu Yaklaşım?
✅ Organize ve kolay yönetilebilir
✅ Kullanıcı dostu (ana kategori → alt kategori)
✅ Genişletilebilir
✅ Filtreleme ve arama kolay

---

## 🗄️ VERİTABANI YAPISI

### 1. `kategoriler` Tablosu (Ana Kategoriler)
```sql
CREATE TABLE kategoriler (
  id SERIAL PRIMARY KEY,
  kategori_adi VARCHAR(100) NOT NULL,
  icon VARCHAR(10),          -- Emoji (🏥, 🍔, 🚗, vb.)
  renk VARCHAR(20),          -- Hex renk kodu
  sira INTEGER,              -- Görüntülenme sırası
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. `alt_kategoriler` Tablosu
```sql
CREATE TABLE alt_kategoriler (
  id SERIAL PRIMARY KEY,
  kategori_id INTEGER REFERENCES kategoriler(id),
  alt_kategori_adi VARCHAR(100) NOT NULL,
  icon VARCHAR(10),
  aciklama TEXT,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. `dukkanlar` Tablosuna Ekleme
```sql
-- Mevcut dukkanlar tablosuna yeni sütun
ALTER TABLE dukkanlar
ADD COLUMN alt_kategori_id INTEGER REFERENCES alt_kategoriler(id);

-- Mevcut 'kategori' sütunu opsiyonel olarak kalabilir (backward compatibility)
```

---

## 📊 KATEGORİ VERİLERİ

### Ana Kategoriler (15 adet)

| ID | Kategori | Icon | Renk | Açıklama |
|----|----------|------|------|----------|
| 1 | Sağlık | 🏥 | #10b981 | Sağlık hizmetleri |
| 2 | Gıda | 🍔 | #f59e0b | Gıda ve market |
| 3 | Otomotiv | 🚗 | #ef4444 | Araç bakım ve tamir |
| 4 | Sanayi | 🏭 | #6366f1 | İmalat ve üretim |
| 5 | İnşaat | 🏗️ | #f97316 | İnşaat malzemeleri |
| 6 | Elektronik | 💻 | #3b82f6 | Teknoloji ve elektronik |
| 7 | Giyim | 👔 | #ec4899 | Tekstil ve giyim |
| 8 | Ev & Yaşam | 🏠 | #8b5cf6 | Ev eşyaları |
| 9 | Güzellik | 💇 | #f43f5e | Kişisel bakım |
| 10 | Eğitim | 📚 | #14b8a6 | Eğitim hizmetleri |
| 11 | Profesyonel | 💼 | #64748b | Danışmanlık ve hizmetler |
| 12 | Yeme & İçme | 🍕 | #dc2626 | Restoran ve kafe |
| 13 | Eğlence | 🎮 | #a855f7 | Eğlence ve spor |
| 14 | Taşımacılık | 🚚 | #0ea5e9 | Kargo ve nakliyat |
| 15 | Diğer | 📌 | #94a3b8 | Diğer hizmetler |

### Alt Kategoriler (100+ adet)

#### 🏥 SAĞLIK (9 adet)
1. Eczane
2. Diş Kliniği
3. Özel Poliklinik
4. Veteriner
5. Laboratuvar
6. Tıbbi Malzeme
7. Optik
8. Odyoloji (İşitme Cihazları)
9. Fizyoterapi

#### 🍔 GIDA (12 adet)
1. Bakkal
2. Market
3. Süpermarket
4. Kasap
5. Manav
6. Kuruyemiş
7. Şarküteri
8. Şekerci
9. Baharatçı
10. Tekel & İçki
11. Toptan Gıda
12. Organik Ürünler

#### 🚗 OTOMOTİV (15 adet)
1. Oto Tamir
2. Oto Elektrik
3. Oto Yıkama
4. Lastikçi
5. Oto Boyacı
6. Mekanik
7. Oto Cam
8. Oto Aksesuar
9. Oto Ses Sistemi
10. Motor Tamiri
11. Klima Dolumu
12. Egzoz Tamiri
13. Diferansiyel
14. Jant Tamiri
15. Oto Döşeme

#### 🏭 SANAYİ (12 adet)
1. Elektrik Bobinaj
2. Torna
3. Kaynak
4. Metal İşleme
5. Boru İşleme
6. Plastik Enjeksiyon
7. Ahşap İşleme
8. CNC İşleme
9. Lazer Kesim
10. Kaplama & Boya
11. Döküm
12. Kalıp İmalatı

#### 🏗️ İNŞAAT (10 adet)
1. Hırdavat
2. Boya Badana
3. Elektrik Malzemeleri
4. Tesisat
5. Nalburiye
6. Demir Doğrama
7. PVC Doğrama
8. Alüminyum Doğrama
9. Cam Balkon
10. Isı Yalıtım

#### 💻 ELEKTRONİK (8 adet)
1. Bilgisayar Servisi
2. Cep Telefonu Servisi
3. Beyaz Eşya Servisi
4. Elektronik Tamiri
5. Oyun Konsolu
6. Yazıcı & Fotokopi
7. Güvenlik Sistemleri
8. Uydu Sistemleri

#### 👔 GİYİM (8 adet)
1. Erkek Giyim
2. Kadın Giyim
3. Çocuk Giyim
4. Ayakkabı
5. Çanta & Aksesuar
6. Tuhafiye
7. Terzi
8. Gelinlik & Damatlık

#### 🏠 EV & YAŞAM (9 adet)
1. Mobilya
2. Ev Tekstili
3. Züccaciye
4. Hediyelik Eşya
5. Kırtasiye
6. Oyuncakçı
7. Çiçekçi
8. Halı & Kilim
9. Perde & Aksesuar

#### 💇 GÜZELLİK (7 adet)
1. Erkek Kuaförü
2. Kadın Kuaförü
3. Berber
4. Güzellik Salonu
5. Masaj & SPA
6. Solaryum
7. Cilt Bakımı

#### 📚 EĞİTİM (6 adet)
1. Dershane
2. Kurs Merkezi
3. Anaokulu
4. Kreş
5. Özel Öğretmen
6. Sürücü Kursu

#### 💼 PROFESYONEL HİZMETLER (10 adet)
1. Avukat
2. Muhasebe & Mali Müşavir
3. Danışmanlık
4. Emlak
5. Sigorta
6. Çeviri Bürosu
7. Noter
8. Arabuluculuk
9. Pazarlama Ajansı
10. Web Tasarım

#### 🍕 YEME & İÇME (10 adet)
1. Restoran
2. Kafe
3. Fast Food
4. Çay Ocağı
5. Kebapçı
6. Pideci
7. Pastane
8. Fırın
9. Tatlıcı
10. Lokanta

#### 🎮 EĞLENCE & SOSYAL (6 adet)
1. Spor Salonu
2. Yoga & Pilates
3. Sinema
4. Internet Kafe
5. Playstation Salonu
6. Bilardo Salonu

#### 🚚 TAŞIMACILIK (5 adet)
1. Kargo
2. Nakliyat
3. Taksi Durağı
4. Minibüs Durağı
5. Kurye Hizmeti

#### 📌 DİĞER HİZMETLER (8 adet)
1. Temizlik Hizmeti
2. Kuru Temizleme
3. Çilingir
4. Anahtar
5. Oto Çilingir
6. Haşere İlaçlama
7. Klima Montaj & Servis
8. Asansör Bakım

**TOPLAM: 135 Alt Kategori**

---

## 🎨 UI/UX TASARIM

### 1. Ana Sayfa - Kategori Kartları
```
┌─────────────────────────────────────────────────────────┐
│  KATEGORİLER                                            │
├─────────────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │ 🏥   │  │ 🍔   │  │ 🚗   │  │ 🏭   │  │ 🏗️   │     │
│  │Sağlık│  │ Gıda │  │ Oto  │  │Sanayi│  │İnşaat│     │
│  │ 234  │  │ 567  │  │ 890  │  │ 123  │  │ 456  │     │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘     │
└─────────────────────────────────────────────────────────┘
```

### 2. Filtreleme Bölümü
```
┌─────────────────────────────────────────────────────────┐
│  FİLTRELE                                               │
├─────────────────────────────────────────────────────────┤
│  📍 İl:       [İstanbul ▼]                              │
│  📍 İlçe:     [Ümraniye ▼]                              │
│  📍 Mahalle:  [Adem Yavuz Mah. ▼]                       │
│  📂 Kategori: [Otomotiv ▼]                              │
│  📋 Alt Kat:  [Oto Elektrik ▼]                          │
│  🔍 Ara:      [________________________]  [ARA]         │
└─────────────────────────────────────────────────────────┘
```

### 3. İşletme Kartı
```
┌─────────────────────────────────────────────────────────┐
│  🏥 Öz Teknik Bobinaj              [⭐ 4.5] (23 oy)     │
├─────────────────────────────────────────────────────────┤
│  👤 Sadettin Usta                                       │
│  📂 Sanayi → Elektrik Bobinaj                           │
│  📍 Ümraniye, İstanbul                                  │
│  📞 0532 000 00 00                                      │
│  🌐 www.ozteknik.com                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 İMPLEMENTASYON PLANI

### Faz 1: Veritabanı (1 gün)
- [  ] `kategoriler` tablosu oluştur
- [  ] `alt_kategoriler` tablosu oluştur
- [  ] `dukkanlar` tablosuna `alt_kategori_id` ekle
- [  ] 15 ana kategori ver isini import et
- [  ] 135 alt kategori verisini import et

### Faz 2: Backend (1 gün)
- [  ] Kategori listeleme API
- [  ] Alt kategori listeleme API (kategori_id'ye göre)
- [  ] İşletme filtreleme (kategori bazlı)

### Faz 3: Frontend (2 gün)
- [  ] Kategori kartları komponenti
- [  ] Kategori seçimi dropdown
- [  ] Alt kategori cascade dropdown
- [  ] Filtreleme mantığı
- [  ] Kategori ikonları ve renkler

### Faz 4: Test & İyileştirme (1 gün)
- [  ] Tüm kategorileri test et
- [  ] Performans optimizasyonu
- [  ] Mobile responsive test

**TOPLAM SÜRE: ~5 gün**

---

## 🚀 SONRAKI ADIM

Onayınızla şu adımları başlatalım:

1. ✅ Veritabanı tablolarını oluştur
2. ✅ Kategori verilerini hazırla ve import et
3. ✅ Frontend'e kategori seçimi ekle
4. ✅ Test et ve göster

**Başlayalım mı?** 🎯
