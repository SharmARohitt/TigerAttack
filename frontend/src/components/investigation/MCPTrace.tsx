"use client"

import { Activity, Check, CircleAlert, Terminal } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { AuditEntry, CaseAnswer } from "@/lib/types"

function value(entry: AuditEntry, key: string): unknown {
  return entry[key]
}

export function MCPTrace({ answer, audit }: { answer: CaseAnswer; audit: AuditEntry[] }) {
  const events = audit.filter(entry => String(entry.action ?? "").toLowerCase().includes("mcp"))
  const mcpStatus = answer.runtime?.mcp ?? "NOT RETURNED"
  const available = mcpStatus === "AVAILABLE" || mcpStatus === "CONNECTED"

  return (
    <div className="p-4 space-y-4">
      <div className="border hairline bg-[var(--ink)]/70 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-[var(--cyan)]" aria-hidden />
            <span className="eyebrow text-[var(--cyan)]">TigerGraph MCP</span>
          </div>
          <span className={cn("forensic text-[9px]", available ? "status-live" : "text-[var(--yellow-fx)]")}>{mcpStatus}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Metric label="TOTAL TOOL CALLS" value={answer.tool_calls} />
          <Metric label="AUDIT EVENTS" value={events.length} />
        </div>
      </div>

      {events.length === 0 ? (
        <div className="border hairline p-4 text-center">
          <CircleAlert size={16} className="mx-auto mb-2 text-white/25" aria-hidden />
          <div className="forensic text-[10px] text-white/40">NO MCP AUDIT EVENT RETURNED</div>
          <p className="text-[10px] text-white/25 mt-1">The backend did not expose a trace entry for this case.</p>
        </div>
      ) : events.map((entry, index) => {
        const status = String(entry.status ?? "not returned").toUpperCase()
        const queries = value(entry, "queries")
        const calls = value(entry, "calls")
        const successful = value(entry, "successful_calls")
        return (
          <motion.div
            key={`${String(entry.timestamp ?? index)}-${index}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.08, 0.4) }}
            className="border hairline bg-[var(--surface)] p-3"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Check size={12} className={status === "COMPLETE" ? "text-[var(--green-fx)]" : "text-[var(--red-fx)]"} aria-hidden />
                <span className="forensic text-[10px] text-white/75">mcp_graph_access</span>
              </div>
              <span className={cn("forensic text-[9px]", status === "COMPLETE" ? "text-[var(--green-fx)]" : "text-[var(--red-fx)]")}>{status}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Metric label="RESULTS" value={calls ?? "Not returned"} />
              <Metric label="SUCCESSFUL" value={successful ?? "Not returned"} />
            </div>
            {Array.isArray(queries) && queries.length > 0 && (
              <div>
                <div className="eyebrow text-[var(--quiet)] mb-2">Verified query names</div>
                <div className="space-y-1">
                  {queries.map((query, queryIndex) => (
                    <div key={`${String(query)}-${queryIndex}`} className="flex items-center gap-2 forensic text-[9px] text-[var(--cyan)]/80">
                      <Activity size={10} aria-hidden />{String(query)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: unknown }) {
  return <div className="border hairline bg-white/[.025] px-2 py-2"><div className="eyebrow text-[var(--quiet)] text-[8px]">{label}</div><div className="forensic text-[11px] text-[var(--text)] mt-1">{String(value)}</div></div>
}
