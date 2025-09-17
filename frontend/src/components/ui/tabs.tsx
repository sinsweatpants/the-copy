import * as React from "react";
import { cn } from "./utils";

export function Tabs({ children, className, defaultValue }: any) {
  const [value, setValue] = React.useState(defaultValue);
  return <div className={className} data-value={value}>{React.Children.map(children, (ch: any)=>React.cloneElement(ch, { value, setValue }))}</div>;
}
export function TabsList({ children, className, value, setValue }: any) {
  return <div className={cn("flex gap-2 bg-slate-100 rounded-lg p-1", className)}>{React.Children.map(children, (ch: any)=>React.cloneElement(ch, { value, setValue }))}</div>;
}
export function TabsTrigger({ children, value: myValue, value, setValue }: any) {
  const active = value === myValue;
  return <button onClick={()=>setValue(myValue)} className={cn("px-3 py-1 rounded-md text-sm", active?"bg-white shadow font-semibold":"text-slate-600")}>{children}</button>;
}
export function TabsContent({ children, value: myValue, value }: any) {
  return value===myValue ? <div className="mt-2">{children}</div> : null;
}