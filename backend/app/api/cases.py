"""Cases API — CRUD and lifecycle management."""

from fastapi import APIRouter, HTTPException
from ..cases.case_manager import CaseManager
from ..models.case import CaseAnswer, ActionType

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


@router.get("/{case_id}/audit")
async def get_audit(case_id: str):
    if not _mgr.get_answer(case_id):
        raise HTTPException(404, f"Case {case_id} not found")
    return {"case_id": case_id, "audit": _mgr.get_audit(case_id)}


@router.post("/{case_id}/actions/{action_id}/approve")
async def approve_action(case_id: str, action_id: str):
    ans = _mgr.get_answer(case_id)
    if not ans:
        raise HTTPException(404, f"Case {case_id} not found")
    try:
        ActionType(action_id)
    except ValueError as exc:
        raise HTTPException(400, f"Unknown action: {action_id}") from exc
    available = {a.action.value for a in ans.next_best_actions.final}
    if action_id not in available:
        raise HTTPException(409, f"Action {action_id} is not recommended for this case")
    ans.action_decisions[action_id] = {
        "status": "approved",
        "execution_mode": "SIMULATED",
    }
    _mgr.update_answer(ans)
    _mgr.log_audit(case_id, [{
        "step": 12, "action": "approval", "status": "approved",
        "action_id": action_id, "execution_mode": "SIMULATED",
    }])
    return {"approved": True, "case_id": case_id, "action": action_id,
            "execution_mode": "SIMULATED"}


@router.post("/{case_id}/actions/{action_id}/reject")
async def reject_action(case_id: str, action_id: str):
    ans = _mgr.get_answer(case_id)
    if not ans:
        raise HTTPException(404, f"Case {case_id} not found")
    if action_id not in {a.action.value for a in ans.next_best_actions.final}:
        raise HTTPException(409, f"Action {action_id} is not recommended for this case")
    ans.action_decisions[action_id] = {
        "status": "rejected",
        "execution_mode": "SIMULATED",
    }
    _mgr.update_answer(ans)
    _mgr.log_audit(case_id, [{
        "step": 12, "action": "approval", "status": "rejected",
        "action_id": action_id, "execution_mode": "SIMULATED",
    }])
    return {"rejected": True, "case_id": case_id, "action": action_id}
