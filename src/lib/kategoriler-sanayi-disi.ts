// Sanayi sitesi dışındaki firmalar için ana kategoriler ve alt kategoriler
export type SanayiDisiKategori = {
  ana: string;
  altlar: string[];
};

export const SANAYI_DISI_KATEGORILER: SanayiDisiKategori[] = [
  {
    ana: 'YEME İÇME',
    altlar: [
      'Berber & Kuaför',
      'Kafe & Restoran',
      'Fırın & Pastane',
      'Yemek Servisi & Catering',
    ]
  },
  {
    ana: 'MARKET & GIDA',
    altlar: [
      'Market & Bakkal',
      'Toptan Gıda',
      'Organik Ürün Satışı',
    ]
  },
  {
    ana: 'GİYİM & AKSESUAR',
    altlar: [
      'Giyim & Ayakkabı',
      'Kuaför & Güzellik',
    ]
  },
  {
    ana: 'SAĞLIK & HİZMETLER',
    altlar: [
      'Eczane',
      'Veteriner Hizmetleri',
      'Pet Shop',
    ]
  },
  {
    ana: 'EĞİTİM & KÜLTÜR',
    altlar: [
      'Eğitim & Kurslar',
      'Spor Salonları',
    ]
  },
  {
    ana: 'GÜZELLIK & BAKIM',
    altlar: [
      'Güzellik & Estetik',
      'Berber & Kuaför',
      'Kuru Temizleme',
    ]
  },
  {
    ana: 'İNŞAAT & EMLAK',
    altlar: [
      'İnşaat & Yapı Malzemeleri',
      'Emlak & Gayrimenkul',
      'Mobilya & Dekorasyon',
    ]
  },
  {
    ana: 'TEKNİK HİZMETLER',
    altlar: [
      'Elektrikçi',
      'Boyacı & Badanacı',
      'Su Tesisatı',
      'Klima Servisi',
      'Kombi Servisi',
      'Beyaz Eşya Tamiri',
      'Bilgisayar Tamiri',
      'Telefon Tamiri',
      'Cam Balkon',
      'PVC Kapı Pencere',
      'Asansör Servisi',
    ]
  },
  {
    ana: 'DANIŞMANLIK & HİZMET',
    altlar: [
      'Avukat & Hukuk',
      'Muhasebe & Mali Müşavirlik',
      'Sigorta Acentesi',
    ]
  },
  {
    ana: 'ULAŞIM & LOJİSTİK',
    altlar: [
      'Taksi & Nakliye',
      'Güvenlik Sistemleri',
    ]
  },
  {
    ana: 'TEMİZLİK & PEYZAJ',
    altlar: [
      'Temizlik Hizmetleri',
      'Peyzaj & Bahçe',
    ]
  },
  {
    ana: 'DİJİTAL & MEDYA',
    altlar: [
      'Dijital Medya & Reklam',
      'Bilişim & Yazılım',
      'Fotoğraf & Video',
      'Organizasyon & Etkinlik',
    ]
  },
  {
    ana: 'DİĞER',
    altlar: [
      'Diğer Hizmetler',
    ]
  },
];

// Tüm alt kategorileri düz liste olarak da export edelim
export const TUM_SANAYI_DISI_ALT_KATEGORILER = SANAYI_DISI_KATEGORILER.flatMap(k => k.altlar).sort((a, b) => a.localeCompare(b, 'tr'));
