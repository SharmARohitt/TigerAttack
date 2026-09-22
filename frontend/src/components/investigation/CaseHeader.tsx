"use client"
import { maskId, formatUSD, patternLabel, statusColor } from "@/lib/utils"
import { VerdictBadge } from "@/components/ui/VerdictBadge"
import type { CaseAnswer } from "@/lib/types"

interface Props { answer: CaseAnswer }

function Field({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <div className="font-mono-ui text-[9px] text-[#8B8D96]/60 tracking-wider uppercase mb-0.5">{label}</div>
      <div className={`text-sm text-[#F2F1ED] ${mono ? "font-mono-ui" : ""}`}>
        {value ?? "—"}
      </div>
    </div>
  )
}

export function CaseHeader({ answer }: Props) {
  const c = answer.case
  const customerId = c.evidence.flatMap(e => e.entity_ids).find(id => /^C\d+$/.test(id))

  return (
    <div className="space-y-4 p-4">
      {/* Case ID */}
      <div>
        <div className="font-mono-ui text-[9px] text-[#8B8D96]/60 tracking-wider uppercase mb-0.5">CASE ID</div>
        <div className="font-mono-ui text-base text-[#D9A441] font-semibold tracking-wider">
          {answer.case_id}
        </div>
      </div>

      {/* Verdict */}
      <VerdictBadge
        verdict={c.verdict}
        probability={c.fraud_probability}
        pattern={c.pattern}
        className="w-full"
      />

      {/* Status */}
      <div>
        <div className="font-mono-ui text-[9px] text-[#8B8D96]/60 tracking-wider uppercase mb-0.5">STATUS</div>
        <span className={`font-mono-ui text-xs uppercase tracking-wider ${statusColor(c.status)}`}>
          {c.status}
        </span>
      </div>

      <div className="border-t border-white/08" />

      {/* Metrics */}
      <div className="space-y-3">
        <Field label="EXPOSURE"    value={formatUSD(c.exposure_usd)} mono />
        <Field label="PATTERN"     value={patternLabel(c.pattern)} mono />
        <Field label="CARD ID"     value={maskId(answer.case_id + "-K1", 6)} mono />
        {customerId && <Field label="CUSTOMER"  value={maskId(customerId, 5)} mono />}
        <Field label="TXN (FIRST)" value={c.first_suspicious_txn_id || c.affected_txn_ids[0] || "—"} mono />
        <Field label="TOOL CALLS"  value={String(answer.tool_calls)} mono />
        <Field label="LATENCY"     value={`${answer.latency_s?.toFixed(2) ?? "—"}s`} mono />
      </div>

      {/* Affected txns */}
      {c.affected_txn_ids.length > 0 && (
        <div>
          <div className="font-mono-ui text-[9px] text-[#8B8D96]/60 tracking-wider uppercase mb-1.5">
            AFFECTED TRANSACTIONS
          </div>
          <div className="flex flex-wrap gap-1">
            {c.affected_txn_ids.slice(0, 6).map(id => (
              <span key={id} className="font-mono-ui text-[9px] px-1.5 py-0.5 rounded bg-[#D9A441]/08 border border-[#D9A441]/20 text-[#D9A441]/80">
                {id}
              </span>
            ))}
            {c.affected_txn_ids.length > 6 && (
              <span className="font-mono-ui text-[9px] text-[#8B8D96]/50">+{c.affected_txn_ids.length - 6}</span>
            )}
          </div>
        </div>
      )}

      {/* Stop reason */}
      {answer.stop_reason && (
        <div>
          <div className="font-mono-ui text-[9px] text-[#8B8D96]/60 tracking-wider uppercase mb-1">STOP REASON</div>
          <p className="font-mono-ui text-[9px] text-[#8B8D96] leading-relaxed">{answer.stop_reason}</p>
        </div>
      )}
    </div>
  )
}
