// Kurumsal firmalar için ana kategoriler ve alt kategoriler
export type KurumsalKategori = {
  ana: string;
  altlar: string[];
};

export const KURUMSAL_KATEGORILER: KurumsalKategori[] = [
  {
    ana: 'SAĞLIK',
    altlar: [
      'Hastaneler',
      'Özel Poliklinikler',
      'Tıp Merkezleri',
      'Diyaliz Merkezleri',
      'Fizik Tedavi ve Rehabilitasyon',
      'Ağız ve Diş Sağlığı',
      'Görüntüleme Merkezleri',
      'Laboratuvarlar',
      'Ambulans Hizmetleri',
    ]
  },
  {
    ana: 'EĞİTİM',
    altlar: [
      'Üniversiteler',
      'Özel Okullar',
      'Dershaneler',
      'Kurslar ve Eğitim Merkezleri',
      'Dil Okulları',
      'Sürücü Kursları',
      'Meslek Edindirme Kursları',
      'Online Eğitim Platformları',
    ]
  },
  {
    ana: 'FİNANS',
    altlar: [
      'Bankalar',
      'Sigorta Şirketleri',
      'Finansal Danışmanlık',
      'Yatırım Şirketleri',
      'Döviz Büroları',
      'Faktoring Şirketleri',
      'Leasing Firmaları',
    ]
  },
  {
    ana: 'İNŞAAT & GAYRİMENKUL',
    altlar: [
      'İnşaat Firmaları',
      'Gayrimenkul Yatırım Ortaklıkları (GYO)',
      'Emlak Ofisleri',
      'Proje Yönetimi',
      'Mimarlık Büroları',
      'İç Mimarlık',
      'Dekorasyon Firmaları',
    ]
  },
  {
    ana: 'TEKNOLOJİ',
    altlar: [
      'Yazılım Şirketleri',
      'Donanım Firmaları',
      'Bilişim Danışmanlığı',
      'Bulut Hizmet Sağlayıcıları',
      'Siber Güvenlik',
      'Yapay Zeka ve Makine Öğrenimi',
      'E-ticaret Platformları',
      'Mobil Uygulama Geliştirme',
    ]
  },
  {
    ana: 'OTOMOTİV',
    altlar: [
      'Yetkili Servisler',
      'Otomotiv Yan Sanayi',
      'Araç Kiralama',
      'Filo Yönetimi',
      'Lastik Bayileri',
      'Yedek Parça Tedarikçileri',
      'Araç Ekspertiz',
    ]
  },
  {
    ana: 'TURİZM & KONAKLAMA',
    altlar: [
      'Oteller',
      'Tatil Köyleri',
      'Butik Oteller',
      'Pansiyonlar',
      'Seyahat Acenteleri',
      'Tur Operatörleri',
      'Havayolu Firmaları',
      'Rent a Car',
    ]
  },
  {
    ana: 'GIDA & İÇECEK',
    altlar: [
      'Restoran Zincirleri',
      'Gıda Üretim Tesisleri',
      'İçecek Üreticileri',
      'Catering Firmaları',
      'Toptan Gıda',
      'Organik Ürün Üreticileri',
    ]
  },
  {
    ana: 'LOJİSTİK & NAKLİYE',
    altlar: [
      'Kargo Firmaları',
      'Nakliyat Şirketleri',
      'Depolama Hizmetleri',
      'Soğuk Zincir Lojistik',
      'Uluslararası Taşımacılık',
      'Gümrük Müşavirliği',
    ]
  },
  {
    ana: 'MEDYA & İLETİŞİM',
    altlar: [
      'Reklam Ajansları',
      'Prodüksiyon Şirketleri',
      'Basım ve Yayın',
      'Dijital Pazarlama',
      'Halkla İlişkiler',
      'Sosyal Medya Yönetimi',
    ]
  },
  {
    ana: 'ENERJİ',
    altlar: [
      'Elektrik Üretimi',
      'Yenilenebilir Enerji',
      'Doğalgaz Dağıtımı',
      'Petrol Ürünleri',
      'Enerji Danışmanlığı',
      'Güneş Enerjisi Sistemleri',
    ]
  },
  {
    ana: 'HUKUK & DANIŞMANLIK',
    altlar: [
      'Hukuk Büroları',
      'Mali Müşavirlik',
      'Vergi Danışmanlığı',
      'İnsan Kaynakları Danışmanlığı',
      'Yönetim Danışmanlığı',
      'Patent ve Marka',
    ]
  },
];

// Tüm alt kategorileri düz liste olarak da export edelim
export const TUM_KURUMSAL_ALT_KATEGORILER = KURUMSAL_KATEGORILER.flatMap(k => k.altlar).sort((a, b) => a.localeCompare(b, 'tr'));
