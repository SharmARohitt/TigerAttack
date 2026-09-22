"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Volume2, VolumeX, ChevronRight } from "lucide-react"
import { TigerCanvas } from "./TigerCanvas"
import { RuntimePill } from "@/components/ui/RuntimePill"
import { getHealth, listCases } from "@/lib/api"
import type { HealthStatus, CaseListItem } from "@/lib/types"

const CASE_PACK_IDS = [
  "HHG-001","HHG-002","HHG-003","HHG-004","HHG-005",
  "HHG-006","HHG-007","HHG-008","HHG-009","HHG-010",
  "HHG-011","HHG-012","HHG-013","HHG-014","HHG-015",
  "HHG-016","HHG-017","HHG-018","HHG-019","HHG-020",
]

interface Props { onLaunch: (caseId: string) => void }

export function HeroSection({ onLaunch }: Props) {
  const [health, setHealth]         = useState<HealthStatus | null>(null)
  const [cases, setCases]           = useState<CaseListItem[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [selectedId, setSelectedId] = useState("")
  const [inputId, setInputId]       = useState("")
  const [muted, setMuted]           = useState(true)
  const [activated, setActivated]   = useState(false)
  const [launching, setLaunching]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Poll health
  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      try {
        const h = await getHealth()
        if (!cancelled) setHealth(h)
      } catch { /* offline */ }
    }
    poll()
    const id = setInterval(poll, 9000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  // Load case list
  useEffect(() => {
    listCases(20).then(setCases).catch(() => {})
  }, [])

  const handleLaunch = useCallback((caseId: string) => {
    if (launching || !caseId.trim()) return
    setActivated(true)
    setLaunching(true)
    // Fire backend call in parallel with the transition animation
    setTimeout(() => onLaunch(caseId.trim()), 400)
  }, [launching, onLaunch])

  const handlePrimaryClick = useCallback(() => {
    const id = inputId.trim() || selectedId
    if (id) {
      handleLaunch(id)
    } else {
      setShowPicker(true)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [inputId, selectedId, handleLaunch])

  // Derive case IDs: backend list first, fall back to static pack
  const displayIds = cases.length > 0
    ? cases.map(c => c.case_id)
    : CASE_PACK_IDS

  const tg  = health?.tigergraph === "connected" ? "CONNECTED"  : health ? "UNAVAILABLE" : null
  const mcp = health?.mcp         === "connected" ? "CONNECTED"  : health ? "UNAVAILABLE" : null

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-[#0A0A0C] scanlines">
      {/* Background scene */}
      <TigerCanvas activated={activated} />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0C]/15 to-[#0A0A0C]/85 pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#0A0A0C] to-transparent pointer-events-none" />

      {/* Scan line overlay */}
      <div className="scan-line" aria-hidden />

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/08">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded border border-[#D9A441]/40 bg-[#D9A441]/08 flex items-center justify-center">
            <span className="text-[#D9A441] text-[10px]">⟁</span>
          </div>
          <span className="font-mono-ui text-xs tracking-[0.4em] text-[#D9A441] uppercase">Tiger Effect</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {tg  && <RuntimePill label="GRAPH" value={tg} />}
          {mcp && <RuntimePill label="MCP"   value={mcp} />}
          {!health && (
            <span className="font-mono-ui text-[10px] text-[#8B8D96] px-2">
              checking…
            </span>
          )}
        </div>
      </header>

      {/* ── Hero content ─────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-start justify-center px-8 md:px-16 lg:px-24 pb-20 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Tag */}
          <p className="font-mono-ui text-[10px] tracking-[0.55em] text-[#8B8D96] mb-5 uppercase">
            Fraud Investigation Intelligence Command Center
          </p>

          {/* H1 */}
          <h1 className="font-sans font-light uppercase tracking-tight mb-3 leading-none"
              style={{ fontSize: "clamp(2.5rem,6vw,5.5rem)" }}>
            <span className="text-[#D9A441]">TIGER</span>
            <span className="text-[#F2F1ED]"> EFFECT</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-[#F2F1ED] text-lg md:text-xl font-light mb-3 tracking-wide">
            Hunt the evidence.{" "}
            <span className="text-[#4FD1E8]/80">Map the fraud.</span>
          </p>

          {/* Body */}
          <p className="text-[#8B8D96] text-sm max-w-xl mb-10 leading-relaxed">
            An evidence-grounded fraud investigation system that connects transactions,
            identities, behavior, historical cases and policy into one investigation graph.
          </p>

          {/* Input + CTAs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
            {/* Case ID input */}
            <div className="flex items-center gap-0 rounded-lg border border-white/10 bg-[#14151A]/80 overflow-hidden">
              <span className="font-mono-ui text-[10px] text-[#8B8D96] px-3 whitespace-nowrap border-r border-white/08">
                CASE
              </span>
              <input
                ref={inputRef}
                type="text"
                value={inputId}
                onChange={e => setInputId(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handlePrimaryClick()}
                placeholder="HHG-001"
                aria-label="Case ID to investigate"
                className="bg-transparent outline-none text-sm font-mono-ui text-[#D9A441] px-3 py-2.5 w-28 placeholder:text-[#8B8D96]/40"
                disabled={launching}
              />
            </div>

            {/* Run Investigation */}
            <motion.button
              onClick={handlePrimaryClick}
              disabled={launching}
              whileHover={{ scale: launching ? 1 : 1.02 }}
              whileTap={{  scale: launching ? 1 : 0.98 }}
              aria-label="Run investigation"
              className="relative overflow-hidden px-7 py-3 rounded-lg font-mono-ui text-sm tracking-[0.18em] uppercase
                         bg-[#D9A441]/12 border border-[#D9A441]/40 text-[#D9A441]
                         hover:bg-[#D9A441]/20 hover:border-[#D9A441]/65
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-200 glow-amber"
            >
              {launching ? "LAUNCHING…" : "RUN INVESTIGATION"}
            </motion.button>

            {/* Explore cases */}
            <motion.button
              onClick={() => onLaunch("LIST")}
              disabled={launching}
              whileHover={{ scale: 1.02 }}
              whileTap={{  scale: 0.98 }}
              aria-label="Explore all cases"
              className="px-6 py-3 rounded-lg font-mono-ui text-xs tracking-[0.15em] uppercase
                         text-[#8B8D96] border border-white/10
                         hover:border-white/20 hover:text-[#F2F1ED]
                         transition-colors duration-200 disabled:opacity-40"
            >
              EXPLORE CASES
            </motion.button>
          </div>

          {/* Case picker dropdown */}
          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border border-white/10 bg-[#14151A]/95 backdrop-blur overflow-hidden w-72 shadow-2xl"
              >
                <div className="px-3 py-2 border-b border-white/08 font-mono-ui text-[10px] text-[#8B8D96] tracking-wider">
                  SELECT CASE TO INVESTIGATE
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {displayIds.map(id => {
                    const meta = cases.find(c => c.case_id === id)
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          setSelectedId(id)
                          setInputId(id)
                          setShowPicker(false)
                          handleLaunch(id)
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5
                                   font-mono-ui text-xs text-[#F2F1ED]/80 hover:bg-[#D9A441]/08
                                   hover:text-[#D9A441] transition-colors duration-100 text-left"
                      >
                        <span>{id}</span>
                        {meta && (
                          <span className="text-[#8B8D96] text-[9px]">
                            {meta.verdict?.toUpperCase()}
                          </span>
                        )}
                        <ChevronRight size={12} className="text-[#8B8D96]" aria-hidden />
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setShowPicker(false)}
                  className="w-full px-3 py-2 text-[10px] font-mono-ui text-[#8B8D96] hover:text-[#F2F1ED] border-t border-white/08 transition-colors"
                >
                  DISMISS
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status indicators */}
          <div className="flex items-center gap-6 text-[10px] font-mono-ui text-[#8B8D96]/60 mt-2">
            <span className={tg === "CONNECTED" ? "text-[#3DD68C]/70" : "text-[#E5484D]/60"}>
              ◆ {tg ? `GRAPH ${tg}` : "GRAPH CHECKING…"}
            </span>
            <span className={mcp === "CONNECTED" ? "text-[#3DD68C]/70" : "text-[#E5484D]/60"}>
              ◆ {mcp ? `MCP ${mcp}` : "MCP CHECKING…"}
            </span>
            <span className="text-[#3DD68C]/70">◆ EVIDENCE ENGINE READY</span>
          </div>
        </motion.div>
      </main>

      {/* ── Mute control ─────────────────────────────────────────────── */}
      <div className="absolute bottom-6 right-6 z-10">
        <button
          onClick={() => setMuted(m => !m)}
          aria-label={muted ? "Unmute audio" : "Mute audio"}
          className="flex items-center gap-1.5 px-3 py-2 rounded border border-white/10 bg-[#14151A]/70
                     font-mono-ui text-[10px] text-[#8B8D96] hover:text-[#F2F1ED] hover:border-white/20
                     transition-colors duration-150"
        >
          {muted
            ? <VolumeX size={12} aria-hidden />
            : <Volume2 size={12} aria-hidden />}
          <span>{muted ? "MUTED" : "AUDIO ON"}</span>
        </button>
      </div>
    </div>
  )
}
