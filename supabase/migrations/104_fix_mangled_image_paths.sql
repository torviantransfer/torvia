-- =============================================================
-- 104 — Fix image_url mangled by the migration scripts
-- =============================================================
-- Migrations 100-102 passed the image path as a shell argument on Windows;
-- Git Bash's MSYS layer rewrites any argument that looks like a POSIX
-- absolute path, so "/images/regions/kundu-lara.jpg" was inserted as
-- "C:/Program Files/Git/images/regions/kundu-lara.jpg". Caught in local
-- preview (next/image refused to render it) before the old routes were
-- removed, so nothing on the live site was ever affected.

UPDATE landing_pages SET image_url = '/images/regions/kundu-lara.jpg'
  WHERE slug = 'lara-beach-transfer' AND image_url = 'C:/Program Files/Git/images/regions/kundu-lara.jpg';

UPDATE landing_pages SET image_url = '/images/havaalani-vip-transfer.jpg'
  WHERE slug = 'vip-transfer-antalya' AND image_url = 'C:/Program Files/Git/images/havaalani-vip-transfer.jpg';

UPDATE landing_pages SET image_url = '/images/antalya-airport.jpg'
  WHERE slug = 'hotel-transfer-antalya' AND image_url = 'C:/Program Files/Git/images/antalya-airport.jpg';
