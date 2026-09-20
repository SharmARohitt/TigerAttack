"use client"
import { motion } from "framer-motion"

interface Props {
  caseIds: string[]
  currentCaseId: string
}

// We show the IDs with a "similar" label — actual data from the backend
export function HistoricalCases({ caseIds, currentCaseId }: Props) {
  if (!caseIds.length) return (
    <div className="text-slate-700 text-xs mono text-center py-8">
      NO PRIOR CASES RETRIEVED
    </div>
  )

  return (
    <div className="space-y-2">
      <h3 className="mono text-[9px] tracking-[0.3em] text-slate-600 mb-3">SIMILAR PRIOR CASES</h3>

      {/* Lineage indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded border border-amber-800/30 bg-amber-950/10">
          <span className="mono text-[9px] text-amber-400">{currentCaseId}</span>
          <span className="text-slate-700 text-[9px]">CURRENT</span>
        </div>
        <div className="text-slate-700 text-xs">→</div>
        <div className="text-slate-700 text-[10px] italic">retrieved {caseIds.length} similar case(s)</div>
      </div>

      <div className="space-y-1.5">
        {caseIds.map((cid, i) => (
          <motion.div
            key={cid}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 px-3 py-2 rounded border border-white/5 bg-[#0D1117]/60 hover:border-white/10 transition-colors"
          >
            {/* Similarity rank */}
            <div className="w-5 h-5 rounded border border-slate-700/50 bg-slate-900/50 flex items-center justify-center shrink-0">
              <span className="mono text-[8px] text-slate-500">{i + 1}</span>
            </div>

            {/* Case ID */}
            <div className="flex-1 min-w-0">
              <div className="mono text-xs text-slate-300">{cid}</div>
              <div className="mono text-[9px] text-slate-600">Retrieved by case-memory similarity</div>
            </div>

            {/* Graph indicator */}
            <div className="shrink-0 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-600/60" />
              <span className="mono text-[8px] text-slate-600">IN GRAPH</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 px-2 py-2 rounded border border-white/5 bg-[#0D1117]/40">
        <p className="text-slate-600 text-[9px] mono">
          Case memory retrieved from TigerGraph FraudCaseGraph via closed_cases_history.
          These cases were used as investigation context, not as ground truth.
        </p>
      </div>
    </div>
  )
}
