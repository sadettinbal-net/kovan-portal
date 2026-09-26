-- Test için örnek firma ekleyelim

-- Önce İstanbul'un ID'sini alalım (genellikle 34)
-- İstanbul > Ümraniye > Bir mahalle > Bir sokağa firma ekleyelim

-- Test Firması 1
INSERT INTO dukkanlar (dukkan_adi, usta_adi, telefon, sokak_id, alt_kategori_id, site_id, adres, latitude, longitude)
VALUES
  ('Demir Döküm Atölyesi', 'Mehmet Yılmaz', '0532 123 45 67', 1, 1, NULL, 'Test Sokak, Test Mahalle, Ümraniye, İstanbul', 41.0082, 29.0104),
  ('Oto Elektrik Ustası', 'Ahmet Kaya', '0533 234 56 78', 1, 2, NULL, 'Test Sokak, Test Mahalle, Ümraniye, İstanbul', 41.0082, 29.0104),
  ('Boya Badana', 'Ali Demir', '0534 345 67 89', 1, 3, NULL, 'Test Sokak, Test Mahalle, Ümraniye, İstanbul', 41.0082, 29.0104);

-- NOT: sokak_id ve alt_kategori_id'yi gerçek verilerinize göre değiştirin
-- Bu sadece örnek, çalışması için gerçek ID'ler gerekir
