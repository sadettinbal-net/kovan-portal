-- Türkiye'nin tüm ilçeleri (İl adına göre)
-- Bu scripti Supabase SQL Editor'da çalıştırın

-- ADANA İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Aladağ', 'Ceyhan', 'Çukurova', 'Feke', 'İmamoğlu', 'Karaisalı', 'Karataş', 'Kozan', 'Pozantı', 'Saimbeyli', 'Sarıçam', 'Seyhan', 'Tufanbeyli', 'Yumurtalık', 'Yüreğir'])
FROM iller WHERE sehir_adi = 'Adana';

-- ADIYAMAN İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Besni', 'Çelikhan', 'Gerger', 'Gölbaşı', 'Kahta', 'Merkez', 'Samsat', 'Sincik', 'Tut'])
FROM iller WHERE sehir_adi = 'Adıyaman';

-- AFYONKARAHİSAR İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Başmakçı', 'Bayat', 'Bolvadin', 'Çay', 'Çobanlar', 'Dazkırı', 'Dinar', 'Emirdağ', 'Evciler', 'Hocalar', 'İhsaniye', 'İscehisar', 'Kızılören', 'Merkez', 'Sandıklı', 'Sinanpaşa', 'Sultandağı', 'Şuhut'])
FROM iller WHERE sehir_adi = 'Afyonkarahisar';

-- AĞRI İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Diyadin', 'Doğubayazıt', 'Eleşkirt', 'Hamur', 'Merkez', 'Patnos', 'Taşlıçay', 'Tutak'])
FROM iller WHERE sehir_adi = 'Ağrı';

-- AKSARAY İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Ağaçören', 'Eskil', 'Gülağaç', 'Güzelyurt', 'Merkez', 'Ortaköy', 'Sarıyahşi', 'Sultanhanı'])
FROM iller WHERE sehir_adi = 'Aksaray';

-- AMASYA İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Göynücek', 'Gümüşhacıköy', 'Hamamözü', 'Merkez', 'Merzifon', 'Suluova', 'Taşova'])
FROM iller WHERE sehir_adi = 'Amasya';

-- ANKARA İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Akyurt', 'Altındağ', 'Ayaş', 'Balâ', 'Beypazarı', 'Çamlıdere', 'Çankaya', 'Çubuk', 'Elmadağ', 'Etimesgut', 'Evren', 'Gölbaşı', 'Güdül', 'Haymana', 'Kahramankazan', 'Kalecik', 'Keçiören', 'Kızılcahamam', 'Mamak', 'Nallıhan', 'Polatlı', 'Pursaklar', 'Sincan', 'Şereflikoçhisar', 'Yenimahalle'])
FROM iller WHERE sehir_adi = 'Ankara';

-- ANTALYA İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Akseki', 'Aksu', 'Alanya', 'Demre', 'Döşemealtı', 'Elmalı', 'Finike', 'Gazipaşa', 'Gündoğmuş', 'İbradı', 'Kaş', 'Kemer', 'Kepez', 'Konyaaltı', 'Korkuteli', 'Kumluca', 'Manavgat', 'Muratpaşa', 'Serik'])
FROM iller WHERE sehir_adi = 'Antalya';

-- ARDAHAN İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Çıldır', 'Damal', 'Göle', 'Hanak', 'Merkez', 'Posof'])
FROM iller WHERE sehir_adi = 'Ardahan';

-- ARTVİN İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Ardanuç', 'Arhavi', 'Borçka', 'Hopa', 'Kemalpaşa', 'Merkez', 'Murgul', 'Şavşat', 'Yusufeli'])
FROM iller WHERE sehir_adi = 'Artvin';

-- AYDIN İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Bozdoğan', 'Buharkent', 'Çine', 'Didim', 'Efeler', 'Germencik', 'İncirliova', 'Karacasu', 'Karpuzlu', 'Koçarlı', 'Köşk', 'Kuşadası', 'Kuyucak', 'Nazilli', 'Söke', 'Sultanhisar', 'Yenipazar'])
FROM iller WHERE sehir_adi = 'Aydın';

-- BALIKESİR İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Altıeylül', 'Ayvalık', 'Balya', 'Bandırma', 'Bigadiç', 'Burhaniye', 'Dursunbey', 'Edremit', 'Erdek', 'Gömeç', 'Gönen', 'Havran', 'İvrindi', 'Karesi', 'Kepsut', 'Manyas', 'Marmara', 'Savaştepe', 'Sındırgı', 'Susurluk'])
FROM iller WHERE sehir_adi = 'Balıkesir';

-- BARTIN İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Amasra', 'Kurucaşile', 'Merkez', 'Ulus'])
FROM iller WHERE sehir_adi = 'Bartın';

-- BATMAN İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Beşiri', 'Gercüş', 'Hasankeyf', 'Kozluk', 'Merkez', 'Sason'])
FROM iller WHERE sehir_adi = 'Batman';

-- BAYBURT İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Aydıntepe', 'Demirözü', 'Merkez'])
FROM iller WHERE sehir_adi = 'Bayburt';

-- BİLECİK İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Bozüyük', 'Gölpazarı', 'İnhisar', 'Merkez', 'Osmaneli', 'Pazaryeri', 'Söğüt', 'Yenipazar'])
FROM iller WHERE sehir_adi = 'Bilecik';

-- BİNGÖL İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Adaklı', 'Genç', 'Karlıova', 'Kiğı', 'Merkez', 'Solhan', 'Yayladere', 'Yedisu'])
FROM iller WHERE sehir_adi = 'Bingöl';

-- BİTLİS İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Adilcevaz', 'Ahlat', 'Güroymak', 'Hizan', 'Merkez', 'Mutki', 'Tatvan'])
FROM iller WHERE sehir_adi = 'Bitlis';

-- BOLU İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Dörtdivan', 'Gerede', 'Göynük', 'Kıbrıscık', 'Mengen', 'Merkez', 'Mudurnu', 'Seben', 'Yeniçağa'])
FROM iller WHERE sehir_adi = 'Bolu';

-- BURDUR İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Ağlasun', 'Altınyayla', 'Bucak', 'Çavdır', 'Çeltikçi', 'Gölhisar', 'Karamanlı', 'Kemer', 'Merkez', 'Tefenni', 'Yeşilova'])
FROM iller WHERE sehir_adi = 'Burdur';

-- BURSA İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Büyükorhan', 'Gemlik', 'Gürsu', 'Harmancık', 'İnegöl', 'İznik', 'Karacabey', 'Keles', 'Kestel', 'Mudanya', 'Mustafakemalpaşa', 'Nilüfer', 'Orhaneli', 'Orhangazi', 'Osmangazi', 'Yenişehir', 'Yıldırım'])
FROM iller WHERE sehir_adi = 'Bursa';

-- ÇANAKKALE İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Ayvacık', 'Bayramiç', 'Biga', 'Bozcaada', 'Çan', 'Eceabat', 'Ezine', 'Gelibolu', 'Gökçeada', 'Lapseki', 'Merkez', 'Yenice'])
FROM iller WHERE sehir_adi = 'Çanakkale';

-- ÇANKIRI İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Atkaracalar', 'Bayramören', 'Çerkeş', 'Eldivan', 'Ilgaz', 'Kızılırmak', 'Korgun', 'Kurşunlu', 'Merkez', 'Orta', 'Şabanözü', 'Yapraklı'])
FROM iller WHERE sehir_adi = 'Çankırı';

-- ÇORUM İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Alaca', 'Bayat', 'Boğazkale', 'Dodurga', 'İskilip', 'Kargı', 'Laçin', 'Mecitözü', 'Merkez', 'Oğuzlar', 'Ortaköy', 'Osmancık', 'Sungurlu', 'Uğurludağ'])
FROM iller WHERE sehir_adi = 'Çorum';

-- DENİZLİ İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Acıpayam', 'Babadağ', 'Baklan', 'Bekilli', 'Beyağaç', 'Bozkurt', 'Buldan', 'Çal', 'Çameli', 'Çardak', 'Çivril', 'Güney', 'Honaz', 'Kale', 'Merkezefendi', 'Pamukkale', 'Sarayköy', 'Serinhisar', 'Tavas'])
FROM iller WHERE sehir_adi = 'Denizli';

-- DİYARBAKIR İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Bağlar', 'Bismil', 'Çermik', 'Çınar', 'Çüngüş', 'Dicle', 'Eğil', 'Ergani', 'Hani', 'Hazro', 'Kayapınar', 'Kocaköy', 'Kulp', 'Lice', 'Silvan', 'Sur', 'Yenişehir'])
FROM iller WHERE sehir_adi = 'Diyarbakır';

-- DÜZCE İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Akçakoca', 'Cumayeri', 'Çilimli', 'Gölyaka', 'Gümüşova', 'Kaynaşlı', 'Merkez', 'Yığılca'])
FROM iller WHERE sehir_adi = 'Düzce';

-- EDİRNE İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Enez', 'Havsa', 'İpsala', 'Keşan', 'Lalapaşa', 'Meriç', 'Merkez', 'Süloğlu', 'Uzunköprü'])
FROM iller WHERE sehir_adi = 'Edirne';

-- ELAZIĞ İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Ağın', 'Alacakaya', 'Arıcak', 'Baskil', 'Karakoçan', 'Keban', 'Kovancılar', 'Maden', 'Merkez', 'Palu', 'Sivrice'])
FROM iller WHERE sehir_adi = 'Elazığ';

-- ERZİNCAN İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Çayırlı', 'İliç', 'Kemah', 'Kemaliye', 'Merkez', 'Otlukbeli', 'Refahiye', 'Tercan', 'Üzümlü'])
FROM iller WHERE sehir_adi = 'Erzincan';

-- ERZURUM İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Aşkale', 'Aziziye', 'Çat', 'Hınıs', 'Horasan', 'İspir', 'Karaçoban', 'Karayazı', 'Köprüköy', 'Narman', 'Oltu', 'Olur', 'Palandöken', 'Pasinler', 'Pazaryolu', 'Şenkaya', 'Tekman', 'Tortum', 'Uzundere', 'Yakutiye'])
FROM iller WHERE sehir_adi = 'Erzurum';

-- ESKİŞEHİR İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Alpu', 'Beylikova', 'Çifteler', 'Günyüzü', 'Han', 'İnönü', 'Mahmudiye', 'Mihalgazi', 'Mihalıççık', 'Odunpazarı', 'Sarıcakaya', 'Seyitgazi', 'Sivrihisar', 'Tepebaşı'])
FROM iller WHERE sehir_adi = 'Eskişehir';

-- GAZİANTEP İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Araban', 'İslahiye', 'Karkamış', 'Nizip', 'Nurdağı', 'Oğuzeli', 'Şahinbey', 'Şehitkamil', 'Yavuzeli'])
FROM iller WHERE sehir_adi = 'Gaziantep';

-- GİRESUN İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Alucra', 'Bulancak', 'Çamoluk', 'Çanakçı', 'Dereli', 'Doğankent', 'Espiye', 'Eynesil', 'Görele', 'Güce', 'Keşap', 'Merkez', 'Piraziz', 'Şebinkarahisar', 'Tirebolu', 'Yağlıdere'])
FROM iller WHERE sehir_adi = 'Giresun';

-- GÜMÜŞHANE İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Kelkit', 'Köse', 'Kürtün', 'Merkez', 'Şiran', 'Torul'])
FROM iller WHERE sehir_adi = 'Gümüşhane';

-- HAKKARİ İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Çukurca', 'Merkez', 'Şemdinli', 'Yüksekova'])
FROM iller WHERE sehir_adi = 'Hakkari';

-- HATAY İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Altınözü', 'Antakya', 'Arsuz', 'Belen', 'Defne', 'Dörtyol', 'Erzin', 'Hassa', 'İskenderun', 'Kırıkhan', 'Kumlu', 'Payas', 'Reyhanlı', 'Samandağ', 'Yayladağı'])
FROM iller WHERE sehir_adi = 'Hatay';

-- IĞDIR İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Aralık', 'Karakoyunlu', 'Merkez', 'Tuzluca'])
FROM iller WHERE sehir_adi = 'Iğdır';

-- ISPARTA İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Aksu', 'Atabey', 'Eğirdir', 'Gelendost', 'Gönen', 'Keçiborlu', 'Merkez', 'Senirkent', 'Sütçüler', 'Şarkikaraağaç', 'Uluborlu', 'Yalvaç', 'Yenişarbademli'])
FROM iller WHERE sehir_adi = 'Isparta';

-- İSTANBUL İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu'])
FROM iller WHERE sehir_adi = 'İstanbul';

-- İZMİR İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Aliağa', 'Balçova', 'Bayındır', 'Bayraklı', 'Bergama', 'Beydağ', 'Bornova', 'Buca', 'Çeşme', 'Çiğli', 'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karaburun', 'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz', 'Konak', 'Menderes', 'Menemen', 'Narlıdere', 'Ödemiş', 'Seferihisar', 'Selçuk', 'Tire', 'Torbalı', 'Urla'])
FROM iller WHERE sehir_adi = 'İzmir';

-- KAHRAMANMARAŞ İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Afşin', 'Andırın', 'Çağlayancerit', 'Dulkadiroğlu', 'Ekinözü', 'Elbistan', 'Göksun', 'Nurhak', 'Onikişubat', 'Pazarcık', 'Türkoğlu'])
FROM iller WHERE sehir_adi = 'Kahramanmaraş';

-- KARABÜK İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Eflani', 'Eskipazar', 'Merkez', 'Ovacık', 'Safranbolu', 'Yenice'])
FROM iller WHERE sehir_adi = 'Karabük';

-- KARAMAN İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Ayrancı', 'Başyayla', 'Ermenek', 'Kazımkarabekir', 'Merkez', 'Sarıveliler'])
FROM iller WHERE sehir_adi = 'Karaman';

-- KARS İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Akyaka', 'Arpaçay', 'Digor', 'Kağızman', 'Merkez', 'Sarıkamış', 'Selim', 'Susuz'])
FROM iller WHERE sehir_adi = 'Kars';

-- KASTAMONU İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Abana', 'Ağlı', 'Araç', 'Azdavay', 'Bozkurt', 'Cide', 'Çatalzeytin', 'Daday', 'Devrekani', 'Doğanyurt', 'Hanönü', 'İhsangazi', 'İnebolu', 'Küre', 'Merkez', 'Pınarbaşı', 'Şenpazar', 'Seydiler', 'Taşköprü', 'Tosya'])
FROM iller WHERE sehir_adi = 'Kastamonu';

-- KAYSERİ İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Akkışla', 'Bünyan', 'Develi', 'Felahiye', 'Hacılar', 'İncesu', 'Kocasinan', 'Melikgazi', 'Özvatan', 'Pınarbaşı', 'Sarıoğlan', 'Sarız', 'Talas', 'Tomarza', 'Yahyalı', 'Yeşilhisar'])
FROM iller WHERE sehir_adi = 'Kayseri';

-- KİLİS İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Elbeyli', 'Merkez', 'Musabeyli', 'Polateli'])
FROM iller WHERE sehir_adi = 'Kilis';

-- KIRIKKALE İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Bahşili', 'Balışeyh', 'Çelebi', 'Delice', 'Karakeçili', 'Keskin', 'Merkez', 'Sulakyurt', 'Yahşihan'])
FROM iller WHERE sehir_adi = 'Kırıkkale';

-- KIRKLARELİ İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Babaeski', 'Demirköy', 'Kofçaz', 'Lüleburgaz', 'Merkez', 'Pehlivanköy', 'Pınarhisar', 'Vize'])
FROM iller WHERE sehir_adi = 'Kırklareli';

-- KIRŞEHİR İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Akçakent', 'Akpınar', 'Boztepe', 'Çiçekdağı', 'Kaman', 'Merkez', 'Mucur'])
FROM iller WHERE sehir_adi = 'Kırşehir';

-- KOCAELİ İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Başiskele', 'Çayırova', 'Darıca', 'Derince', 'Dilovası', 'Gebze', 'Gölcük', 'İzmit', 'Kandıra', 'Karamürsel', 'Kartepe', 'Körfez'])
FROM iller WHERE sehir_adi = 'Kocaeli';

-- KONYA İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Ahırlı', 'Akören', 'Akşehir', 'Altınekin', 'Beyşehir', 'Bozkır', 'Cihanbeyli', 'Çeltik', 'Çumra', 'Derbent', 'Derebucak', 'Doğanhisar', 'Emirgazi', 'Ereğli', 'Güneysın', 'Hadim', 'Halkapınar', 'Hüyük', 'Ilgın', 'Kadınhanı', 'Karapınar', 'Karatay', 'Kulu', 'Meram', 'Sarayönü', 'Selçuklu', 'Seydişehir', 'Taşkent', 'Tuzlukçu', 'Yalıhüyük', 'Yunak'])
FROM iller WHERE sehir_adi = 'Konya';

-- KÜTAHYA İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Altıntaş', 'Aslanapa', 'Çavdarhisar', 'Domaniç', 'Dumlupınar', 'Emet', 'Gediz', 'Hisarcık', 'Merkez', 'Pazarlar', 'Şaphane', 'Simav', 'Tavşanlı'])
FROM iller WHERE sehir_adi = 'Kütahya';

-- MALATYA İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Akçadağ', 'Arapgir', 'Arguvan', 'Battalgazi', 'Darende', 'Doğanşehir', 'Doğanyol', 'Hekimhan', 'Kale', 'Kuluncak', 'Pütürge', 'Yazıhan', 'Yeşilyurt'])
FROM iller WHERE sehir_adi = 'Malatya';

-- MANİSA İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Ahmetli', 'Akhisar', 'Alaşehir', 'Demirci', 'Gölmarmara', 'Gördes', 'Kırkağaç', 'Köprübaşı', 'Kula', 'Salihli', 'Sarıgöl', 'Saruhanlı', 'Selendi', 'Soma', 'Şehzadeler', 'Turgutlu', 'Yunusemre'])
FROM iller WHERE sehir_adi = 'Manisa';

-- MARDİN İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Artuklu', 'Dargeçit', 'Derik', 'Kızıltepe', 'Mazıdağı', 'Midyat', 'Nusaybin', 'Ömerli', 'Savur', 'Yeşilli'])
FROM iller WHERE sehir_adi = 'Mardin';

-- MERSİN İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Akdeniz', 'Anamur', 'Aydıncık', 'Bozyazı', 'Çamlıyayla', 'Erdemli', 'Gülnar', 'Mezitli', 'Mut', 'Silifke', 'Tarsus', 'Toroslar', 'Yenişehir'])
FROM iller WHERE sehir_adi = 'Mersin';

-- MUĞLA İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Bodrum', 'Dalaman', 'Datça', 'Fethiye', 'Kavaklıdere', 'Köyceğiz', 'Marmaris', 'Menteşe', 'Milas', 'Ortaca', 'Seydikemer', 'Ula', 'Yatağan'])
FROM iller WHERE sehir_adi = 'Muğla';

-- MUŞ İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Bulanık', 'Hasköy', 'Korkut', 'Malazgirt', 'Merkez', 'Varto'])
FROM iller WHERE sehir_adi = 'Muş';

-- NEVŞEHİR İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Acıgöl', 'Avanos', 'Derinkuyu', 'Gülşehir', 'Hacıbektaş', 'Kozaklı', 'Merkez', 'Ürgüp'])
FROM iller WHERE sehir_adi = 'Nevşehir';

-- NİĞDE İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Altunhisar', 'Bor', 'Çamardı', 'Çiftlik', 'Merkez', 'Ulukışla'])
FROM iller WHERE sehir_adi = 'Niğde';

-- ORDU İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Akkuş', 'Altınordu', 'Aybastı', 'Çamaş', 'Çatalpınar', 'Çaybaşı', 'Fatsa', 'Gölköy', 'Gülyalı', 'Gürgentepe', 'İkizce', 'Kabadüz', 'Kabataş', 'Korgan', 'Kumru', 'Mesudiye', 'Perşembe', 'Ulubey', 'Ünye'])
FROM iller WHERE sehir_adi = 'Ordu';

-- OSMANİYE İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Bahçe', 'Düziçi', 'Hasanbeyli', 'Kadirli', 'Merkez', 'Sumbas', 'Toprakkale'])
FROM iller WHERE sehir_adi = 'Osmaniye';

-- RİZE İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Ardeşen', 'Çamlıhemşin', 'Çayeli', 'Derepazarı', 'Fındıklı', 'Güneysu', 'Hemşin', 'İkizdere', 'İyidere', 'Kalkandere', 'Merkez', 'Pazar'])
FROM iller WHERE sehir_adi = 'Rize';

-- SAKARYA İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Adapazarı', 'Akyazı', 'Arifiye', 'Erenler', 'Ferizli', 'Geyve', 'Hendek', 'Karapürçek', 'Karasu', 'Kaynarca', 'Kocaali', 'Pamukova', 'Sapanca', 'Serdivan', 'Söğütlü', 'Taraklı'])
FROM iller WHERE sehir_adi = 'Sakarya';

-- SAMSUN İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Alaçam', 'Asarcık', 'Atakum', 'Ayvacık', 'Bafra', 'Canik', 'Çarşamba', 'Havza', 'İlkadım', 'Kavak', 'Ladik', 'Ondokuzmayıs', 'Salıpazarı', 'Tekkeköy', 'Terme', 'Vezirköprü', 'Yakakent'])
FROM iller WHERE sehir_adi = 'Samsun';

-- ŞANLIURFA İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Akçakale', 'Birecik', 'Bozova', 'Ceylanpınar', 'Eyyübiye', 'Halfeti', 'Haliliye', 'Harran', 'Hilvan', 'Karaköprü', 'Siverek', 'Suruç', 'Viranşehir'])
FROM iller WHERE sehir_adi = 'Şanlıurfa';

-- SİİRT İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Baykan', 'Eruh', 'Kurtalan', 'Merkez', 'Pervari', 'Şirvan', 'Tillo'])
FROM iller WHERE sehir_adi = 'Siirt';

-- SİNOP İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Ayancık', 'Boyabat', 'Dikmen', 'Durağan', 'Erfelek', 'Gerze', 'Merkez', 'Saraydüzü', 'Türkeli'])
FROM iller WHERE sehir_adi = 'Sinop';

-- ŞIRNAK İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Beytüşşebap', 'Cizre', 'Güçlükonak', 'İdil', 'Merkez', 'Silopi', 'Uludere'])
FROM iller WHERE sehir_adi = 'Şırnak';

-- SİVAS İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Akıncılar', 'Altınyayla', 'Divriği', 'Doğanşar', 'Gemerek', 'Gölova', 'Gürün', 'Hafik', 'İmranlı', 'Kangal', 'Koyulhisar', 'Merkez', 'Şarkışla', 'Suşehri', 'Ulaş', 'Yıldızeli', 'Zara'])
FROM iller WHERE sehir_adi = 'Sivas';

-- TEKİRDAĞ İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Çerkezköy', 'Çorlu', 'Ergene', 'Hayrabolu', 'Kapaklı', 'Malkara', 'Marmaraereğlisi', 'Muratlı', 'Saray', 'Süleymanpaşa', 'Şarköy'])
FROM iller WHERE sehir_adi = 'Tekirdağ';

-- TOKAT İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Almus', 'Artova', 'Başçiftlik', 'Erbaa', 'Merkez', 'Niksar', 'Pazar', 'Reşadiye', 'Sulusaray', 'Turhal', 'Yeşilyurt', 'Zile'])
FROM iller WHERE sehir_adi = 'Tokat';

-- TRABZON İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Akçaabat', 'Araklı', 'Arsin', 'Beşikdüzü', 'Çarşıbaşı', 'Çaykara', 'Dernekpazarı', 'Düzköy', 'Hayrat', 'Köprübaşı', 'Maçka', 'Of', 'Ortahisar', 'Şalpazarı', 'Sürmene', 'Tonya', 'Vakfıkebir', 'Yomra'])
FROM iller WHERE sehir_adi = 'Trabzon';

-- TUNCELİ İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Çemişgezek', 'Hozat', 'Mazgirt', 'Merkez', 'Nazımiye', 'Ovacık', 'Pertek', 'Pülümür'])
FROM iller WHERE sehir_adi = 'Tunceli';

-- UŞAK İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Banaz', 'Eşme', 'Karahallı', 'Merkez', 'Sivaslı', 'Ulubey'])
FROM iller WHERE sehir_adi = 'Uşak';

-- VAN İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Bahçesaray', 'Başkale', 'Çaldıran', 'Çatak', 'Edremit', 'Erciş', 'Gevaş', 'Gürpınar', 'İpekyolu', 'Muradiye', 'Özalp', 'Saray', 'Tuşba'])
FROM iller WHERE sehir_adi = 'Van';

-- YALOVA İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Altınova', 'Armutlu', 'Çınarcık', 'Çiftlikköy', 'Merkez', 'Termal'])
FROM iller WHERE sehir_adi = 'Yalova';

-- YOZGAT İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Akdağmadeni', 'Aydıncık', 'Boğazlıyan', 'Çandır', 'Çayıralan', 'Çekerek', 'Kadışehri', 'Merkez', 'Saraykent', 'Sarıkaya', 'Sorgun', 'Şefaatli', 'Yerköy', 'Yenifakılı'])
FROM iller WHERE sehir_adi = 'Yozgat';

-- ZONGULDAK İlçeleri
INSERT INTO ilceler (sehir_id, ilce_adi)
SELECT id, unnest(ARRAY['Alaplı', 'Çaycuma', 'Devrek', 'Gökçebey', 'Kilimli', 'Kozlu', 'Merkez', 'Ereğli'])
FROM iller WHERE sehir_adi = 'Zonguldak';

-- İşlem tamamlandı
SELECT 'İller ve ilçeler başarıyla eklendi! Toplam ' || COUNT(*) || ' ilçe eklendi.' as sonuc
FROM ilceler;
