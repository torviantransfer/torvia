-- Add latitude/longitude columns to regions
ALTER TABLE regions ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6);
ALTER TABLE regions ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);

-- Antalya Airport coordinates: 36.8987, 30.7933

-- Update all 26 seeded regions with real coordinates
UPDATE regions SET latitude = 36.8648, longitude = 30.9278 WHERE slug = 'kundu';
UPDATE regions SET latitude = 36.8493, longitude = 30.8007 WHERE slug = 'lara';
UPDATE regions SET latitude = 36.8572, longitude = 30.9878 WHERE slug = 'belek';
UPDATE regions SET latitude = 36.7683, longitude = 31.3860 WHERE slug = 'side';
UPDATE regions SET latitude = 36.5980, longitude = 30.5574 WHERE slug = 'kemer';
UPDATE regions SET latitude = 36.5440, longitude = 32.0005 WHERE slug = 'alanya';
UPDATE regions SET latitude = 36.3074, longitude = 30.5571 WHERE slug = 'kas';
UPDATE regions SET latitude = 36.7862, longitude = 31.4339 WHERE slug = 'manavgat';
UPDATE regions SET latitude = 36.8857, longitude = 30.6337 WHERE slug = 'konyaalti';
UPDATE regions SET latitude = 36.6489, longitude = 30.4773 WHERE slug = 'beldibi';
UPDATE regions SET latitude = 36.6283, longitude = 30.5172 WHERE slug = 'goynuk';
UPDATE regions SET latitude = 36.5229, longitude = 30.5614 WHERE slug = 'tekirova';
UPDATE regions SET latitude = 36.6222, longitude = 30.5906 WHERE slug = 'camyuva';
UPDATE regions SET latitude = 36.4333, longitude = 30.5475 WHERE slug = 'olympos';
UPDATE regions SET latitude = 36.3800, longitude = 30.4700 WHERE slug = 'adrasan';
UPDATE regions SET latitude = 36.2445, longitude = 29.9870 WHERE slug = 'demre';
UPDATE regions SET latitude = 36.2950, longitude = 30.0530 WHERE slug = 'finike';
UPDATE regions SET latitude = 36.3700, longitude = 30.2900 WHERE slug = 'kumluca';
UPDATE regions SET latitude = 36.2700, longitude = 32.3100 WHERE slug = 'gazipasa';
UPDATE regions SET latitude = 36.5317, longitude = 32.1021 WHERE slug = 'okurcalar';
UPDATE regions SET latitude = 36.5157, longitude = 32.1019 WHERE slug = 'turkler';
UPDATE regions SET latitude = 36.5125, longitude = 32.1089 WHERE slug = 'avsallar';
UPDATE regions SET latitude = 36.5012, longitude = 32.1275 WHERE slug = 'konakli';
UPDATE regions SET latitude = 36.4671, longitude = 32.1503 WHERE slug = 'mahmutlar';
UPDATE regions SET latitude = 36.5100, longitude = 32.1150 WHERE slug = 'kestel';
UPDATE regions SET latitude = 36.8841, longitude = 30.7036 WHERE slug = 'antalya-city-center';
