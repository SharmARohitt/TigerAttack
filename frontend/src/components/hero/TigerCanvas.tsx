"use client"
import { useEffect, useRef, useCallback } from "react"

interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }
interface Node { x: number; y: number; r: number; pulse: number; type: "main"|"data" }
interface Edge { a: number; b: number; alpha: number; drawn: number }

export function TigerCanvas({ activated }: { activated: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef  = useRef<number>(0)
  const stateRef  = useRef({ particles: [] as Particle[], nodes: [] as Node[], edges: [] as Edge[], t: 0 })

  const init = useCallback(() => {
    const s = stateRef.current
    s.particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * 1200, y: Math.random() * 700,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.6 - 0.2,
      life: Math.random() * 120,
      maxLife: 80 + Math.random() * 80,
    }))
    // Graph nodes in cyber-city arrangement
    s.nodes = [
      { x: 500, y: 340, r: 18, pulse: 0, type: "main" },  // tiger center
      { x: 300, y: 260, r: 10, pulse: Math.random()*6, type: "data" },
      { x: 680, y: 220, r: 10, pulse: Math.random()*6, type: "data" },
      { x: 200, y: 400, r: 8,  pulse: Math.random()*6, type: "data" },
      { x: 740, y: 400, r: 8,  pulse: Math.random()*6, type: "data" },
      { x: 400, y: 180, r: 7,  pulse: Math.random()*6, type: "data" },
      { x: 600, y: 460, r: 7,  pulse: Math.random()*6, type: "data" },
      { x: 150, y: 310, r: 6,  pulse: Math.random()*6, type: "data" },
      { x: 820, y: 280, r: 6,  pulse: Math.random()*6, type: "data" },
    ]
    s.edges = [
      { a:0, b:1, alpha:0, drawn:0 },{ a:0, b:2, alpha:0, drawn:0 },
      { a:0, b:3, alpha:0, drawn:0 },{ a:0, b:4, alpha:0, drawn:0 },
      { a:0, b:5, alpha:0, drawn:0 },{ a:0, b:6, alpha:0, drawn:0 },
      { a:1, b:7, alpha:0, drawn:0 },{ a:2, b:8, alpha:0, drawn:0 },
      { a:1, b:5, alpha:0, drawn:0 },{ a:3, b:7, alpha:0, drawn:0 },
    ]
  }, [])

  useEffect(() => {
    init()
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

    function draw() {
      if (!canvas || !ctx) return
      const W = canvas.width, H = canvas.height
      const s = stateRef.current
      s.t++

      // Clear
      ctx.fillStyle = "rgba(8,10,12,0.18)"
      ctx.fillRect(0, 0, W, H)

      const scaleX = W / 1200
      const scaleY = H / 700
      const sc = Math.min(scaleX, scaleY)
      const ox = (W - 1200 * sc) / 2
      const oy = (H - 700  * sc) / 2

      function tx(x: number) { return ox + x * sc }
      function ty(y: number) { return oy + y * sc }

      // City silhouette
      ctx.save()
      ctx.globalAlpha = 0.12
      const buildings = [
        [0,700,80,300],[90,700,60,400],[160,700,100,250],[270,700,50,350],
        [330,700,80,200],[950,700,80,300],[1040,700,60,450],[1110,700,90,280],
      ]
      for (const [bx,by,bw,bh] of buildings) {
        const grad = ctx.createLinearGradient(tx(bx),ty(by-bh),tx(bx),ty(by))
        grad.addColorStop(0,"rgba(6,182,212,0.3)")
        grad.addColorStop(1,"rgba(6,182,212,0.05)")
        ctx.fillStyle = grad
        ctx.fillRect(tx(bx),ty(by-bh), bw*sc, bh*sc)
        // windows
        ctx.fillStyle = "rgba(245,158,11,0.25)"
        for (let wy = by-bh+20; wy < by-10; wy += 22)
          for (let wx = bx+8; wx < bx+bw-8; wx += 14)
            if (Math.random() > 0.5)
              ctx.fillRect(tx(wx), ty(wy), 5*sc, 8*sc)
      }
      ctx.restore()

      // Fog/haze
      const fogGrad = ctx.createRadialGradient(tx(500),ty(500),0,tx(500),ty(500),400*sc)
      fogGrad.addColorStop(0,"rgba(6,182,212,0.03)")
      fogGrad.addColorStop(1,"transparent")
      ctx.fillStyle = fogGrad
      ctx.fillRect(0,0,W,H)

      // Edges
      for (const e of s.edges) {
        if (activated) e.alpha = Math.min(1, e.alpha + 0.02)
        else e.alpha = Math.max(0, e.alpha - 0.01)
        if (e.alpha < 0.01) continue
        const na = s.nodes[e.a], nb = s.nodes[e.b]
        ctx.save()
        ctx.globalAlpha = e.alpha * 0.45
        ctx.strokeStyle = "#06B6D4"
        ctx.lineWidth = 1 * sc
        ctx.setLineDash([4*sc, 4*sc])
        ctx.lineDashOffset = -s.t * 0.5
        ctx.beginPath()
        ctx.moveTo(tx(na.x), ty(na.y))
        ctx.lineTo(tx(nb.x), ty(nb.y))
        ctx.stroke()
        ctx.restore()
      }

      // Nodes
      for (let i = 0; i < s.nodes.length; i++) {
        const n = s.nodes[i]
        n.pulse += 0.04
        const pulseFactor = 0.85 + 0.15 * Math.sin(n.pulse)
        const r = n.r * sc * pulseFactor

        if (n.type === "main") {
          // Tiger center — amber glow
          const g = ctx.createRadialGradient(tx(n.x),ty(n.y),0,tx(n.x),ty(n.y),r*3)
          g.addColorStop(0,"rgba(245,158,11,0.25)")
          g.addColorStop(1,"transparent")
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(tx(n.x),ty(n.y),r*3,0,Math.PI*2)
          ctx.fill()

          ctx.strokeStyle = "rgba(245,158,11,0.8)"
          ctx.lineWidth = 1.5 * sc
          ctx.beginPath()
          ctx.arc(tx(n.x),ty(n.y),r,0,Math.PI*2)
          ctx.stroke()

          // Inner cross-hairs
          ctx.globalAlpha = 0.4
          ctx.strokeStyle = "#F59E0B"
          ctx.lineWidth = 0.5 * sc
          ctx.beginPath()
          ctx.moveTo(tx(n.x)-r*1.8, ty(n.y))
          ctx.lineTo(tx(n.x)+r*1.8, ty(n.y))
          ctx.moveTo(tx(n.x), ty(n.y)-r*1.8)
          ctx.lineTo(tx(n.x), ty(n.y)+r*1.8)
          ctx.stroke()
          ctx.globalAlpha = 1

          // Eye dots
          const eyeY = ty(n.y) - r * 0.3
          const eyeAlpha = activated ? 0.8 + 0.2 * Math.sin(s.t * 0.08) : 0.4
          ctx.fillStyle = `rgba(245,158,11,${eyeAlpha})`
          ctx.beginPath(); ctx.arc(tx(n.x)-r*0.4, eyeY, r*0.2, 0, Math.PI*2); ctx.fill()
          ctx.beginPath(); ctx.arc(tx(n.x)+r*0.4, eyeY, r*0.2, 0, Math.PI*2); ctx.fill()
        } else {
          const alpha = activated ? 0.7 : 0.3
          const g = ctx.createRadialGradient(tx(n.x),ty(n.y),0,tx(n.x),ty(n.y),r*2)
          g.addColorStop(0,`rgba(6,182,212,${alpha})`)
          g.addColorStop(1,"transparent")
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(tx(n.x),ty(n.y),r*2,0,Math.PI*2); ctx.fill()
          ctx.fillStyle = `rgba(6,182,212,${alpha*0.9})`
          ctx.beginPath(); ctx.arc(tx(n.x),ty(n.y),r*0.5,0,Math.PI*2); ctx.fill()
        }
      }

      // Tiger silhouette (SVG path rendered via Path2D)
      ctx.save()
      const tigerBob = Math.sin(s.t * 0.045) * 5
      const tigerDrift = Math.sin(s.t * 0.018) * 8
      ctx.translate(tx(500 + tigerDrift), ty(340 + tigerBob))
      ctx.scale(sc * 0.7, sc * 0.7)
      // Stylized tiger stripes using bezier curves
      const alpha = 0.55 + 0.1 * Math.sin(s.t * 0.03)
      ctx.globalAlpha = alpha
      // Body oval
      const bodyGrad = ctx.createRadialGradient(-5, 0, 5, -5, 0, 55)
      bodyGrad.addColorStop(0, "rgba(180,100,0,0.5)")
      bodyGrad.addColorStop(0.5, "rgba(120,60,0,0.35)")
      bodyGrad.addColorStop(1, "rgba(60,30,0,0.1)")
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 5, 40, 28, 0, 0, Math.PI*2)
      ctx.fill()
      // Head
      ctx.beginPath()
      ctx.ellipse(-2, -28, 22, 18, -0.1, 0, Math.PI*2)
      ctx.fill()
      // Stripes
      ctx.strokeStyle = "rgba(60,20,0,0.6)"
      ctx.lineWidth = 3
      for (let si = 0; si < 4; si++) {
        ctx.beginPath()
        ctx.moveTo(-30+si*14, -8)
        ctx.bezierCurveTo(-25+si*14, 5, -20+si*14, 5, -18+si*14, -8)
        ctx.stroke()
      }
      // Tail sway makes the silhouette visibly animated even before launch.
      ctx.beginPath()
      ctx.moveTo(35, 8)
      ctx.bezierCurveTo(
        62, 18 + Math.sin(s.t * 0.06) * 5,
        67, -12 + Math.sin(s.t * 0.06) * 5,
        52, -20 + Math.sin(s.t * 0.06) * 5,
      )
      ctx.stroke()
      ctx.restore()

      // Particles
      for (const p of s.particles) {
        p.x += p.vx; p.y += p.vy; p.life++
        if (p.life > p.maxLife) { p.x = Math.random()*1200; p.y = 700; p.life = 0 }
        const fade = 1 - p.life / p.maxLife
        ctx.fillStyle = `rgba(245,158,11,${fade * 0.35})`
        ctx.beginPath()
        ctx.arc(tx(p.x), ty(p.y), 1.2, 0, Math.PI*2)
        ctx.fill()
      }

      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [init, activated])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.9 }}
      aria-hidden
    />
  )
}
