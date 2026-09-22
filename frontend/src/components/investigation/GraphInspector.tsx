"use client"

import { ExternalLink, GitBranch, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EvidenceItem } from "@/lib/types"

export function GraphInspector({ entityId, evidence, onClose }: { entityId: string | null; evidence: EvidenceItem[]; onClose: () => void }) {
  if (!entityId) return null
  const related = evidence.filter(item => item.entity_ids.includes(entityId))

  return (
    <aside className="absolute right-4 top-4 z-20 w-[min(19rem,calc(100%-2rem))] border hairline bg-[var(--ink)]/95 shadow-2xl backdrop-blur-md" aria-label={`Inspector for ${entityId}`}>
      <div className="flex items-start justify-between gap-3 border-b hairline px-3 py-3">
        <div>
          <div className="eyebrow text-[var(--cyan)]">Selected entity</div>
          <div className="forensic mt-1 text-sm text-[var(--text)]">{entityId}</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close entity inspector" className="p-1 text-white/40 hover:text-white"><X size={14} /></button>
      </div>
      <div className="space-y-4 p-3">
        <div className="grid grid-cols-2 gap-2">
          <Metric label="RELATED EVIDENCE" value={related.length} />
          <Metric label="RELATIONSHIPS" value={new Set(related.flatMap(item => item.entity_ids).filter(id => id !== entityId)).size} />
        </div>
        {related.length === 0 ? (
          <div className="border hairline p-3 forensic text-[9px] text-white/40">No evidence item returned for this entity.</div>
        ) : related.map((item, index) => (
          <div key={`${item.ref}-${index}`} className="border hairline bg-white/[.025] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className={cn("eyebrow", item.source === "graph" ? "text-[var(--cyan)]" : "text-[var(--amber)]")}>{item.source}</span>
              <GitBranch size={12} className="text-white/25" aria-hidden />
            </div>
            <p className="mt-2 text-[11px] leading-5 text-white/75">{item.claim}</p>
            <div className="mt-3 border-t hairline pt-2 space-y-1">
              <Meta label="QUERY / REF" value={item.ref || "Not returned"} />
              <Meta label="ENTITY IDS" value={item.entity_ids.join(", ") || "Not returned"} />
              <Meta label="GROUNDING" value="Verified from returned evidence" />
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 forensic text-[8px] text-white/30"><ExternalLink size={10} aria-hidden /> Provenance is preserved from the backend response.</div>
      </div>
    </aside>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="border hairline bg-white/[.025] px-2 py-2"><div className="eyebrow text-[8px] text-[var(--quiet)]">{label}</div><div className="forensic mt-1 text-[11px] text-[var(--text)]">{value}</div></div>
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="flex gap-2 forensic text-[8px]"><span className="text-[var(--quiet)] shrink-0">{label}</span><span className="truncate text-white/55">{value}</span></div>
}
