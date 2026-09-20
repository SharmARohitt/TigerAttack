// ── Exact types mirroring the backend Pydantic models ──────────────────────

export type CaseStatus = "open" | "closed_fraud" | "closed_legitimate" | "escalated"
export type Verdict = "fraud" | "legitimate" | "uncertain"
export type FraudPattern =
  | "card_testing"
  | "card_not_present_fraud"
  | "card_not_present_new_device"
  | "out_of_region_use"
  | "account_takeover"
  | "undocumented"
  | "none"
export type ApprovalRoute = "auto" | "L1" | "L2"
export type ActionType =
  | "ALLOW_TRANSACTION" | "DECLINE_TRANSACTION" | "MONITOR_CARD"
  | "MONITOR_CONNECTED_CARDS" | "WARN_CUSTOMER" | "VERIFY_WITH_CUSTOMER"
  | "STEP_UP_AUTH" | "BLOCK_CARD" | "BLOCK_ALL_CARDS" | "GENERATE_REPORT"
  | "CREATE_CASE" | "FILE_REPORT" | "ESCALATE_TO_ANALYST" | "CLOSE_NO_FRAUD"
export type EvidenceSource = "graph" | "document" | "customer" | "external"

export interface EvidenceItem {
  claim: string
  source: EvidenceSource
  ref: string
  entity_ids: string[]
}

export interface ActionRecommendation {
  action: ActionType
  route: ApprovalRoute
  reason: string
}

export interface EvidenceRequest {
  type: "customer_validation" | "step_up_auth" | "analyst_info"
  asked_after_step: number
  assumed_response: string
}

export interface NextBestActions {
  initial: ActionRecommendation[]
  final: ActionRecommendation[]
  what_changed: string
}

export interface SAR {
  file: boolean
  reason: string
  narrative: string
  subjects: string[]
  total_amount_usd: number
  activity_dates: string[]
}

export interface CaseRecord {
  status: CaseStatus
  verdict: Verdict
  fraud_probability: number
  pattern: FraudPattern
  pattern_description: string
  affected_txn_ids: string[]
  first_suspicious_txn_id: string
  connected_card_ids: string[]
  connected_device_profiles: string[]
  exposure_usd: number
  evidence: EvidenceItem[]
  similar_prior_cases: string[]
  summary: string
  written_to_graph: boolean
  graph_case_id: string
}

export interface CaseAnswer {
  case_id: string
  case: CaseRecord
  evidence_requests: EvidenceRequest[]
  next_best_actions: NextBestActions
  sar: SAR
  stop_reason: string
  tool_calls: number
  tokens: number
  latency_s: number
  audit?: AuditEntry[]
}

export interface CaseListItem {
  case_id: string
  status: CaseStatus
  verdict: Verdict
  fraud_probability: number
  pattern: FraudPattern
  exposure_usd: number
  created_at: string
}

export interface HealthStatus {
  status: string
  tigergraph: "connected" | "unavailable"
  mcp: "connected" | "unavailable"
  data_loaded: {
    transactions: number
    identity: number
    closed_cases: number
    case_pack: number
  }
}

export interface AuditEntry {
  step?: number
  action?: string
  status?: string
  timestamp?: string
  [key: string]: unknown
}

// ── Investigation stream event ──────────────────────────────────────────────
export interface StreamEvent {
  step?: string
  complete?: boolean
  answer?: CaseAnswer
}

// ── Graph node/edge for vis ─────────────────────────────────────────────────
export interface GraphNode {
  id: string
  label: string
  type: "transaction" | "card" | "customer" | "device" | "case" | "policy" | "evidence"
  value?: string | number
  highlighted?: boolean
}

export interface GraphEdge {
  source: string
  target: string
  label?: string
  strength?: number
}
