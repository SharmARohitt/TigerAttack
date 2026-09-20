// ── Backend API client — uses real endpoints, no mock data ─────────────────

import type {
  CaseAnswer, CaseListItem, HealthStatus, StreamEvent,
} from "./types"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`API ${path} → ${res.status}: ${body.slice(0, 120)}`)
  }
  return res.json() as Promise<T>
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`API POST ${path} → ${res.status}: ${text.slice(0, 120)}`)
  }
  return res.json() as Promise<T>
}

// ── Health ──────────────────────────────────────────────────────────────────
export async function getHealth(): Promise<HealthStatus> {
  return get<HealthStatus>("/health")
}

// ── Cases ───────────────────────────────────────────────────────────────────
export async function listCases(limit = 20): Promise<CaseListItem[]> {
  const data = await get<{ cases: CaseListItem[] }>(`/cases?limit=${limit}`)
  return data.cases ?? []
}

export async function getCase(caseId: string): Promise<CaseAnswer> {
  return get<CaseAnswer>(`/cases/${caseId}`)
}

export async function getCaseEvidence(caseId: string) {
  return get<{ evidence: CaseAnswer["case"]["evidence"]; evidence_requests: CaseAnswer["evidence_requests"] }>(
    `/cases/${caseId}/evidence`
  )
}

export async function getCaseGraph(caseId: string) {
  return get<{
    written_to_graph: boolean
    graph_case_id: string
    connected_card_ids: string[]
    connected_device_profiles: string[]
  }>(`/cases/${caseId}/graph`)
}

export async function getCaseAudit(caseId: string) {
  return get<{ case_id: string; audit: unknown[] }>(`/cases/${caseId}/audit`)
}

export async function approveAction(caseId: string, actionId: string) {
  return post<{ approved: boolean; execution_mode: string }>(
    `/cases/${caseId}/actions/${actionId}/approve`,
    {}
  )
}

export async function rejectAction(caseId: string, actionId: string) {
  return post<{ rejected: boolean }>(
    `/cases/${caseId}/actions/${actionId}/reject`,
    {}
  )
}

// ── Investigations ──────────────────────────────────────────────────────────
export async function runInvestigation(caseId: string): Promise<CaseAnswer> {
  return post<CaseAnswer>("/investigations/run", { case_id: caseId })
}

export async function runAllInvestigations() {
  return post<{ total: number; completed: number; failed: number; results: Record<string, unknown> }>(
    "/investigations/run-all",
    {}
  )
}

// ── SSE stream ───────────────────────────────────────────────────────────────
export function streamInvestigation(
  caseId: string,
  onEvent: (event: StreamEvent) => void,
  onError?: (err: Error) => void
): () => void {
  const url = `${BASE}/investigations/${caseId}/stream`
  const source = new EventSource(url)

  source.onmessage = (e) => {
    try {
      const parsed: StreamEvent = JSON.parse(e.data)
      onEvent(parsed)
      if (parsed.complete) source.close()
    } catch {
      // ignore parse errors on individual events
    }
  }
  source.onerror = () => {
    source.close()
    onError?.(new Error("SSE connection error"))
  }

  return () => source.close()
}
