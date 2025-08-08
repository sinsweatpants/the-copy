import * as React from "react";
import { cn } from "./utils";
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("border rounded-lg px-3 py-2 text-sm w-full focus:outline focus:outline-2", className)} {...props} />;
}