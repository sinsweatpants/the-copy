import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getActiveSprint, startSprint, updateSprint } from "@/api";

export default function SprintTimer() {
  const qc = useQueryClient();
  const { data: active } = useQuery({ queryKey: ["sprint"], queryFn: getActiveSprint });
  const [seconds, setSeconds] = useState(25*60);
  const timerRef = useRef<number|undefined>(undefined);

  const startMut = useMutation({ mutationFn: startSprint, onSuccess: ()=>qc.invalidateQueries({queryKey:["sprint"]}) });
  const endMut = useMutation({ mutationFn: (payload: any)=>updateSprint(active?.id, payload), onSuccess: ()=>qc.invalidateQueries({queryKey:["sprint"]}) });

  useEffect(()=>{
    if (active?.isActive) {
      timerRef.current = window.setInterval(()=>setSeconds(s=>Math.max(0, s-1)), 1000);
      return ()=>clearInterval(timerRef.current);
    }
  }, [active?.isActive]);

  const mm = String(Math.floor(seconds/60)).padStart(2,"0");
  const ss = String(seconds%60).padStart(2,"0");

  return (
    <Card className="p-3 flex items-center justify-between">
      <div className="text-sm">جلسة كتابة</div>
      <div className="text-2xl font-mono">{mm}:{ss}</div>
      <div className="flex gap-2">
        {!active?.isActive
          ? <Button onClick={()=>startMut.mutate()}>بدء 25 دقيقة</Button>
          : <Button variant="secondary" onClick={()=>endMut.mutate({ action:"end", durationSec: (25*60 - seconds) })}>إنهاء</Button>
        }
      </div>
    </Card>
  );
}