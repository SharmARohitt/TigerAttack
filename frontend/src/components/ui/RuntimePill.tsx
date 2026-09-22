"use client"
import { cn, runtimeColor, runtimeDot } from "@/lib/utils"
import type { RuntimeValue } from "@/lib/types"

interface Props {
  label: string
  value: RuntimeValue | string | null | undefined
  className?: string
}

export function RuntimePill({ label, value, className }: Props) {
  const v = value ?? "UNKNOWN"
  const isOnline = ["CONNECTED","AVAILABLE"].includes(v)
  const isOff    = ["DEGRADED","FAILED","NOT_AVAILABLE"].includes(v)

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded border font-mono-ui text-[10px] tracking-wider",
      isOnline ? "border-[#3DD68C]/25 bg-[#3DD68C]/06" :
      isOff    ? "border-[#E5484D]/25 bg-[#E5484D]/06" :
                 "border-white/08 bg-white/03",
      className,
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", runtimeDot(v), isOnline && "animate-pulse")} />
      <span className="text-[#8B8D96]">{label}:</span>
      <span className={runtimeColor(v)}>{v}</span>
    </div>
  )
}
