// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {BaseTest} from "./Base.t.sol";
import {FeeController} from "../src/FeeController.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract FeeControllerTest is BaseTest {
    function test_defaultsToZero() public view {
        assertEq(fees.protocolFeeBps(), 0);
        assertEq(fees.computeFee(alice, 1_000e6), 0);
        assertEq(fees.feeRecipient(), treasury);
    }

    function test_boundedAndExemptions() public {
        vm.startPrank(admin);
        vm.expectRevert(FeeController.FeeTooHigh.selector);
        fees.setProtocolFeeBps(101);
        fees.setProtocolFeeBps(25);
        assertEq(fees.computeFee(alice, 10_000e6), 25e6);
        fees.setExempt(alice, true);
        assertEq(fees.computeFee(alice, 10_000e6), 0);
        assertEq(fees.computeFee(bob, 10_000e6), 25e6);
        vm.stopPrank();
    }

    function test_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        fees.setProtocolFeeBps(1);
    }

    function testFuzz_feeNeverExceedsOnePercent(uint16 bps, uint256 amount) public {
        bps = uint16(bound(bps, 0, fees.MAX_PROTOCOL_FEE_BPS()));
        amount = bound(amount, 0, type(uint128).max);
        vm.prank(admin);
        fees.setProtocolFeeBps(bps);
        assertLe(fees.computeFee(bob, amount), amount / 100);
    }
}
