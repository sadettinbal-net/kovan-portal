-- Reklam görselleri: GIF (hareketli banner), JPG, PNG, WEBP; dosya başına en fazla 5 MB.
-- Herkes görüntüleyebilir (herkese açık depo). Yükleme kuralı (politika) eklenmez:
-- sadece sunucu, yönetici kontrolünden geçen istekle yükleyebilir.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reklam-gorselleri', 'reklam-gorselleri', true, 5242880,
        array['image/gif', 'image/jpeg', 'image/png', 'image/webp']);
