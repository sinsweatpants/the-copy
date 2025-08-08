export function Progress({ value=0 }: { value?: number }) {
  return (
    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
      <div className="h-full bg-slate-800" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}