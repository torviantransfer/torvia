import { createAdminClient } from "@/lib/supabase/admin";
import BlogManager from "@/components/admin/BlogManager";

export default async function AdminBlogPage() {
  const supabase = createAdminClient();

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Blog Yazıları</h1>
      <BlogManager initialPosts={posts ?? []} />
    </div>
  );
}
