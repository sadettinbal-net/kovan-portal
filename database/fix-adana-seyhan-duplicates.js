const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// SERVICE_ROLE_KEY kullanıyoruz çünkü DELETE işlemi yapacağız (RLS bypass)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDuplicates() {
  try {
    console.log('=== ADANA/SEYHAN DUPLICATE MAHALLELERİ TEMİZLENİYOR ===\n');

    // Adana ilini bul
    const { data: adanaIl } = await supabase
      .from('iller')
      .select('id')
      .eq('sehir_adi', 'Adana')
      .single();

    // Seyhan ilçesini bul
    const { data: seyhanIlce } = await supabase
      .from('ilceler')
      .select('id')
      .eq('sehir_id', adanaIl.id)
      .ilike('ilce_adi', 'Seyhan')
      .single();

    console.log('Seyhan İlçe ID:', seyhanIlce.id);

    // Tüm Seyhan mahallelerini al
    const { data: mahalleler } = await supabase
      .from('mahalleler_yeni')
      .select('id, mahalle_id, mahalle_adi, ilce_id')
      .eq('ilce_id', seyhanIlce.id)
      .order('mahalle_adi')
      .order('id');

    console.log('Toplam kayıt sayısı:', mahalleler.length);

    // Her mahalle için sadece ilk kaydı tut, diğerlerini silecek ID listesi oluştur
    const toKeep = new Map(); // mahalle_adi -> ilk kayıt ID'si
    const toDelete = []; // silinecek ID'ler

    mahalleler.forEach(m => {
      const key = `${m.mahalle_adi}_${m.mahalle_id}`;

      if (!toKeep.has(key)) {
        // İlk kayıt - tut
        toKeep.set(key, m.id);
        console.log(`✅ TUTULACAK: ${m.mahalle_adi} (ID: ${m.id})`);
      } else {
        // Duplicate - sil
        toDelete.push(m.id);
        console.log(`❌ SİLİNECEK: ${m.mahalle_adi} (ID: ${m.id})`);
      }
    });

    console.log('\n--- ÖZET ---');
    console.log('Tutulacak (unique) mahalle:', toKeep.size);
    console.log('Silinecek duplicate kayıt:', toDelete.length);
    console.log('Toplam:', toKeep.size + toDelete.length);

    if (toDelete.length === 0) {
      console.log('\n✅ Silinecek duplicate kayıt yok!');
      return;
    }

    console.log('\n⚠️  Silme işlemi başlıyor...');

    // Supabase batch delete (her seferinde 1000 kayıt)
    const batchSize = 100;
    let deletedCount = 0;

    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);

      const { error } = await supabase
        .from('mahalleler_yeni')
        .delete()
        .in('id', batch);

      if (error) {
        console.error(`❌ Batch ${i / batchSize + 1} HATA:`, error);
      } else {
        deletedCount += batch.length;
        console.log(`✅ Batch ${i / batchSize + 1}: ${batch.length} kayıt silindi (Toplam: ${deletedCount}/${toDelete.length})`);
      }
    }

    console.log('\n🎉 TEMİZLEME TAMAMLANDI!');
    console.log(`Silinen toplam kayıt: ${deletedCount}`);
    console.log(`Kalan mahalle sayısı: ${toKeep.size}`);

    // Kontrol et
    const { data: yeniMahalleler } = await supabase
      .from('mahalleler_yeni')
      .select('*')
      .eq('ilce_id', seyhanIlce.id);

    console.log('\n--- SON DURUM ---');
    console.log('Seyhan mahalle sayısı:', yeniMahalleler?.length || 0);

  } catch (error) {
    console.error('❌ HATA:', error);
  }
}

fixDuplicates();
