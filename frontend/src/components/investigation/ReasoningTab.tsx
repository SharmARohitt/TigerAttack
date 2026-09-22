"use client"
import { AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { VerdictBadge } from "@/components/ui/VerdictBadge"
import { formatProb, routeColor, routeLabel, cn } from "@/lib/utils"
import type { CaseAnswer, ActionRecommendation } from "@/lib/types"

function ActionList({ actions, label }: { actions: ActionRecommendation[]; label: string }) {
  if (!actions?.length) return null
  return (
    <div>
      <div className="font-mono-ui text-[9px] tracking-wider text-[#8B8D96]/60 uppercase mb-2">{label}</div>
      <div className="space-y-1.5">
        {actions.map((a, i) => (
          <div key={i} className="flex items-start gap-2 rounded border border-white/08 bg-[#14151A]/60 px-3 py-2">
            <span className="font-mono-ui text-xs font-semibold text-[#F2F1ED] uppercase tracking-wide flex-1">
              {a.action.replace(/_/g, " ")}
            </span>
            <span className={cn(
              "font-mono-ui text-[8px] px-1.5 py-0.5 rounded border shrink-0",
              routeColor(a.route),
            )}>
              {routeLabel(a.route)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ReasoningTab({ answer }: { answer: CaseAnswer }) {
  const g = answer.grounding
  const reasoning = answer.reasoning
  const llmRuntime = g?.llm_runtime ?? answer.runtime?.llm
  const fallbackActive = reasoning?.fallback === true || g?.llm_fallback_used === true

  const na = answer.next_best_actions
  const changed = na?.what_changed && na.what_changed !== "nothing"

  return (
    <div className="space-y-5 p-4">
      {/* Verdict */}
      <div>
        <div className="font-mono-ui text-[9px] text-[#8B8D96]/60 tracking-wider uppercase mb-2">VERDICT</div>
        <VerdictBadge
          verdict={answer.case.verdict}
          probability={answer.case.fraud_probability}
          pattern={answer.case.pattern}
          large
        />
        <div className="font-mono-ui text-xs text-[#8B8D96] mt-2">
          probability: <span className="text-[#F2F1ED]">{formatProb(answer.case.fraud_probability)}</span>
          {"  ·  "}
          evidence: <span className="text-[#F2F1ED]">{answer.case.evidence.length} items</span>
        </div>
      </div>

      {/* Uncertainty / evidence required */}
      {answer.evidence_requests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-[#D9A441]/40 bg-[#D9A441]/06 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-[#D9A441]" aria-hidden />
            <span className="font-mono-ui text-xs font-semibold text-[#D9A441] tracking-wider">
              EVIDENCE REQUIRED
            </span>
          </div>
          <div className="space-y-2">
            {answer.evidence_requests.map((er, i) => (
              <div key={i} className="rounded border border-white/08 bg-[#14151A]/60 px-3 py-2">
                <div className="font-mono-ui text-[9px] text-[#8B8D96]/70 uppercase tracking-wider mb-0.5">
                  {er.type.replace(/_/g, " ")}
                </div>
                <p className="text-[11px] text-[#F2F1ED]/70 leading-snug">
                  {er.assumed_response || er.reason || "—"}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <ActionList actions={na?.initial ?? []} label="INITIAL RECOMMENDATION" />
      {changed && (
        <div className="rounded border border-[#E8C547]/30 bg-[#E8C547]/06 px-3 py-2">
          <div className="font-mono-ui text-[9px] text-[#E8C547]/70 uppercase tracking-wider mb-0.5">WHAT CHANGED</div>
          <p className="font-mono-ui text-[10px] text-[#E8C547]">{na.what_changed}</p>
        </div>
      )}
      <ActionList actions={na?.final ?? []} label="FINAL RECOMMENDATION" />

      {/* Stop reason */}
      {answer.stop_reason && (
        <div>
          <div className="font-mono-ui text-[9px] text-[#8B8D96]/60 tracking-wider uppercase mb-1">STOP REASON</div>
          <p className="font-mono-ui text-[10px] text-[#8B8D96] leading-relaxed">{answer.stop_reason}</p>
        </div>
      )}

      {/* LLM / reasoning engine status */}
      <div className="rounded border border-white/08 bg-[#0A0A0C]/60 px-3 py-3 space-y-1.5">
        <div className="font-mono-ui text-[9px] text-[#8B8D96]/60 uppercase tracking-wider mb-2">REASONING ENGINE</div>
        <div className={cn(
          "font-mono-ui text-xs font-semibold tracking-wide",
          fallbackActive ? "text-[#E8C547]" : llmRuntime === "AVAILABLE" ? "text-[#3DD68C]" : "text-[#8B8D96]",
        )}>
          {fallbackActive
            ? "DETERMINISTIC FALLBACK ACTIVE"
            : llmRuntime === "AVAILABLE"
              ? "LLM ACTIVE"
                : reasoning?.executed === true ? "LIVE" : llmRuntime ?? "NOT RETURNED"}
        </div>
              {reasoning?.provider && <div className="font-mono-ui text-[9px] text-[var(--cyan)] uppercase">{reasoning.provider}{reasoning.model ? ` / ${reasoning.model}` : ""}</div>}
        {!reasoning?.provider && g?.llm_provider && (
          <div className="font-mono-ui text-[9px] text-[#8B8D96]">
            {g.llm_provider}{g.llm_model ? ` / ${g.llm_model}` : ""}
          </div>
        )}
        {g?.llm_backup_used && (
          <div className="font-mono-ui text-[9px] text-[#E8C547]/70">backup credential used</div>
        )}
        {g?.fabricated_entities != null && g.fabricated_entities > 0 && (
          <div className="font-mono-ui text-[9px] text-[#E5484D]">
            grounding failures: {g.fabricated_entities} fabricated entities detected
          </div>
        )}
      </div>
    </div>
  )
}
