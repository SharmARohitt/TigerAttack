"use client"
import { useState, useCallback } from "react"
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { RuntimePill } from "@/components/ui/RuntimePill"
import { StateMachineStrip } from "./StateMachineStrip"
import { CaseHeader } from "./CaseHeader"
import { CaseMemoryPanel } from "./CaseMemoryPanel"
import { EvidenceGraph } from "./EvidenceGraph"
import { EvidenceStream } from "./EvidenceStream"
import { ReasoningTab } from "./ReasoningTab"
import { PolicyTab } from "./PolicyTab"
import { HistoryTab } from "./HistoryTab"
import { AuditTab } from "./AuditTab"
import { SARPanel } from "./SARPanel"
import { ActionCenter } from "./ActionCenter"
import type { CaseAnswer, AuditEntry } from "@/lib/types"

const TABS = [
  { id: "reasoning", label: "REASONING" },
  { id: "evidence",  label: "EVIDENCE" },
  { id: "policy",    label: "POLICY" },
  { id: "history",   label: "HISTORY" },
  { id: "audit",     label: "AUDIT" },
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
      className="flex flex-col bg-[#0A0A0C] scanlines"
      style={{ height: "100dvh", overflow: "hidden" }}
    >
      {/* ── TOP BAR ──────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 border-b border-white/08 shrink-0"
              style={{ height: 48 }}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="font-mono-ui text-[10px] text-[#8B8D96] hover:text-[#F2F1ED] transition-colors flex items-center gap-1 shrink-0"
            aria-label="Return to landing"
          >
            ← <span className="hidden sm:inline">TIGER EFFECT</span>
          </button>
          <div className="w-px h-4 bg-white/10 shrink-0" aria-hidden />
          <span className="font-mono-ui text-sm text-[#D9A441] font-semibold tracking-wider shrink-0">
            {answer.case_id}
          </span>
          <span className={cn(
            "font-mono-ui text-[9px] px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 hidden sm:inline-flex",
            statusCls,
          )}>
            {c.status}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {rt.tigergraph && <RuntimePill label="TG"  value={rt.tigergraph} />}
          {rt.mcp        && <RuntimePill label="MCP" value={rt.mcp} />}
          {rt.llm        && <RuntimePill label="LLM" value={rt.llm} />}
          <button onClick={onBack} aria-label="Back" className="ml-1 p-1.5 rounded hover:bg-white/05 text-[#8B8D96]">
            <RefreshCw size={12} />
          </button>
        </div>
      </header>

      {/* ── STATE MACHINE STRIP ──────────────────────────────────── */}
      <div className="px-4 py-2 border-b border-white/08 bg-[#14151A]/40 shrink-0 overflow-x-auto">
        <StateMachineStrip answer={answer} />
      </div>

      {/* ── MAIN BODY (flex row, fills remaining height) ─────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT: case header — hidden on mobile */}
        <aside className="hidden md:flex flex-col w-56 xl:w-64 border-r border-white/08 overflow-y-auto shrink-0">
          <CaseHeader answer={answer} />
          <div className="px-4 pb-4">
            <CaseMemoryPanel answer={answer} />
          </div>
        </aside>

        {/* CENTER: graph */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
          <div className="flex-1 relative min-h-[180px]">
            <EvidenceGraph evidence={c.evidence} onNodeClick={handleNodeClick} />
          </div>
        </div>

        {/* RIGHT: tabs — always visible on lg+, slide-over on smaller */}
        <div className="flex flex-col border-l border-white/08 shrink-0 w-72 xl:w-80 overflow-hidden">
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
            {activeTab === "sar"       && <SARPanel sar={answer.sar} />}
            {activeTab === "actions"   && <ActionCenter answer={answer} />}
          </div>
        </div>
      </div>

      {/* ── BOTTOM DRAWER ────────────────────────────────────────── */}
      <div
        className="border-t border-white/08 shrink-0 bg-[#14151A]/60 transition-all duration-250"
        style={{ height: drawerOpen ? 180 : 36 }}
      >
        <button
          onClick={() => setDrawerOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/03 transition-colors"
          aria-expanded={drawerOpen}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono-ui text-[9px] text-[#8B8D96]/60 uppercase tracking-wider">
              EVIDENCE STREAM
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
