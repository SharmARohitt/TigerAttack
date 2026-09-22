"use client"
import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { CaseAnswer, PolicyEvidenceItem } from "@/lib/types"

function PolicyCard({ item, source }: { item: PolicyEvidenceItem; source: string }) {
  const [open, setOpen] = useState(false)
  const id    = item.rule_id ?? item.typology_id ?? item.doc_id ?? "—"
  const title = item.title ?? item.name ?? "—"
  const body  = item.text ?? item.description ?? ""

  return (
    <div
      className="rounded-lg border border-white/08 bg-[#14151A]/60 overflow-hidden cursor-pointer"
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-start gap-3 px-3 py-3">
        {/* Badge */}
        <span className="font-mono-ui text-[8px] px-1.5 py-0.5 rounded border border-[#D9A441]/30 bg-[#D9A441]/08 text-[#D9A441] shrink-0 mt-0.5 uppercase tracking-wider">
          {id}
        </span>

        <div className="flex-1 min-w-0">
          <div className="text-xs text-[#F2F1ED]/90 font-medium leading-snug">{title}</div>
          <div className="font-mono-ui text-[8px] text-[#8B8D96]/40 mt-0.5 uppercase tracking-wider">{source}</div>
          {!open && body && (
            <p className="text-[10px] text-[#8B8D96]/60 mt-1 line-clamp-1">{body}</p>
          )}
        </div>

        <span className="text-[#8B8D96]/40 shrink-0 mt-0.5" aria-hidden>
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </span>
      </div>

      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-white/06 pt-2">
          {body && (
            <p className="text-[11px] text-[#F2F1ED]/70 leading-relaxed">{body}</p>
          )}
          {item.triggers && item.triggers.length > 0 && (
            <div>
              <div className="font-mono-ui text-[8px] text-[#8B8D96]/50 uppercase tracking-wider mb-1">TRIGGERS</div>
              <div className="flex flex-wrap gap-1">
                {item.triggers.map((t, i) => (
                  <span key={i} className="font-mono-ui text-[8px] px-1.5 py-0.5 rounded bg-white/05 border border-white/10 text-[#8B8D96]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {item.actions && item.actions.length > 0 && (
            <div>
              <div className="font-mono-ui text-[8px] text-[#8B8D96]/50 uppercase tracking-wider mb-1">ACTIONS</div>
              <div className="flex flex-wrap gap-1">
                {item.actions.map((a, i) => (
                  <span key={i} className="font-mono-ui text-[8px] px-1.5 py-0.5 rounded bg-[#4FD1E8]/08 border border-[#4FD1E8]/20 text-[#4FD1E8]/80">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
          {item.indicators && item.indicators.length > 0 && (
            <div>
              <div className="font-mono-ui text-[8px] text-[#8B8D96]/50 uppercase tracking-wider mb-1">INDICATORS</div>
              <ul className="space-y-0.5">
                {item.indicators.map((ind, i) => (
                  <li key={i} className="text-[10px] text-[#8B8D96] flex items-start gap-1.5">
                    <span className="text-[#D9A441]/50 mt-0.5 shrink-0">◆</span>{ind}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function PolicyTab({ answer }: { answer: CaseAnswer }) {
  const policy   = answer.policy_evidence   ?? []
  const typology = answer.typology_evidence ?? []
  const total    = policy.length + typology.length

  if (!total) {
    return (
      <div className="flex items-center justify-center h-32 font-mono-ui text-xs text-[#8B8D96]/40 p-4">
        No policy evidence retrieved for this case
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {policy.length > 0 && (
        <div>
          <div className="font-mono-ui text-[9px] tracking-wider text-[#8B8D96]/60 uppercase mb-2">
            POLICY RULES ({policy.length})
          </div>
          <div className="space-y-1.5">
            {policy.map((item, i) => (
              <PolicyCard key={i} item={item} source="policy_evidence" />
            ))}
          </div>
        </div>
      )}
      {typology.length > 0 && (
        <div>
          <div className="font-mono-ui text-[9px] tracking-wider text-[#8B8D96]/60 uppercase mb-2">
            FRAUD TYPOLOGY ({typology.length})
          </div>
          <div className="space-y-1.5">
            {typology.map((item, i) => (
              <PolicyCard key={i} item={item} source="typology_evidence" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
