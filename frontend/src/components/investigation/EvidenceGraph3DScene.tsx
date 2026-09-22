"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { Html, OrbitControls } from "@react-three/drei"
import { useMemo, useRef } from "react"
import * as THREE from "three"
import type { GraphNode } from "@/lib/types"

type Props = { nodes: GraphNode[]; edges: Array<[string, string]>; onNodeClick?: (id: string) => void }
const COLORS: Record<string, string> = {
  case: "#F6A623", transaction: "#62E6FF", customer: "#F4F1EA",
  card: "#FFB84A", device: "#62E6FF", evidence: "#7BE495", policy: "#F4D35E",
}

export default function EvidenceGraph3DScene({ nodes, edges, onNodeClick }: Props) {
  const lookup = useMemo(() => new Map(nodes.map(node => [node.id, node])), [nodes])
  const positions = useMemo(() => {
    const result = new Map<string, [number, number, number]>()
    nodes.forEach((node, index) => {
      if (index === 0) {
        result.set(node.id, [0, 0, 0])
        return
      }
      const seed = [...node.id].reduce((total, char) => total + char.charCodeAt(0), 0)
      const angle = seed * 0.071 + index * 1.7
      const radius = 1.2 + (index % 4) * 0.45
      result.set(node.id, [Math.cos(angle) * radius, ((index % 3) - 1) * 0.28, Math.sin(angle) * radius])
    })
    return result
  }, [nodes])

  return (
    <Canvas camera={{ position: [0, 1.1, 5.8], fov: 40 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} fallback={<div className="absolute inset-0 flex items-center justify-center forensic text-[10px] text-[var(--yellow-fx)]">WEBGL UNAVAILABLE</div>}>
      <color attach="background" args={["#070808"]} />
      <fog attach="fog" args={["#070808", 4.5, 9]} />
      <ambientLight intensity={0.45} />
      <pointLight position={[2.5, 3, 3]} color="#F6A623" intensity={10} distance={8} />
      <pointLight position={[-3, -1, -2]} color="#62E6FF" intensity={5} distance={7} />
      <GraphEdges edges={edges} lookup={lookup} positions={positions} />
      {nodes.map((node, index) => {
        const position = positions.get(node.id) ?? [0, 0, 0]
        return <GraphNodeMesh key={node.id} node={node} index={index} position={position} onClick={onNodeClick} />
      })}
      <OrbitControls enablePan={false} minDistance={3.2} maxDistance={8} autoRotate autoRotateSpeed={0.18} enableDamping dampingFactor={0.08} />
    </Canvas>
  )
}

function GraphEdges({ edges, lookup, positions }: { edges: Array<[string, string]>; lookup: Map<string, GraphNode>; positions: Map<string, [number, number, number]> }) {
  return <>{edges.map(([from, to], index) => {
    const start = positions.get(from), end = positions.get(to)
    if (!start || !end) return null
    const target = lookup.get(to)
    return <GraphEdge key={`${from}-${to}-${index}`} start={start} end={end} color={COLORS[target?.type ?? "evidence"] ?? "#62E6FF"} delay={index * 0.17} />
  })}</>
}

function GraphEdge({ start, end, color, delay }: { start: [number, number, number]; end: [number, number, number]; color: string; delay: number }) {
  const pulse = useRef<THREE.Mesh>(null)
  const geometry = useMemo(() => {
    const value = new THREE.BufferGeometry()
    value.setFromPoints([new THREE.Vector3(...start), new THREE.Vector3(...end)])
    return value
  }, [start, end])
  const line = useMemo(() => new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.48 }),
  ), [color, geometry])

  useFrame(({ clock }) => {
    if (!pulse.current) return
    const progress = (clock.getElapsedTime() * 0.18 + delay) % 1
    pulse.current.position.set(
      start[0] + (end[0] - start[0]) * progress,
      start[1] + (end[1] - start[1]) * progress,
      start[2] + (end[2] - start[2]) * progress,
    )
  })

  return (
    <group>
      <primitive object={line} />
      <mesh ref={pulse}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
    </group>
  )
}

function GraphNodeMesh({ node, index, position, onClick }: { node: GraphNode; index: number; position: [number, number, number]; onClick?: (id: string) => void }) {
  const ref = useRef<THREE.Mesh>(null)
  const color = COLORS[node.type] ?? "#7BE495"
  const isCase = index === 0
  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * (isCase ? 0.25 : 0.1)
    if (isCase) ref.current.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.055)
  })

  return (
    <group position={position}>
      <mesh ref={ref} onClick={(event) => { event.stopPropagation(); onClick?.(node.id) }}>
        {isCase ? <icosahedronGeometry args={[0.31, 2]} /> : node.type === "card" ? <boxGeometry args={[0.26, 0.14, 0.36]} /> : <sphereGeometry args={[0.14, 18, 18]} />}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isCase ? 0.95 : 0.4} roughness={0.38} metalness={0.5} />
      </mesh>
      {isCase && <mesh rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[0.45, 0.47, 48]} /><meshBasicMaterial color="#F6A623" transparent opacity={0.55} /></mesh>}
      <Html center distanceFactor={7} style={{ pointerEvents: "none" }}>
        <span className={`whitespace-nowrap border bg-[#070808]/90 px-1.5 py-0.5 forensic text-[9px] ${isCase ? "border-[#F6A623]/50 text-[#FFB84A]" : "border-white/10 text-[#A7A49D]"}`}>{node.label}</span>
      </Html>
    </group>
  )
}
