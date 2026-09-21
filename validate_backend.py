"""Authoritative runtime validation for the fraud investigation backend.

This command intentionally distinguishes local deterministic checks from live
TigerGraph/MCP/LLM execution. It never turns a missing service into success.
"""

from __future__ import annotations

import asyncio
import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "backend"))

from app.agents.fraud_agent import FraudAgent, validate_grounded_llm_output  # noqa: E402
from app.config import get_settings  # noqa: E402
from app.data_layer import get_data_layer  # noqa: E402
from app.tigergraph.mcp_client import get_mcp_investigation_client  # noqa: E402
from app.tigergraph.queries import TGQueries  # noqa: E402
from app.tigergraph.client import get_client  # noqa: E402


def _status(ok: bool, attempted: bool = True) -> str:
    if ok:
        return "PASS"
    return "DEGRADED" if attempted else "NOT_VERIFIED"


def _case_metrics(answer: Any) -> dict[str, Any]:
    evidence = answer.case.evidence
    mcp_events = [e for e in answer.audit if e.get("action") == "mcp_graph_access"]
    return {
        "case_id": answer.case_id,
        "runtime": answer.runtime,
        "status": answer.case.status.value,
        "verdict": answer.case.verdict.value,
        "fraud_probability": answer.case.fraud_probability,
        "pattern": answer.case.pattern.value,
        "exposure_usd": answer.case.exposure_usd,
        "tigergraph_queries": sum(
            1 for e in answer.audit if e.get("action") in {
                "gather_evidence", "case_memory_readback"
            } and e.get("status") == "complete"
        ),
        "mcp_calls": sum(e.get("calls", 0) for e in mcp_events),
        "mcp_successful_calls": sum(e.get("successful_calls", 0) for e in mcp_events),
        "graph_evidence_count": len(evidence),
        "historical_cases": len(answer.case.similar_prior_cases),
        "policy_evidence": len(answer.policy_evidence) + len(answer.typology_evidence),
        "evidence_requests": len(answer.evidence_requests),
        "initial_actions": [a.action.value for a in answer.next_best_actions.initial],
        "final_actions": [a.action.value for a in answer.next_best_actions.final],
        "approval": answer.action_decisions,
        "sar": answer.sar.model_dump(),
        "case_memory": answer.case_memory,
        "audit_event_count": len(answer.audit),
        "stop_reason": answer.stop_reason,
        "grounding": answer.validation,
        "llm_api_calls": answer.validation.get("llm_api_calls", 0),
        "llm_backup_used": answer.validation.get("llm_backup_used", False),
    }


async def _live_checks(rows: list[dict[str, Any]], progress_path: Path | None = None) -> dict[str, Any]:
    agent = FraudAgent()
    cases: list[dict[str, Any]] = []
    for row in rows:
        started = time.monotonic()
        try:
            answer = await agent.investigate(row)
            item = _case_metrics(answer)
            item["latency_s"] = round(time.monotonic() - started, 3)
            item["runtime_status"] = "COMPLETED"
        except Exception as exc:  # noqa: BLE001
            item = {
                "case_id": row.get("case_id", ""),
                "runtime_status": "FAILED",
                "error": str(exc),
            }
        cases.append(item)
        if progress_path:
            progress_path.parent.mkdir(exist_ok=True)
            progress_path.write_text(
                json.dumps({"completed_cases": cases}, indent=2, default=str),
                encoding="utf-8",
            )

    graph_algorithm: dict[str, Any]
    try:
        result = await TGQueries().run_community_detection(rows[0].get("card_id", ""))
        graph_algorithm = {
            "algorithm": "bounded_connected_card_neighborhood",
            "input": rows[0].get("card_id", ""),
            "output_summary": result,
            "why_executed": "Measure connected-card exposure for the investigation graph.",
            "investigation_impact": "Provides a bounded connected-card signal to exposure and policy evaluation.",
            "status": "PASS" if result else "DEGRADED",
        }
    except Exception as exc:  # noqa: BLE001
        graph_algorithm = {"algorithm": "bounded_connected_card_neighborhood", "status": "FAILED", "error": str(exc)}

    mcp_report: dict[str, Any]
    try:
        async with get_mcp_investigation_client() as mcp:
            installed = await mcp.list_installed_queries()
            mcp_report = {
                "status": "PASS" if mcp.available else "DEGRADED",
                "package": "tigergraph-mcp",
                "transport": "stdio",
                "server_available": mcp.available,
                "tool_count": mcp.tool_count,
                "tool_names": mcp.tool_names,
                "installed_queries_discovered": installed,
            }
    except Exception as exc:  # noqa: BLE001
        mcp_report = {"status": "FAILED", "error": str(exc)}

    try:
        installed = get_client().installed_queries()
        direct_queries = [str(name).split("/")[-1] for name in installed]
        gsql_report = {
            "status": "PASS" if direct_queries else "DEGRADED",
            "source": "pyTigerGraph.getInstalledQueries",
            "query_count": len(direct_queries),
            "queries": sorted(direct_queries),
            "mcp_metadata_status": "DEGRADED" if len(mcp_report.get("installed_queries_discovered", [])) < len(direct_queries) else "PASS",
        }
    except Exception as exc:  # noqa: BLE001
        gsql_report = {"status": "FAILED", "error": str(exc)}

    return {
        "cases": cases,
        "graph_algorithm": graph_algorithm,
        "mcp": mcp_report,
        "gsql": gsql_report,
    }


def _security_check() -> dict[str, Any]:
    tracked = subprocess.run(
        ["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, check=True
    ).stdout.splitlines()
    forbidden = {".env", "backend/fraud_cases.db", "backend/fraud_cases_index.pkl"}
    leaked_paths = sorted(forbidden.intersection(tracked))
    return {
        "status": "PASS" if not leaked_paths else "FAIL",
        "tracked_secret_paths": leaked_paths,
    }


def _tests_check() -> dict[str, Any]:
    started = time.monotonic()
    result = subprocess.run(
        [sys.executable, "-m", "pytest", "backend/tests", "-q"],
        cwd=ROOT, capture_output=True, text=True,
        env={**os.environ, "TIGERATTACK_DISABLE_LLM": "1"},
    )
    return {
        "status": "PASS" if result.returncode == 0 else "FAIL",
        "returncode": result.returncode,
        "duration_s": round(time.monotonic() - started, 3),
        "output_tail": (result.stdout + result.stderr)[-2000:],
    }


def _adversarial_grounding_check() -> dict[str, Any]:
    """Verify an unsupported device ID is rejected without any live mutation."""
    context = {
        "trigger": {"txn_id": "3583227", "card_id": "C08106-K1", "customer_id": "C08106"},
        "graph_evidence": [{"entity_ids": ["3583227", "C08106-K1", "C08106"]}],
        "mcp_evidence": [],
        "historical_cases": [],
        "policy_evidence": [],
    }
    accepted, counters = validate_grounded_llm_output(
        context,
        {"evidence": [{"claim": "Unknown device", "entity_ids": ["DEVICE-NOT-IN-PACK"]}]},
    )
    return {
        "status": "PASS" if not accepted and counters["fabricated_entities"] == 1 else "FAIL",
        "accepted_items": len(accepted),
        **counters,
    }


def _markdown_report(report: dict[str, Any]) -> str:
    aggregate = report["aggregate"]
    lines = [
        "# Backend Runtime Validation",
        "",
        f"Generated: `{report['generated_at']}`",
        "",
        "## Component Status",
        "",
        "| Component | Status |",
        "| --- | --- |",
    ]
    lines.extend(
        f"| {name} | {value if isinstance(value, str) else value.get('status', 'UNKNOWN')} |"
        for name, value in report["components"].items()
    )
    lines.extend([
        "",
        "## Runtime Totals",
        "",
        f"- Cases completed: {aggregate['cases_completed']}/{aggregate['cases_total']}",
        f"- MCP calls: {aggregate['mcp_calls']} ({aggregate['mcp_successful_calls']} successful)",
        f"- Graph evidence items: {aggregate['graph_evidence_items']}",
        f"- Historical cases: {aggregate['historical_cases']}",
        f"- Evidence requests: {aggregate['evidence_requests']}",
        f"- Audit events: {aggregate['audit_events']}",
        f"- Graph memory writes/readbacks: {aggregate['graph_memory_writes']}/{aggregate['graph_memory_readbacks']}",
        "",
        "## Cases",
        "",
        "| Case | Runtime | Verdict | Probability | Pattern | Exposure | MCP | Readback | Stop reason |",
        "| --- | --- | --- | ---: | --- | ---: | ---: | ---: | --- |",
    ])
    for case in report["cases"]:
        lines.append(
            f"| {case.get('case_id', '')} | {case.get('runtime_status', '')} | "
            f"{case.get('verdict', '')} | {case.get('fraud_probability', '')} | "
            f"{case.get('pattern', '')} | {case.get('exposure_usd', '')} | "
            f"{case.get('mcp_successful_calls', 0)}/{case.get('mcp_calls', 0)} | "
            f"{case.get('case_memory', {}).get('readback', False)} | "
            f"{case.get('stop_reason', '').replace('|', '\\|')} |"
        )
    return "\n".join(lines) + "\n"


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--case", dest="case_id", help="Validate one case only")
    parser.add_argument("--skip-tests", action="store_true")
    args = parser.parse_args()
    rows = get_data_layer().get_all_case_pack_rows()
    if args.case_id:
        rows = [r for r in rows if r.get("case_id") == args.case_id]
        if not rows:
            raise SystemExit(f"Case {args.case_id} not found in case_pack")
    output_dir = ROOT / "validation_reports"
    output_dir.mkdir(exist_ok=True)
    live = await _live_checks(rows, output_dir / "backend_validation_progress.json")
    completed = [c for c in live["cases"] if c.get("runtime_status") == "COMPLETED"]
    mcp_calls = sum(c.get("mcp_calls", 0) for c in completed)
    mcp_successes = sum(c.get("mcp_successful_calls", 0) for c in completed)
    runtime = {
        "tigergraph": "PASS" if any(c.get("runtime", {}).get("tigergraph") == "CONNECTED" for c in completed) else "DEGRADED",
        "mcp": live["mcp"].get("status", "DEGRADED"),
        "graphrag": "PASS" if completed else "FAILED",
        "llm": (
            "PASS" if any(c.get("runtime", {}).get("llm") == "AVAILABLE" for c in completed)
            else "FAILED" if any(c.get("runtime", {}).get("llm") == "FAILED" for c in completed)
            else "NOT_AVAILABLE"
        ),
    }
    llm_available = runtime["llm"] == "PASS"
    llm_settings = get_settings()
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "classification": "LIVE_SYSTEM_AND_END_TO_END",
        "runtime": runtime,
        "components": {
            "TigerGraph": runtime["tigergraph"],
            "GSQL enumeration": live["gsql"].get("status", "DEGRADED"),
            "GSQL execution": "PASS" if any(c.get("runtime", {}).get("tigergraph") == "CONNECTED" for c in completed) else "DEGRADED",
            "MCP query metadata": live["gsql"].get("mcp_metadata_status", "DEGRADED"),
            "Graph algorithms": live["graph_algorithm"]["status"],
            "MCP": runtime["mcp"],
            "Agent MCP path": "PASS" if mcp_successes else "DEGRADED",
            "GraphRAG": runtime["graphrag"],
            "Historical RAG": "PASS" if any(c.get("historical_cases", 0) for c in completed) else "DEGRADED",
            "Policy RAG": "PASS" if completed else "DEGRADED",
            "Fraud engine": "PASS" if completed else "FAIL",
            "Uncertainty": "PASS" if any(c.get("evidence_requests", 0) for c in completed) else "DEGRADED",
            "Case memory": "PASS" if any(c.get("case_memory", {}).get("written") for c in completed) else "DEGRADED",
            "Graph write/readback": "PASS" if any(c.get("case_memory", {}).get("readback") for c in completed) else "DEGRADED",
            "Audit trail": "PASS" if all(c.get("audit_event_count", 0) > 0 for c in completed) else "DEGRADED",
            "Security": _security_check(),
            "Grounding adversarial test": _adversarial_grounding_check(),
        },
        "aggregate": {
            "cases_total": len(rows),
            "cases_completed": len(completed),
            "mcp_calls": mcp_calls,
            "mcp_successful_calls": mcp_successes,
            "llm_api_calls": sum(c.get("llm_api_calls", 0) for c in completed),
            "llm_backup_uses": sum(bool(c.get("llm_backup_used")) for c in completed),
            "graph_evidence_items": sum(c.get("graph_evidence_count", 0) for c in completed),
            "historical_cases": sum(c.get("historical_cases", 0) for c in completed),
            "evidence_requests": sum(c.get("evidence_requests", 0) for c in completed),
            "audit_events": sum(c.get("audit_event_count", 0) for c in completed),
            "graph_memory_writes": sum(bool(c.get("case_memory", {}).get("written")) for c in completed),
            "graph_memory_readbacks": sum(bool(c.get("case_memory", {}).get("readback")) for c in completed),
        },
        "graph_algorithm": live["graph_algorithm"],
        "mcp_discovery": live["mcp"],
        "gsql": live["gsql"],
        "llm": {
            "provider": llm_settings.llm_provider,
            "model": llm_settings.llm_model,
            "runtime_availability": runtime["llm"],
            "real_invocation": any(
                c.get("grounding", {}).get("llm_runtime") in {"AVAILABLE", "FAILED"}
                for c in completed
            ),
            "fallback_used": any(
                c.get("grounding", {}).get("llm_fallback_used") is True
                for c in completed
            ),
            "evidencepack_only_context": all(
                c.get("grounding", {}).get("llm_raw_dataset_in_context") is False
                for c in completed
            ),
        },
        "grounding_adversarial": _adversarial_grounding_check(),
        "cases": live["cases"],
    }
    report["tests"] = _tests_check() if not args.skip_tests else {
        "status": "NOT_RUN",
        "reason": "--skip-tests was supplied",
    }
    (output_dir / "backend_validation.json").write_text(json.dumps(report, indent=2, default=str), encoding="utf-8")
    (output_dir / "backend_validation.md").write_text(_markdown_report(report), encoding="utf-8")
    if not args.skip_tests:
        (output_dir / "backend_validation.json").write_text(json.dumps(report, indent=2, default=str), encoding="utf-8")
        (output_dir / "backend_validation.md").write_text(_markdown_report(report), encoding="utf-8")
    print(json.dumps({"aggregate": report["aggregate"], "components": report["components"]}, indent=2, default=str))
    return 0 if report["aggregate"]["cases_completed"] == len(rows) else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))