import { type ClassValue, clsx } from "clsx"
import type { CaseStatus, FraudPattern, InvestigationStage, StageState, Verdict } from "./types"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatUSD(n: number | null | undefined): string {
  if (n == null) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: 2,
  }).format(n)
}

export function formatProb(n: number | null | undefined): string {
  if (n == null) return "—"
  return n.toFixed(3)
}

/** Mask all but last N chars of an ID string. */
export function maskId(id: string | null | undefined, keep = 4): string {
  if (!id) return "—"
  if (id.length <= keep) return id
  return "•".repeat(id.length - keep) + id.slice(-keep)
}

export function patternLabel(p: FraudPattern | string | null | undefined): string {
  if (!p || p === "none") return "none"
  return p.replace(/_/g, " ")
}

export function verdictColor(v: Verdict | string | null | undefined): string {
  if (v === "fraud")      return "text-[#E5484D]"
  if (v === "legitimate") return "text-[#3DD68C]"
  return "text-[#E8C547]"
}

export function verdictBg(v: Verdict | string | null | undefined): string {
  if (v === "fraud")      return "bg-[#E5484D]/10 border-[#E5484D]/30"
  if (v === "legitimate") return "bg-[#3DD68C]/10 border-[#3DD68C]/30"
  return "bg-[#E8C547]/10 border-[#E8C547]/30"
}

export function statusColor(s: CaseStatus | string | null | undefined): string {
  if (!s) return "text-text-muted"
  if (s.includes("fraud") || s.includes("escalated")) return "text-[#E5484D]"
  if (s.includes("legitimate")) return "text-[#3DD68C]"
  if (s.includes("awaiting") || s === "open") return "text-[#E8C547]"
  return "text-[#8B8D96]"
}

export function routeLabel(r: string): string {
  if (r === "auto") return "AUTO"
  if (r === "L1")   return "L1 — TEAM LEAD"
  if (r === "L2")   return "L2 — FRAUD MANAGER"
  return r
}

export function routeColor(r: string): string {
  if (r === "auto") return "text-[#3DD68C] border-[#3DD68C]/30 bg-[#3DD68C]/08"
  if (r === "L1")   return "text-[#E8C547] border-[#E8C547]/30 bg-[#E8C547]/08"
  if (r === "L2")   return "text-[#E5484D] border-[#E5484D]/30 bg-[#E5484D]/08"
  return "text-[#8B8D96]"
}

export function runtimeColor(v: string | null | undefined): string {
  if (!v) return "text-[#8B8D96]"
  if (["CONNECTED","AVAILABLE"].includes(v)) return "text-[#3DD68C]"
  if (["DEGRADED","FAILED","NOT_AVAILABLE"].includes(v)) return "text-[#E5484D]"
  return "text-[#E8C547]"
}

export function runtimeDot(v: string | null | undefined): string {
  if (!v) return "bg-[#8B8D96]"
  if (["CONNECTED","AVAILABLE"].includes(v)) return "bg-[#3DD68C]"
  if (["DEGRADED","FAILED","NOT_AVAILABLE"].includes(v)) return "bg-[#E5484D]"
  return "bg-[#E8C547]"
}

/** Map case status + stop_reason → current investigation stage */
export function deriveStages(
  status: CaseStatus | string,
  stopReason: string | null | undefined,
  evidenceRequests: number,
  writtenToGraph: boolean,
): Record<InvestigationStage, StageState> {
  const STAGES: InvestigationStage[] = [
    "TRIGGER","INVESTIGATE","GATHER EVIDENCE","ASSESS UNCERTAINTY",
    "GATHER MORE EVIDENCE","TAKE ACTION","EXPLAIN","REMEMBER",
  ]

  let currentIdx = 1 // default: INVESTIGATE

  if (status === "awaiting_external_evidence" ||
      stopReason === "AWAITING_EXTERNAL_EVIDENCE") {
    currentIdx = 4 // GATHER MORE EVIDENCE
  } else if (status === "escalated") {
    currentIdx = 5 // TAKE ACTION
  } else if (status === "closed_fraud" || status === "closed_legitimate") {
    currentIdx = writtenToGraph ? 7 : 6 // REMEMBER or EXPLAIN
  } else if (evidenceRequests > 0) {
    currentIdx = 4
  } else {
    currentIdx = 3 // ASSESS UNCERTAINTY
  }

  const result = {} as Record<InvestigationStage, StageState>
  STAGES.forEach((s, i) => {
    result[s] = i < currentIdx ? "completed" : i === currentIdx ? "current" : "pending"
  })
  return result
}

export function relativeTime(ts: string | undefined, baseTs: string | undefined): string {
  if (!ts) return ""
  try {
    const t = new Date(ts).getTime()
    const base = baseTs ? new Date(baseTs).getTime() : t
    const diff = t - base
    if (diff < 0) return "00:00.000"
    const m  = Math.floor(diff / 60000)
    const s  = Math.floor((diff % 60000) / 1000)
    const ms = diff % 1000
    return `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}.${ms.toString().padStart(3,"0")}`
  } catch {
    return ts.slice(11, 23) // fallback: show HH:MM:SS.mmm
  }
}
