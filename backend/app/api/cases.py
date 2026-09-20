"""Cases API — CRUD and lifecycle management."""

from fastapi import APIRouter, HTTPException
from ..cases.case_manager import CaseManager
from ..models.case import CaseAnswer

router = APIRouter(prefix="/cases", tags=["cases"])
_mgr = CaseManager()


@router.get("")
async def list_cases(limit: int = 50):
    return {"cases": _mgr.list_cases(limit)}


@router.get("/{case_id}")
async def get_case(case_id: str):
    ans = _mgr.get_answer(case_id)
    if not ans:
        raise HTTPException(404, f"Case {case_id} not found")
    return ans


@router.get("/{case_id}/sar")
async def get_sar(case_id: str):
    ans = _mgr.get_answer(case_id)
    if not ans:
        raise HTTPException(404, f"Case {case_id} not found")
    return ans.sar


@router.get("/{case_id}/evidence")
async def get_evidence(case_id: str):
    ans = _mgr.get_answer(case_id)
    if not ans:
        raise HTTPException(404, f"Case {case_id} not found")
    return {"evidence": ans.case.evidence, "evidence_requests": ans.evidence_requests}


@router.get("/{case_id}/transactions")
async def get_transactions(case_id: str):
    ans = _mgr.get_answer(case_id)
    if not ans:
        raise HTTPException(404, f"Case {case_id} not found")
    return {
        "affected_txn_ids": ans.case.affected_txn_ids,
        "exposure_usd": ans.case.exposure_usd,
    }


@router.get("/{case_id}/related-cases")
async def get_related_cases(case_id: str):
    ans = _mgr.get_answer(case_id)
    if not ans:
        raise HTTPException(404, f"Case {case_id} not found")
    return {"similar_prior_cases": ans.case.similar_prior_cases}


@router.get("/{case_id}/graph")
async def get_graph(case_id: str):
    ans = _mgr.get_answer(case_id)
    if not ans:
        raise HTTPException(404, f"Case {case_id} not found")
    return {
        "written_to_graph": ans.case.written_to_graph,
        "graph_case_id": ans.case.graph_case_id,
        "connected_card_ids": ans.case.connected_card_ids,
        "connected_device_profiles": ans.case.connected_device_profiles,
    }


@router.post("/{case_id}/actions/{action_id}/approve")
async def approve_action(case_id: str, action_id: str):
    ans = _mgr.get_answer(case_id)
    if not ans:
        raise HTTPException(404, f"Case {case_id} not found")
    return {"approved": True, "case_id": case_id, "action": action_id}


@router.post("/{case_id}/actions/{action_id}/reject")
async def reject_action(case_id: str, action_id: str):
    ans = _mgr.get_answer(case_id)
    if not ans:
        raise HTTPException(404, f"Case {case_id} not found")
    return {"rejected": True, "case_id": case_id, "action": action_id}
