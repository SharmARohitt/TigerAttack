"""Probe tigergraph-mcp via stdio to discover tools and test a real call."""
import asyncio
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.config import get_settings
get_settings.cache_clear()
s = get_settings()

# TG_* env vars for the MCP server
MCP_ENV = {
    "TG_HOST":      s.tigergraph_host,
    "TG_GRAPHNAME": s.tigergraph_graph_name,
    "TG_SECRET":    s.tigergraph_secret,
    "TG_TGCLOUD":   "true",
    "TG_SSL_PORT":  "443",
}


async def probe():
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import get_default_environment, stdio_client

    env = {**get_default_environment(), **MCP_ENV}

    server_params = StdioServerParameters(
        command="tigergraph-mcp",
        args=["-vv"],
        env=env,
    )

    print("Starting tigergraph-mcp subprocess...")
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            print("MCP session initialized")

            tools_resp = await session.list_tools()
            tools = tools_resp.tools
            print(f"Tools discovered: {len(tools)}")
            for t in tools[:12]:
                print(f"  {t.name}")
            if len(tools) > 12:
                print(f"  ... and {len(tools)-12} more")

            # Test 1: list graphs
            print("\nCalling tigergraph__list_graphs ...")
            r1 = await session.call_tool("tigergraph__list_graphs", arguments={})
            for c in r1.content:
                print("  list_graphs:", c.text[:200])

            # Test 2: get graph schema
            print("\nCalling tigergraph__get_graph_schema ...")
            r2 = await session.call_tool("tigergraph__get_graph_schema",
                                         arguments={"graph_name": s.tigergraph_graph_name})
            for c in r2.content:
                print("  schema:", c.text[:300])

            # Test 3: run installed query — Transaction_Fraud with txn 3583227 (HHG-004)
            print("\nCalling tigergraph__run_installed_query (Transaction_Fraud)...")
            r3 = await session.call_tool(
                "tigergraph__run_installed_query",
                arguments={
                    "graph_name": s.tigergraph_graph_name,
                    "query_name": "Transaction_Fraud",
                    "params": {"txn": "3583227"},
                },
            )
            for c in r3.content:
                print("  Transaction_Fraud result:", c.text[:500])

            return tools, r3.content


if __name__ == "__main__":
    asyncio.run(probe())
