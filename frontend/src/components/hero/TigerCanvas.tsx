"use client"
/**
 * Tiger cyber-city canvas scene.
 *
 * Uses Canvas 2D only — no WebGL dependency.
 * If the canvas context fails, the component renders nothing and the
 * parent's static CSS fallback remains visible.
 *
 * Pauses when document.hidden (tab backgrounded).
 * Respects prefers-reduced-motion: freezes to a single static frame.
 */
import { useEffect, useRef, useCallback } from "react"

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number }
interface Node     { x: number; y: number; r: number; t: number; phase: number; kind: "hub"|"data" }
interface Edge     { a: number; b: number; alpha: number; dashOff: number }

const AMBER  = "rgba(217,164,65,"
const CYAN   = "rgba(79,209,232,"
const AMBER_FULL = "#D9A441"

export function TigerCanvas({ activated }: { activated: boolean }) {
  const ref       = useRef<HTMLCanvasElement>(null)
  const frameRef  = useRef(0)
  const stateRef  = useRef<{
    particles: Particle[]; nodes: Node[]; edges: Edge[]; t: number
  } | null>(null)

  const reducedMotion = typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const init = useCallback(() => {
    const particles: Particle[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * 1200, y: 700 + Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.5, vy: -Math.random() * 0.7 - 0.15,
      life: 0, max: 80 + Math.random() * 100, size: Math.random() * 1.5 + 0.5,
    }))
    const nodes: Node[] = [
      { x: 500, y: 350, r: 20, t: 0, phase: 0,          kind: "hub" },
      { x: 290, y: 255, r: 9,  t: 0, phase: 1.1,        kind: "data" },
      { x: 690, y: 215, r: 9,  t: 0, phase: 2.3,        kind: "data" },
      { x: 180, y: 420, r: 7,  t: 0, phase: 0.7,        kind: "data" },
      { x: 760, y: 415, r: 7,  t: 0, phase: 3.1,        kind: "data" },
      { x: 400, y: 175, r: 6,  t: 0, phase: 1.9,        kind: "data" },
      { x: 610, y: 475, r: 6,  t: 0, phase: 4.2,        kind: "data" },
      { x: 140, y: 310, r: 5,  t: 0, phase: 5.0,        kind: "data" },
      { x: 840, y: 275, r: 5,  t: 0, phase: 0.3,        kind: "data" },
    ]
    const edges: Edge[] = [
      { a:0,b:1,alpha:0,dashOff:0 },{ a:0,b:2,alpha:0,dashOff:0 },
      { a:0,b:3,alpha:0,dashOff:0 },{ a:0,b:4,alpha:0,dashOff:0 },
      { a:0,b:5,alpha:0,dashOff:0 },{ a:0,b:6,alpha:0,dashOff:0 },
      { a:1,b:7,alpha:0,dashOff:0 },{ a:2,b:8,alpha:0,dashOff:0 },
      { a:1,b:5,alpha:0,dashOff:0 },{ a:3,b:7,alpha:0,dashOff:0 },
    ]
    stateRef.current = { particles, nodes, edges, t: 0 }
  }, [])

  useEffect(() => {
    init()
    const canvas = ref.current
    if (!canvas) return
    let ctx: CanvasRenderingContext2D | null
    try { ctx = canvas.getContext("2d") } catch { return }
    if (!ctx) return

    const resize = () => {
      if (!canvas) return
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frameRef.current)
      } else {
        frameRef.current = requestAnimationFrame(draw)
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)

    function draw() {
      if (!canvas || !ctx || !stateRef.current) return
      const { particles, nodes, edges } = stateRef.current
      stateRef.current.t++
      const t = stateRef.current.t

      const W = canvas.width, H = canvas.height
      const sc = Math.min(W / 1200, H / 700)
      const ox = (W - 1200 * sc) / 2
      const oy = (H - 700  * sc) / 2
      const tx = (x: number) => ox + x * sc
      const ty = (y: number) => oy + y * sc

      // Trail clear
      ctx.fillStyle = "rgba(10,10,12,0.16)"
      ctx.fillRect(0, 0, W, H)

      // Buildings silhouette
      const bldgs = [
        [20,700,70,280],[100,700,55,380],[165,700,90,220],[265,700,48,340],
        [325,700,75,190],[960,700,75,285],[1045,700,55,430],[1110,700,85,265],
      ]
      ctx.save()
      ctx.globalAlpha = 0.11
      for (const [bx,by,bw,bh] of bldgs) {
        const g = ctx.createLinearGradient(tx(bx),ty(by-bh),tx(bx),ty(by))
        g.addColorStop(0, CYAN+"0.28)")
        g.addColorStop(1, CYAN+"0.04)")
        ctx.fillStyle = g
        ctx.fillRect(tx(bx), ty(by-bh), bw*sc, bh*sc)
        // Windows
        ctx.fillStyle = AMBER+"0.22)"
        for (let wy = by-bh+18; wy < by-12; wy += 20)
          for (let wx = bx+7; wx < bx+bw-7; wx += 13)
            if ((wx*37+wy*19)%7 > 3)
              ctx.fillRect(tx(wx), ty(wy), 5*sc, 7*sc)
      }
      ctx.restore()

      // Fog gradient
      const fog = ctx.createRadialGradient(tx(500),ty(490),0,tx(500),ty(490),380*sc)
      fog.addColorStop(0, CYAN+"0.04)")
      fog.addColorStop(1,"transparent")
      ctx.fillStyle = fog
      ctx.fillRect(0,0,W,H)

      // Graph edges
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i]
        if (activated) e.alpha = Math.min(1, e.alpha + 0.018)
        else           e.alpha = Math.max(0, e.alpha - 0.012)
        if (e.alpha < 0.01) continue
        const na = nodes[e.a], nb = nodes[e.b]
        e.dashOff -= 0.6
        ctx.save()
        ctx.globalAlpha = e.alpha * 0.5
        ctx.strokeStyle = CYAN+"1)"
        ctx.lineWidth   = 0.9 * sc
        ctx.setLineDash([4*sc, 6*sc])
        ctx.lineDashOffset = e.dashOff
        ctx.beginPath(); ctx.moveTo(tx(na.x), ty(na.y)); ctx.lineTo(tx(nb.x), ty(nb.y)); ctx.stroke()
        ctx.restore()
      }

      // Graph nodes
      for (const n of nodes) {
        n.t += 0.035
        const pulse = 0.85 + 0.15 * Math.sin(n.t + n.phase)
        const r = n.r * sc * pulse

        if (n.kind === "hub") {
          const eyeAlpha = activated ? 0.7 + 0.3 * Math.sin(t * 0.07) : 0.35
          // Outer glow
          const g = ctx.createRadialGradient(tx(n.x),ty(n.y),0,tx(n.x),ty(n.y),r*3.5)
          g.addColorStop(0, AMBER + (eyeAlpha * 0.3).toFixed(2)+")")
          g.addColorStop(1,"transparent")
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(tx(n.x),ty(n.y),r*3.5,0,Math.PI*2); ctx.fill()
          // Circle
          ctx.strokeStyle = AMBER_FULL
          ctx.lineWidth   = 1.5 * sc
          ctx.globalAlpha = 0.9
          ctx.beginPath(); ctx.arc(tx(n.x),ty(n.y),r,0,Math.PI*2); ctx.stroke()
          ctx.globalAlpha = 1
          // Crosshair
          ctx.strokeStyle = AMBER+"0.35)"; ctx.lineWidth = 0.5*sc
          ctx.setLineDash([])
          ctx.beginPath()
          ctx.moveTo(tx(n.x)-r*1.9,ty(n.y)); ctx.lineTo(tx(n.x)+r*1.9,ty(n.y))
          ctx.moveTo(tx(n.x),ty(n.y)-r*1.9); ctx.lineTo(tx(n.x),ty(n.y)+r*1.9)
          ctx.stroke()
          // Tiger eyes
          const ey = ty(n.y) - r*0.3
          ctx.fillStyle = AMBER+eyeAlpha.toFixed(2)+")"
          ctx.beginPath(); ctx.arc(tx(n.x)-r*0.42,ey,r*0.22,0,Math.PI*2); ctx.fill()
          ctx.beginPath(); ctx.arc(tx(n.x)+r*0.42,ey,r*0.22,0,Math.PI*2); ctx.fill()
        } else {
          const a = activated ? 0.65 : 0.25
          const g = ctx.createRadialGradient(tx(n.x),ty(n.y),0,tx(n.x),ty(n.y),r*2.2)
          g.addColorStop(0, CYAN+a+")")
          g.addColorStop(1,"transparent")
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(tx(n.x),ty(n.y),r*2.2,0,Math.PI*2); ctx.fill()
          ctx.fillStyle = CYAN+(a*0.85).toFixed(2)+")"
          ctx.beginPath(); ctx.arc(tx(n.x),ty(n.y),r*0.55,0,Math.PI*2); ctx.fill()
        }
      }

      // Tiger silhouette
      ctx.save()
      ctx.translate(tx(500), ty(350))
      ctx.scale(sc * 0.72, sc * 0.72)
      const bodyAlpha = 0.48 + 0.08 * Math.sin(t * 0.025)
      ctx.globalAlpha = bodyAlpha
      const bg = ctx.createRadialGradient(-6,0,4,-6,0,56)
      bg.addColorStop(0,"rgba(175,95,0,0.52)")
      bg.addColorStop(0.5,"rgba(110,55,0,0.35)")
      bg.addColorStop(1,"rgba(50,25,0,0.08)")
      ctx.fillStyle = bg
      ctx.beginPath(); ctx.ellipse(0,6,42,30,0,0,Math.PI*2); ctx.fill()
      // Head
      ctx.beginPath(); ctx.ellipse(-2,-30,24,19,-0.08,0,Math.PI*2); ctx.fill()
      // Stripes
      ctx.strokeStyle="rgba(55,18,0,0.55)"; ctx.lineWidth=3.2
      for (let i=0;i<4;i++) {
        ctx.beginPath()
        ctx.moveTo(-32+i*14,-9)
        ctx.bezierCurveTo(-27+i*14,6,-22+i*14,6,-19+i*14,-9)
        ctx.stroke()
      }
      ctx.restore()

      // Particles
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.life++
        if (p.life > p.max) { p.x=Math.random()*1200; p.y=710+Math.random()*80; p.life=0 }
        const alpha = (1 - p.life / p.max) * 0.3
        ctx.fillStyle = AMBER+alpha.toFixed(3)+")"
        ctx.beginPath(); ctx.arc(tx(p.x),ty(p.y),p.size,0,Math.PI*2); ctx.fill()
      }

      frameRef.current = requestAnimationFrame(draw)
    }

    if (!reducedMotion) {
      frameRef.current = requestAnimationFrame(draw)
    } else {
      // Render one static frame
      draw()
    }

    return () => {
      cancelAnimationFrame(frameRef.current)
      ro.disconnect()
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init, activated, reducedMotion])

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.88 }}
      aria-hidden="true"
    />
  )
}
