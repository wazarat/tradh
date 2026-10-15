// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Minimal read interface for the testnet price oracle.
interface IMockPriceOracle {
    /// @return price USD price scaled by 1e8
    /// @return updatedAt unix timestamp of the last update
    function getPrice(address asset) external view returns (uint256 price, uint256 updatedAt);

    /// @dev Non-reverting variant. `valid` is false when the feed is missing, paused or stale.
    function peekPrice(address asset)
        external
        view
        returns (uint256 price, uint256 updatedAt, bool valid);
}
