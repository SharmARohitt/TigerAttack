"use client"

import dynamic from "next/dynamic"
import { useMemo, useState } from "react"
import type { EvidenceItem, GraphNode } from "@/lib/types"

const Scene = dynamic(() => import("./EvidenceGraph3DScene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center forensic text-[10px] text-white/35">GRAPH ENGINE INITIALISING</div>,
})

type Filter = "all" | GraphNode["type"]

function inferType(id: string): GraphNode["type"] {
  if (/^[A-Z]{2}-\d+$/.test(id) || id.startsWith("HHG-")) return "case"
  if (id.startsWith("C") && id.includes("-K")) return "card"
  if (/^C\d+$/.test(id)) return "customer"
  if (/^\d{7,}$/.test(id)) return "transaction"
  if (/device|proxy/i.test(id)) return "device"
  return "evidence"
}

export function EvidenceGraph3D({ caseId, evidence, onNodeClick }: { caseId: string; evidence: EvidenceItem[]; onNodeClick?: (id: string) => void }) {
  const [filter, setFilter] = useState<Filter>("all")
  const graph = useMemo(() => {
    const nodes = new Map<string, GraphNode>([[caseId, { id: caseId, label: caseId, type: "case" }]])
    const edges: Array<[string, string]> = []
    const seen = new Set<string>()
    const visible = filter === "all" ? evidence : evidence.filter(item => item.entity_ids.some(id => inferType(id) === filter))

    visible.slice(0, 30).forEach(item => {
      item.entity_ids.forEach((id, index) => {
        if (!id) return
        if (!nodes.has(id)) nodes.set(id, { id, label: id.length > 13 ? `${id.slice(0, 11)}...` : id, type: inferType(id) })
        const key = `${caseId}:${id}`
        if (!seen.has(key)) { seen.add(key); edges.push([caseId, id]) }
        const next = item.entity_ids[index + 1]
        if (next) {
          const relation = [id, next].sort().join(":")
          if (!seen.has(relation)) { seen.add(relation); edges.push([id, next]) }
        }
      })
    })

    return { nodes: [...nodes.values()], edges }
  }, [caseId, evidence, filter])

  return (
    <div className="relative h-full min-h-[260px] w-full">
      <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-24px)] flex-wrap gap-1.5" aria-label="Graph filters">
        {(["all", "transaction", "customer", "card", "device", "case"] as const).map(option => (
          <button key={option} type="button" onClick={() => setFilter(option)} className={`forensic border px-2 py-1 text-[8px] uppercase tracking-[.1em] transition-colors ${filter === option ? "border-[var(--amber)]/60 bg-[var(--amber)]/10 text-[var(--amber-bright)]" : "border-white/10 bg-[var(--ink)]/65 text-white/35 hover:text-white/75"}`}>
            {option === "all" ? "ALL ENTITIES" : option}
          </button>
        ))}
      </div>
      <Scene nodes={graph.nodes} edges={graph.edges} onNodeClick={onNodeClick} />
      <div className="absolute bottom-2 left-3 forensic text-[9px] text-white/35">{graph.nodes.length - 1} entities // {graph.edges.length} relationships</div>
    </div>
  )
}
