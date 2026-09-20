"use client"
import { useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { HeroSection } from "@/components/hero/HeroSection"
import { InvestigationWorkspace } from "@/components/investigation/InvestigationWorkspace"
import { CaseListView } from "@/components/cases/CaseListView"
import { getCase, runInvestigation, getCaseAudit } from "@/lib/api"
import type { CaseAnswer, AuditEntry } from "@/lib/types"

type Screen = "hero" | "list" | "investigating" | "workspace"

export default function Home() {
  const [screen, setScreen]       = useState<Screen>("hero")
  const [answer, setAnswer]       = useState<CaseAnswer | null>(null)
  const [audit, setAudit]         = useState<AuditEntry[]>([])
  const [error, setError]         = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [loadingMsg, setLoading]  = useState("")

  const loadCase = useCallback(async (caseId: string) => {
    setError(null)
    setLoading("AWAKENING TIGER")
    setScreen("investigating")

    const STEPS = [
      "MAPPING TRANSACTION",
      "TRACING CONNECTIONS",
      "SEARCHING CASE MEMORY",
      "CHECKING POLICY",
      "ASSESSING EVIDENCE",
    ]

    // Try to load existing case first (fast path)
    try {
      setLoading("MAPPING TRANSACTION")
      const existing = await getCase(caseId)
      setLoading("SEARCHING CASE MEMORY")
      const auditData = await getCaseAudit(caseId).catch(() => ({ audit: [] }))
      setAnswer(existing)
      setAudit((auditData.audit ?? []) as AuditEntry[])
      setStreaming(false)
      setScreen("workspace")
      return
    } catch {
      // Case not found — run investigation
    }

    // Run investigation with step feedback
    try {
      let stepIdx = 0
      const stepTimer = setInterval(() => {
        stepIdx = (stepIdx + 1) % STEPS.length
        setLoading(STEPS[stepIdx])
      }, 600)

      setStreaming(true)
      const result = await runInvestigation(caseId)
      clearInterval(stepTimer)

      const auditData = await getCaseAudit(caseId).catch(() => ({ audit: [] }))
      setAnswer(result)
      setAudit((auditData.audit ?? []) as AuditEntry[])
      setScreen("workspace")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      setError(msg)
      setScreen("hero")
    } finally {
      setLoading("")
    }
  }, [])

  const handleHeroLaunch = useCallback((caseId: string) => {
    if (caseId === "LIST") {
      setScreen("list")
      return
    }
    loadCase(caseId)
  }, [loadCase])

  return (
    <main>
      <AnimatePresence mode="wait">

        {screen === "hero" && (
          <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <HeroSection onLaunch={handleHeroLaunch} />
            {error && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded border border-red-700/50 bg-red-950/80 backdrop-blur px-6 py-3 mono text-sm text-red-300">
                {error}
              </div>
            )}
          </motion.div>
        )}

        {screen === "list" && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <CaseListView
              onSelectCase={loadCase}
              onBack={() => setScreen("hero")}
            />
          </motion.div>
        )}

        {screen === "investigating" && (
          <motion.div
            key="investigating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#080A0C] flex flex-col items-center justify-center gap-6"
          >
            {/* Animated tiger eye */}
            <motion.div
              className="w-20 h-20 rounded-full border border-amber-500/30 bg-amber-950/20 flex items-center justify-center"
              animate={{ scale: [1, 1.08, 1], boxShadow: ["0 0 20px rgba(245,158,11,0.1)", "0 0 50px rgba(245,158,11,0.35)", "0 0 20px rgba(245,158,11,0.1)"] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            >
              <span className="text-3xl eye-glow">⟁</span>
            </motion.div>

            <div className="text-center">
              <motion.div
                key={loadingMsg}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mono text-amber-400 text-sm tracking-[0.3em] mb-2"
              >
                {loadingMsg || "INITIALISING…"}
              </motion.div>
              <div className="mono text-slate-700 text-xs">TIGER EFFECT — INVESTIGATION IN PROGRESS</div>
            </div>

            {/* Progress bar */}
            <div className="w-64 h-px bg-slate-900 rounded overflow-hidden">
              <motion.div
                className="h-full bg-amber-500/60"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}

        {screen === "workspace" && answer && (
          <motion.div key="workspace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <InvestigationWorkspace
              answer={answer}
              audit={audit}
              streaming={streaming}
              onBack={() => setScreen("hero")}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </main>
  )
}
