"use client";

import { useRef, useState, type ReactNode } from "react";
import { EditorContent, Extension, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import {
  AlertTriangle, Bold, Code2, Columns3, Heading2, Heading3, Heading4, HelpCircle, ImagePlus, Italic,
  Link2, List, ListOrdered, Loader2, Minus, Pilcrow, Quote, Redo2, Rows3, Table2, Trash2, Underline,
  Undo2, Unlink, Upload,
} from "lucide-react";
import { FAQ_HEADING } from "@/lib/articleOutline";
import { Button, Dialog, Field, Input, Textarea, cx } from "@/components/admin/ui";
import { editorLosses, prepareForEditor } from "./editorCompat";

/** The FAQ heading the public page recognises, in each language (blog.faqHeading). */
const FAQ_LABEL: Record<string, string> = {
  tr: "Sık sorulan sorular",
  en: "Frequently asked questions",
  de: "Häufige Fragen",
  pl: "Najczęściej zadawane pytania",
  ru: "Частые вопросы",
  nl: "Veelgestelde vragen",
  ro: "Întrebări frecvente",
  ar: "الأسئلة الشائعة",
};

/**
 * Keeps `id` on headings and paragraphs, so the anchors of a hand-written
 * table of contents survive a save from the visual editor. Not copied onto
 * the second half when a heading is split with Enter — two ids would clash.
 */
const KeepIds = Extension.create({
  name: "keepIds",
  addGlobalAttributes() {
    return [
      {
        types: ["heading", "paragraph"],
        attributes: {
          id: {
            default: null,
            keepOnSplit: false,
            parseHTML: (el) => el.getAttribute("id"),
            renderHTML: (attrs) => (attrs.id ? { id: attrs.id } : {}),
          },
        },
      },
    ];
  },
});

/** Styles for the editing surface, close to the public article so what you see is what ships. */
const SURFACE = [
  "min-h-[480px] px-5 py-5 text-[15.5px] leading-[1.75] text-adm-ink-2 outline-none sm:px-8 sm:py-7",
  "[&>*:first-child]:mt-0",
  "[&_h2]:mb-3 [&_h2]:mt-9 [&_h2]:text-[22px] [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:tracking-tight [&_h2]:text-adm-ink",
  "[&_h3]:mb-2 [&_h3]:mt-7 [&_h3]:text-[18px] [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:text-adm-ink",
  "[&_h4]:mb-2 [&_h4]:mt-5 [&_h4]:font-semibold [&_h4]:text-adm-ink",
  "[&_p]:mb-4 [&_li_p]:m-0 [&_td_p]:m-0 [&_th_p]:m-0",
  "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:ps-6 [&_li]:my-1",
  "[&_strong]:font-semibold [&_strong]:text-adm-ink",
  "[&_a]:text-[#007AFF] [&_a]:underline [&_a]:underline-offset-2",
  "[&_blockquote]:my-5 [&_blockquote]:border-s-[3px] [&_blockquote]:border-[#007AFF]/30 [&_blockquote]:ps-4 [&_blockquote]:text-adm-muted",
  "[&_hr]:my-8 [&_hr]:border-adm-line",
  "[&_img]:my-5 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl [&_img.ProseMirror-selectednode]:outline [&_img.ProseMirror-selectednode]:outline-2 [&_img.ProseMirror-selectednode]:outline-[#007AFF]",
  "[&_.tableWrapper]:my-5 [&_.tableWrapper]:overflow-x-auto",
  "[&_table]:w-full [&_table]:border-collapse [&_table]:text-[14px]",
  "[&_th]:border [&_th]:border-adm-line [&_th]:bg-adm-surface-2 [&_th]:px-3 [&_th]:py-2 [&_th]:text-start [&_th]:font-semibold [&_th]:align-top",
  "[&_td]:border [&_td]:border-adm-line [&_td]:px-3 [&_td]:py-2 [&_td]:align-top",
  "[&_.selectedCell]:bg-[#007AFF]/[0.08]",
  // Placeholder text on empty blocks.
  "[&_.is-empty]:before:pointer-events-none [&_.is-empty]:before:float-start [&_.is-empty]:before:h-0 [&_.is-empty]:before:text-adm-faint [&_.is-empty]:before:content-[attr(data-placeholder)]",
].join(" ");

export default function RichEditor({
  id,
  value,
  onChange,
  locale,
}: {
  id: string;
  value: string;
  onChange: (html: string) => void;
  /** The language being written — picks the FAQ heading and the text direction. */
  locale: string;
}) {
  // Posts with markup the editor would drop open in HTML mode (editorCompat).
  const [initialLosses] = useState(() => editorLosses(value));
  const [mode, setMode] = useState<"visual" | "html">(initialLosses.length ? "html" : "visual");
  const [pendingLosses, setPendingLosses] = useState<string[] | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        code: false,
        codeBlock: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          // Internal links must not carry nofollow or open a new tab; the
          // link dialog sets both for an external link that asks for it.
          HTMLAttributes: { rel: null, target: null },
        },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({
        includeChildren: false,
        placeholder: ({ node }) =>
          node.type.name === "heading" ? "Başlık yazın…" : "Yazmaya başlayın. Başlık, liste, tablo ve görsel için üstteki araçları kullanın.",
      }),
      KeepIds,
    ],
    content: initialLosses.length ? "" : prepareForEditor(value),
    editorProps: {
      attributes: {
        id,
        class: SURFACE,
        dir: locale === "ar" ? "rtl" : "ltr",
        "aria-label": "Yazı içeriği",
      },
    },
    onUpdate: ({ editor }) => {
      if (editor.isEmpty) onChange("");
      else onChange(editor.getHTML());
    },
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            block: e.isActive("heading", { level: 2 })
              ? "h2"
              : e.isActive("heading", { level: 3 })
                ? "h3"
                : e.isActive("heading", { level: 4 })
                  ? "h4"
                  : "p",
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            underline: e.isActive("underline"),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            quote: e.isActive("blockquote"),
            link: e.isActive("link"),
            table: e.isActive("table"),
            image: e.isActive("image"),
            imageAlt: e.isActive("image") ? String(e.getAttributes("image").alt ?? "") : "",
            imagePos: e.state.selection.from,
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });

  const toVisual = (force = false) => {
    const losses = editorLosses(value);
    if (losses.length && !force) {
      setPendingLosses(losses);
      return;
    }
    setPendingLosses(null);
    editor?.commands.setContent(prepareForEditor(value), { emitUpdate: false });
    setMode("visual");
  };

  // Nothing to copy across: every edit in the visual editor already reached
  // `value` through onUpdate, and an untouched post keeps its HTML verbatim.
  const toHtml = () => setMode("html");

  const addFaq = () => {
    if (!editor) return;
    const { doc } = editor.state;
    let lastH2 = "";
    doc.forEach((node) => {
      if (node.type.name === "heading" && node.attrs.level === 2) lastH2 = node.textContent;
    });
    const hasFaq = FAQ_HEADING.test(lastH2);
    const end = doc.content.size;
    const label = FAQ_LABEL[locale] ?? FAQ_LABEL.en;
    const nodes = [
      ...(hasFaq ? [] : [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: label }] }]),
      { type: "heading", attrs: { level: 3 } },
      { type: "paragraph" },
    ];
    // Cursor into the new question: past the FAQ heading if one was added.
    const questionPos = end + (hasFaq ? 0 : label.length + 2) + 1;
    editor.chain().insertContentAt(end, nodes).setTextSelection(questionPos).scrollIntoView().focus().run();
  };

  return (
    <div className="rounded-adm-lg border border-adm-line bg-adm-surface shadow-adm-sm">
      {/* Toolbar — sticks under the admin top bar while the post scrolls. */}
      <div className="sticky top-[60px] z-10 rounded-t-adm-lg border-b border-adm-line-2 bg-adm-surface/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
          {mode === "visual" && editor && state ? (
            <>
              <Tool label="Geri al (Ctrl+Z)" icon={Undo2} disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()} />
              <Tool label="Yinele (Ctrl+Y)" icon={Redo2} disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()} />
              <Sep />
              <Tool label="Paragraf" icon={Pilcrow} active={state.block === "p"} onClick={() => editor.chain().focus().setParagraph().run()} />
              <Tool label="Ana başlık (H2)" icon={Heading2} active={state.block === "h2"} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
              <Tool label="Alt başlık (H3)" icon={Heading3} active={state.block === "h3"} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
              <Tool label="Küçük başlık (H4)" icon={Heading4} active={state.block === "h4"} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} />
              <Sep />
              <Tool label="Kalın (Ctrl+B)" icon={Bold} active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()} />
              <Tool label="İtalik (Ctrl+I)" icon={Italic} active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()} />
              <Tool label="Altı çizili (Ctrl+U)" icon={Underline} active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()} />
              <Sep />
              <Tool label="Madde listesi" icon={List} active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()} />
              <Tool label="Numaralı liste" icon={ListOrdered} active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
              <Tool label="Alıntı / not" icon={Quote} active={state.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
              <Tool label="Ayırıcı çizgi" icon={Minus} onClick={() => editor.chain().focus().setHorizontalRule().run()} />
              <Sep />
              <Tool label="Link ekle" icon={Link2} active={state.link} onClick={() => setLinkOpen(true)} />
              {state.link && <Tool label="Linki kaldır" icon={Unlink} onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()} />}
              <Tool label="Görsel ekle" icon={ImagePlus} onClick={() => setImageOpen(true)} />
              <Tool
                label="Tablo ekle"
                icon={Table2}
                active={state.table}
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              />
              <Tool label="SSS sorusu ekle" icon={HelpCircle} onClick={addFaq} text="SSS" />
            </>
          ) : mode === "html" ? (
            <span className="px-2 text-[12.5px] font-medium text-adm-muted">HTML kodu düzenleniyor</span>
          ) : (
            <span className="h-8" />
          )}
          <span className="ms-auto" />
          <button
            type="button"
            onClick={() => (mode === "visual" ? toHtml() : toVisual())}
            aria-pressed={mode === "html"}
            className={cx(
              "inline-flex h-7 items-center gap-1.5 rounded-adm-sm px-2.5 text-[12.5px] font-semibold transition-colors",
              mode === "html" ? "bg-adm-ink text-white" : "text-adm-ink-2 hover:bg-adm-line-2"
            )}
          >
            <Code2 size={14} aria-hidden="true" />
            {mode === "html" ? "Görsel editör" : "HTML"}
          </button>
        </div>

        {/* Context rows: only while the cursor is in a table or on an image. */}
        {mode === "visual" && editor && state?.table && (
          <div className="flex flex-wrap items-center gap-1 border-t border-adm-line-2 px-2 py-1.5 text-[12px]">
            <span className="px-1.5 font-semibold text-adm-muted">Tablo:</span>
            <Ctx icon={Rows3} onClick={() => editor.chain().focus().addRowAfter().run()}>Satır ekle</Ctx>
            <Ctx icon={Columns3} onClick={() => editor.chain().focus().addColumnAfter().run()}>Sütun ekle</Ctx>
            <Ctx onClick={() => editor.chain().focus().deleteRow().run()}>Satırı sil</Ctx>
            <Ctx onClick={() => editor.chain().focus().deleteColumn().run()}>Sütunu sil</Ctx>
            <Ctx onClick={() => editor.chain().focus().toggleHeaderRow().run()}>Başlık satırı</Ctx>
            <Ctx icon={Trash2} danger onClick={() => editor.chain().focus().deleteTable().run()}>Tabloyu sil</Ctx>
          </div>
        )}
        {mode === "visual" && editor && state?.image && (
          <div className="flex flex-wrap items-center gap-2 border-t border-adm-line-2 px-3 py-1.5 text-[12px]">
            <label htmlFor={`${id}-img-alt`} className="font-semibold text-adm-muted">Görsel alt metni:</label>
            <input
              id={`${id}-img-alt`}
              key={state.imagePos}
              defaultValue={state.imageAlt}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              onChange={(e) => editor.commands.updateAttributes("image", { alt: e.target.value })}
              placeholder="Görselde ne var? (Google ve ekran okuyucular için)"
              className="h-7 min-w-0 flex-1 rounded-adm-sm border border-adm-line bg-adm-surface px-2 text-[12.5px] outline-none focus:border-[#c9c8c2]"
            />
            <Ctx icon={Trash2} danger onClick={() => editor.chain().focus().deleteSelection().run()}>Görseli sil</Ctx>
          </div>
        )}
      </div>

      {initialLosses.length > 0 && mode === "html" && (
        <div className="flex gap-2.5 border-b border-adm-amber-line bg-adm-amber-soft px-4 py-3 text-[12.5px] text-adm-amber">
          <AlertTriangle size={16} aria-hidden="true" className="mt-px shrink-0" />
          <div>
            <p className="font-semibold">Bu yazı görsel editörün desteklemediği biçimler içeriyor, bu yüzden HTML modunda açıldı.</p>
            <p className="mt-0.5">Burada düzenlerseniz hiçbir şey kaybolmaz. Görsel editöre geçmek isterseniz sağ üstteki düğmeyi kullanın; neyin kaybolacağını geçmeden önce gösteririz.</p>
          </div>
        </div>
      )}

      <div hidden={mode !== "visual"}>
        <EditorContent editor={editor} />
      </div>
      {mode === "html" && (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          dir="ltr"
          className="min-h-[480px] rounded-none border-0 font-mono text-[12.5px] leading-relaxed shadow-none focus:ring-0"
          placeholder="<h2>Başlık</h2><p>Paragraf…</p>"
        />
      )}

      <LinkDialog open={linkOpen} editor={editor} onClose={() => setLinkOpen(false)} />
      <ImageDialog open={imageOpen} editor={editor} onClose={() => setImageOpen(false)} />

      <Dialog
        open={!!pendingLosses}
        title="Görsel editöre geçilsin mi?"
        subtitle="Görsel editör bu biçimleri tutamaz."
        onClose={() => setPendingLosses(null)}
        footer={
          <>
            <Button onClick={() => setPendingLosses(null)}>HTML&apos;de kal</Button>
            <Button variant="danger" onClick={() => toVisual(true)}>Yine de geç</Button>
          </>
        }
      >
        <p className="text-[13px] text-adm-ink-2">Kaydettiğinizde şunlar silinir (yazılar ve tablolar kalır):</p>
        <ul className="mt-2 grid list-disc gap-1 ps-5 text-[13px] text-adm-ink-2">
          {(pendingLosses ?? []).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-adm-muted">Kaydetmeden çıkarsanız yazı olduğu gibi kalır.</p>
      </Dialog>
    </div>
  );
}

function Tool({
  label,
  icon: Icon,
  active,
  disabled,
  onClick,
  text,
}: {
  label: string;
  icon: typeof Bold;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  text?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cx(
        "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-adm-sm px-1.5 text-[12px] font-semibold transition-colors disabled:opacity-35",
        active ? "bg-adm-ink text-white" : "text-adm-ink-2 hover:bg-adm-line-2"
      )}
    >
      <Icon size={16} aria-hidden="true" />
      {text}
    </button>
  );
}

function Sep() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-adm-line" />;
}

function Ctx({
  icon: Icon,
  danger,
  onClick,
  children,
}: {
  icon?: typeof Bold;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cx(
        "inline-flex h-7 items-center gap-1 rounded-adm-sm px-2 font-medium transition-colors",
        danger ? "text-adm-rose hover:bg-adm-rose-soft" : "text-adm-ink-2 hover:bg-adm-line-2"
      )}
    >
      {Icon && <Icon size={13} aria-hidden="true" />}
      {children}
    </button>
  );
}

/** Enter inside a dialog field must not submit the post form around it. */
const noSubmit = (submit: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === "Enter") {
    e.preventDefault();
    submit();
  }
};

function LinkDialog({ open, editor, onClose }: { open: boolean; editor: Editor | null; onClose: () => void }) {
  if (!open || !editor) return null;
  return <LinkDialogBody editor={editor} onClose={onClose} />;
}

function LinkDialogBody({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const current = editor.getAttributes("link");
  const [href, setHref] = useState<string>(current.href ?? "");
  const [newTab, setNewTab] = useState<boolean>(current.target === "_blank");
  const external = /^https?:\/\//i.test(href) && !/torviantransfer\.com/i.test(href);

  const apply = () => {
    const url = href.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!url) chain.unsetLink().run();
    else chain.setLink({ href: url, target: newTab ? "_blank" : null, rel: newTab ? "noopener" : null }).run();
    onClose();
  };

  return (
    <Dialog
      open
      title="Link"
      subtitle="Önce metni seçin, sonra linki ekleyin."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Vazgeç</Button>
          <Button variant="primary" onClick={apply}>{href.trim() ? "Linki uygula" : "Linki kaldır"}</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field
          label="Adres"
          htmlFor="rich-link-href"
          hint="Site içi sayfalar için yalnızca yolu yazın: /tr/antalya-belek-transfer veya /tr/blog/…"
        >
          <Input id="rich-link-href" autoFocus value={href} onChange={(e) => setHref(e.target.value)} onKeyDown={noSubmit(apply)} placeholder="/tr/antalya-havalimani-transfer" />
        </Field>
        <label className="flex items-center gap-2 text-[13px] text-adm-ink-2">
          <input type="checkbox" checked={newTab} onChange={(e) => setNewTab(e.target.checked)} />
          Yeni sekmede aç
          {external && !newTab && <span className="text-adm-muted">· dış siteler için önerilir</span>}
        </label>
      </div>
    </Dialog>
  );
}

function ImageDialog({ open, editor, onClose }: { open: boolean; editor: Editor | null; onClose: () => void }) {
  if (!open || !editor) return null;
  return <ImageDialogBody editor={editor} onClose={onClose} />;
}

function ImageDialogBody({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const result = await res.json();
      if (!res.ok) setError(result.error || "Yükleme başarısız oldu");
      else setSrc(result.url);
    } catch {
      setError("Yükleme başarısız oldu");
    } finally {
      setUploading(false);
    }
  };

  const insert = () => {
    if (!src.trim()) return;
    editor.chain().focus().setImage({ src: src.trim(), alt: alt.trim() }).run();
    onClose();
  };

  return (
    <Dialog
      open
      title="Görsel ekle"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Vazgeç</Button>
          <Button variant="primary" disabled={!src.trim() || uploading} onClick={insert}>Ekle</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          <Button icon={uploading ? Loader2 : Upload} onClick={() => fileRef.current?.click()} disabled={uploading} className="justify-self-start">
            {uploading ? "Yükleniyor…" : "Bilgisayardan yükle"}
          </Button>
          {error && <p className="text-xs text-adm-rose">{error}</p>}
          <Input value={src} onChange={(e) => setSrc(e.target.value)} onKeyDown={noSubmit(insert)} placeholder="veya görsel adresi yapıştırın" className="text-xs" />
        </div>
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="max-h-44 w-full rounded-adm-sm border border-adm-line object-cover" />
        )}
        <Field label="Alt metni" htmlFor="rich-image-alt" hint="Görselde ne olduğunu yazının dilinde anlatın. Google görseli bununla anlar.">
          <Input id="rich-image-alt" value={alt} onChange={(e) => setAlt(e.target.value)} onKeyDown={noSubmit(insert)} placeholder="ör. Antalya Havalimanı'nda bekleyen Mercedes Vito" />
        </Field>
      </div>
    </Dialog>
  );
}
