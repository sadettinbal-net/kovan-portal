-- =====================================================
-- KATEGORİ VERİLERİ - ANA KATEGORİLER
-- =====================================================

INSERT INTO kategoriler (id, kategori_adi, icon, renk, sira, aktif) VALUES
(1, 'Sağlık', '🏥', '#10b981', 1, true),
(2, 'Gıda', '🍔', '#f59e0b', 2, true),
(3, 'Otomotiv', '🚗', '#ef4444', 3, true),
(4, 'Sanayi', '🏭', '#6366f1', 4, true),
(5, 'İnşaat', '🏗️', '#f97316', 5, true),
(6, 'Elektronik', '💻', '#3b82f6', 6, true),
(7, 'Giyim', '👔', '#ec4899', 7, true),
(8, 'Ev & Yaşam', '🏠', '#8b5cf6', 8, true),
(9, 'Güzellik', '💇', '#f43f5e', 9, true),
(10, 'Eğitim', '📚', '#14b8a6', 10, true),
(11, 'Profesyonel', '💼', '#64748b', 11, true),
(12, 'Yeme & İçme', '🍕', '#dc2626', 12, true),
(13, 'Eğlence', '🎮', '#a855f7', 13, true),
(14, 'Taşımacılık', '🚚', '#0ea5e9', 14, true),
(15, 'Diğer', '📌', '#94a3b8', 15, true)
ON CONFLICT (kategori_adi) DO NOTHING;

-- Sequence'i güncelle
SELECT setval('kategoriler_id_seq', (SELECT MAX(id) FROM kategoriler));

-- =====================================================
-- ALT KATEGORİLER
-- =====================================================

-- SAĞLIK (9 alt kategori)
INSERT INTO alt_kategoriler (kategori_id, alt_kategori_adi) VALUES
(1, 'Eczane'),
(1, 'Diş Kliniği'),
(1, 'Özel Poliklinik'),
(1, 'Veteriner'),
(1, 'Laboratuvar'),
(1, 'Tıbbi Malzeme'),
(1, 'Optik'),
(1, 'İşitme Cihazları'),
(1, 'Fizyoterapi')
ON CONFLICT (kategori_id, alt_kategori_adi) DO NOTHING;

-- GIDA (12 alt kategori)
INSERT INTO alt_kategoriler (kategori_id, alt_kategori_adi) VALUES
(2, 'Bakkal'),
(2, 'Market'),
(2, 'Süpermarket'),
(2, 'Kasap'),
(2, 'Manav'),
(2, 'Kuruyemiş'),
(2, 'Şarküteri'),
(2, 'Şekerci'),
(2, 'Baharatçı'),
(2, 'Tekel & İçki'),
(2, 'Toptan Gıda'),
(2, 'Organik Ürünler')
ON CONFLICT (kategori_id, alt_kategori_adi) DO NOTHING;

-- OTOMOTİV (15 alt kategori)
INSERT INTO alt_kategoriler (kategori_id, alt_kategori_adi) VALUES
(3, 'Oto Tamir'),
(3, 'Oto Elektrik'),
(3, 'Oto Yıkama'),
(3, 'Lastikçi'),
(3, 'Oto Boyacı'),
(3, 'Mekanik'),
(3, 'Oto Cam'),
(3, 'Oto Aksesuar'),
(3, 'Oto Ses Sistemi'),
(3, 'Motor Tamiri'),
(3, 'Klima Dolumu'),
(3, 'Egzoz Tamiri'),
(3, 'Diferansiyel'),
(3, 'Jant Tamiri'),
(3, 'Oto Döşeme')
ON CONFLICT (kategori_id, alt_kategori_adi) DO NOTHING;

-- SANAYİ (12 alt kategori)
INSERT INTO alt_kategoriler (kategori_id, alt_kategori_adi) VALUES
(4, 'Elektrik Bobinaj'),
(4, 'Torna'),
(4, 'Kaynak'),
(4, 'Metal İşleme'),
(4, 'Boru İşleme'),
(4, 'Plastik Enjeksiyon'),
(4, 'Ahşap İşleme'),
(4, 'CNC İşleme'),
(4, 'Lazer Kesim'),
(4, 'Kaplama & Boya'),
(4, 'Döküm'),
(4, 'Kalıp İmalatı')
ON CONFLICT (kategori_id, alt_kategori_adi) DO NOTHING;

-- İNŞAAT (10 alt kategori)
INSERT INTO alt_kategoriler (kategori_id, alt_kategori_adi) VALUES
(5, 'Hırdavat'),
(5, 'Boya Badana'),
(5, 'Elektrik Malzemeleri'),
(5, 'Tesisat'),
(5, 'Nalburiye'),
(5, 'Demir Doğrama'),
(5, 'PVC Doğrama'),
(5, 'Alüminyum Doğrama'),
(5, 'Cam Balkon'),
(5, 'Isı Yalıtım')
ON CONFLICT (kategori_id, alt_kategori_adi) DO NOTHING;

-- ELEKTRONİK (8 alt kategori)
INSERT INTO alt_kategoriler (kategori_id, alt_kategori_adi) VALUES
(6, 'Bilgisayar Servisi'),
(6, 'Cep Telefonu Servisi'),
(6, 'Beyaz Eşya Servisi'),
(6, 'Elektronik Tamiri'),
(6, 'Oyun Konsolu'),
(6, 'Yazıcı & Fotokopi'),
(6, 'Güvenlik Sistemleri'),
(6, 'Uydu Sistemleri')
ON CONFLICT (kategori_id, alt_kategori_adi) DO NOTHING;

-- GİYİM (8 alt kategori)
INSERT INTO alt_kategoriler (kategori_id, alt_kategori_adi) VALUES
(7, 'Erkek Giyim'),
(7, 'Kadın Giyim'),
(7, 'Çocuk Giyim'),
(7, 'Ayakkabı'),
(7, 'Çanta & Aksesuar'),
(7, 'Tuhafiye'),
(7, 'Terzi'),
(7, 'Gelinlik & Damatlık')
ON CONFLICT (kategori_id, alt_kategori_adi) DO NOTHING;

-- EV & YAŞAM (9 alt kategori)
INSERT INTO alt_kategoriler (kategori_id, alt_kategori_adi) VALUES
(8, 'Mobilya'),
(8, 'Ev Tekstili'),
(8, 'Züccaciye'),
(8, 'Hediyelik Eşya'),
(8, 'Kırtasiye'),
(8, 'Oyuncakçı'),
(8, 'Çiçekçi'),
(8, 'Halı & Kilim'),
(8, 'Perde & Aksesuar')
ON CONFLICT (kategori_id, alt_kategori_adi) DO NOTHING;

-- GÜZELLİK (7 alt kategori)
INSERT INTO alt_kategoriler (kategori_id, alt_kategori_adi) VALUES
(9, 'Erkek Kuaförü'),
(9, 'Kadın Kuaförü'),
(9, 'Berber'),
(9, 'Güzellik Salonu'),
(9, 'Masaj & SPA'),
(9, 'Solaryum'),
(9, 'Cilt Bakımı')
ON CONFLICT (kategori_id, alt_kategori_adi) DO NOTHING;

-- EĞİTİM (6 alt kategori)
INSERT INTO alt_kategoriler (kategori_id, alt_kategori_adi) VALUES
(10, 'Dershane'),
(10, 'Kurs Merkezi'),
(10, 'Anaokulu'),
(10, 'Kreş'),
(10, 'Özel Öğretmen'),
(10, 'Sürücü Kursu')
ON CONFLICT (kategori_id, alt_kategori_adi) DO NOTHING;

-- PROFESYONEL HİZMETLER (10 alt kategori)
INSERT INTO alt_kategoriler (kategori_id, alt_kategori_adi) VALUES
(11, 'Avukat'),
(11, 'Muhasebe & Mali Müşavir'),
(11, 'Danışmanlık'),
(11, 'Emlak'),
(11, 'Sigorta'),
(11, 'Çeviri Bürosu'),
(11, 'Noter'),
(11, 'Arabuluculuk'),
(11, 'Pazarlama Ajansı'),
(11, 'Web Tasarım')
ON CONFLICT (kategori_id, alt_kategori_adi) DO NOTHING;

-- YEME & İÇME (10 alt kategori)
INSERT INTO alt_kategoriler (kategori_id, alt_kategori_adi) VALUES
(12, 'Restoran'),
(12, 'Kafe'),
(12, 'Fast Food'),
(12, 'Çay Ocağı'),
(12, 'Kebapçı'),
(12, 'Pideci'),
(12, 'Pastane'),
(12, 'Fırın'),
(12, 'Tatlıcı'),
(12, 'Lokanta')
ON CONFLICT (kategori_id, alt_kategori_adi) DO NOTHING;

-- EĞLENCE & SOSYAL (6 alt kategori)
INSERT INTO alt_kategoriler (kategori_id, alt_kategori_adi) VALUES
(13, 'Spor Salonu'),
(13, 'Yoga & Pilates'),
(13, 'Sinema'),
(13, 'Internet Kafe'),
(13, 'Playstation Salonu'),
(13, 'Bilardo Salonu')
ON CONFLICT (kategori_id, alt_kategori_adi) DO NOTHING;

-- TAŞIMACILIK (5 alt kategori)
INSERT INTO alt_kategoriler (kategori_id, alt_kategori_adi) VALUES
(14, 'Kargo'),
(14, 'Nakliyat'),
(14, 'Taksi Durağı'),
(14, 'Minibüs Durağı'),
(14, 'Kurye Hizmeti')
ON CONFLICT (kategori_id, alt_kategori_adi) DO NOTHING;

-- DİĞER HİZMETLER (8 alt kategori)
INSERT INTO alt_kategoriler (kategori_id, alt_kategori_adi) VALUES
(15, 'Temizlik Hizmeti'),
(15, 'Kuru Temizleme'),
(15, 'Çilingir'),
(15, 'Anahtar'),
(15, 'Oto Çilingir'),
(15, 'Haşere İlaçlama'),
(15, 'Klima Montaj & Servis'),
(15, 'Asansör Bakım')
ON CONFLICT (kategori_id, alt_kategori_adi) DO NOTHING;
