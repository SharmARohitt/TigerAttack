"use client"
import { cn } from "@/lib/utils"

interface Props {
  connected: boolean
  label: string
  className?: string
}

export function StatusBadge({ connected, label, className }: Props) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono tracking-wider",
      connected
        ? "bg-emerald-950/60 border border-emerald-700/40 text-emerald-400"
        : "bg-red-950/60 border border-red-700/40 text-red-400",
      className
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full blink",
        connected ? "bg-emerald-400" : "bg-red-400"
      )} />
      {label}
    </div>
  )
}
