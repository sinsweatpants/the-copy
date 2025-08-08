import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Users, History, Bug } from "lucide-react";

type Props = {
  active: "editor" | "characters" | "revisions" | "errors";
  onNavigate: (k: Props["active"]) => void;
  title: string;
  pageCount: number;
};

export default function EditorSidebar({ active, onNavigate, title, pageCount }: Props) {
  const Item = ({ k, icon: Icon, label }: any) => (
    <button
      onClick={() => onNavigate(k)}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-right w-full ${active===k?"bg-slate-200 font-semibold":"hover:bg-slate-100"}`}>
      <Icon className="size-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <Card className="p-4 h-full flex flex-col">
      <div className="mb-4">
        <div className="text-xs text-slate-500">المشروع</div>
        <div className="font-bold">{title}</div>
        <div className="text-xs text-slate-500">صفحات: {pageCount}</div>
      </div>
      <div className="flex-1 space-y-1">
        <Item k="editor" icon={FileText} label="المحرّر" />
        <Item k="characters" icon={Users} label="الشخصيات" />
        <Item k="revisions" icon={History} label="المراجعات" />
        <Item k="errors" icon={Bug} label="فحص الأخطاء" />
      </div>
      <div className="pt-4 border-t">
        <Button variant="secondary" className="w-full">الملف الشخصي</Button>
      </div>
    </Card>
  );
}