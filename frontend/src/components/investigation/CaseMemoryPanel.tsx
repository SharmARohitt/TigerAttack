"use client"
import { motion } from "framer-motion"
import type { CaseAnswer } from "@/lib/types"
import { formatCurrency, patternLabel } from "@/lib/utils"
import { cn } from "@/lib/utils"

export function CaseMemoryPanel({ answer }: { answer: CaseAnswer }) {
  const { case: c } = answer
  const written = c.written_to_graph

  return (
    <div className="space-y-3">
      {/* Write-back status */}
      <div className={cn(
        "rounded border p-3 flex items-center gap-3",
        written
          ? "border-emerald-800/40 bg-emerald-950/15"
          : "border-slate-800/40 bg-[#0D1117]/60"
      )}>
        <motion.div
          className={cn("w-3 h-3 rounded-full shrink-0",
            written ? "bg-emerald-500" : "bg-slate-700"
          )}
          animate={written ? { scale: [1, 1.4, 1] } : {}}
          transition={{ duration: 1.2, repeat: written ? Infinity : 0, repeatDelay: 2 }}
        />
        <div>
          <div className="mono text-xs font-semibold text-slate-200">
            {written ? "CASE MEMORY UPDATED" : "MEMORY WRITE PENDING"}
          </div>
          <div className="mono text-[9px] text-slate-600">
            {written
              ? `Graph case ID: ${c.graph_case_id || answer.case_id}`
              : "Investigation result not yet written to TigerGraph"}
          </div>
        </div>
      </div>

      {/* Memory record */}
      {written && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h3 className="mono text-[9px] tracking-[0.3em] text-slate-600">STORED INVESTIGATION RECORD</h3>

          <div className="grid grid-cols-2 gap-2">
            {[
              ["CASE ID",     answer.case_id],
              ["VERDICT",     c.verdict.toUpperCase()],
              ["PATTERN",     patternLabel(c.pattern)],
              ["EXPOSURE",    formatCurrency(c.exposure_usd)],
              ["EVIDENCE",    `${c.evidence.length} items`],
              ["TOOL CALLS",  String(answer.tool_calls)],
              ["LATENCY",     `${answer.latency_s.toFixed(2)}s`],
              ["WRITTEN",     written ? "YES" : "NO"],
            ].map(([k, v]) => (
              <div key={k} className="rounded border border-white/5 bg-[#0D1117]/60 px-2 py-1.5">
                <div className="mono text-[8px] text-slate-600 mb-0.5">{k}</div>
                <div className="mono text-[10px] text-slate-300">{v}</div>
              </div>
            ))}
          </div>

          {/* Affected transactions */}
          {c.affected_txn_ids.length > 0 && (
            <div className="rounded border border-white/5 bg-[#0D1117]/60 p-2">
              <div className="mono text-[8px] text-slate-600 mb-1.5">AFFECTED TRANSACTIONS</div>
              <div className="flex flex-wrap gap-1">
                {c.affected_txn_ids.map(id => (
                  <span key={id} className="mono text-[9px] px-1.5 py-0.5 rounded bg-amber-950/30 text-amber-600/70 border border-amber-900/20">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {c.summary && (
            <div className="rounded border border-white/5 bg-[#0D1117]/60 p-2">
              <div className="mono text-[8px] text-slate-600 mb-1">INVESTIGATION SUMMARY</div>
              <p className="text-slate-400 text-[10px] leading-relaxed">{c.summary}</p>
            </div>
          )}

          <div className="mono text-[8px] text-slate-700 pt-1">
            This case is now retrievable by future investigations as case memory in TigerGraph FraudCaseGraph.
          </div>
        </motion.div>
      )}
    </div>
  )
}
