import { createAdminClient } from "@/lib/supabase/admin";
import BlogManager from "@/components/admin/BlogManager";
import type { BlogPostRow } from "@/components/admin/blog/BlogEditor";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const supabase = createAdminClient();
  const { data: posts } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
  return <BlogManager initialPosts={(posts ?? []) as BlogPostRow[]} />;
}
