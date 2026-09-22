"use client"

import { ArrowDown, ArrowUp, Minus, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react"
import { motion } from "framer-motion"
import { cn, formatProb, formatUSD, patternLabel, verdictColor } from "@/lib/utils"
import type { CaseAnswer } from "@/lib/types"

export function AssessmentPanel({ answer }: { answer: CaseAnswer }) {
  const c = answer.case
  const initial = answer.initial_assessment ?? {}
  const latest = answer.reassessment_history?.at(-1)
  const initialRisk = numberValue(initial, "fraud_probability") ?? numberValue(initial, "risk_after") ?? latest?.risk_before
  const finalRisk = latest?.risk_after ?? c.fraud_probability
  const delta = initialRisk != null ? finalRisk - initialRisk : null
  const evidenceCount = answer.evidence_summary?.item_count ?? c.evidence.length
  const signalCount = answer.evidence_summary?.independent_signal_count
  const Icon = c.verdict === "fraud" ? ShieldAlert : c.verdict === "legitimate" ? ShieldCheck : ShieldQuestion

  return (
    <section className="border-b hairline bg-[var(--surface)]/80 px-4 py-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="eyebrow text-[var(--quiet)] mb-2">Investigation assessment</div>
          <div className="flex items-center gap-2">
            <Icon size={16} className={verdictColor(c.verdict)} aria-hidden />
            <span className={cn("font-semibold tracking-[.16em] text-sm uppercase", verdictColor(c.verdict))}>{c.verdict}</span>
            <span className="forensic text-[10px] text-white/40">{formatProb(c.fraud_probability)}</span>
          </div>
        </div>
        <div className="flex items-end gap-5">
          <Value label="PATTERN" value={patternLabel(c.pattern)} />
          <Value label="EXPOSURE" value={formatUSD(c.exposure_usd)} accent />
          <Value label="EVIDENCE" value={`${evidenceCount} items${signalCount != null && signalCount !== evidenceCount ? ` // ${signalCount} signals` : ""}`} />
        </div>
      </div>

      {answer.reassessment_history && answer.reassessment_history.length > 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 border-t hairline pt-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="eyebrow text-[var(--quiet)]">Initial → reassessment</div>
            <span className="forensic text-[11px] text-white/60">{initialRisk != null ? formatProb(initialRisk) : "Not returned"}</span>
            {delta == null ? <Minus size={12} className="text-white/30" aria-hidden /> : delta > 0 ? <ArrowUp size={12} className="text-[var(--red-fx)]" aria-hidden /> : <ArrowDown size={12} className="text-[var(--green-fx)]" aria-hidden />}
            <span className="forensic text-[11px] text-[var(--amber-bright)]">{formatProb(finalRisk)}</span>
            <span className="text-[10px] text-white/40">{latest?.change_summary ?? "Reassessment completed; no change summary returned."}</span>
          </div>
        </motion.div>
      )}
    </section>
  )
}

function numberValue(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "number" ? record[key] as number : undefined
}

function Value({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <div><div className="eyebrow text-[var(--quiet)] text-[8px]">{label}</div><div className={cn("forensic text-[11px] mt-1", accent ? "text-[var(--amber-bright)]" : "text-white/75")}>{value}</div></div>
}
