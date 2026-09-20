from fastapi import APIRouter
from ..tigergraph.client import get_client
from ..tigergraph.mcp_client import get_mcp_client
from ..data_layer import get_data_layer

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    dl = get_data_layer()
    tg_ok = False
    mcp_ok = False
    try:
        tg_ok = await get_client().ping()
    except Exception:
        pass
    try:
        mcp_ok = await get_mcp_client().ping()
    except Exception:
        pass
    return {
        "status": "ok",
        "tigergraph": "connected" if tg_ok else "unavailable",
        "mcp": "connected" if mcp_ok else "unavailable",
        "data_loaded": {
            "transactions": len(dl.transactions),
            "identity": len(dl.identity),
            "closed_cases": len(dl.closed_cases),
            "case_pack": len(dl.case_pack),
        },
    }
