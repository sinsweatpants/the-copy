import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addCharacter, getCharacters } from "@/api";

export default function CharacterPanel({ screenplayId, onViewDialogues }:
  { screenplayId: string; onViewDialogues: (id: string, name: string)=>void }) {

  const qc = useQueryClient();
  const { data: characters } = useQuery({ queryKey: ["characters", screenplayId], queryFn: ()=>getCharacters(screenplayId) });

  const addMut = useMutation({
    mutationFn: (name: string)=>addCharacter(screenplayId, { name }),
    onSuccess: ()=>qc.invalidateQueries({ queryKey: ["characters", screenplayId] })
  });

  return (
    <Tabs defaultValue="characters" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="characters">الشخصيات</TabsTrigger>
        <TabsTrigger value="revisions">المراجعات</TabsTrigger>
        <TabsTrigger value="errors">الأخطاء</TabsTrigger>
      </TabsList>

      <TabsContent value="characters" className="space-y-3">
        <div className="flex justify-between">
          <div className="text-sm text-slate-600">إدارة الشخصيات</div>
          <Button onClick={()=>addMut.mutate(prompt("اسم الشخصية؟")||"بدون اسم")}>إضافة شخصية</Button>
        </div>
        <div className="grid gap-3">
          {(characters ?? []).map((c: any)=>(
            <Card key={c.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.role || "—"}</div>
                </div>
                <div className="w-1/2">
                  <Progress value={Math.random()*100} />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={()=>onViewDialogues(c.id, c.name)}>عرض الحوارات</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="revisions">
        <Card className="p-3 text-sm text-slate-600">قريبًا: سجل المراجعات.</Card>
      </TabsContent>

      <TabsContent value="errors">
        <Card className="p-3 text-sm text-slate-600">شغّل المدقق من لوحة "فحص الأخطاء".</Card>
      </TabsContent>
    </Tabs>
  );
}