"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import type { ActionRecommendation, ApprovalRoute } from "@/lib/types"
import { routeLabel } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { approveAction, rejectAction } from "@/lib/api"

const ROUTE_COLORS: Record<ApprovalRoute, string> = {
  auto: "border-emerald-700/50 text-emerald-400 bg-emerald-950/30",
  L1:   "border-amber-700/50  text-amber-400  bg-amber-950/30",
  L2:   "border-red-700/50    text-red-400    bg-red-950/30",
}

const ACTION_SEVERITY: Record<string, "critical" | "warn" | "safe"> = {
  BLOCK_CARD: "critical", BLOCK_ALL_CARDS: "critical", FILE_REPORT: "critical",
  DECLINE_TRANSACTION: "warn", ESCALATE_TO_ANALYST: "warn", STEP_UP_AUTH: "warn",
  CREATE_CASE: "warn", MONITOR_CARD: "safe", MONITOR_CONNECTED_CARDS: "safe",
  ALLOW_TRANSACTION: "safe", CLOSE_NO_FRAUD: "safe", VERIFY_WITH_CUSTOMER: "safe",
  WARN_CUSTOMER: "safe", GENERATE_REPORT: "safe",
}

export function ActionCenter({
  actions, caseId, label = "RECOMMENDED ACTIONS"
}: {
  actions: ActionRecommendation[]
  caseId: string
  label?: string
}) {
  const [decisions, setDecisions] = useState<Record<string, "approved"|"rejected">>({})
  const [loading, setLoading]     = useState<string | null>(null)

  const handleDecision = async (action: string, decision: "approved"|"rejected") => {
    setLoading(action)
    try {
      if (decision === "approved") await approveAction(caseId, action)
      else                         await rejectAction(caseId, action)
      setDecisions(prev => ({ ...prev, [action]: decision }))
    } catch {
      // silently record failure
    } finally {
      setLoading(null)
    }
  }

  if (!actions.length) return null

  return (
    <div className="space-y-2">
      <h3 className="mono text-[9px] tracking-[0.3em] text-slate-600 mb-2">{label}</h3>
      {actions.map((a, i) => {
        const sev   = ACTION_SEVERITY[a.action] ?? "safe"
        const dec   = decisions[a.action]
        const isAuto = a.route === "auto"
        return (
          <motion.div
            key={`${a.action}-${i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={cn(
              "rounded border p-3 glass",
              dec === "approved" ? "border-emerald-700/40 bg-emerald-950/20" :
              dec === "rejected" ? "border-red-900/40 bg-red-950/10 opacity-50" :
              sev === "critical" ? "border-red-800/40" :
              sev === "warn"     ? "border-amber-800/40" :
                                   "border-white/5"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "mono text-xs font-semibold tracking-wide",
                    sev === "critical" ? "text-red-400" :
                    sev === "warn"     ? "text-amber-400" :
                                         "text-emerald-400"
                  )}>
                    {a.action.replace(/_/g, " ")}
                  </span>
                  <span className={cn(
                    "mono text-[9px] px-1.5 py-0.5 rounded border",
                    ROUTE_COLORS[a.route]
                  )}>
                    {a.route === "auto" ? "AUTO" : routeLabel(a.route)}
                  </span>
                </div>
                <p className="text-slate-500 text-[10px] leading-relaxed">{a.reason}</p>
              </div>

              {/* Approval buttons for non-auto actions */}
              {!isAuto && !dec && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleDecision(a.action, "approved")}
                    disabled={loading === a.action}
                    className="px-2 py-1 text-[9px] mono rounded border border-emerald-700/50 text-emerald-400
                               hover:bg-emerald-950/40 transition-colors disabled:opacity-40"
                  >
                    APPROVE
                  </button>
                  <button
                    onClick={() => handleDecision(a.action, "rejected")}
                    disabled={loading === a.action}
                    className="px-2 py-1 text-[9px] mono rounded border border-red-800/50 text-red-400
                               hover:bg-red-950/40 transition-colors disabled:opacity-40"
                  >
                    REJECT
                  </button>
                </div>
              )}

              {/* Decision result */}
              {dec && (
                <span className={cn("mono text-[9px] shrink-0",
                  dec === "approved" ? "text-emerald-500" : "text-red-500")}>
                  {dec.toUpperCase()}
                </span>
              )}
              {isAuto && !dec && (
                <span className="mono text-[9px] text-emerald-700 shrink-0">AGENT CAN ACT</span>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
