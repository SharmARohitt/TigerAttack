"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Lock } from "lucide-react"
import { cn, routeColor, routeLabel } from "@/lib/utils"
import { approveAction, rejectAction } from "@/lib/api"
import type { CaseAnswer, ActionRecommendation } from "@/lib/types"

type Decision = "approved" | "rejected"

function ActionCard({
  rec,
  caseId,
  decisions,
  onDecision,
}: {
  rec: ActionRecommendation
  caseId: string
  decisions: Record<string, Decision>
  onDecision: (action: string, d: Decision) => void
}) {
  const [loading, setLoading] = useState(false)
  const decision = decisions[rec.action]
  const needsApproval = rec.route !== "auto"

  const handle = async (d: Decision) => {
    setLoading(true)
    try {
      if (d === "approved") await approveAction(caseId, rec.action)
      else await rejectAction(caseId, rec.action)
      onDecision(rec.action, d)
    } catch {
      // silent — still record in local state
      onDecision(rec.action, d)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn(
      "rounded-lg border px-3 py-3 space-y-2 transition-all duration-200",
      decision === "approved" ? "border-[#3DD68C]/30 bg-[#3DD68C]/05" :
      decision === "rejected" ? "border-[#E5484D]/20 bg-[#E5484D]/04 opacity-50" :
      needsApproval           ? "border-[#E8C547]/25 bg-[#14151A]/60" :
                                "border-white/08 bg-[#14151A]/60",
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono-ui text-xs font-bold uppercase tracking-wide text-[#F2F1ED]">
              {rec.action.replace(/_/g, " ")}
            </span>
            <span className={cn(
              "font-mono-ui text-[8px] px-1.5 py-0.5 rounded border",
              routeColor(rec.route),
            )}>
              {routeLabel(rec.route)}
            </span>
            {needsApproval && !decision && (
              <span className="flex items-center gap-1 font-mono-ui text-[8px] px-1.5 py-0.5 rounded border border-[#E8C547]/30 bg-[#E8C547]/08 text-[#E8C547]">
                <Lock size={8} aria-hidden /> APPROVAL REQUIRED
              </span>
            )}
          </div>
          <p className="text-[10px] text-[#8B8D96]/70 leading-snug">{rec.reason}</p>
        </div>

        {/* Decision result */}
        {decision && (
          <span className={cn(
            "font-mono-ui text-[9px] uppercase shrink-0",
            decision === "approved" ? "text-[#3DD68C]" : "text-[#E5484D]",
          )}>
            {decision}
          </span>
        )}
      </div>

      {/* Approval buttons for non-auto actions */}
      {needsApproval && !decision && (
        <div className="flex gap-1.5">
          <button
            onClick={() => handle("approved")}
            disabled={loading}
            aria-label={`Approve action ${rec.action}`}
            className="px-3 py-1.5 text-[9px] font-mono-ui uppercase rounded border border-[#3DD68C]/40 text-[#3DD68C]
                       hover:bg-[#3DD68C]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            APPROVE
          </button>
          <button
            onClick={() => handle("rejected")}
            disabled={loading}
            aria-label={`Reject action ${rec.action}`}
            className="px-3 py-1.5 text-[9px] font-mono-ui uppercase rounded border border-[#E5484D]/40 text-[#E5484D]
                       hover:bg-[#E5484D]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            REJECT
          </button>
        </div>
      )}

      {/* Auto actions note */}
      {!needsApproval && !decision && (
        <div className="font-mono-ui text-[8px] text-[#3DD68C]/50">
          Agent may execute automatically
        </div>
      )}
    </div>
  )
}

export function ActionCenter({ answer }: { answer: CaseAnswer }) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>(
    // Pre-populate from backend action_decisions if present
    Object.fromEntries(
      Object.entries(answer.action_decisions ?? {}).map(([k, v]) => [k, v.status as Decision])
    )
  )

  const onDecision = (action: string, d: Decision) =>
    setDecisions(prev => ({ ...prev, [action]: d }))

  const na = answer.next_best_actions
  if (!na) return <div className="p-4 font-mono-ui text-xs text-[#8B8D96]/40">No actions</div>

  const changed = na.what_changed && na.what_changed !== "nothing"

  return (
    <div className="p-4 space-y-5">
      {/* Initial */}
      <div>
        <div className="font-mono-ui text-[9px] tracking-wider text-[#8B8D96]/60 uppercase mb-2">
          INITIAL RECOMMENDATION
        </div>
        <div className="space-y-2">
          {na.initial?.map((rec, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <ActionCard rec={rec} caseId={answer.case_id} decisions={decisions} onDecision={onDecision} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* What changed */}
      {changed && (
        <div className="rounded border border-[#E8C547]/30 bg-[#E8C547]/05 px-3 py-2">
          <div className="font-mono-ui text-[8px] text-[#E8C547]/60 uppercase tracking-wider mb-0.5">WHAT CHANGED</div>
          <p className="font-mono-ui text-[10px] text-[#E8C547]">{na.what_changed}</p>
        </div>
      )}

      {/* Final */}
      <div>
        <div className="font-mono-ui text-[9px] tracking-wider text-[#8B8D96]/60 uppercase mb-2">
          FINAL RECOMMENDATION
        </div>
        <div className="space-y-2">
          {na.final?.map((rec, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <ActionCard rec={rec} caseId={answer.case_id} decisions={decisions} onDecision={onDecision} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
