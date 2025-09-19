import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auditWithGemini } from "@/services/GeminiCoordinator";
import { useState } from "react";

type Issue = { lineIndex: number; correctFormat: string; type: "Format"|"Consistency"; severity: "Error"|"Warning"; description: string };

export default function ErrorChecker({ getLines, applyFix }:
  { getLines: ()=>{ text: string; format: string }[]; applyFix: (index: number, to: string)=>void }) {

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);

  async function runAudit() {
    setLoading(true);
    const lines = getLines().map((x, idx)=>({ text: x.text, format: x.format, index: idx }));
    const corrections = await auditWithGemini(lines);
    const mapped: Issue[] = corrections.map(c=>({
      lineIndex: c.lineIndex,
      correctFormat: c.correctFormat,
      type: "Format",
      severity: "Warning",
      description: `تعديل التصنيف إلى ${c.correctFormat}`
    }));
    setIssues(mapped);
    setLoading(false);
  }

  return (
    <Card className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-bold">المدقق الذكي</div>
        <Button onClick={runAudit} disabled={loading}>{loading?"جارٍ الفحص…":"تشغيل الفحص"}</Button>
      </div>
      <div className="text-xs text-slate-500">يعرض المشكلات حسب النوع والشدة ويتيح الإصلاح التلقائي.</div>

      <div className="space-y-2">
        {issues.map((it, i)=>(
          <div key={i} className="flex items-center justify-between border rounded p-2">
            <div className="text-sm">
              سطر #{it.lineIndex+1}: {it.description}
            </div>
            <Button variant="secondary" onClick={()=>applyFix(it.lineIndex, it.correctFormat)}>إصلاح</Button>
          </div>
        ))}
        {!issues.length && <div className="text-sm text-slate-500">لا توجد نتائج بعد.</div>}
      </div>
    </Card>
  );
}