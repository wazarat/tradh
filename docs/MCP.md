# MCP (planned — Milestone 3)

A separate MCP server (`apps/mcp`) will expose read tools (`list_supported_assets`, `get_market_snapshot`, `get_portfolio`, `get_strategy_status`, …) and draft/validation tools (`create_strategy_draft`, `validate_strategy`, `simulate_strategy`, `request_trade_approval`, `pause_strategy`, `revoke_strategy_authorization`). There is **no** execute-trade tool; execution goes through the authenticated approval flow and policy enforcement.

Auth: OAuth 2.1 with per-user tokens, resource ownership checks, scopes per tool group, rate limits and audit logs. All MCP input is treated as untrusted; strategy rules are validated against `StrategySpec` before anything is saved. Not implemented yet; `ENABLE_MCP=false`.
