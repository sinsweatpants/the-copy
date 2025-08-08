import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStash, addStash, deleteStash } from "@/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StashPanel() {
  const qc = useQueryClient();
  const { data: items=[] } = useQuery({ queryKey: ["stash"], queryFn: getStash });

  const add = useMutation({
    mutationFn: (text: string)=>addStash(text),
    onSuccess: ()=>qc.invalidateQueries({ queryKey: ["stash"] })
  });

  const del = useMutation({
    mutationFn: (id: string)=>deleteStash(id),
    onSuccess: ()=>qc.invalidateQueries({ queryKey: ["stash"] })
  });

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <div className="font-bold">المخزن المؤقت</div>
        <Button onClick={()=>{
          const t = prompt("أدخل النص لحفظه كملاحظة قصيرة:");
          if (t) add.mutate(t);
        }}>إضافة</Button>
      </div>
      <div className="grid gap-2 mt-2 max-h-[25vh] overflow-auto">
        {items.map((it: any)=>(
          <div key={it.id} className="border rounded p-2">
            <div className="text-xs text-slate-500">{it.type} · {it.wordCount} كلمة</div>
            <div className="text-sm">{it.text}</div>
            <div className="text-right"><Button variant="secondary" onClick={()=>del.mutate(it.id)}>حذف</Button></div>
          </div>
        ))}
        {!items.length && <div className="text-sm text-slate-500">لا عناصر بعد.</div>}
      </div>
    </Card>
  );
}