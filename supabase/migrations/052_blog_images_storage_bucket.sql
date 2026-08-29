-- =============================================
-- Public storage bucket for images uploaded from the admin blog editor.
-- Uploads go through /api/admin/upload-image using the service-role key,
-- which bypasses RLS, so no INSERT/UPDATE policy is required — only a
-- public SELECT policy so the uploaded images can be rendered on the site.
-- =============================================

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

create policy "Public read access for blog images"
  on storage.objects for select
  using (bucket_id = 'blog-images');
