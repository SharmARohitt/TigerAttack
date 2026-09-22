"use client"
/**
 * d3-force evidence graph.
 * Nodes/edges built ONLY from the backend evidence array — no fabrication.
 */
import { useEffect, useRef, useMemo, useCallback } from "react"
import type { EvidenceItem, GraphNode, GraphEdge } from "@/lib/types"

const TYPE_COLORS: Record<string, string> = {
  transaction: "#4FD1E8",
  card:        "#D9A441",
  customer:    "#F2F1ED",
  device:      "#8B8D96",
  case:        "#E5484D",
  policy:      "#E8C547",
  evidence:    "#3DD68C",
}

function inferType(id: string): GraphNode["type"] {
  if (!id) return "evidence"
  if (/^[A-Z]{2}-\d+$/.test(id) || id.startsWith("HHG-")) return "case"
  if (id.startsWith("C") && id.includes("-K")) return "card"
  if (/^C\d+$/.test(id)) return "customer"
  if (/^\d{7,}$/.test(id)) return "transaction"
  if (id.toLowerCase().includes("device") || id.toLowerCase().includes("proxy")) return "device"
  return "evidence"
}

function safeN(v: number | undefined, fallback: number): number {
  return isFinite(v as number) ? (v as number) : fallback
}

function buildGraph(evidence: EvidenceItem[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodeMap = new Map<string, GraphNode>()
  const edges: GraphEdge[] = []
  const seen  = new Set<string>()

  nodeMap.set("__inv__", { id: "__inv__", label: "CASE", type: "case", x: 0, y: 0, vx: 0, vy: 0 })

  for (const ev of evidence.slice(0, 30)) {
    for (const eid of ev.entity_ids) {
      if (!eid) continue
      const short = eid.length > 12 ? eid.slice(0,10)+"…" : eid
      if (!nodeMap.has(eid)) {
        const angle = Math.random() * Math.PI * 2
        const dist  = 80 + Math.random() * 110
        nodeMap.set(eid, {
          id: eid, label: short, type: inferType(eid),
          x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, vx: 0, vy: 0,
        })
      }
      const edgeKey = `__inv__::${eid}`
      if (!seen.has(edgeKey)) {
        seen.add(edgeKey)
        edges.push({ source: "__inv__", target: eid })
      }
    }
    for (let i = 0; i < ev.entity_ids.length - 1; i++) {
      const a = ev.entity_ids[i], b = ev.entity_ids[i + 1]
      if (!a || !b) continue
      const k = [a,b].sort().join("::")
      if (!seen.has(k)) {
        seen.add(k)
        edges.push({ source: a, target: b })
      }
    }
  }
  return { nodes: Array.from(nodeMap.values()), edges }
}

interface Props {
  evidence: EvidenceItem[]
  onNodeClick?: (nodeId: string) => void
}

export function EvidenceGraph({ evidence, onNodeClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef  = useRef(0)
  const nodesRef  = useRef<GraphNode[]>([])
  const edgesRef  = useRef<GraphEdge[]>([])
  const tickRef   = useRef(0)
  const mounted   = useRef(true)

  const built = useMemo(() => buildGraph(evidence), [evidence])

  // Reinitialise nodes/edges whenever evidence changes
  useEffect(() => {
    nodesRef.current = built.nodes.map(n => ({ ...n }))
    edgesRef.current = built.edges
    tickRef.current  = 0
  }, [built])

  const simulate = useCallback((nodes: GraphNode[], edges: GraphEdge[], W: number, H: number) => {
    const cx = W / 2, cy = H / 2
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]
      n.vx = safeN(n.vx, 0)
      n.vy = safeN(n.vy, 0)
      n.x  = safeN(n.x, cx)
      n.y  = safeN(n.y, cy)

      if (n.id !== "__inv__") {
        n.vx += (cx - n.x) * 0.0015
        n.vy += (cy - n.y) * 0.0015
      }
      for (let j = i + 1; j < nodes.length; j++) {
        const m = nodes[j]
        m.x = safeN(m.x, cx); m.y = safeN(m.y, cy)
        const dx = m.x - n.x, dy = m.y - n.y
        const d  = Math.sqrt(dx*dx + dy*dy) + 0.1
        if (d < 110) {
          const f = (110 - d) / d * 0.35
          n.vx -= dx * f * 0.08; n.vy -= dy * f * 0.08
          m.vx = safeN(m.vx, 0) + dx * f * 0.08
          m.vy = safeN(m.vy, 0) + dy * f * 0.08
        }
      }
      for (const e of edges) {
        const sid = typeof e.source === "string" ? e.source : (e.source as GraphNode).id
        const tid = typeof e.target === "string" ? e.target : (e.target as GraphNode).id
        if (sid === n.id || tid === n.id) {
          const other = nodes.find(x => x.id === (sid === n.id ? tid : sid))
          if (other) {
            other.x = safeN(other.x, cx); other.y = safeN(other.y, cy)
            const dx = other.x - n.x, dy = other.y - n.y
            const d  = Math.sqrt(dx*dx + dy*dy) + 0.1
            const tgt = n.id === "__inv__" ? 130 : 85
            const f   = (d - tgt) / d * 0.04
            n.vx += dx * f; n.vy += dy * f
          }
        }
      }
      n.vx *= 0.88; n.vy *= 0.88
      n.x = Math.max(20, Math.min(W - 20, n.x + n.vx))
      n.y = Math.max(20, Math.min(H - 20, n.y + n.vy))
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    const canvas = canvasRef.current
    if (!canvas) return
    let ctx: CanvasRenderingContext2D | null
    try { ctx = canvas.getContext("2d") } catch { return }
    if (!ctx) return

    const resize = () => { if (canvas) { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight } }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(canvas)
    const handleVis = () => {
      if (document.hidden) cancelAnimationFrame(frameRef.current)
      else frameRef.current = requestAnimationFrame(draw)
    }
    document.addEventListener("visibilitychange", handleVis)

    function draw() {
      if (!canvas || !ctx || !mounted.current) return
      tickRef.current++
      const W = canvas.width, H = canvas.height
      if (!W || !H) { frameRef.current = requestAnimationFrame(draw); return }

      ctx.clearRect(0, 0, W, H)
      const cx = W / 2, cy = H / 2

      const nodes = nodesRef.current
      const edges = edgesRef.current

      if (!nodes.length) {
        ctx.fillStyle = "rgba(139,141,150,0.35)"
        ctx.font = "11px 'JetBrains Mono',monospace"
        ctx.textAlign = "center"
        ctx.fillText("No graph evidence returned for this case", cx, cy)
        frameRef.current = requestAnimationFrame(draw); return
      }

      simulate(nodes, edges, W, H)
      const nodeMap = new Map(nodes.map(n => [n.id, n]))

      // Edges
      for (let i = 0; i < edges.length; i++) {
        const sid = typeof edges[i].source === "string" ? edges[i].source as string : (edges[i].source as GraphNode).id
        const tid = typeof edges[i].target === "string" ? edges[i].target as string : (edges[i].target as GraphNode).id
        const a = nodeMap.get(sid), b = nodeMap.get(tid)
        if (!a || !b) continue
        const ax = safeN(a.x, cx), ay = safeN(a.y, cy)
        const bx = safeN(b.x, cx), by = safeN(b.y, cy)
        ctx.save()
        ctx.globalAlpha = 0.18 + 0.07 * Math.sin(tickRef.current * 0.02 + i)
        ctx.strokeStyle = "#4FD1E8"; ctx.lineWidth = 0.8
        ctx.setLineDash([4, 7]); ctx.lineDashOffset = -(tickRef.current + i * 18) % 60 * 0.25
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()
        ctx.restore()
      }

      // Nodes
      for (const n of nodes) {
        const nx = safeN(n.x, cx), ny = safeN(n.y, cy)
        const col = TYPE_COLORS[n.type] ?? "#8B8D96"
        const isCtr = n.id === "__inv__"
        const r = isCtr ? 16 : 7

        // Guard: only draw glow if coords are finite
        if (isFinite(nx) && isFinite(ny) && isFinite(r)) {
          const glow = ctx.createRadialGradient(nx, ny, 0, nx, ny, r * 3)
          glow.addColorStop(0, col + "30"); glow.addColorStop(1, "transparent")
          ctx.fillStyle = glow
          ctx.beginPath(); ctx.arc(nx, ny, r * 3, 0, Math.PI*2); ctx.fill()

          ctx.beginPath(); ctx.arc(nx, ny, r, 0, Math.PI*2)
          ctx.fillStyle = col + (isCtr ? "CC" : "88"); ctx.fill()
          ctx.strokeStyle = col; ctx.lineWidth = isCtr ? 1.5 : 1; ctx.stroke()

          ctx.fillStyle = isCtr ? "#D9A441" : "#8B8D96"
          ctx.font = `${isCtr ? 9 : 7}px 'JetBrains Mono',monospace`
          ctx.textAlign = "center"
          ctx.fillText(n.label, nx, ny + r + 10)
        }
      }
      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => {
      mounted.current = false
      cancelAnimationFrame(frameRef.current)
      ro.disconnect()
      document.removeEventListener("visibilitychange", handleVis)
    }
  }, [simulate])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onNodeClick) return
    const canvas = canvasRef.current; if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    for (const n of nodesRef.current) {
      const dx = safeN(n.x, 0) - mx, dy = safeN(n.y, 0) - my
      if (Math.sqrt(dx*dx + dy*dy) < 18 && n.id !== "__inv__") {
        onNodeClick(n.id); break
      }
    }
  }, [onNodeClick])

  return (
    <div className="relative w-full h-full min-h-[220px]">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onClick={handleClick}
        aria-label="Evidence relationship graph"
        role="img"
      />
      <div className="absolute bottom-2 left-2 flex flex-wrap gap-2">
        {(["transaction","card","customer","case"] as const).map(t => (
          <div key={t} className="flex items-center gap-1 font-mono-ui text-[9px] text-[#8B8D96]/50">
            <div className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[t] }} />
            {t}
          </div>
        ))}
      </div>
    </div>
  )
}
