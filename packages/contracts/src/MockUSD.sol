// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title MockUSD
/// @notice TESTNET-ONLY dollar-denominated settlement asset with a rate-limited faucet.
///         No real value. 6 decimals like common USD stablecoins.
contract MockUSD is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public constant FAUCET_AMOUNT = 10_000 * 1e6; // 10,000 mUSD per claim
    uint256 public constant FAUCET_COOLDOWN = 24 hours;
    uint256 public constant FAUCET_LIFETIME_CAP = 100_000 * 1e6; // per address

    mapping(address => uint256) public lastClaimAt;
    mapping(address => uint256) public totalClaimed;

    event FaucetClaimed(address indexed account, uint256 amount);

    error FaucetCooldown(uint256 availableAt);
    error FaucetCapReached();
    error ZeroAddress();

    constructor(address admin) ERC20("Mock USD (tradh. testnet)", "mUSD") {
        if (admin == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    function isMock() external pure returns (bool) {
        return true;
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Claim FAUCET_AMOUNT once per FAUCET_COOLDOWN, up to FAUCET_LIFETIME_CAP.
    function faucet() external {
        uint256 availableAt = lastClaimAt[msg.sender] + FAUCET_COOLDOWN;
        if (lastClaimAt[msg.sender] != 0 && block.timestamp < availableAt) {
            revert FaucetCooldown(availableAt);
        }
        if (totalClaimed[msg.sender] + FAUCET_AMOUNT > FAUCET_LIFETIME_CAP) revert FaucetCapReached();
        lastClaimAt[msg.sender] = block.timestamp;
        totalClaimed[msg.sender] += FAUCET_AMOUNT;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}
