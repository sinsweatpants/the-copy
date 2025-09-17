import * as React from "react";
import { cn } from "./utils";
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-white rounded-2xl shadow", className)} {...props} />;
}