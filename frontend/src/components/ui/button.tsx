import * as React from "react";
import { cn } from "./utils";
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default"|"secondary"|"ghost" };
export function Button({ className, variant="default", ...props }: Props) {
  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-slate-100 hover:bg-slate-200",
    ghost: "hover:bg-slate-100"
  } as const;
  return <button className={cn("px-3 py-2 rounded-lg text-sm", variants[variant], className)} {...props}/>;
}
export default Button;