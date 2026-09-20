"use client"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AuditEntry { step?: number; action?: string; status?: string; timestamp?: string; [key: string]: unknown }

const STATUS_COLORS: Record<string, string> = {
  start:    "border-cyan-800/50 text-cyan-500",
  complete: "border-emerald-800/50 text-emerald-500",
  pass:     "border-emerald-800/50 text-emerald-500",
  fail:     "border-red-800/50 text-red-500",
  approved: "border-emerald-800/50 text-emerald-500",
  rejected: "border-red-800/50 text-red-500",
}

function statusDot(status: string) {
  if (status === "complete" || status === "pass" || status === "approved")
    return "bg-emerald-600"
  if (status === "fail" || status === "rejected")
    return "bg-red-600"
  if (status === "start")
    return "bg-cyan-600"
  return "bg-slate-700"
}

export function AuditTimeline({ entries }: { entries: AuditEntry[] }) {
  if (!entries?.length) return (
    <div className="text-slate-700 text-xs mono text-center py-8">
      NO AUDIT EVENTS
    </div>
  )

  return (
    <div className="space-y-0 relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-800" />

      {entries.map((e, i) => {
        const status = (e.status ?? "").toLowerCase()
        const action = (e.action ?? "UNKNOWN").toUpperCase()
        const cols   = STATUS_COLORS[status] ?? "border-slate-800/50 text-slate-500"
        const extra  = Object.entries(e)
          .filter(([k]) => !["step","action","status","timestamp"].includes(k))
          .map(([k, v]) => `${k}: ${v}`)
          .join(" · ")

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.8) }}
            className="relative flex items-start gap-3 pb-3 pl-9"
          >
            {/* Dot on timeline */}
            <div className={cn("absolute left-3.5 mt-1.5 w-1.5 h-1.5 rounded-full -translate-x-px", statusDot(status))} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {e.timestamp && (
                  <span className="mono text-[8px] text-slate-700 shrink-0">
                    {typeof e.timestamp === "string" ? e.timestamp.slice(11, 22) : String(e.timestamp)}
                  </span>
                )}
                {e.step !== undefined && (
                  <span className="mono text-[8px] text-slate-700">STEP {e.step}</span>
                )}
                <span className={cn("mono text-[9px] font-semibold px-1 rounded border", cols)}>
                  {action}
                </span>
                <span className={cn("mono text-[8px]", cols.split(" ")[1])}>
                  {status.toUpperCase()}
                </span>
              </div>
              {extra && (
                <p className="mono text-[8px] text-slate-600 mt-0.5 leading-relaxed truncate">{extra}</p>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
