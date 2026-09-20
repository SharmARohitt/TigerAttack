"use client"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { EvidenceItem } from "@/lib/types"
import { sourceIcon } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface StreamEntry {
  id: string
  ts: number
  label: string
  source: string
  ref: string
  entity_ids: string[]
  expanded: boolean
}

function buildEntries(evidence: EvidenceItem[], offset = 0): StreamEntry[] {
  return evidence.map((ev, i) => ({
    id: `ev-${i}`,
    ts: offset + i * 180 + Math.random() * 80,
    label: ev.claim,
    source: ev.source,
    ref: ev.ref,
    entity_ids: ev.entity_ids,
    expanded: false,
  }))
}

const SOURCE_COLORS: Record<string, string> = {
  graph:    "text-cyan-400 border-cyan-800/50",
  document: "text-slate-400 border-slate-700/50",
  customer: "text-violet-400 border-violet-800/50",
  external: "text-amber-400 border-amber-800/50",
}

export function EvidenceStream({ evidence, streaming }: { evidence: EvidenceItem[]; streaming?: boolean }) {
  const [visible, setVisible] = useState<StreamEntry[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const listRef = useRef<HTMLDivElement>(null)
  const entries = useRef(buildEntries(evidence))
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    entries.current = buildEntries(evidence)
    setVisible([])

    if (!streaming) {
      setVisible(entries.current)
      return
    }

    let i = 0
    function addNext() {
      if (i >= entries.current.length) return
      setVisible(prev => [...prev, entries.current[i]])
      i++
      timerRef.current = setTimeout(addNext, 220 + Math.random() * 160)
    }
    timerRef.current = setTimeout(addNext, 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evidence, streaming])

  // Auto-scroll
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [visible])

  const toggle = (id: string) =>
    setExpanded(prev => {
      const n = new Set(prev)
      if (n.has(id)) { n.delete(id) } else { n.add(id) }
      return n
    })

  const fmtTs = (ms: number) => {
    const s = ms / 1000
    return `${Math.floor(s / 60).toString().padStart(2,"0")}:${(s % 60).toFixed(2).padStart(5,"0")}`
  }

  return (
    <div ref={listRef} className="h-full overflow-y-auto space-y-1 pr-1">
      <AnimatePresence initial={false}>
        {visible.map(entry => {
          const isExp = expanded.has(entry.id)
          const cols = SOURCE_COLORS[entry.source] ?? SOURCE_COLORS.external
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22 }}
              className={cn(
                "rounded border cursor-pointer transition-colors duration-150",
                "bg-[#0D1117]/80 hover:bg-[#111820]/90",
                isExp ? "border-white/10" : "border-white/5"
              )}
              onClick={() => toggle(entry.id)}
            >
              <div className="flex items-start gap-2 px-3 py-2">
                <span className="mono text-[9px] text-slate-600 shrink-0 mt-0.5 w-14">{fmtTs(entry.ts)}</span>
                <span className={cn("text-xs shrink-0 mt-0.5", cols.split(" ")[0])}>
                  {sourceIcon(entry.source)}
                </span>
                <span className="text-xs text-slate-300 leading-snug flex-1 line-clamp-2">{entry.label}</span>
                <span className="text-slate-700 text-[10px] shrink-0 mt-0.5">{isExp ? "▲" : "▼"}</span>
              </div>
              {isExp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className={cn("px-3 pb-2 border-t mono text-[9px] space-y-1", cols.split(" ")[1])}
                >
                  <div className="text-slate-500 pt-1">SOURCE: <span className="text-slate-400 uppercase">{entry.source}</span></div>
                  <div className="text-slate-500">REF: <span className="text-slate-400">{entry.ref}</span></div>
                  {entry.entity_ids.length > 0 && (
                    <div className="text-slate-500">ENTITIES:
                      <span className="text-cyan-500/70 ml-1">{entry.entity_ids.join(" → ")}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
      {visible.length === 0 && (
        <div className="flex items-center justify-center h-full text-slate-700 text-xs mono">
          AWAITING EVIDENCE…
        </div>
      )}
    </div>
  )
}
