"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { listCases } from "@/lib/api"
import type { CaseListItem } from "@/lib/types"
import { formatCurrency, patternLabel, verdictColor, statusColor } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface Props { onSelectCase: (caseId: string) => void; onBack: () => void }

export function CaseListView({ onSelectCase, onBack }: Props) {
  const [cases, setCases]     = useState<CaseListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    listCases(50)
      .then(c => { setCases(c); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  return (
    <div className="min-h-screen bg-[#080A0C] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="mono text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
            ← TIGER EFFECT
          </button>
          <div className="w-px h-4 bg-white/10" />
          <span className="mono text-amber-400 text-sm tracking-wider">CASE EXPLORER</span>
        </div>
        <span className="mono text-[10px] text-slate-600">{cases.length} CASES LOADED</span>
      </header>

      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="mono text-sm text-amber-500/60 animate-pulse">LOADING CASE MEMORY…</div>
          </div>
        )}

        {error && (
          <div className="rounded border border-red-800/40 bg-red-950/20 p-4 text-red-400 mono text-sm">
            CONNECTION LOST — {error}
          </div>
        )}

        {!loading && !error && cases.length === 0 && (
          <div className="text-center py-20">
            <div className="mono text-slate-600 mb-4">NO CASES IN MEMORY</div>
            <p className="text-slate-700 text-sm">Run an investigation to populate case memory.</p>
          </div>
        )}

        {!loading && cases.length > 0 && (
          <div className="space-y-2">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-3 py-1.5">
              {["CASE ID","STATUS","VERDICT","PATTERN","EXPOSURE",""].map(h => (
                <span key={h} className="mono text-[8px] text-slate-700 tracking-wider">{h}</span>
              ))}
            </div>

            {cases.map((c, i) => (
              <motion.button
                key={c.case_id}
                onClick={() => onSelectCase(c.case_id)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.5) }}
                className="w-full grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center
                           px-3 py-3 rounded border border-white/5 bg-[#0D1117]/60
                           hover:border-amber-700/30 hover:bg-[#111820]/80 text-left
                           transition-all duration-150 group"
              >
                <span className="mono text-sm text-amber-400 group-hover:text-amber-300 transition-colors">
                  {c.case_id}
                </span>
                <span className={cn("mono text-xs", statusColor(c.status))}>
                  {c.status.replace(/_/g," ").toUpperCase()}
                </span>
                <span className={cn("mono text-xs", verdictColor(c.verdict))}>
                  {c.verdict.toUpperCase()}
                </span>
                <span className="mono text-[10px] text-slate-500 truncate">
                  {patternLabel(c.pattern)}
                </span>
                <span className={cn("mono text-xs",
                  c.exposure_usd > 1000 ? "text-red-400" :
                  c.exposure_usd > 200  ? "text-amber-400" :
                  "text-slate-400"
                )}>
                  {formatCurrency(c.exposure_usd)}
                </span>
                <span className="mono text-[9px] text-slate-700 group-hover:text-amber-600 transition-colors shrink-0">
                  OPEN →
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
