"use client"
import { cn } from "@/lib/utils"
import type { Verdict } from "@/lib/types"

const MAP: Record<Verdict, { label: string; cls: string }> = {
  fraud:      { label: "FRAUD",       cls: "bg-red-950/80 border-red-600/50 text-red-300" },
  legitimate: { label: "LEGITIMATE",  cls: "bg-emerald-950/80 border-emerald-600/50 text-emerald-300" },
  uncertain:  { label: "UNCERTAIN",   cls: "bg-amber-950/80 border-amber-500/50 text-amber-300" },
}

export function VerdictBadge({ verdict, probability, className }: {
  verdict: Verdict
  probability?: number
  className?: string
}) {
  const { label, cls } = MAP[verdict] ?? MAP.uncertain
  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded border text-sm font-mono tracking-widest", cls, className)}>
      {label}
      {probability !== undefined && (
        <span className="opacity-70 text-xs">{(probability * 100).toFixed(0)}%</span>
      )}
    </div>
  )
}
