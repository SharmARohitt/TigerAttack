"use client"
import { useState, useCallback } from "react"
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { RuntimePill } from "@/components/ui/RuntimePill"
import { CaseHeader } from "./CaseHeader"
import { CaseMemoryPanel } from "./CaseMemoryPanel"
import { EvidenceGraph3D } from "./EvidenceGraph3D"
import { EvidenceStream } from "./EvidenceStream"
import { ReasoningTab } from "./ReasoningTab"
import { PolicyTab } from "./PolicyTab"
import { HistoryTab } from "./HistoryTab"
import { AuditTab } from "./AuditTab"
import { SARPanel } from "./SARPanel"
import { ActionCenter } from "./ActionCenter"
import { SystemStatus, WorkflowRail } from "./WorkflowRail"
import { MCPTrace } from "./MCPTrace"
import { AssessmentPanel } from "./AssessmentPanel"
import { GraphInspector } from "./GraphInspector"
import type { CaseAnswer, AuditEntry } from "@/lib/types"

const TABS = [
  { id: "reasoning", label: "REASONING" },
  { id: "evidence",  label: "EVIDENCE" },
  { id: "policy",    label: "POLICY" },
  { id: "history",   label: "HISTORY" },
  { id: "audit",     label: "AUDIT" },
  { id: "mcp",       label: "MCP TRACE" },
  { id: "sar",       label: "SAR" },
  { id: "actions",   label: "ACTIONS" },
] as const

type TabId = typeof TABS[number]["id"]

interface Props {
  answer: CaseAnswer
  audit: AuditEntry[]
  streaming?: boolean
  onBack: () => void
}

export function InvestigationWorkspace({ answer, audit, onBack }: Props) {
  const [activeTab, setActiveTab]         = useState<TabId>("reasoning")
  const [drawerOpen, setDrawerOpen]       = useState(true)
  const [focusedEntity, setFocusedEntity] = useState<string | null>(null)

  const c  = answer.case
  const rt = answer.runtime ?? {}

  const handleNodeClick = useCallback((nodeId: string) => {
    setFocusedEntity(nodeId)
    setActiveTab("evidence")
  }, [])

  const statusCls =
    c.status.includes("fraud") || c.status.includes("escalated")
      ? "border-[#E5484D]/30 bg-[#E5484D]/08 text-[#E5484D]"
      : c.status.includes("legitimate")
        ? "border-[#3DD68C]/30 bg-[#3DD68C]/08 text-[#3DD68C]"
        : "border-[#E8C547]/30 bg-[#E8C547]/08 text-[#E8C547]"

  return (
    <div
      className="flex min-h-screen flex-col bg-[#0A0A0C] scanlines md:h-[100dvh] md:overflow-hidden"
    >
      {/* ── TOP BAR ──────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 border-b hairline shrink-0 bg-[var(--ink)]"
              style={{ height: 48 }}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="font-mono-ui text-[10px] text-[#8B8D96] hover:text-[#F2F1ED] transition-colors flex items-center gap-1 shrink-0"
            aria-label="Return to landing"
          >
            ← <span className="hidden sm:inline">TIGER ATTACK</span>
          </button>
          <div className="w-px h-4 bg-white/10 shrink-0" aria-hidden />
          <span className="forensic text-sm text-[var(--amber)] font-semibold tracking-wider shrink-0">
            {answer.case_id}
          </span>
          <span className={cn(
            "font-mono-ui text-[9px] px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 hidden sm:inline-flex",
            statusCls,
          )}>
            {c.status}
          </span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <SystemStatus answer={answer} />
          <div className="flex items-center gap-1.5">
          {rt.tigergraph && <RuntimePill label="TG"  value={rt.tigergraph} />}
          {rt.mcp        && <RuntimePill label="MCP" value={rt.mcp} />}
          {rt.llm        && <RuntimePill label="LLM" value={rt.llm} />}
          <button onClick={onBack} aria-label="Back" className="ml-1 p-1.5 rounded hover:bg-white/05 text-[#8B8D96]">
            <RefreshCw size={12} />
          </button>
          </div>
        </div>
      </header>

      {/* ── MAIN BODY (flex row, fills remaining height) ─────────── */}
      <div className="flex flex-1 min-h-0 flex-col overflow-y-auto md:flex-row md:overflow-hidden">

        {/* LEFT: investigation lifecycle and case signal */}
        <aside className="hidden md:flex flex-col w-64 xl:w-72 border-r hairline overflow-y-auto shrink-0 bg-[var(--surface)]">
          <WorkflowRail answer={answer} />
          <CaseHeader answer={answer} />
          <div className="px-4 pb-4">
            <CaseMemoryPanel answer={answer} />
          </div>
        </aside>

        {/* CENTER: graph */}
        <div className="flex min-h-[540px] flex-1 min-w-0 flex-col overflow-hidden tiger-noise md:min-h-0">
          <AssessmentPanel answer={answer} />
          <div className="flex items-center justify-between px-4 py-3 border-b hairline bg-[var(--ink)]/50">
            <div>
              <div className="eyebrow text-[var(--quiet)]">Evidence graph</div>
              <div className="forensic text-[10px] text-white/45 mt-1">LIVE RELATIONSHIP MAP // {answer.evidence_summary?.item_count ?? c.evidence.length} ITEMS // {answer.evidence_summary?.independent_signal_count ?? "Not returned"} SIGNALS</div>
            </div>
            <div className="hidden sm:flex items-center gap-3 forensic text-[9px] text-white/35">
              <span className="text-[var(--cyan)]">DIRECT</span><span>HISTORICAL</span><span>PROVENANCE</span>
            </div>
          </div>
          <div className="flex-1 relative min-h-[180px]">
            <EvidenceGraph3D caseId={answer.case_id} evidence={c.evidence} onNodeClick={handleNodeClick} />
            <GraphInspector entityId={focusedEntity} evidence={c.evidence} onClose={() => setFocusedEntity(null)} />
          </div>
        </div>

        {/* RIGHT: tabs — always visible on lg+, slide-over on smaller */}
        <div className="flex w-full shrink-0 flex-col border-t border-white/08 overflow-hidden md:w-72 md:border-l md:border-t-0 xl:w-80">
          {/* Tab bar */}
          <div className="flex items-center gap-0 border-b border-white/08 px-1 shrink-0 overflow-x-auto bg-[#14151A]/80">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "px-2.5 py-2.5 font-mono-ui text-[9px] tracking-wider shrink-0 border-b-2 transition-colors whitespace-nowrap",
                  activeTab === t.id
                    ? "border-[#D9A441] text-[#D9A441]"
                    : "border-transparent text-[#8B8D96] hover:text-[#F2F1ED]",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content — scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {activeTab === "evidence"  && <EvidenceStream evidence={c.evidence} focusedEntityId={focusedEntity} />}
            {activeTab === "reasoning" && <ReasoningTab answer={answer} />}
            {activeTab === "policy"    && <PolicyTab answer={answer} />}
            {activeTab === "history"   && <HistoryTab answer={answer} />}
            {activeTab === "audit"     && <AuditTab entries={audit} />}
            {activeTab === "mcp"       && <MCPTrace answer={answer} audit={audit} />}
            {activeTab === "sar"       && <SARPanel sar={answer.sar} />}
            {activeTab === "actions"   && <ActionCenter answer={answer} />}
          </div>
        </div>
      </div>

      {/* ── BOTTOM DRAWER ────────────────────────────────────────── */}
      <div
        className="hidden border-t border-white/08 shrink-0 bg-[#14151A]/60 transition-all duration-250 md:block"
        style={{ height: drawerOpen ? 180 : 36 }}
      >
        <button
          onClick={() => setDrawerOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/03 transition-colors"
          aria-expanded={drawerOpen}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono-ui text-[9px] text-[#8B8D96]/60 uppercase tracking-wider">
              EVIDENCE STREAM // PROVENANCE
            </span>
            <span className="font-mono-ui text-[8px] text-[#8B8D96]/35">
              {c.evidence.length} items
            </span>
          </div>
          {drawerOpen
            ? <ChevronDown size={11} className="text-[#8B8D96]/40" aria-hidden />
            : <ChevronRight size={11} className="text-[#8B8D96]/40 rotate-90" aria-hidden />}
        </button>

        {drawerOpen && (
          <div className="overflow-y-auto px-2" style={{ height: 144 }}>
            <EvidenceStream evidence={c.evidence} focusedEntityId={focusedEntity} />
          </div>
        )}
      </div>

      {/* Mobile: accordion for case details */}
      <div className="md:hidden border-t border-white/08 shrink-0 bg-[#14151A]/60">
        <details>
          <summary className="flex items-center justify-between px-4 py-2 font-mono-ui text-[9px] text-[#8B8D96]/60 uppercase tracking-wider cursor-pointer list-none">
            <span>CASE DETAILS</span>
            <ChevronDown size={11} className="text-[#8B8D96]/40" />
          </summary>
          <div className="max-h-56 overflow-y-auto border-t border-white/08">
            <CaseHeader answer={answer} />
          </div>
        </details>
      </div>
    </div>
  )
}
