"use client"

import { Check, Crosshair, Database, FileSearch, Flag, GitBranch, ShieldCheck, Zap } from "lucide-react"
import { cn, deriveStages } from "@/lib/utils"
import type { CaseAnswer, InvestigationStage, StageState } from "@/lib/types"

const STAGES: Array<{ label: InvestigationStage; icon: typeof Crosshair }> = [
  { label: "TRIGGER", icon: Crosshair },
  { label: "INVESTIGATE", icon: GitBranch },
  { label: "GATHER EVIDENCE", icon: FileSearch },
  { label: "ASSESS UNCERTAINTY", icon: ShieldCheck },
  { label: "GATHER MORE EVIDENCE", icon: Database },
  { label: "TAKE ACTION", icon: Zap },
  { label: "EXPLAIN", icon: Flag },
  { label: "REMEMBER", icon: Database },
]

export function WorkflowRail({ answer }: { answer: CaseAnswer }) {
  const states = deriveStages(
    answer.case.status,
    answer.stop_reason,
    answer.evidence_requests.length,
    answer.case.written_to_graph,
  )

  return (
    <section className="border-b hairline px-4 py-4" aria-label="Investigation workflow">
      <div className="eyebrow text-[var(--quiet)] mb-4">Investigation lifecycle</div>
      <div className="relative space-y-0.5">
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-white/10" aria-hidden />
        {STAGES.map(({ label, icon: Icon }, index) => {
          const state = states[label] as StageState
          const isCurrent = state === "current"
          return (
            <div key={label} className="relative flex items-center gap-3 min-h-9">
              <div className={cn(
                "relative z-10 flex h-6 w-6 items-center justify-center border bg-[var(--surface)]",
                isCurrent ? "border-[var(--amber)] text-[var(--amber)] shadow-[0_0_16px_rgba(246,166,35,.25)]" :
                state === "completed" ? "border-[var(--green-fx)]/60 text-[var(--green-fx)]" : "border-white/15 text-white/25",
              )}>
                {state === "completed" ? <Check size={12} /> : <Icon size={12} />}
              </div>
              <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                <span className={cn(
                  "font-mono-ui text-[9px] tracking-[.12em] leading-tight",
                  isCurrent ? "text-[var(--amber)]" : state === "completed" ? "text-[var(--text)]/70" : "text-white/30",
                )}>{String(index + 1).padStart(2, "0")} {label}</span>
                {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-[var(--amber)] stage-pulse" aria-label="Current stage" />}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function SystemStatus({ answer }: { answer: CaseAnswer }) {
  const memory = answer.case_memory?.readback === true ? "VERIFIED" : answer.case_memory?.written === true ? "WRITTEN" : "NOT RETURNED"
  const items = [
    ["TIGERGRAPH", answer.runtime?.tigergraph ?? "UNKNOWN"],
    ["MCP", answer.runtime?.mcp ?? "UNKNOWN"],
    ["GRAPHRAG", answer.runtime?.graphrag ?? "UNKNOWN"],
    ["GROQ", answer.grounding?.llm_runtime ?? answer.runtime?.llm ?? "UNKNOWN"],
    ["MEMORY", memory],
  ]
  return (
    <div className="hidden xl:flex items-center gap-4" aria-label="System status">
      {items.map(([label, value]) => {
        const active = value === "CONNECTED" || value === "AVAILABLE" || value === "VERIFIED" || value === "WRITTEN"
        return <span key={label} className={cn("forensic text-[9px] tracking-[.12em]", active ? "status-live" : "text-white/35")} title={`${label}: ${value}`}>{label}</span>
      })}
    </div>
  )
}
