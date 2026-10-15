# Exchange and execution

Phase 1 routes every trade to `MockSpotExchange` (constant product, asset/mUSD pools). Costs shown to the user: LP fee (kept in pool), protocol fee (0 by default, routed to `FeeController.feeRecipient`), price impact, network fee, minimum received. Fee accounting: `executions` stores `lpFee`, `protocolFee`, `gasUsed`, `effectiveGasPrice` from the receipt.

Phase 2 adds venue discovery, quote comparison and external adapters (Arcus, Rialto, Uniswap on Robinhood Chain) behind `ISpotExchange`, and a separately deployable liquidity module. External venue fees are not platform revenue.
