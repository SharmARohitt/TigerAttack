"use client"
import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react"
import { cn, verdictBg, verdictColor, formatProb, patternLabel } from "@/lib/utils"
import type { Verdict, FraudPattern } from "@/lib/types"

interface Props {
  verdict: Verdict | string | null | undefined
  probability?: number | null
  pattern?: FraudPattern | string | null
  large?: boolean
  className?: string
}

const ICONS = {
  fraud:      ShieldAlert,
  legitimate: ShieldCheck,
  uncertain:  ShieldQuestion,
}

export function VerdictBadge({ verdict, probability, pattern, large, className }: Props) {
  const v   = (verdict ?? "uncertain") as Verdict
  const Icon = ICONS[v] ?? ShieldQuestion
  const labelMap: Record<string, string> = {
    fraud:      "FRAUD",
    legitimate: "LEGITIMATE",
    uncertain:  "UNCERTAIN",
  }
  const label = labelMap[v] ?? String(verdict ?? "UNKNOWN").toUpperCase()

  return (
    <div className={cn(
      "inline-flex flex-col items-center gap-1 rounded-lg border px-4 py-3",
      verdictBg(v),
      large && "px-6 py-4",
      className,
    )}>
      <div className={cn("flex items-center gap-2", verdictColor(v))}>
        <Icon size={large ? 22 : 16} strokeWidth={2} aria-hidden />
        <span className={cn(
          "font-mono-ui font-bold tracking-widest",
          large ? "text-lg" : "text-sm",
        )}>
          {label}
        </span>
      </div>
      {probability != null && (
        <span className="font-mono-ui text-xs opacity-70">
          {formatProb(probability)} confidence
        </span>
      )}
      {pattern != null && (
        <span className="font-mono-ui text-[10px] uppercase tracking-wider opacity-50">
          {patternLabel(pattern)}
        </span>
      )}
    </div>
  )
}
