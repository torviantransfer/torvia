"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Power, Image as ImageIcon, FileText } from "lucide-react";
import { scoreSeo } from "@/lib/seoScore";
import { BLOG_CATEGORIES } from "@/lib/blogCategories";
import { ScoreBadge } from "./seo/SeoScorePanel";
import BlogEditor, { LOCALES, type BlogPostRow } from "./blog/BlogEditor";
import {
  Button,
  Chip,
  ConfirmDialog,
  DataGrid,
  EmptyState,
  IconButton,
  PageHeader,
  cx,
  type GridColumn,
} from "@/components/admin/ui";

interface Props {
  initialPosts: BlogPostRow[];
}

const str = (post: BlogPostRow, key: string) => (post[key] as string | null | undefined) ?? "";

/**
 * The posts list. Writing happens in BlogEditor; this screen lists, publishes
 * and deletes.
 */
export default function BlogManager({ initialPosts }: Props) {
  const [posts, setPosts] = useState<BlogPostRow[]>(initialPosts);
  // undefined: the list. null: a new post. A row: that post.
  const [editing, setEditing] = useState<BlogPostRow | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<BlogPostRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const handleToggle = async (id: string) => {
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "blog_posts", action: "toggle", id, data: { field: "is_published" } }),
    });
    const result = await res.json();
    if (result.data) {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, is_published: result.data.is_published } : p)));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "blog_posts", action: "delete", id: deleting.id }),
    });
    const result = await res.json();
    setDeleteBusy(false);
    if (result.success) {
      setPosts((prev) => prev.filter((p) => p.id !== deleting.id));
      setDeleting(null);
    }
  };

  if (editing !== undefined) {
    return (
      <BlogEditor
        post={editing}
        onClose={() => setEditing(undefined)}
        onSaved={(row, created) => {
          setPosts((prev) => (created ? [row, ...prev] : prev.map((p) => (p.id === row.id ? row : p))));
          // Stay in the editor; a new post becomes the post being edited.
          setEditing(row);
        }}
      />
    );
  }

  const columns: GridColumn<BlogPostRow>[] = [
    {
      key: "post",
      header: "Yazı",
      width: "minmax(220px,1.6fr)",
      area: "body",
      cell: (post) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-adm-sm border border-adm-line-2 bg-adm-line-2">
            {str(post, "image_url") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={str(post, "image_url")} alt="" className="size-full object-cover" />
            ) : (
              <ImageIcon size={16} aria-hidden="true" className="text-adm-faint" />
            )}
          </div>
          <div className="min-w-0">
            <div className="line-clamp-1 text-[13.5px] font-semibold">
              {str(post, "title_tr") || str(post, "title_en") || "Başlıksız"}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-adm-muted">
              <span className="font-mono">{post.slug}</span>
              <span className="ms-1.5 flex items-center gap-0.5" title="Dolu diller">
                {LOCALES.map((l) => (
                  <span
                    key={l}
                    aria-hidden="true"
                    className={cx("size-1.5 rounded-full", str(post, `title_${l}`) ? "bg-adm-green" : "bg-adm-line-2")}
                  />
                ))}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Kategori",
      width: "140px",
      area: "foot-start",
      cell: (post) => {
        const c = BLOG_CATEGORIES.find((x) => x.key === post.category);
        return <span className={cx("text-[13px]", c ? "text-adm-ink-2" : "text-adm-faint")}>{c?.label ?? "—"}</span>;
      },
    },
    { key: "seo", header: "SEO", width: "70px", area: "top-start", cell: (post) => <ScoreBadge percent={postScore(post)} /> },
    {
      key: "status",
      header: "Durum",
      width: "110px",
      area: "top-end",
      cell: (post) => (
        <Chip tone={post.is_published ? "green" : "neutral"} plain>
          {post.is_published ? "Yayında" : "Taslak"}
        </Chip>
      ),
    },
    {
      key: "date",
      header: "Tarih",
      width: "100px",
      area: "foot-start",
      cell: (post) => (
        <span className="text-[13px] text-adm-muted">
          {new Date(str(post, "published_at") || post.created_at).toLocaleDateString("tr-TR")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "110px",
      area: "foot-end",
      cell: (post) => (
        <div className="flex items-center justify-end gap-0.5">
          <IconButton
            icon={Power}
            label={post.is_published ? "Yayından kaldır" : "Yayınla"}
            size="sm"
            onClick={() => handleToggle(post.id)}
            className={post.is_published ? "text-adm-green" : undefined}
          />
          <IconButton icon={Edit2} label="Düzenle" size="sm" onClick={() => setEditing(post)} />
          <IconButton icon={Trash2} label="Sil" size="sm" onClick={() => setDeleting(post)} className="hover:bg-adm-rose-soft hover:text-adm-rose" />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Blog Yazıları"
        actions={
          <Button variant="primary" icon={Plus} compact onClick={() => setEditing(null)}>
            Yeni yazı
          </Button>
        }
      />

      <DataGrid
        label="Blog yazıları"
        columns={columns}
        rows={posts}
        rowKey={(post) => post.id}
        onRowClick={(post) => setEditing(post)}
        empty={<EmptyState compact icon={FileText} title="Henüz blog yazısı yok" action={<Button onClick={() => setEditing(null)}>İlk yazıyı oluştur</Button>} />}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Yazıyı sil"
        message={deleting ? `"${str(deleting, "title_tr") || str(deleting, "title_en") || deleting.slug}" kalıcı olarak silinecek.` : ""}
        confirmLabel="Sil"
        danger
        busy={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

/**
 * Row-level score for the posts table, in the first language the post has a
 * title in — scoring a Turkish-only post against English would report a
 * defect that is not one. Same inputs as the editor's score.
 */
function postScore(post: BlogPostRow): number {
  const lang = LOCALES.find((l) => str(post, `title_${l}`).trim()) ?? "en";
  const pick = (prefix: string) => str(post, `${prefix}_${lang}`);
  return scoreSeo({
    title: pick("meta_title") || pick("title"),
    description: pick("meta_description") || pick("excerpt"),
    focusKeyword: pick("focus_keyword"),
    keywords: pick("secondary_keywords"),
    slug: pick("slug") || post.slug,
    content: pick("content"),
    h1: pick("title"),
    imageUrl: str(post, "image_url"),
    ogImageUrl: str(post, "image_url"),
    imageAlt: pick("image_alt"),
  }).percent;
}
