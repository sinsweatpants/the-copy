import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDialogues, updateDialogue } from "@/api";
import { useMemo } from "react";

export default function DialogueModal({ open, onOpenChange, characterId, characterName }:
  { open: boolean; onOpenChange: (v: boolean)=>void; characterId: string|null; characterName: string; }) {

  const qc = useQueryClient();
  const { data: dialogues=[] } = useQuery({
    enabled: !!characterId, queryKey: ["dialogues", characterId], queryFn: ()=>getDialogues(characterId!)
  });

  const mut = useMutation({
    mutationFn: ({ id, text }: any)=>updateDialogue(id, text),
    onSuccess: ()=>qc.invalidateQueries({ queryKey: ["dialogues", characterId!] })
  });

  const counts = useMemo(()=>{
    const words = dialogues.reduce((acc: number, d: any)=> acc + (d.text?.trim().split(/\s+/).filter(Boolean).length || 0), 0);
    return { lines: dialogues.length, words };
  }, [dialogues]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>حوارات: {characterName}</DialogTitle>
        </DialogHeader>

        <div className="text-xs text-slate-500 mb-2">إجمالي الأسطر: {counts.lines} · عدد الكلمات: {counts.words}</div>

        <div className="space-y-3 max-h-[60vh] overflow-auto">
          {dialogues.map((d: any)=>(
            <div key={d.id} className="border rounded p-2">
              <div className="text-[11px] text-slate-500 mb-1">المشهد: {d.sceneNumber||"—"} · الصفحة: {d.page||"—"}</div>
              <div
                contentEditable
                suppressContentEditableWarning
                className="p-2 rounded bg-slate-50 focus:outline focus:outline-2"
                onBlur={(e)=>mut.mutate({ id: d.id, text: e.currentTarget.innerText })}
              >{d.text}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={()=>onOpenChange(false)}>إغلاق</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}