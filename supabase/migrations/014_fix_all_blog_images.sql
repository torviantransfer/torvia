-- =============================================
-- Fix ALL blog post image_url paths to match
-- actual files in /public/images/blog/
-- =============================================

UPDATE blog_posts SET image_url = '/images/antalya-airport.jpg'
WHERE slug = 'antalya-havalimani-transfer-rehberi';

UPDATE blog_posts SET image_url = '/images/blog/belek-golf.avif'
WHERE slug = 'belek-golf-otelleri-transfer';

UPDATE blog_posts SET image_url = '/images/blog/horizontal-hd.avif'
WHERE slug = 'vip-transfer-mi-shuttle-mi';

UPDATE blog_posts SET image_url = '/images/blog/family-airport.avif'
WHERE slug = 'aileler-icin-antalya-transfer-ipuclari';

UPDATE blog_posts SET image_url = '/images/blog/side-temple.avif'
WHERE slug = 'side-antik-kent-transfer';

UPDATE blog_posts SET image_url = '/images/blog/winter-antalya.jpg'
WHERE slug = 'kis-antalya-tatil-transfer';

UPDATE blog_posts SET image_url = '/images/blog/uber-taxi.avif'
WHERE slug = 'uber-antalya-havalimanı-ulasim';

UPDATE blog_posts SET image_url = '/images/blog/kemer-vip.avif'
WHERE slug = 'antalya-havalimani-kemer-vip-transfer';

UPDATE blog_posts SET image_url = '/images/blog/havas-shuttle.avif'
WHERE slug = 'antalya-havas-mi-vip-transfer-mi';

UPDATE blog_posts SET image_url = '/images/blog/land-of-legends.jpg'
WHERE slug = 'land-of-legends-transfer-rehberi';
