"use client"
import { useEffect, useRef, useMemo } from "react"
import type { EvidenceItem } from "@/lib/types"

interface Node { id: string; label: string; type: string; x: number; y: number; vx: number; vy: number }
interface Edge { s: string; t: string }

const TYPE_COLORS: Record<string, string> = {
  transaction: "#F59E0B",
  card:        "#06B6D4",
  customer:    "#8B5CF6",
  case:        "#EF4444",
  document:    "#64748B",
  customer_ev: "#10B981",
  graph:       "#06B6D4",
  unknown:     "#475569",
}

function inferNodeType(id: string, source: string): string {
  if (id.startsWith("C") && id.includes("-K")) return "card"
  if (id.startsWith("C") && /^C\d+$/.test(id)) return "customer"
  if (id.startsWith("CC-") || id.startsWith("HHG-")) return "case"
  if (/^\d{7,}$/.test(id)) return "transaction"
  return source === "graph" ? "graph" : source === "customer" ? "customer_ev" : "document"
}

function buildGraph(evidence: EvidenceItem[]) {
  const nodes = new Map<string, Node>()
  const edges: Edge[] = []
  const W = 680, H = 380, cx = W / 2, cy = H / 2

  // Central node — the investigation
  nodes.set("__inv__", { id: "__inv__", label: "INVESTIGATION", type: "transaction", x: cx, y: cy, vx: 0, vy: 0 })

  for (const ev of evidence) {
    for (const eid of ev.entity_ids) {
      if (!nodes.has(eid)) {
        const angle = Math.random() * Math.PI * 2
        const dist  = 80 + Math.random() * 120
        nodes.set(eid, {
          id: eid, label: eid.length > 12 ? eid.slice(0, 10) + "…" : eid,
          type: inferNodeType(eid, ev.source),
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          vx: 0, vy: 0,
        })
      }
      if (!edges.some(e => e.s === "__inv__" && e.t === eid))
        edges.push({ s: "__inv__", t: eid })
    }
    // edges between entity_ids in same evidence
    for (let i = 0; i < ev.entity_ids.length - 1; i++) {
      const a = ev.entity_ids[i], b = ev.entity_ids[i + 1]
      if (!edges.some(e => (e.s === a && e.t === b) || (e.s === b && e.t === a)))
        edges.push({ s: a, t: b })
    }
  }

  return { nodes: Array.from(nodes.values()), edges }
}

export function EvidenceGraph({ evidence }: { evidence: EvidenceItem[]; caseId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef  = useRef<number>(0)
  const graphRef  = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null)
  const tickRef   = useRef(0)

  const builtGraph = useMemo(() => buildGraph(evidence.slice(0, 20)), [evidence])

  useEffect(() => {
    graphRef.current = { nodes: builtGraph.nodes.map(n => ({ ...n })), edges: builtGraph.edges }
  }, [builtGraph])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    function resize() {
      if (!canvas) return
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener("resize", resize)

    function simulate(nodes: Node[], edges: Edge[]) {
      const W = canvas!.offsetWidth || 680
      const H = canvas!.offsetHeight || 380
      const cx = W / 2, cy = H / 2

      // repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x
          const dy = nodes[j].y - nodes[i].y
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.01
          if (dist < 120) {
            const f = (120 - dist) / dist * 0.4
            nodes[i].vx -= dx * f * 0.1
            nodes[i].vy -= dy * f * 0.1
            nodes[j].vx += dx * f * 0.1
            nodes[j].vy += dy * f * 0.1
          }
        }
        // center gravity for non-center nodes
        if (nodes[i].id !== "__inv__") {
          nodes[i].vx += (cx - nodes[i].x) * 0.002
          nodes[i].vy += (cy - nodes[i].y) * 0.002
        }
        // edge spring
        for (const e of edges) {
          if (e.s === nodes[i].id || e.t === nodes[i].id) {
            const other = nodes.find(n => n.id === (e.s === nodes[i].id ? e.t : e.s))
            if (other) {
              const dx = other.x - nodes[i].x
              const dy = other.y - nodes[i].y
              const dist = Math.sqrt(dx * dx + dy * dy) + 0.01
              const target = nodes[i].id === "__inv__" ? 140 : 90
              const f = (dist - target) / dist * 0.05
              nodes[i].vx += dx * f
              nodes[i].vy += dy * f
            }
          }
        }
        // dampen + clamp
        nodes[i].vx *= 0.85
        nodes[i].vy *= 0.85
        nodes[i].x += nodes[i].vx
        nodes[i].y += nodes[i].vy
        nodes[i].x = Math.max(30, Math.min(W - 30, nodes[i].x))
        nodes[i].y = Math.max(30, Math.min(H - 30, nodes[i].y))
      }
    }

    function draw() {
      if (!canvas || !ctx || !graphRef.current) return
      tickRef.current++
      const { nodes, edges } = graphRef.current
      const W = canvas.width, H = canvas.height

      ctx.clearRect(0, 0, W, H)

      // Simulate physics
      simulate(nodes, edges)

      const nodeMap = new Map(nodes.map(n => [n.id, n]))

      // Edges
      for (let i = 0; i < edges.length; i++) {
        const a = nodeMap.get(edges[i].s), b = nodeMap.get(edges[i].t)
        if (!a || !b) continue
        const phase = (tickRef.current * 0.8 + i * 30) % 60
        const alpha = 0.15 + 0.1 * Math.sin(tickRef.current * 0.02 + i)
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.strokeStyle = "#06B6D4"
        ctx.lineWidth = 0.75
        ctx.setLineDash([4, 6])
        ctx.lineDashOffset = -phase * 0.3
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
        ctx.restore()
      }

      // Nodes
      for (const n of nodes) {
        const col = TYPE_COLORS[n.type] ?? "#475569"
        const isCenter = n.id === "__inv__"
        const r = isCenter ? 18 : 8

        // Glow
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3)
        glow.addColorStop(0, col + "33")
        glow.addColorStop(1, "transparent")
        ctx.fillStyle = glow
        ctx.beginPath(); ctx.arc(n.x, n.y, r * 3, 0, Math.PI * 2); ctx.fill()

        // Circle
        ctx.fillStyle = col + (isCenter ? "CC" : "99")
        ctx.strokeStyle = col
        ctx.lineWidth = isCenter ? 1.5 : 1
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fill(); ctx.stroke()

        // Label
        ctx.fillStyle = isCenter ? "#FCD34D" : "#94A3B8"
        ctx.font = `${isCenter ? 9 : 7}px 'IBM Plex Mono', monospace`
        ctx.textAlign = "center"
        ctx.fillText(n.label, n.x, n.y + r + 10)
      }

      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <div className="relative w-full h-full min-h-[340px]">
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex flex-wrap gap-2">
        {Object.entries(TYPE_COLORS).slice(0, 5).map(([type, col]) => (
          <div key={type} className="flex items-center gap-1 text-[9px] mono text-slate-500">
            <div className="w-2 h-2 rounded-full" style={{ background: col }} />
            {type}
          </div>
        ))}
      </div>
    </div>
  )
}
