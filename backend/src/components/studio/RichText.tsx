"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

/** Tiptap rich text: headings, emphasis, lists, quotes and links. The server sanitises what's saved. */
export function RichText({ value, onChange, id, label }: { value: string; onChange: (html: string) => void; id: string; label: string }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, codeBlock: false, code: false, link: { openOnClick: false, autolink: true } })],
    content: value || "<p></p>",
    immediatelyRender: false,
    editorProps: { attributes: { class: "rich-edit min-h-36 px-3 py-2", id, "aria-label": label, role: "textbox", "aria-multiline": "true" } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Content replaced from outside (restoring a version, switching sections).
  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML()) editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
  }, [value, editor]);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? { b: e.isActive("bold"), i: e.isActive("italic"), h2: e.isActive("heading", { level: 2 }), h3: e.isActive("heading", { level: 3 }), ul: e.isActive("bulletList"), ol: e.isActive("orderedList"), q: e.isActive("blockquote"), a: e.isActive("link") }
        : null,
  });

  if (!editor) return <div className="field min-h-36" />;
  const B = ({ on, label, run, children }: { on?: boolean; label: string; run: () => void; children: React.ReactNode }) => (
    <button type="button" aria-label={label} aria-pressed={on} title={label} onMouseDown={(e) => e.preventDefault()} onClick={run} className={`grid h-7 min-w-7 place-items-center rounded px-1.5 text-xs ${on ? "bg-midnight text-pearl" : "hover:bg-ink/10"}`}>
      {children}
    </button>
  );
  const c = () => editor.chain().focus();

  return (
    <div className="rounded-md border border-ink/15 bg-white focus-within:border-gold">
      <div className="flex flex-wrap gap-0.5 border-b border-ink/10 p-1" role="toolbar" aria-label={`${label} formatting`}>
        <B label="Bold" on={state?.b} run={() => c().toggleBold().run()}>
          <b>B</b>
        </B>
        <B label="Italic" on={state?.i} run={() => c().toggleItalic().run()}>
          <i>I</i>
        </B>
        <B label="Heading" on={state?.h2} run={() => c().toggleHeading({ level: 2 }).run()}>
          H2
        </B>
        <B label="Subheading" on={state?.h3} run={() => c().toggleHeading({ level: 3 }).run()}>
          H3
        </B>
        <B label="Bulleted list" on={state?.ul} run={() => c().toggleBulletList().run()}>
          • List
        </B>
        <B label="Numbered list" on={state?.ol} run={() => c().toggleOrderedList().run()}>
          1. List
        </B>
        <B label="Quote" on={state?.q} run={() => c().toggleBlockquote().run()}>
          “ ”
        </B>
        <B
          label="Link"
          on={state?.a}
          run={() => {
            const prev = editor.getAttributes("link").href as string | undefined;
            const url = window.prompt("Link address (leave empty to remove)", prev ?? "https://");
            if (url === null) return;
            if (!url) c().unsetLink().run();
            else c().extendMarkRange("link").setLink({ href: url }).run();
          }}
        >
          Link
        </B>
        <B label="Divider" run={() => c().setHorizontalRule().run()}>
          ―
        </B>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
