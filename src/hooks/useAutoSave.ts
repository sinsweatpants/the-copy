import { useEffect, useRef, useState } from "react";
import { putScreenplayContent } from "@/api";

export function useAutoSave(editor: any, screenplayId: string, intervalMs = 10000) {
  const lastSentRef = useRef<string>("");
  const [saving, setSaving] = useState<"idle"|"saving"|"offline">("idle");

  async function tick() {
    if (!editor) return;
    const html = editor.getHTML();
    if (html === lastSentRef.current) return;
    if (!navigator.onLine) {
      setSaving("offline");
      localStorage.setItem(`draft:${screenplayId}`, html);
      return;
    }
    setSaving("saving");
    try {
      await putScreenplayContent(screenplayId, html);
      lastSentRef.current = html;
      setSaving("idle");
      localStorage.removeItem(`draft:${screenplayId}`);
    } catch {
      setSaving("offline");
      localStorage.setItem(`draft:${screenplayId}`, html);
    }
  }

  useEffect(()=>{
    const id = window.setInterval(tick, intervalMs);
    const onBeforeUnload = () => {
      try { localStorage.setItem(`draft:${screenplayId}`, editor?.getHTML?.() ?? ""); } catch {}
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return ()=>{ window.clearInterval(id); window.removeEventListener("beforeunload", onBeforeUnload); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, screenplayId, intervalMs]);

  return { savingState: saving };
}