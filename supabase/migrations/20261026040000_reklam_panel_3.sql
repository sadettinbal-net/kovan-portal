-- Ana sayfa sağ menüde 3 panel: panel seçimi 0-3 olur (0 fark etmez, 1 üst, 2 orta, 3 alt).
alter table public.reklamlar drop constraint if exists reklamlar_panel_check;
alter table public.reklamlar add constraint reklamlar_panel_check check (panel between 0 and 3);
