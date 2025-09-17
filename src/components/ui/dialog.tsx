import * as React from "react";
import { cn } from "./utils";

export function Dialog({ open, onOpenChange, children }: any) {
  React.useEffect(()=>{
    function onKey(e: KeyboardEvent){ if (e.key==="Escape") onOpenChange(false); }
    if (open) document.addEventListener("keydown", onKey);
    return ()=>document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);
  return open ? <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/30" onClick={()=>onOpenChange(false)} />
    {children}
  </div> : null;
}

export function DialogContent({ children, className }: any) {
  return <div className={cn("relative z-50 bg-white rounded-2xl shadow-xl p-4 w-[90vw] max-w-lg", className)}>{children}</div>;
}
export function DialogHeader({ children }: any) { return <div className="mb-2">{children}</div>; }
export function DialogTitle({ children }: any) { return <div className="text-lg font-bold">{children}</div>; }