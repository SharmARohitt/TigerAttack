"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import type { CaseAnswer, AuditEntry } from "@/lib/types"
import { formatCurrency, formatProbability, patternLabel } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { VerdictBadge } from "@/components/ui/VerdictBadge"
import { GlassPanel } from "@/components/ui/GlassPanel"
import { InvestigationPhases } from "./InvestigationPhases"
import { EvidenceGraph } from "./EvidenceGraph"
import { EvidenceStream } from "./EvidenceStream"
import { ActionCenter } from "./ActionCenter"
import { PolicyView } from "./PolicyView"
import { HistoricalCases } from "./HistoricalCases"
import { CaseMemoryPanel } from "./CaseMemoryPanel"
import { AuditTimeline } from "./AuditTimeline"
import { SARPanel } from "./SARPanel"

const TABS = [
  { id: "graph",   label: "GRAPH" },
  { id: "evidence",label: "EVIDENCE" },
  { id: "actions", label: "ACTIONS" },
  { id: "policy",  label: "POLICY" },
  { id: "history", label: "HISTORY" },
  { id: "memory",  label: "MEMORY" },
  { id: "sar",     label: "SAR" },
  { id: "audit",   label: "AUDIT" },
]

interface Props {
  answer: CaseAnswer
  audit: AuditEntry[]
  streaming?: boolean
  onBack: () => void
}

export function InvestigationWorkspace({ answer, audit, streaming, onBack }: Props) {
  const [tab, setTab] = useState<string>("graph")
  const { case: c } = answer

  const riskColor =
    c.fraud_probability >= 0.8 ? "text-red-400" :
    c.fraud_probability >= 0.5 ? "text-amber-400" :
    "text-emerald-400"

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col bg-[#080A0C]"
    >
      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="mono text-[10px] text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
          >
            ← TIGER EFFECT
          </button>
          <div className="w-px h-4 bg-white/10" />
          <span className="mono text-amber-400 text-sm font-semibold tracking-wider">{answer.case_id}</span>
          <VerdictBadge verdict={c.verdict} probability={c.fraud_probability} />
        </div>

        <div className="flex items-center gap-4 text-[10px] mono">
          <span className="text-slate-600">
            TOOL CALLS <span className="text-slate-400">{answer.tool_calls}</span>
          </span>
          <span className="text-slate-600">
            LATENCY <span className="text-slate-400">{answer.latency_s.toFixed(2)}s</span>
          </span>
          <span className="text-slate-600">
            EVIDENCE <span className="text-slate-400">{c.evidence.length}</span>
          </span>
        </div>
      </header>

      {/* ── Case header ───────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-white/5 bg-[#0D1117]/60 shrink-0">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {/* Key metrics row */}
          <div className="flex items-center gap-1">
            <span className="mono text-[9px] text-slate-600">RISK</span>
            <span className={cn("mono text-sm font-bold", riskColor)}>
              {formatProbability(c.fraud_probability)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="mono text-[9px] text-slate-600">EXPOSURE</span>
            <span className="mono text-sm text-slate-200">{formatCurrency(c.exposure_usd)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="mono text-[9px] text-slate-600">PATTERN</span>
            <span className="mono text-xs text-cyan-400">{patternLabel(c.pattern)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="mono text-[9px] text-slate-600">TXN</span>
            <span className="mono text-xs text-slate-300">{c.affected_txn_ids[0] ?? "—"}</span>
          </div>
          {c.connected_card_ids.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="mono text-[9px] text-slate-600">CONNECTED CARDS</span>
              <span className="mono text-xs text-slate-400">{c.connected_card_ids.length}</span>
            </div>
          )}
        </div>

        {/* Investigation phases */}
        <div className="mt-3 overflow-x-auto">
          <InvestigationPhases status={c.status} verdict={c.verdict} />
        </div>
      </div>

      {/* ── Main layout ───────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT — Evidence stream */}
        <div className="w-72 xl:w-80 border-r border-white/5 flex flex-col shrink-0">
          <div className="px-3 py-2 border-b border-white/5">
            <span className="mono text-[9px] tracking-[0.3em] text-slate-600">EVIDENCE STREAM</span>
          </div>
          <div className="flex-1 overflow-hidden p-2">
            <EvidenceStream evidence={c.evidence} streaming={streaming} />
          </div>
        </div>

        {/* CENTER — Tabbed workspace */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab bar */}
          <div className="flex items-center gap-0 border-b border-white/5 px-2 shrink-0 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-3 py-2.5 mono text-[10px] tracking-wider shrink-0 border-b-2 transition-colors duration-150",
                  tab === t.id
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-slate-600 hover:text-slate-400"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto p-4">
            {tab === "graph" && (
              <div className="h-full min-h-[360px]">
                <EvidenceGraph evidence={c.evidence} caseId={answer.case_id} />
              </div>
            )}

            {tab === "evidence" && (
              <div className="space-y-2 max-w-3xl">
                <div className="mono text-[9px] tracking-[0.3em] text-slate-600 mb-3">
                  EVIDENCE PACK — {c.evidence.length} ITEMS
                </div>
                {c.evidence.map((ev, i) => (
                  <GlassPanel key={i} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        <span className={cn("mono text-[9px] px-1.5 py-0.5 rounded border uppercase",
                          ev.source === "graph"    ? "border-cyan-800/50 text-cyan-500 bg-cyan-950/20" :
                          ev.source === "customer" ? "border-violet-800/50 text-violet-500 bg-violet-950/20" :
                          "border-slate-700/50 text-slate-500 bg-slate-900/30"
                        )}>
                          {ev.source}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-xs leading-snug mb-1.5">{ev.claim}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          <span className="mono text-[8px] text-slate-600">
                            REF: <span className="text-slate-500">{ev.ref}</span>
                          </span>
                          {ev.entity_ids.length > 0 && (
                            <span className="mono text-[8px] text-slate-600">
                              ENTITIES: <span className="text-cyan-700">{ev.entity_ids.join(" → ")}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            )}

            {tab === "actions" && (
              <div className="max-w-xl space-y-6">
                <ActionCenter
                  actions={answer.next_best_actions.initial}
                  caseId={answer.case_id}
                  label="INITIAL RECOMMENDATION"
                />
                {answer.next_best_actions.what_changed !== "nothing" && (
                  <div className="rounded border border-amber-800/30 bg-amber-950/10 p-3">
                    <div className="mono text-[9px] text-amber-600 mb-1">WHAT CHANGED</div>
                    <p className="text-slate-400 text-[10px]">{answer.next_best_actions.what_changed}</p>
                  </div>
                )}
                <ActionCenter
                  actions={answer.next_best_actions.final}
                  caseId={answer.case_id}
                  label="FINAL RECOMMENDATION"
                />
                {answer.evidence_requests.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="mono text-[9px] tracking-[0.3em] text-slate-600">EVIDENCE REQUESTED</h3>
                    {answer.evidence_requests.map((er, i) => (
                      <GlassPanel key={i} className="p-3">
                        <div className="mono text-[9px] text-amber-500 mb-1 uppercase">{er.type.replace(/_/g," ")}</div>
                        <p className="text-slate-400 text-[10px]">{er.assumed_response}</p>
                      </GlassPanel>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "policy" && (
              <div className="max-w-xl">
                <PolicyView
                  actions={answer.next_best_actions.final}
                  stopReason={answer.stop_reason}
                />
              </div>
            )}

            {tab === "history" && (
              <div className="max-w-xl">
                <HistoricalCases
                  caseIds={c.similar_prior_cases}
                  currentCaseId={answer.case_id}
                />
              </div>
            )}

            {tab === "memory" && (
              <div className="max-w-xl">
                <CaseMemoryPanel answer={answer} />
              </div>
            )}

            {tab === "sar" && (
              <div className="max-w-xl">
                <SARPanel sar={answer.sar} />
              </div>
            )}

            {tab === "audit" && (
              <div className="max-w-xl">
                <AuditTimeline entries={audit} />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Verdict + summary panel */}
        <div className="w-64 xl:w-72 border-l border-white/5 flex flex-col shrink-0">
          <div className="px-3 py-2 border-b border-white/5">
            <span className="mono text-[9px] tracking-[0.3em] text-slate-600">INVESTIGATION INTELLIGENCE</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">

            {/* Verdict */}
            <GlassPanel amber={c.verdict === "fraud"} glow={c.verdict === "fraud"} className="p-3">
              <div className="mono text-[8px] text-slate-600 mb-2">VERDICT</div>
              <VerdictBadge verdict={c.verdict} probability={c.fraud_probability} className="w-full justify-center mb-2" />
              <div className="mono text-[9px] text-slate-600 text-center">
                {c.status.replace(/_/g, " ").toUpperCase()}
              </div>
            </GlassPanel>

            {/* Pattern */}
            <GlassPanel className="p-3">
              <div className="mono text-[8px] text-slate-600 mb-1">FRAUD PATTERN</div>
              <div className="mono text-xs text-cyan-400">{patternLabel(c.pattern)}</div>
              {c.pattern_description && (
                <p className="text-slate-500 text-[9px] mt-1 leading-relaxed">{c.pattern_description}</p>
              )}
            </GlassPanel>

            {/* Exposure */}
            <GlassPanel className="p-3">
              <div className="mono text-[8px] text-slate-600 mb-1">FINANCIAL EXPOSURE</div>
              <div className={cn("mono text-lg font-bold",
                c.exposure_usd > 1000 ? "text-red-400" :
                c.exposure_usd > 200  ? "text-amber-400" :
                "text-slate-300"
              )}>
                {formatCurrency(c.exposure_usd)}
              </div>
              <div className="mono text-[9px] text-slate-600 mt-0.5">
                {c.affected_txn_ids.length} transaction(s) affected
              </div>
            </GlassPanel>

            {/* Stop reason */}
            <GlassPanel className="p-3">
              <div className="mono text-[8px] text-slate-600 mb-1">STOP REASON</div>
              <p className="text-slate-500 text-[9px] leading-relaxed">{answer.stop_reason}</p>
            </GlassPanel>

            {/* Summary */}
            {c.summary && (
              <GlassPanel className="p-3">
                <div className="mono text-[8px] text-slate-600 mb-1">SUMMARY</div>
                <p className="text-slate-500 text-[9px] leading-relaxed">{c.summary}</p>
              </GlassPanel>
            )}

            {/* Graph status */}
            <GlassPanel className="p-3">
              <div className="mono text-[8px] text-slate-600 mb-1">GRAPH STATUS</div>
              <div className="flex items-center gap-1.5">
                <div className={cn("w-1.5 h-1.5 rounded-full", c.written_to_graph ? "bg-emerald-500" : "bg-slate-700")} />
                <span className="mono text-[9px] text-slate-400">
                  {c.written_to_graph ? "WRITTEN TO TIGERGRAPH" : "NOT YET WRITTEN"}
                </span>
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
