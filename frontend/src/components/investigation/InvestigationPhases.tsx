"use client"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { CaseStatus, Verdict } from "@/lib/types"

const PHASES = [
  { id: "trigger",    label: "TRIGGER" },
  { id: "investigate",label: "INVESTIGATE" },
  { id: "gather",     label: "GATHER EVIDENCE" },
  { id: "assess",     label: "ASSESS" },
  { id: "action",     label: "TAKE ACTION" },
  { id: "remember",   label: "REMEMBER" },
]

function resolvePhase(status: CaseStatus): number {
  if (status === "open")              return 2
  if (status === "escalated")         return 3
  if (status === "closed_fraud" ||
      status === "closed_legitimate") return 5
  return 2
}

export function InvestigationPhases({ status }: { status: CaseStatus; verdict: Verdict }) {
  const current = resolvePhase(status)

  return (
    <div className="flex items-center gap-0">
      {PHASES.map((phase, i) => {
        const done    = i < current
        const active  = i === current
        const pending = i > current
        return (
          <div key={phase.id} className="flex items-center">
            <div className={cn(
              "flex flex-col items-center gap-1",
              pending ? "opacity-30" : ""
            )}>
              {/* Step dot */}
              <motion.div
                className={cn(
                  "w-2.5 h-2.5 rounded-full border",
                  done    ? "bg-emerald-500 border-emerald-400" :
                  active  ? "bg-amber-500 border-amber-300" :
                             "bg-transparent border-slate-700"
                )}
                animate={active ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
                transition={active ? { duration: 1.4, repeat: Infinity } : {}}
              />
              <span className={cn(
                "text-[7px] mono tracking-wide leading-none text-center",
                done   ? "text-emerald-600" :
                active ? "text-amber-400" :
                          "text-slate-700"
              )}>
                {phase.label}
              </span>
            </div>
            {i < PHASES.length - 1 && (
              <div className={cn(
                "w-8 h-px mx-1 mb-3",
                done ? "bg-emerald-700/60" : "bg-slate-800"
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
