import { useCallback } from "react";
import DOMPurify from "dompurify";
import { ScreenplayClassifier } from "@/services/ScreenplayClassifier";
import type { ScreenplayFormatId } from "@/types/screenplay";

/**
 * Intercepts paste, classifies lines with look-ahead, builds DOM fragment HTML for Tiptap.
 */
export function usePasteHandler(editor: any) {
  const classifier = new ScreenplayClassifier();

  return useCallback(async (e: React.ClipboardEvent) => {
    if (!editor) return;
    e.preventDefault();

    const raw = e.clipboardData.getData("text/plain") ?? "";
    const safe = DOMPurify.sanitize(raw);
    const lines = safe.replace(/\r\n/g, "\n").split("\n");

    // 1) Look-ahead classification
    const classified: Array<{ line: string; format: ScreenplayFormatId }> = [];
    let prev: ScreenplayFormatId | null = null;
    for (let i = 0; i < lines.length; i++) {
      const fmt = classifier.classifyLine(lines[i], prev);
      classified.push({ line: lines[i], format: fmt });
      prev = fmt;
    }

    // 2) Build DocumentFragment (via an offscreen container)
    const container = document.createElement("div");
    container.setAttribute("dir", "rtl");
    container.className = "screenplay-page";

    for (let i = 0; i < classified.length; i++) {
      const { line, format } = classified[i];
      if (!line.trim()) continue;

      if (format === "scene-header-1") {
        const parsed = classifier.parseSceneHeaderLine(line);
        const wrap = document.createElement("div");
        wrap.className = "scene-header-line1";
        const s1 = document.createElement("span");
        const s2 = document.createElement("span");
        s1.textContent = parsed?.sceneNumber ?? "";
        s2.textContent = parsed?.sceneInfo ?? "";
        wrap.appendChild(s1);
        wrap.appendChild(s2);
        container.appendChild(wrap);

        // look-ahead for location
        const next = classified[i + 1];
        if (next && next.format === "scene-header-location") {
          const loc = document.createElement("div");
          loc.className = "scene-header-location";
          loc.textContent = next.line.trim();
          container.appendChild(loc);
          i++; // skip next
        }
        continue;
      }

      const div = document.createElement("div");
      switch (format) {
        case "action":
          div.className = "action";
          break;
        case "character":
          div.className = "dialogue character";
          break;
        case "parenthetical":
          div.className = "dialogue parenthetical";
          break;
        case "dialogue":
          div.className = "dialogue";
          break;
        case "transition":
          div.className = "transition";
          break;
        case "basmala":
          div.className = "basmala";
          break;
        default:
          div.className = "action";
      }
      div.textContent = line.trim();
      container.appendChild(div);
    }

    // 3) Insert into Tiptap
    editor.chain().focus().insertContent(container.innerHTML).run();
  }, [editor]);
}