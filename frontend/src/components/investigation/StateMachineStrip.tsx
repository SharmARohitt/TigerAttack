"use client"
import { motion } from "framer-motion"
import { CheckCircle2, Circle } from "lucide-react"
import { cn, deriveStages } from "@/lib/utils"
import type { CaseAnswer, InvestigationStage, StageState } from "@/lib/types"

const STAGES: InvestigationStage[] = [
  "TRIGGER","INVESTIGATE","GATHER EVIDENCE","ASSESS UNCERTAINTY",
  "GATHER MORE EVIDENCE","TAKE ACTION","EXPLAIN","REMEMBER",
]

interface Props { answer: CaseAnswer }

export function StateMachineStrip({ answer }: Props) {
  const stages = deriveStages(
    answer.case.status,
    answer.stop_reason,
    answer.evidence_requests.length,
    answer.case.written_to_graph,
  )

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1" role="list" aria-label="Investigation stages">
      {STAGES.map((stage, i) => {
        const state: StageState = stages[stage]
        return (
          <div key={stage} className="flex items-center" role="listitem">
            <StageNode label={stage} state={state} />
            {i < STAGES.length - 1 && (
              <div className={cn(
                "w-5 h-px shrink-0 mx-0.5",
                state === "completed" ? "bg-[#D9A441]/50" : "bg-white/10",
              )} aria-hidden />
            )}
          </div>
        )
      })}
    </div>
  )
}

function StageNode({ label, state }: { label: InvestigationStage; state: StageState }) {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0 min-w-[68px] px-1">
      {/* Dot */}
      <div className="relative flex items-center justify-center w-5 h-5">
        {state === "completed" && (
          <CheckCircle2 size={14} className="text-[#D9A441]" aria-hidden />
        )}
        {state === "current" && (
          <motion.div
            className="w-3 h-3 rounded-full bg-[#D9A441] stage-pulse"
            animate={{ boxShadow: ["0 0 0 0 rgba(217,164,65,0.4)","0 0 0 6px rgba(217,164,65,0)"] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            aria-hidden
          />
        )}
        {state === "pending" && (
          <Circle size={12} className="text-white/20" aria-hidden />
        )}
      </div>

      {/* Label */}
      <span className={cn(
        "font-mono-ui text-[8px] tracking-wide text-center leading-tight",
        state === "completed" ? "text-[#D9A441]/80" :
        state === "current"   ? "text-[#D9A441]" :
                                "text-white/20",
      )}>
        {label}
      </span>
    </div>
  )
}
