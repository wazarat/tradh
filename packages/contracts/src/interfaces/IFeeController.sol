// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IFeeController {
    function feeRecipient() external view returns (address);
    function protocolFeeBps() external view returns (uint16);
    function isExempt(address account) external view returns (bool);
    /// @return fee the protocol fee owed on `amount` by `payer` (0 when exempt or disabled)
    function computeFee(address payer, uint256 amount) external view returns (uint256 fee);
}
