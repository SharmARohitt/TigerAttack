import { type ClassValue, clsx } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatProbability(p: number): string {
  return `${(p * 100).toFixed(0)}%`
}

export function maskId(id: string): string {
  if (id.length <= 4) return id
  return id.slice(0, 2) + "•".repeat(Math.max(0, id.length - 4)) + id.slice(-2)
}

export function patternLabel(pattern: string): string {
  const map: Record<string, string> = {
    card_testing: "Card Testing",
    card_not_present_fraud: "CNP Fraud",
    card_not_present_new_device: "CNP — New Device",
    out_of_region_use: "Out-of-Region Use",
    account_takeover: "Account Takeover",
    undocumented: "Undocumented Pattern",
    none: "No Pattern",
  }
  return map[pattern] ?? pattern
}

export function verdictColor(verdict: string): string {
  if (verdict === "fraud") return "text-red-400"
  if (verdict === "legitimate") return "text-emerald-400"
  return "text-amber-400"
}

export function statusColor(status: string): string {
  if (status === "closed_fraud") return "text-red-400"
  if (status === "closed_legitimate") return "text-emerald-400"
  if (status === "escalated") return "text-orange-400"
  return "text-amber-400"
}

export function sourceIcon(source: string): string {
  if (source === "graph") return "◆"
  if (source === "customer") return "◈"
  if (source === "document") return "◇"
  return "○"
}

export function routeLabel(route: string): string {
  if (route === "auto") return "AUTO"
  if (route === "L1") return "L1 — Team Lead"
  if (route === "L2") return "L2 — Fraud Manager"
  return route
}
