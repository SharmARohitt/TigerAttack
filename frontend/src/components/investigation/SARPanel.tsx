"use client"
import { FileText } from "lucide-react"
import { formatUSD } from "@/lib/utils"
import type { SAR } from "@/lib/types"

export function SARPanel({ sar }: { sar: SAR }) {
  if (!sar) {
    return (
      <div className="p-4 font-mono-ui text-xs text-[#8B8D96]/40">
        SAR data not available
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Filing status */}
      <div className={`rounded-lg border p-4 ${
        sar.file
          ? "border-[#E5484D]/40 bg-[#E5484D]/06"
          : "border-[#3DD68C]/30 bg-[#3DD68C]/05"
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2.5 h-2.5 rounded-full ${sar.file ? "bg-[#E5484D]" : "bg-[#3DD68C]"}`} />
          <span className={`font-mono-ui text-xs font-semibold tracking-wider ${
            sar.file ? "text-[#E5484D]" : "text-[#3DD68C]"
          }`}>
            {sar.file ? "SAR — FILE REPORT" : "SAR NOT REQUIRED"}
          </span>
        </div>
        <p className="text-[11px] text-[#F2F1ED]/60 leading-relaxed">{sar.reason}</p>
      </div>

      {sar.file && (
        <>
          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-white/08 bg-[#14151A]/60 px-2 py-2">
              <div className="font-mono-ui text-[8px] text-[#8B8D96]/50 mb-0.5">TOTAL AMOUNT</div>
              <div className="font-mono-ui text-sm text-[#E5484D]">{formatUSD(sar.total_amount_usd)}</div>
            </div>
            <div className="rounded border border-white/08 bg-[#14151A]/60 px-2 py-2">
              <div className="font-mono-ui text-[8px] text-[#8B8D96]/50 mb-0.5">ACTIVITY DATES</div>
              <div className="font-mono-ui text-[10px] text-[#F2F1ED]">
                {sar.activity_dates?.join(" → ") || "—"}
              </div>
            </div>
          </div>

          {/* Subjects */}
          {sar.subjects?.length > 0 && (
            <div className="rounded border border-white/08 bg-[#14151A]/60 px-3 py-2">
              <div className="font-mono-ui text-[8px] text-[#8B8D96]/50 mb-1.5">SUBJECTS</div>
              <div className="flex flex-wrap gap-1">
                {sar.subjects.map(s => (
                  <span key={s} className="font-mono-ui text-[8px] px-1.5 py-0.5 rounded bg-[#E5484D]/10 border border-[#E5484D]/20 text-[#E5484D]/80">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Narrative */}
          {sar.narrative && (
            <div className="rounded border border-[#E5484D]/20 bg-[#E5484D]/04">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5484D]/15">
                <FileText size={11} className="text-[#E5484D]/60" aria-hidden />
                <span className="font-mono-ui text-[8px] text-[#E5484D]/60 uppercase tracking-wider">
                  SAR NARRATIVE
                </span>
              </div>
              <div className="px-3 py-3 max-h-64 overflow-y-auto">
                <pre className="font-mono-ui text-[10px] text-[#F2F1ED]/65 whitespace-pre-wrap leading-relaxed">
                  {sar.narrative}
                </pre>
              </div>
            </div>
          )}

          <p className="font-mono-ui text-[8px] text-[#E5484D]/40">
            SAR filing requires L2 (Fraud Manager) approval per policy. All content sourced from investigation evidence only.
          </p>
        </>
      )}
    </div>
  )
}
