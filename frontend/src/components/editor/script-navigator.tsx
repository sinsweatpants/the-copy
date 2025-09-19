import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auditWithGemini } from "@/services/GeminiCoordinator";

export default function ScriptNavigator({ getEditorLines, goTo }: { getEditorLines: ()=>string[]; goTo: (lineIndex: number)=>void }) {
  async function buildHierarchy() {
    const lines = getEditorLines();
    // lightweight heuristic: mark scene headers
    const nodes = lines
      .map((t, i)=> ({ t, i }))
      .filter(x=>/^مشهد\s*\d+/u.test(x.t));
    return nodes;
  }

  return (
    <Card className="p-3">
      <Tabs defaultValue="hierarchy">
        <TabsList className="w-full">
          <TabsTrigger value="hierarchy">البنية</TabsTrigger>
          <TabsTrigger value="scenes">المشاهد</TabsTrigger>
          <TabsTrigger value="bookmarks">العلامات</TabsTrigger>
        </TabsList>
        <TabsContent value="hierarchy">
          <button
            className="text-sm underline"
            onClick={async ()=>{
              const nodes = await buildHierarchy();
              alert("عدد رؤوس المشاهد: "+nodes.length);
            }}
          >تحليل سريع</button>
        </TabsContent>
        <TabsContent value="scenes" className="space-y-1 text-sm">
          <div className="text-slate-500">استخدم "تحليل سريع" لعرض المشاهد.</div>
        </TabsContent>
        <TabsContent value="bookmarks">
          <div className="text-slate-500 text-sm">قريبًا.</div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}