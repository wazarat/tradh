// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Venue interface the Phase 1 trade UI and the future ExecutionRouter adapter speak.
interface ISpotExchange {
    struct Quote {
        uint256 amountOut;      // gross of nothing: what the taker receives
        uint256 lpFee;          // fee kept in the pool, in tokenIn units
        uint256 protocolFee;    // fee sent to the FeeController recipient, in tokenIn units
        uint256 spotPrice1e18;  // tokenOut per tokenIn before the trade, 1e18 scaled, decimals-adjusted
        uint256 execPrice1e18;  // effective tokenOut per tokenIn for this trade, 1e18 scaled
        uint256 priceImpactBps; // (spot - exec) / spot in basis points
    }

    function quoteExactIn(address tokenIn, address tokenOut, uint256 amountIn)
        external
        view
        returns (Quote memory q);

    function swapExactIn(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address to,
        uint256 deadline
    ) external returns (uint256 amountOut);
}
