import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { usePasteHandler } from "@/hooks/usePasteHandler";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useQuery } from "@tanstack/react-query";
import { exportPdf, getScreenplayContent } from "@/api";
import { Button } from "@/components/ui/button";

export default function Editor({ screenplayId, title }:
  { screenplayId: string; title: string }) {

  const editor = useEditor({
    extensions: [
      StarterKit.configure({}),
      Placeholder.configure({ placeholder: "ابدأ الكتابة هنا… (اللصق الذكي مفعل)" })
    ],
    editorProps: {
      attributes: { class: "min-h-[70vh] bg-white shadow rounded-2xl p-6 screenplay-page outline-none" }
    },
    content: ""
  });

  // Load persisted content once
  useQuery({
    queryKey: ["sp-content", screenplayId],
    queryFn: ()=>getScreenplayContent(screenplayId),
    enabled: !!editor,
    onSuccess: (d)=> {
      const local = localStorage.getItem(`draft:${screenplayId}`);
      const html = local && local.length > (d.html?.length ?? 0) ? local : (d.html ?? "");
      if (html) editor?.commands.setContent(html);
    }
  });

  const { savingState } = useAutoSave(editor, screenplayId, 10000);
  const onPaste = usePasteHandler(editor);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          حالة الحفظ: {savingState==="saving" ? "جاري الحفظ…" : savingState==="offline" ? "غير متصل — حفظ محلي" : "محفوظ"}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={()=>{
            const html = editor?.getHTML?.() ?? "";
            exportPdf(html, title || "screenplay");
          }}>تصدير PDF</Button>
        </div>
      </div>
      <EditorContent editor={editor} onPaste={onPaste} />
    </div>
  );
}