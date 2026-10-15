// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IFeeController} from "./interfaces/IFeeController.sol";

/// @title FeeController
/// @notice Bounded, disclosed platform fee configuration. Fee collection starts at zero.
contract FeeController is Ownable2Step, IFeeController {
    /// @notice Hard ceiling on the protocol fee: 1% (100 bps).
    uint16 public constant MAX_PROTOCOL_FEE_BPS = 100;

    uint16 public protocolFeeBps;
    address public feeRecipient;
    mapping(address => bool) public isExempt;

    event ProtocolFeeUpdated(uint16 bps);
    event FeeRecipientUpdated(address recipient);
    event ExemptionUpdated(address indexed account, bool exempt);

    error FeeTooHigh();
    error ZeroAddress();

    constructor(address owner_, address feeRecipient_) Ownable(owner_) {
        if (feeRecipient_ == address(0)) revert ZeroAddress();
        feeRecipient = feeRecipient_;
        emit FeeRecipientUpdated(feeRecipient_);
        emit ProtocolFeeUpdated(0);
    }

    function setProtocolFeeBps(uint16 bps) external onlyOwner {
        if (bps > MAX_PROTOCOL_FEE_BPS) revert FeeTooHigh();
        protocolFeeBps = bps;
        emit ProtocolFeeUpdated(bps);
    }

    function setFeeRecipient(address recipient) external onlyOwner {
        if (recipient == address(0)) revert ZeroAddress();
        feeRecipient = recipient;
        emit FeeRecipientUpdated(recipient);
    }

    function setExempt(address account, bool exempt) external onlyOwner {
        isExempt[account] = exempt;
        emit ExemptionUpdated(account, exempt);
    }

    function computeFee(address payer, uint256 amount) external view returns (uint256 fee) {
        if (protocolFeeBps == 0 || isExempt[payer]) return 0;
        return (amount * protocolFeeBps) / 10_000;
    }
}
