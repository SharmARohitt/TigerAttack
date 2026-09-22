"use client"
import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { RefreshCw } from "lucide-react"
import { listCases } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { CaseListItem } from "@/lib/types"

interface Props {
  onSelectCase: (caseId: string) => void
  onBack: () => void
}

export function CaseListView({ onSelectCase, onBack }: Props) {
  const [cases, setCases]     = useState<CaseListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    listCases(50)
      .then(c => { setCases(c); setLoading(false) })
      .catch(e => { setError(e instanceof Error ? e.message : "Unknown error"); setLoading(false) })
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-[#0A0A0C] flex flex-col scanlines">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/08 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="font-mono-ui text-[10px] text-[#8B8D96] hover:text-[#F2F1ED] transition-colors"
            aria-label="Return to landing"
          >
            ← TIGER ATTACK
          </button>
          <div className="w-px h-4 bg-white/10" aria-hidden />
          <span className="font-mono-ui text-sm text-[#D9A441] tracking-wider">CASE EXPLORER</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono-ui text-[10px] text-[#8B8D96]/50">
            {loading ? "loading…" : `${cases.length} cases`}
          </span>
          <button
            onClick={load}
            aria-label="Refresh case list"
            className="p-1.5 rounded hover:bg-white/05 text-[#8B8D96] transition-colors"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {/* Loading */}
        {loading && (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-white/05" />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-lg border border-[#E5484D]/40 bg-[#E5484D]/06 p-6 text-center">
            <div className="font-mono-ui text-sm text-[#E5484D] mb-2">CONNECTION LOST</div>
            <p className="font-mono-ui text-[10px] text-[#8B8D96] mb-4">{error}</p>
            <button
              onClick={load}
              className="px-4 py-2 rounded border border-[#D9A441]/40 font-mono-ui text-xs text-[#D9A441] hover:bg-[#D9A441]/08 transition-colors"
            >
              RETRY
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && cases.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="font-mono-ui text-sm text-[#8B8D96]/40 mb-2">NO CASES IN MEMORY</div>
            <p className="font-mono-ui text-[10px] text-[#8B8D96]/30">
              Run an investigation to populate case memory.
            </p>
          </div>
        )}

        {/* Case list */}
        {!loading && !error && cases.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[.08] border hairline">
              <QueueStat label="CASES AVAILABLE" value={cases.length} />
              <QueueStat label="SCAN MODE" value="FRESH" accent />
              <QueueStat label="VERDICT" value="AFTER SCAN" />
              <QueueStat label="SOURCE" value="CASE PACK" />
            </div>

            {/* Column headers */}
            <div className="hidden md:grid grid-cols-[140px_100px_100px_80px_1fr_120px_40px] gap-3 px-3 py-1.5">
                {["CASE ID", "SCAN STATE", "", "", "", "", ""].map(h => (
                <span key={h} className="font-mono-ui text-[8px] text-[#8B8D96]/40 uppercase tracking-wider">{h}</span>
              ))}
            </div>

            {cases.map((c, i) => (
              <motion.button
                key={c.case_id}
                onClick={() => onSelectCase(c.case_id)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.025, 0.5) }}
                className="w-full grid grid-cols-2 md:grid-cols-[140px_100px_100px_80px_1fr_120px_40px] gap-x-3 gap-y-2 items-center
                           px-3 py-3 rounded-lg border border-white/08 bg-[#14151A]/50
                           hover:border-[#D9A441]/30 hover:bg-[#14151A]/80
                           text-left transition-all duration-150 group"
              >
                <span className="font-mono-ui text-sm text-[#D9A441] group-hover:text-[#D9A441] transition-colors truncate">
                  {c.case_id}
                </span>
                <span className="font-mono-ui text-[10px] uppercase text-[var(--amber-bright)] truncate">READY TO SCAN</span>
                <span className="hidden md:block" />
                <span className="hidden md:block" />
                <span className="hidden md:block" />
                <span className="hidden md:block" />
                <span className="hidden md:block" />
                <span className="font-mono-ui text-[9px] text-[#8B8D96]/30 group-hover:text-[#D9A441]/60 transition-colors text-right">
                  →
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function QueueStat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="bg-[var(--surface)] px-4 py-4">
      <div className="eyebrow text-[var(--quiet)]">{label}</div>
      <div className={cn("forensic text-lg mt-2", accent ? "text-[var(--amber-bright)]" : "text-[var(--text)]")}>{value}</div>
    </div>
  )
}
