"use client"
import { useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { HeroSection } from "@/components/hero/HeroSection"
import { LandingStory } from "@/components/hero/LandingStory"
import { InvestigationWorkspace } from "@/components/investigation/InvestigationWorkspace"
import { CaseListView } from "@/components/cases/CaseListView"
import { InvestigationLoader } from "@/components/investigation/InvestigationLoader"
import { runInvestigation, getCaseAudit } from "@/lib/api"
import type { CaseAnswer, AuditEntry } from "@/lib/types"

type Screen = "hero" | "list" | "investigating" | "workspace"

const HUNT_STEPS = ["REQUEST SENT", "WAITING FOR VERIFIED RESULT"]

export default function Home() {
  const [screen, setScreen]       = useState<Screen>("hero")
  const [answer, setAnswer]       = useState<CaseAnswer | null>(null)
  const [audit, setAudit]         = useState<AuditEntry[]>([])
  const [error, setError]         = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [loadingMsg, setLoading]  = useState("")
  const loadCase = useCallback(async (caseId: string) => {
    setError(null)
    setLoading("REQUEST SENT")
    setScreen("investigating")

    // The API does not expose granular progress, so only present request lifecycle states.
    let stepIdx = 0
    const stepTimer = setInterval(() => {
      stepIdx = (stepIdx + 1) % HUNT_STEPS.length
      setLoading(HUNT_STEPS[stepIdx])
    }, 550)

    try {
      // Every scan runs a fresh investigation; stored answers are not scan results.
      setStreaming(true)
      const result: CaseAnswer = await runInvestigation(caseId)

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
            <LandingStory />
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
            className="fixed inset-0"
          >
            <InvestigationLoader message={loadingMsg} />
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
