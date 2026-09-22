"use client"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { AuditEntry } from "@/lib/types"

const STATUS_DOT: Record<string, string> = {
  complete:  "bg-[#3DD68C]",
  pass:      "bg-[#3DD68C]",
  approved:  "bg-[#3DD68C]",
  start:     "bg-[#4FD1E8]",
  pending:   "bg-[#E8C547]",
  failed:    "bg-[#E5484D]",
  rejected:  "bg-[#E5484D]",
  simulated: "bg-[#E8C547]",
  requested: "bg-[#D9A441]",
}

const STATUS_TEXT: Record<string, string> = {
  complete:  "text-[#3DD68C]",
  pass:      "text-[#3DD68C]",
  approved:  "text-[#3DD68C]",
  start:     "text-[#4FD1E8]",
  pending:   "text-[#E8C547]",
  failed:    "text-[#E5484D]",
  rejected:  "text-[#E5484D]",
  simulated: "text-[#E8C547]",
  requested: "text-[#D9A441]",
}

function dotColor(status: string | undefined): string {
  if (!status) return "bg-[#8B8D96]"
  return STATUS_DOT[status.toLowerCase()] ?? "bg-[#8B8D96]"
}

function textColor(status: string | undefined): string {
  if (!status) return "text-[#8B8D96]"
  return STATUS_TEXT[status.toLowerCase()] ?? "text-[#8B8D96]"
}

export function AuditTab({ entries }: { entries: AuditEntry[] }) {
  if (!entries?.length) {
    return (
      <div className="flex items-center justify-center h-32 font-mono-ui text-xs text-[#8B8D96]/40 p-4">
        No audit events
      </div>
    )
  }

  // Sort by step, then preserve original order for ties
  const sorted = [...entries].sort((a, b) => (a.step ?? 999) - (b.step ?? 999))
  const firstTs = sorted.find(e => e.timestamp)?.timestamp

  return (
    <div className="relative p-4">
      {/* Vertical timeline line */}
      <div className="absolute left-6 top-4 bottom-4 w-px bg-white/06" aria-hidden />

      <div className="space-y-0">
        {sorted.map((e, i) => {
          const status = String(e.status ?? "").toLowerCase()
          const action = String(e.action ?? "UNKNOWN").toUpperCase()
          const ts     = e.timestamp as string | undefined
          // Extra fields beyond the core four
          const extra = Object.entries(e).filter(
            ([k]) => !["step","action","status","timestamp"].includes(k)
          )

          // Relative timestamp
          let relTs = ""
          if (ts && firstTs) {
            try {
              const diff = new Date(ts).getTime() - new Date(firstTs).getTime()
              const m  = Math.floor(diff / 60000)
              const s  = Math.floor((diff % 60000) / 1000)
              const ms = diff % 1000
              relTs = `+${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}.${ms.toString().padStart(3,"0")}`
            } catch {
              relTs = ts.slice(11, 22)
            }
          } else if (ts) {
            relTs = ts.slice(11, 22)
          }

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.6) }}
              className="relative flex items-start gap-3 pb-3 pl-9"
            >
              {/* Dot on timeline */}
              <div className={cn(
                "absolute left-[19px] mt-1.5 w-2 h-2 rounded-full -translate-x-0.5 shrink-0",
                dotColor(status),
              )} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {relTs && (
                    <span className="font-mono-ui text-[8px] text-[#8B8D96]/40 shrink-0 tabular-nums">
                      {relTs}
                    </span>
                  )}
                  {e.step != null && (
                    <span className="font-mono-ui text-[8px] text-[#8B8D96]/40">
                      STEP {e.step}
                    </span>
                  )}
                  <span className={cn("font-mono-ui text-[10px] font-semibold uppercase tracking-wide", textColor(status))}>
                    {action}
                  </span>
                  {status && (
                    <span className={cn("font-mono-ui text-[8px] uppercase", textColor(status))}>
                      {status}
                    </span>
                  )}
                </div>

                {/* Extra fields */}
                {extra.length > 0 && (
                  <div className="mt-0.5 space-y-px">
                    {extra.slice(0, 4).map(([k, v]) => (
                      <span key={k} className="font-mono-ui text-[8px] text-[#8B8D96]/40 block truncate">
                        {k}: {typeof v === "object" ? JSON.stringify(v).slice(0, 60) : String(v).slice(0, 80)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
