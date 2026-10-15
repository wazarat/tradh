// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title MockStockToken
/// @notice TESTNET-ONLY simulation of a tokenized equity exposure. It has no monetary value,
///         is not issued by Robinhood or any issuer, and exists so the tradh. platform can be
///         exercised end to end on Robinhood Chain Testnet before issuer-backed assets are available.
contract MockStockToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint8 private immutable _decimals;
    /// @notice Ticker of the underlying reference instrument (e.g. "AAPL"). Informational only.
    string public underlyingSymbol;

    error ZeroAddress();

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        string memory underlyingSymbol_,
        address admin
    ) ERC20(name_, symbol_) {
        if (admin == address(0)) revert ZeroAddress();
        _decimals = decimals_;
        underlyingSymbol = underlyingSymbol_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    /// @notice Always true. Lets integrators refuse to treat this as an issuer-backed token.
    function isMock() external pure returns (bool) {
        return true;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
