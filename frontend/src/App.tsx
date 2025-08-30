import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Editor from "@/components/editor/Editor";
import EditorSidebar from "@/components/editor-sidebar";
import CharacterPanel from "@/components/character-panel";
import DialogueModal from "@/components/dialogue-modal";
import ErrorChecker from "@/components/error-checker";
import ScriptNavigator from "@/components/script-navigator";
import SprintTimer from "@/components/sprint-timer";
import StashPanel from "@/components/stash-panel";
import DialogueTuner from "@/components/dialogue-tuner";
import { useMemo, useRef, useState } from "react";

const qc = new QueryClient();

export default function App() {
  const [active, setActive] = useState<"editor"|"characters"|"revisions"|"errors">("editor");
  const [dlgOpen, setDlgOpen] = useState(false);
  const [dlgChar, setDlgChar] = useState<{id: string|null; name: string}>({ id: null, name: "" });
  
  // Determine screenplay ID from the current URL or routing state
  const [screenplayId] = useState(() =>
    new URLSearchParams(window.location.search).get("screenplayId") ?? ""
  );

  // Minimal "line accessors" for panels (using DOM snapshot)
  const editorRef = useRef<HTMLDivElement>(null);
  function getLines(): { text: string; format: string }[] {
    const root = document.querySelector(".screenplay-page");
    if (!root) return [];
    return Array.from(root.children).map(el=>({
      text: (el as HTMLElement).innerText,
      format: Array.from(el.classList).find(c=>["action","dialogue","character","parenthetical","transition","scene-header-line1","scene-header-location","basmala"].includes(c)) ?? "action"
    }));
  }
  function goTo(index: number) {
    const root = document.querySelector(".screenplay-page");
    const el = root?.children?.[index] as HTMLElement|undefined;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function applyFix(index: number, to: string) {
    const root = document.querySelector(".screenplay-page");
    const el = root?.children?.[index] as HTMLElement|undefined;
    if (!el) return;
    el.className = to === "dialogue" ? "dialogue" : to === "character" ? "dialogue character" :
                   to === "parenthetical" ? "dialogue parenthetical" : to;
  }

  return (
    <QueryClientProvider client={qc}>
      <div role="main" className="container mx-auto py-6 grid grid-cols-[280px_1fr] gap-4">
        <EditorSidebar active={active} onNavigate={setActive} title="مشروعي الأول" pageCount={1} />
        <div className="space-y-4">
          <SprintTimer />
          {active==="editor" && (
            <>
              <div className="grid grid-cols-[1fr_320px] gap-4 items-start">
                <Editor screenplayId={screenplayId} title="مشروعي الأول" />
                <div className="space-y-3">
                  <ScriptNavigator getEditorLines={()=>getLines().map(l=>l.text)} goTo={goTo} />
                  <StashPanel />
                </div>
              </div>
              <DialogueTuner />
            </>
          )}

          {active==="characters" && (
            <>
              <CharacterPanel screenplayId={screenplayId} onViewDialogues={(id, name)=>{
                setDlgChar({ id, name }); setDlgOpen(true);
              }} />
              <DialogueModal open={dlgOpen} onOpenChange={setDlgOpen} characterId={dlgChar.id} characterName={dlgChar.name} />
            </>
          )}

          {active==="errors" && (
            <ErrorChecker getLines={getLines} applyFix={applyFix}/>
          )}

          {active==="revisions" && (
            <div className="text-center text-slate-500 p-8">
              قريبًا: سجل المراجعات والنسخ المختلفة
            </div>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
}