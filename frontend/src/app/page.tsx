"use client"
import { useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { HeroSection } from "@/components/hero/HeroSection"
import { InvestigationWorkspace } from "@/components/investigation/InvestigationWorkspace"
import { CaseListView } from "@/components/cases/CaseListView"
import { getCase, runInvestigation, getCaseAudit } from "@/lib/api"
import type { CaseAnswer, AuditEntry } from "@/lib/types"

type Screen = "hero" | "list" | "investigating" | "workspace"

const HUNT_STEPS = [
  "AWAKENING TIGER",
  "MAPPING TRANSACTION",
  "TRACING CONNECTIONS",
  "SEARCHING CASE MEMORY",
  "CHECKING POLICY",
  "ASSESSING EVIDENCE",
  "UPDATING CASE MEMORY",
]

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

    // Rotate through hunt steps while the backend call runs
    let stepIdx = 0
    const stepTimer = setInterval(() => {
      stepIdx = (stepIdx + 1) % HUNT_STEPS.length
      setLoading(HUNT_STEPS[stepIdx])
    }, 550)

    try {
      // Try fast path: case already exists
      let result: CaseAnswer | null = null
      try {
        result = await getCase(caseId)
        setStreaming(false)
      } catch {
        // Not found — run investigation
        setStreaming(true)
        result = await runInvestigation(caseId)
      }

      const auditData = await getCaseAudit(caseId).catch(() => ({ audit: [] }))
      clearInterval(stepTimer)
      setAnswer(result)
      setAudit((auditData.audit ?? []) as AuditEntry[])
      setScreen("workspace")
    } catch (e: unknown) {
      clearInterval(stepTimer)
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

        {/* LANDING */}
        {screen === "hero" && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
          >
            <HeroSection onLaunch={handleHeroLaunch} />
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg border border-[#E5484D]/40 bg-[#E5484D]/12 backdrop-blur px-5 py-3 font-mono-ui text-sm text-[#E5484D] shadow-2xl max-w-md text-center"
                role="alert"
              >
                {error}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* CASE LIST */}
        {screen === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <CaseListView
              onSelectCase={loadCase}
              onBack={() => setScreen("hero")}
            />
          </motion.div>
        )}

        {/* TRANSITION / INVESTIGATING */}
        {screen === "investigating" && (
          <motion.div
            key="investigating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-[#0A0A0C] flex flex-col items-center justify-center gap-7"
          >
            {/* Tiger eye animation */}
            <motion.div
              className="w-24 h-24 rounded-full border border-[#D9A441]/25 bg-[#D9A441]/06 flex items-center justify-center"
              animate={{
                scale: [1, 1.07, 1],
                boxShadow: [
                  "0 0 20px rgba(217,164,65,0.08)",
                  "0 0 55px rgba(217,164,65,0.30)",
                  "0 0 20px rgba(217,164,65,0.08)",
                ],
              }}
              transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.span
                className="text-4xl"
                style={{ filter: "drop-shadow(0 0 8px rgba(217,164,65,0.7))" }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.7, repeat: Infinity }}
                aria-hidden
              >
                ⟁
              </motion.span>
            </motion.div>

            {/* Step label */}
            <div className="text-center space-y-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={loadingMsg}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="font-mono-ui text-sm text-[#D9A441] tracking-[0.28em] uppercase"
                  role="status"
                  aria-live="polite"
                >
                  {loadingMsg || "INITIALISING…"}
                </motion.div>
              </AnimatePresence>
              <div className="font-mono-ui text-[10px] text-[#8B8D96]/40 tracking-widest uppercase">
                TIGER EFFECT — INVESTIGATION IN PROGRESS
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-72 h-px bg-[#14151A] rounded overflow-hidden" aria-hidden>
              <motion.div
                className="h-full bg-gradient-to-r from-[#D9A441]/60 to-[#D9A441]"
                initial={{ width: "0%" }}
                animate={{ width: "92%" }}
                transition={{ duration: 5.5, ease: "easeInOut" }}
              />
            </div>

            {/* Graph node pulse — decorative hint */}
            <div className="flex gap-3 mt-1" aria-hidden>
              {[0, 1, 2, 3, 4].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#4FD1E8]/40"
                  animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.2, 0.8] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.18,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* WORKSPACE */}
        {screen === "workspace" && answer && (
          <motion.div
            key="workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
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
