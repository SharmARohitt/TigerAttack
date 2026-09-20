"use client"
import { motion } from "framer-motion"
import type { ActionRecommendation } from "@/lib/types"

// Extract policy rule references from reason strings
function extractRules(actions: ActionRecommendation[]): string[] {
  const rulePattern = /R\d+/g
  const found = new Set<string>()
  for (const a of actions) {
    const matches = a.reason.match(rulePattern) ?? []
    for (const m of matches) found.add(m)
  }
  return Array.from(found).sort()
}

const RULE_DESCRIPTIONS: Record<string, string> = {
  R1:  "Verify before blocking on a weak single signal (p < 0.70).",
  R2:  "Customer denies: BLOCK_CARD + CREATE_CASE. FILE_REPORT if exposure > $1,000 or shared device.",
  R3:  "Customer confirms: CLOSE_NO_FRAUD.",
  R4:  "No reply in 24h: MONITOR_CARD + DECLINE. Escalate if exposure > $500.",
  R5:  "Card testing (3+ micro-auths < $5 within 1h then larger): DECLINE + STEP_UP_AUTH.",
  R6:  "Shared origin across cards: CREATE_CASE + FILE_REPORT + MONITOR_CONNECTED_CARDS.",
  R7:  "Disputed but matches recurring pattern: CREATE_CASE + VERIFY + WARN. Do not block.",
  R8:  "Uncertain + exposure > $500 or conflicting evidence: ESCALATE_TO_ANALYST.",
  R9:  "Undocumented coordinated pattern: CREATE_CASE + FILE_REPORT + ESCALATE.",
  R10: "BLOCK_ALL_CARDS only when ≥2 cards confirmed fraud or credentials compromised.",
}

export function PolicyView({ actions, stopReason }: { actions: ActionRecommendation[]; stopReason: string }) {
  const rules = extractRules(actions)

  return (
    <div className="space-y-3">
      <h3 className="mono text-[9px] tracking-[0.3em] text-slate-600">APPLICABLE POLICY</h3>

      {rules.length === 0 && (
        <p className="text-slate-600 text-xs">No specific policy rules identified in actions.</p>
      )}

      {rules.map((rule, i) => (
        <motion.div
          key={rule}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          className="rounded border border-amber-900/30 bg-amber-950/10 p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="mono text-xs text-amber-400 font-semibold">Policy {rule}</span>
            <div className="flex-1 h-px bg-amber-900/20" />
          </div>
          <p className="text-slate-400 text-[10px] leading-relaxed">
            {RULE_DESCRIPTIONS[rule] ?? "Policy rule from Fraud Policy v1.0"}
          </p>
          {/* Which actions cite this rule */}
          <div className="mt-2 flex flex-wrap gap-1">
            {actions
              .filter(a => a.reason.includes(rule))
              .map((a, j) => (
                <span key={j} className="mono text-[8px] px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-600/70 border border-amber-900/30">
                  {a.action.replace(/_/g," ")}
                </span>
              ))}
          </div>
        </motion.div>
      ))}

      {/* Stop reason */}
      {stopReason && (
        <div className="rounded border border-white/5 bg-[#0D1117]/60 p-3 mt-2">
          <div className="mono text-[9px] text-slate-600 mb-1">INVESTIGATION CLOSED BECAUSE</div>
          <p className="text-slate-400 text-[10px] leading-relaxed">{stopReason}</p>
        </div>
      )}
    </div>
  )
}
