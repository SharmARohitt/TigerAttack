"use client"
import { motion } from "framer-motion"
import type { CaseAnswer } from "@/lib/types"

export function HistoryTab({ answer }: { answer: CaseAnswer }) {
  const priorCases = answer.case.similar_prior_cases ?? []
  const reassessments = answer.reassessment_history ?? []

  if (!priorCases.length) {
    return (
      <div className="flex items-center justify-center h-32 font-mono-ui text-xs text-[#8B8D96]/40 p-4">
        No similar prior cases retrieved
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4">
      <div className="font-mono-ui text-[9px] tracking-wider text-[#8B8D96]/60 uppercase mb-1">
        SIMILAR PRIOR CASES — {priorCases.length} retrieved
      </div>

      {/* Current case → history connection */}
      <div className="flex items-center gap-2 mb-3">
        <div className="font-mono-ui text-[9px] px-2 py-1 rounded border border-[#D9A441]/30 bg-[#D9A441]/08 text-[#D9A441]">
          {answer.case_id} ← CURRENT
        </div>
        <div className="text-[#8B8D96]/40 text-xs">→</div>
        <div className="font-mono-ui text-[9px] text-[#8B8D96]/50 italic">
          {priorCases.length} similar case(s) retrieved from case memory
        </div>
      </div>

      <div className="space-y-2">
        {priorCases.map((cid, i) => {
          // Find matching reassessment entry if any
          const reassessment = reassessments.find(r =>
            (r as Record<string, unknown[]>)["evidence_causing_change"]
              ?.some((e: unknown) => typeof e === "string" && e.includes(cid))
          )

          return (
            <motion.div
              key={cid}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-white/08 bg-[#14151A]/60 px-3 py-3"
            >
              {/* Case ID + connection */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded border border-[#8B8D96]/30 bg-[#1C1E24] flex items-center justify-center shrink-0">
                  <span className="font-mono-ui text-[8px] text-[#8B8D96]/60">{i + 1}</span>
                </div>
                <span className="font-mono-ui text-sm text-[#D9A441] font-semibold">{cid}</span>
                <div className="flex-1 h-px bg-white/06" />
                <span className="font-mono-ui text-[8px] text-[#4FD1E8]/50 uppercase tracking-wider">
                  CASE MEMORY
                </span>
              </div>

              <div className="font-mono-ui text-[9px] text-[#8B8D96]/50 mb-1">
                Retrieved by TF-IDF cosine similarity on closed_cases_history
              </div>

              {/* Reassessment data if available */}
              {reassessment ? (
                <div className="mt-2 rounded border border-[#D9A441]/20 bg-[#D9A441]/04 px-2 py-1.5 space-y-1">
                  <div className="font-mono-ui text-[8px] text-[#D9A441]/70 uppercase tracking-wider">INFLUENCE ON CURRENT DECISION</div>
                  {reassessment.risk_before != null && reassessment.risk_after != null && (
                    <div className="font-mono-ui text-[9px] text-[#8B8D96]">
                      risk: <span className="text-[#F2F1ED]">{reassessment.risk_before}</span>
                      {" → "}
                      <span className="text-[#F2F1ED]">{reassessment.risk_after}</span>
                    </div>
                  )}
                  {reassessment.change_summary && (
                    <div className="font-mono-ui text-[9px] text-[#8B8D96]">{reassessment.change_summary}</div>
                  )}
                </div>
              ) : (
                <div className="font-mono-ui text-[9px] text-[#8B8D96]/35 italic mt-1">
                  influence detail not provided by backend
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
