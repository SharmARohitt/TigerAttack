"use client"
import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { TigerCanvas } from "./TigerCanvas"
import { StatusBadge } from "@/components/ui/StatusBadge"
import type { HealthStatus } from "@/lib/types"
import { getHealth } from "@/lib/api"

const LAUNCH_STEPS = [
  "AWAKENING TIGER",
  "MAPPING TRANSACTION",
  "TRACING CONNECTIONS",
  "SEARCHING CASE MEMORY",
  "CHECKING POLICY",
  "ASSESSING EVIDENCE",
  "ENTERING INVESTIGATION",
]

interface Props {
  onLaunch: (caseId: string) => void
}

export function HeroSection({ onLaunch }: Props) {
  const [health, setHealth]           = useState<HealthStatus | null>(null)
  const [healthError, setHealthError] = useState(false)
  const [launching, setLaunching]     = useState(false)
  const [launchStep, setLaunchStep]   = useState(0)
  const [activated, setActivated]     = useState(false)
  const [caseId, setCaseId]           = useState("HHG-004")

  // Poll health on mount
  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      try {
        const h = await getHealth()
        if (!cancelled) { setHealth(h); setHealthError(false) }
      } catch {
        if (!cancelled) setHealthError(true)
      }
    }
    poll()
    const interval = setInterval(poll, 8000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  const handleLaunch = useCallback(async () => {
    if (launching) return
    setActivated(true)
    setLaunching(true)
    setLaunchStep(0)

    // Step through launch animation
    for (let i = 0; i < LAUNCH_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 280))
      setLaunchStep(i + 1)
    }

    await new Promise(r => setTimeout(r, 400))
    onLaunch(caseId.trim() || "HHG-004")
  }, [launching, caseId, onLaunch])

  const tgConnected  = health?.tigergraph === "connected"
  const mcpConnected = health?.mcp === "connected"
  const backendUp    = !healthError && health !== null

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background canvas */}
      <TigerCanvas activated={activated} />

      {/* Ambient gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080A0C]/20 to-[#080A0C]/90 pointer-events-none" />

      {/* Top bar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded border border-amber-500/50 flex items-center justify-center bg-amber-950/40">
            <span className="text-amber-400 text-xs font-mono">⟁</span>
          </div>
          <span className="font-mono tracking-[0.3em] text-sm text-amber-400 font-semibold">TIGER EFFECT</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge connected={tgConnected}  label="GRAPH" />
          <StatusBadge connected={mcpConnected} label="MCP" />
          <StatusBadge connected={backendUp}    label="ENGINE" />
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="max-w-3xl mx-auto"
        >
          {/* Tagline */}
          <p className="font-mono text-[10px] tracking-[0.5em] text-amber-500/70 mb-6 uppercase">
            Fraud Investigation Intelligence Command Center
          </p>

          {/* Main title */}
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-4 leading-none">
            <span className="text-amber-400">TIGER</span>
            <span className="text-white/90"> EFFECT</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-slate-400 text-lg md:text-xl font-light mb-3 tracking-wide">
            Hunt the evidence.{" "}
            <span className="text-cyan-400/80">Map the fraud.</span>
          </p>

          <p className="text-slate-600 text-sm max-w-xl mx-auto mb-12 leading-relaxed">
            An evidence-grounded investigation system that connects transactions, identities,
            behavioral signals, historical cases and policy into one investigation graph.
          </p>

          {/* Case selector + CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center mb-8">
            <div className="glass rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-slate-500 text-xs mono">CASE</span>
              <input
                type="text"
                value={caseId}
                onChange={e => setCaseId(e.target.value)}
                placeholder="HHG-004"
                className="bg-transparent outline-none text-sm mono text-amber-300 w-24 placeholder:text-slate-600"
                disabled={launching}
              />
            </div>

            <motion.button
              onClick={handleLaunch}
              disabled={launching}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden px-8 py-3 rounded-lg font-mono tracking-[0.2em] text-sm font-semibold
                         bg-amber-500/10 border border-amber-500/40 text-amber-300
                         hover:bg-amber-500/20 hover:border-amber-400/60 hover:text-amber-200
                         disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200
                         glow-amber"
            >
              {launching ? LAUNCH_STEPS[launchStep - 1] ?? "LAUNCHING…" : "RUN INVESTIGATION"}
              {launching && (
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-amber-400"
                  initial={{ width: "0%" }}
                  animate={{ width: `${(launchStep / LAUNCH_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.25 }}
                />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onLaunch("LIST")}
              className="px-6 py-3 rounded-lg font-mono tracking-[0.15em] text-xs text-slate-400
                         border border-white/8 hover:border-white/15 hover:text-slate-300 transition-all duration-200"
            >
              EXPLORE CASES
            </motion.button>
          </div>

          {/* Status indicators */}
          <div className="flex items-center justify-center gap-6 text-[10px] mono text-slate-600">
            <span className={tgConnected ? "text-emerald-600" : "text-red-800"}>
              {tgConnected ? "◆ GRAPH ONLINE" : "◆ GRAPH OFFLINE"}
            </span>
            <span className={mcpConnected ? "text-emerald-600" : "text-red-800"}>
              {mcpConnected ? "◆ MCP CONNECTED" : "◆ MCP OFFLINE"}
            </span>
            <span className={backendUp ? "text-emerald-600" : "text-red-800"}>
              {backendUp ? "◆ EVIDENCE ENGINE READY" : "◆ ENGINE UNAVAILABLE"}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#080A0C] to-transparent pointer-events-none" />
    </div>
  )
}
