"use client"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EvidenceItem } from "@/lib/types"

const SRC_STYLES: Record<string, string> = {
  graph:    "bg-[#4FD1E8]/10 border-[#4FD1E8]/30 text-[#4FD1E8]",
  document: "bg-white/05    border-white/15    text-[#8B8D96]",
  customer: "bg-[#62E6FF]/10 border-[#62E6FF]/30 text-[#62E6FF]",
  external: "bg-[#F6A623]/10 border-[#F6A623]/30 text-[#F6A623]",
}

interface Props {
  evidence: EvidenceItem[]
  focusedEntityId?: string | null
}

export function EvidenceStream({ evidence, focusedEntityId }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const focusRef = useRef<HTMLDivElement | null>(null)

  const toggle = (i: number) =>
    setExpanded(prev => {
      const n = new Set(prev)
      if (n.has(i)) { n.delete(i) } else { n.add(i) }
      return n
    })

  // Scroll focused item into view
  useEffect(() => {
    if (focusedEntityId && focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [focusedEntityId])

  if (!evidence.length) {
    return (
      <div className="flex items-center justify-center h-32 font-mono-ui text-xs text-[#8B8D96]/40">
        No graph evidence returned for this case
      </div>
    )
  }

  return (
    <div className="space-y-1.5 p-1">
      <AnimatePresence initial={false}>
        {evidence.map((ev, i) => {
          const isFocused = focusedEntityId
            ? ev.entity_ids.includes(focusedEntityId)
            : false
          const isExpanded = expanded.has(i)
          const srcStyle = SRC_STYLES[ev.source] ?? SRC_STYLES.document

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, delay: Math.min(i * 0.04, 0.6) }}
              ref={isFocused ? focusRef : null}
              className={cn(
                "rounded-lg border transition-all duration-200 cursor-pointer",
                isFocused
                  ? "border-[#D9A441]/50 bg-[#D9A441]/06 glow-amber"
                  : "border-white/08 bg-[#14151A]/60 hover:border-white/14"
              )}
              onClick={() => toggle(i)}
            >
              <div className="flex items-start gap-2.5 px-3 py-2.5">
                {/* Source badge */}
                <span className={cn(
                  "font-mono-ui text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 mt-0.5",
                  srcStyle,
                )}>
                  {ev.source}
                </span>

                {/* Claim */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-[11px] leading-snug",
                    isExpanded ? "text-[#F2F1ED]" : "text-[#F2F1ED]/80 line-clamp-2",
                  )}>
                    {ev.claim}
                  </p>
                  {!isExpanded && ev.ref && (
                    <span className="font-mono-ui text-[9px] text-[#8B8D96]/50 mt-0.5 block truncate">
                      {ev.ref}
                    </span>
                  )}
                </div>

                {/* Expand toggle */}
                <span className="text-[#8B8D96]/40 shrink-0 mt-0.5" aria-hidden>
                  {isExpanded
                    ? <ChevronDown size={11} />
                    : <ChevronRight size={11} />}
                </span>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-2 border-t border-white/06 pt-2">
                  <div className="font-mono-ui text-[9px] text-[#8B8D96]/50">
                    QUERY / REF: <span className="text-[#8B8D96]">{ev.ref || "Not returned"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="font-mono-ui text-[8px] text-[#8B8D96]/50">SOURCE TYPE</div>
                      <div className="font-mono-ui text-[9px] text-[#F2F1ED]/70 mt-0.5">{ev.source}</div>
                    </div>
                    <div>
                      <div className="font-mono-ui text-[8px] text-[#8B8D96]/50">RETRIEVED</div>
                      <div className="font-mono-ui text-[9px] text-[#F2F1ED]/50 mt-0.5">Not returned</div>
                    </div>
                  </div>
                  {ev.entity_ids.length > 0 && (
                    <div>
                      <div className="font-mono-ui text-[9px] text-[#8B8D96]/50 mb-1">ENTITIES</div>
                      <div className="flex flex-wrap gap-1">
                        {ev.entity_ids.map(eid => (
                          <span
                            key={eid}
                            className={cn(
                              "font-mono-ui text-[8px] px-1.5 py-0.5 rounded border",
                              eid === focusedEntityId
                                ? "bg-[#D9A441]/20 border-[#D9A441]/40 text-[#D9A441]"
                                : "bg-white/04 border-white/10 text-[#8B8D96]",
                            )}
                          >
                            {eid}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
