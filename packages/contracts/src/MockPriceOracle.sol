// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IMockPriceOracle} from "./interfaces/IMockPriceOracle.sol";

/// @title MockPriceOracle
/// @notice TESTNET-ONLY controlled price feed. Prices are USD scaled by 1e8 and carry the
///         timestamp the operator observed them at. Reads revert when a feed is paused or stale
///         so dependent logic cannot silently use bad data. Only ORACLE_ROLE can post prices;
///         retail users cannot move prices used by shared execution.
contract MockPriceOracle is AccessControl, IMockPriceOracle {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    struct Feed {
        uint128 price;      // USD * 1e8
        uint64 updatedAt;   // unix seconds
        bool paused;
        bool exists;
    }

    uint256 public maxPriceAge;
    mapping(address => Feed) private _feeds;

    event PriceUpdated(address indexed asset, uint256 price, uint256 updatedAt);
    event FeedPaused(address indexed asset, bool paused);
    event MaxPriceAgeUpdated(uint256 maxPriceAge);

    error InvalidPrice();
    error InvalidTimestamp();
    error FeedMissing(address asset);
    error FeedPausedError(address asset);
    error StalePrice(address asset, uint256 updatedAt);
    error ZeroAddress();

    constructor(address admin, uint256 maxPriceAge_) {
        if (admin == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
        maxPriceAge = maxPriceAge_;
        emit MaxPriceAgeUpdated(maxPriceAge_);
    }

    function setMaxPriceAge(uint256 maxPriceAge_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxPriceAge = maxPriceAge_;
        emit MaxPriceAgeUpdated(maxPriceAge_);
    }

    /// @param timestamp when the price was observed; must not be in the future
    function setPrice(address asset, uint256 price, uint256 timestamp) external onlyRole(ORACLE_ROLE) {
        _set(asset, price, timestamp);
    }

    function setPrices(address[] calldata assets, uint256[] calldata prices, uint256 timestamp)
        external
        onlyRole(ORACLE_ROLE)
    {
        require(assets.length == prices.length, "length mismatch");
        for (uint256 i = 0; i < assets.length; i++) {
            _set(assets[i], prices[i], timestamp);
        }
    }

    function setPaused(address asset, bool paused) external onlyRole(ORACLE_ROLE) {
        if (!_feeds[asset].exists) revert FeedMissing(asset);
        _feeds[asset].paused = paused;
        emit FeedPaused(asset, paused);
    }

    function getPrice(address asset) external view returns (uint256 price, uint256 updatedAt) {
        Feed memory f = _feeds[asset];
        if (!f.exists) revert FeedMissing(asset);
        if (f.paused) revert FeedPausedError(asset);
        if (block.timestamp > uint256(f.updatedAt) + maxPriceAge) revert StalePrice(asset, f.updatedAt);
        return (f.price, f.updatedAt);
    }

    function peekPrice(address asset) external view returns (uint256 price, uint256 updatedAt, bool valid) {
        Feed memory f = _feeds[asset];
        valid = f.exists && !f.paused && block.timestamp <= uint256(f.updatedAt) + maxPriceAge;
        return (f.price, f.updatedAt, valid);
    }

    function _set(address asset, uint256 price, uint256 timestamp) internal {
        if (asset == address(0)) revert ZeroAddress();
        if (price == 0 || price > type(uint128).max) revert InvalidPrice();
        if (timestamp > block.timestamp || timestamp > type(uint64).max) revert InvalidTimestamp();
        _feeds[asset] = Feed({price: uint128(price), updatedAt: uint64(timestamp), paused: _feeds[asset].paused, exists: true});
        emit PriceUpdated(asset, price, timestamp);
    }
}
