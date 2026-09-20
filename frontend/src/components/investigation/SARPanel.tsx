"use client"
import { motion } from "framer-motion"
import type { SAR } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

export function SARPanel({ sar }: { sar: SAR }) {
  return (
    <div className="space-y-3">
      {/* Filing status */}
      <div className={cn(
        "rounded border p-3",
        sar.file
          ? "border-red-700/40 bg-red-950/15"
          : "border-white/5 bg-[#0D1117]/60"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <div className={cn("w-2.5 h-2.5 rounded-full", sar.file ? "bg-red-500" : "bg-slate-700")} />
          <span className={cn("mono text-xs font-semibold", sar.file ? "text-red-400" : "text-slate-500")}>
            {sar.file ? "SAR — FILE REPORT" : "SAR NOT REQUIRED"}
          </span>
        </div>
        <p className="text-slate-500 text-[10px] leading-relaxed">{sar.reason}</p>
      </div>

      {sar.file && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-white/5 bg-[#0D1117]/60 p-2">
              <div className="mono text-[8px] text-slate-600 mb-0.5">TOTAL AMOUNT</div>
              <div className="mono text-xs text-red-300">{formatCurrency(sar.total_amount_usd)}</div>
            </div>
            <div className="rounded border border-white/5 bg-[#0D1117]/60 p-2">
              <div className="mono text-[8px] text-slate-600 mb-0.5">ACTIVITY DATES</div>
              <div className="mono text-[10px] text-slate-300">
                {sar.activity_dates.join(" → ") || "—"}
              </div>
            </div>
          </div>

          {/* Subjects */}
          {sar.subjects.length > 0 && (
            <div className="rounded border border-white/5 bg-[#0D1117]/60 p-2">
              <div className="mono text-[8px] text-slate-600 mb-1">SUBJECTS</div>
              <div className="flex flex-wrap gap-1">
                {sar.subjects.map(s => (
                  <span key={s} className="mono text-[9px] px-1.5 py-0.5 rounded bg-red-950/30 text-red-600/70 border border-red-900/20">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Narrative */}
          {sar.narrative && (
            <div className="rounded border border-red-900/20 bg-red-950/10 p-3">
              <div className="mono text-[8px] text-red-800 mb-2 tracking-widest">SAR NARRATIVE</div>
              <p className="text-slate-400 text-[10px] leading-relaxed whitespace-pre-wrap">
                {sar.narrative}
              </p>
            </div>
          )}

          <div className="mono text-[8px] text-red-900/60 pt-1">
            This SAR is based solely on evidence retrieved during investigation.
            Filing requires L2 (Fraud Manager) approval per policy.
          </div>
        </motion.div>
      )}
    </div>
  )
}
