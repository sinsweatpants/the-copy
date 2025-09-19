import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function DialogueTuner() {
  return (
    <Card className="p-3 space-y-3">
      <div className="font-bold">مضبط الحوارات (نسخة أولية)</div>
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="ابحث عن شخصية…" />
        <Input placeholder="تصفية حسب المشهد…" />
      </div>
      <div className="text-sm text-slate-500">قريبًا: تحليلات بالذكاء الاصطناعي وتحويل نص إلى كلام.</div>
    </Card>
  );
}