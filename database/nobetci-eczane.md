# Nöbetçi Eczaneler

Sayfa: `/nobetci-eczaneler?il=istanbul&ilce=umraniye`

## Nasıl çalışır
- Veri kaynağı: NosyAPI `pharmacies-on-duty/all` (81 il, tek çağrı = 81 kredi).
- Veritabanındaki `public.nobetci_eczaneler_guncelle()` fonksiyonu listeyi çeker ve
  `nobetci_eczane_durum.veri` alanına yazar. Sayfa `nobetci_eczane_listesi` ve
  `nobetci_eczane_iller2` görünümlerinden okur.
- pg_cron görevleri (Türkiye saati): 10:15 ana çekim, 12:15 ve 15:15 yalnızca o gün
  başarılı çekim yoksa tekrar dener. Günde en fazla 81 kredi harcanır.

## API anahtarını eklemek (bir kez)
Supabase → SQL Editor:

```sql
select vault.create_secret('BURAYA_NOSYAPI_ANAHTARI', 'nosyapi_key');
select public.nobetci_eczaneler_guncelle(true);  -- hemen ilk çekimi yapar
```

Anahtar değişirse:

```sql
select vault.update_secret((select id from vault.secrets where name = 'nosyapi_key'), 'YENI_ANAHTAR');
```

## Kontrol
```sql
select son_basarili, kayit_sayisi, son_hata from public.nobetci_eczane_durum;
select * from cron.job_run_details where command like '%nobetci%' order by start_time desc limit 5;
```
