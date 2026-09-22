# TIGER EFFECT — Fraud Investigation Intelligence

> **Hunt the evidence. Map the fraud.**

An evidence-grounded fraud investigation system built for the
**TigerGraph × Hacker House Goa — IEEE-CIS Fraud Detection** hackathon challenge.

---

## What it does

Tiger Effect takes a fraud alert — a flagged transaction, a customer dispute, or an
analyst request — and runs a full investigation lifecycle:

```
Trigger
  → TigerGraph graph retrieval  (7 parallel GSQL queries)
  → GraphRAG evidence pack      (graph + closed cases + policy + typology)
  → LLM reasoning               (Groq / deterministic fallback)
  → Pattern detection           (5 documented + undocumented)
  → Risk scoring                (continuous weighted signal aggregation)
  → Uncertainty assessment      (evidence-sufficiency gate)
  → Evidence request if needed  (customer validation / step-up auth)
  → Re-assessment after evidence
  → Policy-controlled action    (R1–R10, approval routes auto/L1/L2)
  → SAR generation if required
  → Case memory write-back      (TigerGraph FraudCaseGraph)
  → Audit trail
```

All 20 hackathon cases are investigated automatically. Every verdict is grounded in
retrieved evidence — nothing is fabricated.

---

## Architecture overview

```
┌─────────────────────────────────────────────────────────┐
│                    TIGER EFFECT                         │
│                                                         │
│  ┌──────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │ Frontend │   │   Backend    │   │  TigerGraph    │  │
│  │ Next.js  │◄─►│  FastAPI     │◄─►│  Savanna       │  │
│  │ React 14 │   │  Python 3.13 │   │  FraudCaseGraph│  │
│  └──────────┘   └──────┬───────┘   └────────────────┘  │
│                         │                               │
│                  ┌──────▼───────┐                       │
│                  │  MCP Server  │                       │
│                  │ tigergraph-  │                       │
│                  │    mcp       │                       │
│                  └──────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

### Backend (`backend/`)

| Layer | What it does |
|---|---|
| `app/agents/fraud_agent.py` | Investigation orchestrator — runs the full 10-step lifecycle |
| `app/rag/` | GraphRAG pipeline: graph retriever, document retriever, ranker, context builder |
| `app/fraud/` | Deterministic engines: risk, pattern detector, exposure calculator |
| `app/policy/policy_engine.py` | Machine-readable fraud policy R1–R10, approval routing |
| `app/tigergraph/client.py` | pyTigerGraph-backed Savanna client with auto-discovery |
| `app/tigergraph/mcp_client.py` | Official `tigergraph-mcp` stdio integration |
| `app/tigergraph/queries.py` | Investigation-specific GSQL query wrappers |
| `app/cases/case_manager.py` | SQLite case persistence + audit log |
| `app/reports/sar_generator.py` | FinCEN-compliant SAR narrative generation |
| `app/llm/` | LLM provider abstraction (Groq / OpenAI-compatible) |

### Frontend (`frontend/`)

| Component | What it does |
|---|---|
| `src/app/page.tsx` | Main orchestrator — hero → investigation → workspace |
| `src/components/hero/` | Cinematic landing with procedural tiger canvas |
| `src/components/investigation/` | Evidence graph, evidence stream, action center, audit |
| `src/components/cases/` | Case list explorer |
| `src/lib/api.ts` | Backend API client — real endpoints, no mocks |

---

## TigerGraph integration

Tiger Effect uses TigerGraph as the **central investigation graph**, not merely a
database. Here is exactly how it fits in:

### Graph schema (FraudCaseGraph)

```
Vertices:  Transaction  Card  Customer  Identity  FraudCase

Edges:
  transaction_belongs_to_card      Transaction → Card
  transaction_belongs_to_customer  Transaction → Customer
  transaction_has_identity         Transaction → Identity
  case_flagged_transaction         FraudCase   → Transaction
  case_involves_card               FraudCase   → Card
  case_involves_customer           FraudCase   → Customer
  closed_case_involves_customer    FraudCase   → Customer
  closed_case_involves_card        FraudCase   → Card
```

### Installed GSQL queries (11 investigation queries)

| Query | Purpose |
|---|---|
| `Transaction_Fraud` | Full transaction neighbourhood — card, customer, identity |
| `get_transaction_context` | 1-hop context around a transaction |
| `get_customer_history` | All transactions for a customer (ordered, limited) |
| `find_connected_cards` | Cards sharing the same customer lineage |
| `find_shared_identity` | Transactions sharing the same device/identity record |
| `find_prior_fraud_cases` | Historical FraudCase vertices for a customer/card |
| `find_behavioral_anomalies` | Velocity statistics for a card (count, avg, max, min) |
| `find_card_transactions` | Recent transaction list for a card |
| `calculate_exposure` | Sum of transaction amounts for an episode |
| `get_case_history` | Full case record with linked entities |
| `link_fraud_case` | Connect a FraudCase vertex to its card/customer/transaction |

### Two-plane Savanna authentication

```
Control-plane  https://api.tgcloud.io   x-api-key header   → discover workspace host
Data-plane     <workspace>.i.tgcloud.io  Bearer token        → run GSQL queries
```

1. On startup the client reads `TIGERGRAPH_HOST` from `.env`.
   If blank, it calls `api.tgcloud.io/controller/v4/v2/workgroups` with the Savanna
   API key, walks the workspace list, and extracts the `nginx_host` field.
2. It then calls `getToken(secret)` via pyTigerGraph to exchange the GSQL secret for
   a short-lived Bearer token.
3. All subsequent queries use that token over HTTPS port 443.

### MCP path (official `tigergraph-mcp` package)

Each investigation opens a private stdio subprocess:

```
FraudAgent._gather_mcp_evidence()
  → MCPInvestigationClient.__aenter__()
      → subprocess: tigergraph-mcp  (reads TG_* env vars)
          → pyTigerGraph async → TigerGraph Savanna REST++
  → 7 parallel tool calls (Transaction_Fraud, get_customer_history, …)
  → ProvenanceMCPResult per call  (source_type=tigergraph_mcp, query_name, entity_ids)
  → merged into EvidencePack
```

The MCP subprocess reads `TG_*` environment variables (mapped from `TIGERGRAPH_*` at
call time). No credentials are embedded in code.

### GraphRAG retrieval pipeline

```
InvestigationContextBuilder.build()
  1. GraphRetriever.retrieve_all()     → 7 TigerGraph queries, normalised ProvenanceItems
  2. CaseSimilarityIndex.find_similar() → TF-IDF cosine over 5,565 closed cases
  3. DocumentRetriever                  → policy R1–R10, typologies, regulatory refs
  4. EvidenceRanker.rank()             → score × deduplicate × top-15
  → EvidencePack  (sent to LLM as structured context, never raw CSV)
```

### Case memory write-back

After every investigation the result is written back to TigerGraph as a `FraudCase`
vertex with edges to its transaction, card and customer. Future investigations can
retrieve these cases via `find_prior_fraud_cases`, closing the memory loop.

---

## Quick start

### Prerequisites

- Python 3.11+ and Node.js 18+
- A free [TigerGraph Savanna](https://savanna.tgcloud.io) account with a running
  workspace and the `FraudCaseGraph` schema loaded
- A [Groq](https://console.groq.com) API key (free tier works)

### 1. Clone and configure

```bash
git clone <repo-url>
cd TigerAttack
cp .env.example .env
```

Edit `.env` — **never commit this file**:

```dotenv
# TigerGraph Savanna API key (from Savanna UI → Settings → API Keys)
TIGERGRAPGH_SAVANNA=your_savanna_api_key_here

# Your workspace host — leave blank for auto-discovery
TIGERGRAPH_HOST=

# Graph name
TIGERGRAPH_GRAPH_NAME=FraudCaseGraph

# GSQL secret (from GraphStudio → Admin Portal → User Management → Secrets)
TIGERGRAPH_SECRET=your_gsql_secret_here

# LLM (Groq recommended — free tier available)
LLM_PROVIDER=groq
LLM_API_KEY=your_groq_api_key_here
LLM_MODEL=openai/gpt-oss-120b
LLM_BASE_URL=https://api.groq.com/openai/v1
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
```

**Start the API server:**

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Run all 20 investigation cases:**

```bash
python run_investigations.py
# Output: cases/HHG-001.json … cases/HHG-020.json
```

**Install GSQL queries into TigerGraph:**

```bash
python install_queries.py
```

**Test TigerGraph connectivity:**

```bash
python test_tigergraph_connection.py
```

**Run the test suite:**

```bash
pytest backend/tests -q
```

**Run the full validator:**

```bash
python validate_backend.py
```

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Development server:**

```bash
npm run dev
# Open http://localhost:3000
```

**Production build:**

```bash
npm run build
npm start
```

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Backend + TigerGraph + MCP status |
| `GET` | `/cases` | List investigated cases |
| `GET` | `/cases/{id}` | Full case record |
| `GET` | `/cases/{id}/evidence` | Evidence pack |
| `GET` | `/cases/{id}/graph` | Graph write status |
| `GET` | `/cases/{id}/audit` | Audit trail |
| `POST` | `/cases/{id}/actions/{action}/approve` | Approve an L1/L2 action |
| `POST` | `/investigations/run` | Investigate one case |
| `POST` | `/investigations/run-all` | Investigate all 20 cases |
| `GET` | `/investigations/{id}/stream` | SSE live investigation stream |

---

## Dataset

The dataset is the **IEEE-CIS Fraud Detection** dataset published by Vesta Corporation,
with modifications for the hackathon:

| File | Contents |
|---|---|
| `Datasets/transactions_clean.csv` | 590,742 transactions (58 columns) |
| `Datasets/identity.csv` | 144,432 identity/device records |
| `Datasets/closed_cases_history.csv` | 5,565 closed investigations |
| `Datasets/case_pack.csv` | 20 exam cases |
| `Datasets/README.md` | Full data dictionary + fraud policy |

**Important:** The original fraud labels have been removed and replaced with a
`risk_score` (0–1). The risk score is an input signal, never a verdict.

---

## Fraud policy

The investigation follows **Fraud Policy v1.0** from `Datasets/README.md`:

| Rule | Summary |
|---|---|
| R1 | Verify before blocking when `fp < 0.70` (single signal) |
| R2 | Customer denies → BLOCK_CARD + CREATE_CASE |
| R3 | Customer confirms → CLOSE_NO_FRAUD |
| R4 | No reply 24 h → MONITOR_CARD + DECLINE |
| R5 | Card testing pattern → DECLINE + STEP_UP_AUTH |
| R6 | Shared device/region across cards → FILE_REPORT |
| R7 | Disputed but recurring → VERIFY + WARN (no block) |
| R8 | Uncertain + exposure > $500 → ESCALATE |
| R9 | Undocumented pattern → CREATE_CASE + FILE_REPORT + ESCALATE |
| R10 | BLOCK_ALL_CARDS only when ≥2 cards confirmed fraud |

Verdict thresholds (anchored to the policy):

```
fp >= 0.70  →  FRAUD        (R1 blocking boundary)
fp <= 0.30  →  LEGITIMATE   (below monitoring threshold)
otherwise   →  UNCERTAIN    (triggers evidence-request lifecycle)
```

---

## Validation results

Latest full run — 20/20 cases, real TigerGraph, real MCP:

```
Cases completed     : 20/20
MCP calls           : 140 / 140 successful
Graph evidence      : 300 items
Historical cases    : 100 retrieved (5 per case)
Memory writes       : 20 / 20 readbacks verified
Audit events        : 409
Grounding failures  : 0
Tests               : 94 passed / 0 failed
```

---

## Security notes

- **Never commit `.env`** — it is gitignored. Use `.env.example` as the template.
- All credentials are read from environment variables at runtime.
- The frontend (`NEXT_PUBLIC_*`) exposes only the backend URL — no TigerGraph
  credentials or LLM keys ever reach the browser.
- The LLM receives only the `EvidencePack` context (structured JSON) — never raw
  CSVs or secrets.
- Action approval gates (L1/L2) are enforced server-side by the policy engine.

---

## Project structure

```
TigerAttack/
├── backend/
│   ├── app/
│   │   ├── agents/          # FraudAgent orchestrator
│   │   ├── api/             # FastAPI routers
│   │   ├── cases/           # Case manager + state machine
│   │   ├── fraud/           # Risk engine, pattern detector, exposure
│   │   ├── graphrag/        # Legacy GraphRAG retriever (kept for compat)
│   │   ├── llm/             # LLM provider abstraction
│   │   ├── models/          # Pydantic models matching Answer Format
│   │   ├── policy/          # Policy engine R1–R10
│   │   ├── rag/             # GraphRAG pipeline (graph + doc + ranker)
│   │   ├── reports/         # SAR generator
│   │   └── tigergraph/      # TG client, MCP client, GSQL wrappers
│   ├── gsql/                # GSQL query definitions
│   ├── tests/               # 94 tests
│   ├── run_investigations.py
│   ├── install_queries.py
│   ├── validate_backend.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js app router
│   │   ├── components/      # Hero, investigation workspace, case list
│   │   └── lib/             # Types, API client, utilities
│   ├── .env.local           # NEXT_PUBLIC_API_URL (not committed)
│   └── package.json
├── cases/                   # Generated answer files (HHG-001.json … HHG-020.json)
├── Datasets/                # Source data (read-only)
├── .env                     # Secrets — never commit
├── .env.example             # Template — safe to commit
└── README.md
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Graph database | TigerGraph Savanna (FraudCaseGraph) |
| Graph SDK | pyTigerGraph 2.0.4 |
| MCP server | tigergraph-mcp 1.0.3 (official) |
| Backend | FastAPI + Python 3.13 |
| LLM | Groq (`openai/gpt-oss-120b`) via OpenAI-compatible API |
| Vector similarity | scikit-learn TF-IDF + cosine (5,565 closed cases) |
| Persistence | SQLite (case memory + audit log) |
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Animations | Framer Motion + Canvas 2D API |
| Evidence viz | D3 force-directed graph |
