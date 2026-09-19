#!/usr/bin/env python3
"""
SQL dosyasını il bazında parçalara ayırır
"""
import os
import re

# İl listesi
ILLER = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara',
    'Antalya', 'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman',
    'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
    'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce', 'Edirne',
    'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun',
    'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul', 'İzmir',
    'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri',
    'Kilis', 'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya',
    'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş',
    'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya', 'Samsun',
    'Şanlıurfa', 'Siirt', 'Sinop', 'Şırnak', 'Sivas', 'Tekirdağ', 'Tokat',
    'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
]

def split_sql_by_city(input_file, output_dir, target_city=None):
    """SQL dosyasını il bazında ayırır"""

    # Çıktı klasörünü oluştur
    os.makedirs(output_dir, exist_ok=True)

    # Sadece belirli bir il isteniyorsa
    cities_to_process = [target_city] if target_city else ILLER

    print(f"Islem basliyor: {input_file}")
    print(f"Hedef iller: {', '.join(cities_to_process)}")

    # Her il için dosya tutacağız
    city_files = {}
    city_counters = {city: {'mahalle': 0, 'sokak': 0} for city in cities_to_process}

    current_city = None
    in_data_section = False
    header_lines = []
    footer_lines = []

    with open(input_file, 'r', encoding='utf-8') as f:
        collecting_header = True

        for line_num, line in enumerate(f, 1):
            if line_num % 100000 == 0:
                print(f"Islenen satir: {line_num:,}")

            # Header kısmını topla (CREATE TABLE vs)
            if collecting_header:
                if 'INSERT INTO' in line or 'COPY public' in line:
                    collecting_header = False
                    in_data_section = True
                else:
                    header_lines.append(line)
                    continue

            # Footer kısmı (ALTER TABLE, constraints vs)
            if 'ALTER TABLE' in line or 'ADD CONSTRAINT' in line:
                in_data_section = False
                footer_lines.append(line)
                continue

            if not in_data_section:
                footer_lines.append(line)
                continue

            # İl adını bul
            for city in cities_to_process:
                if city.upper() in line:
                    current_city = city

                    # İlk kez bu il için dosya aç
                    if city not in city_files:
                        output_file = os.path.join(output_dir, f"07_mahalle_sokak_{city.lower()}.sql")
                        city_files[city] = open(output_file, 'w', encoding='utf-8')
                        # Header'ı yaz
                        city_files[city].write(''.join(header_lines))

                    # Satırı yaz
                    city_files[city].write(line)

                    # Sayaçları güncelle
                    if 'public.mahalleler' in line:
                        city_counters[city]['mahalle'] += 1
                    elif 'public.sokaklar' in line:
                        city_counters[city]['sokak'] += 1

                    break

    # Footer'ı her dosyaya ekle ve kapat
    for city, f in city_files.items():
        f.write('\n-- İstatistikler\n')
        f.write(f"-- Mahalle sayısı: {city_counters[city]['mahalle']}\n")
        f.write(f"-- Sokak sayısı: {city_counters[city]['sokak']}\n")
        f.close()
        print(f"OK {city}: {city_counters[city]['mahalle']:,} mahalle, {city_counters[city]['sokak']:,} sokak")

    print(f"\nTamamlandi! {len(city_files)} il islendi.")

if __name__ == '__main__':
    import sys

    input_file = '06_mahalle_sokak_data.sql'
    output_dir = 'mahalle_sokak_il_bazli'

    # Sadece İstanbul için çalıştır
    target = 'İstanbul' if len(sys.argv) < 2 else sys.argv[1]

    split_sql_by_city(input_file, output_dir, target)
