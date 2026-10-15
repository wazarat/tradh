// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {BaseTest} from "./Base.t.sol";
import {MockPriceOracle} from "../src/MockPriceOracle.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

contract MockPriceOracleTest is BaseTest {
    function test_readsFreshPrice() public view {
        (uint256 p, uint256 t) = oracle.getPrice(address(aapl));
        assertEq(p, 200e8);
        assertEq(t, block.timestamp);
    }

    function test_revertsWhenStale() public {
        vm.warp(block.timestamp + 1 hours + 1);
        vm.expectRevert(abi.encodeWithSelector(MockPriceOracle.StalePrice.selector, address(aapl), block.timestamp - 1 hours - 1));
        oracle.getPrice(address(aapl));
        (, , bool valid) = oracle.peekPrice(address(aapl));
        assertFalse(valid);
    }

    function test_revertsWhenPausedAndMissing() public {
        vm.prank(admin);
        oracle.setPaused(address(aapl), true);
        vm.expectRevert(abi.encodeWithSelector(MockPriceOracle.FeedPausedError.selector, address(aapl)));
        oracle.getPrice(address(aapl));
        vm.expectRevert(abi.encodeWithSelector(MockPriceOracle.FeedMissing.selector, address(0xBEEF)));
        oracle.getPrice(address(0xBEEF));
    }

    function test_onlyOracleRoleCanSet() public {
        bytes32 role = oracle.ORACLE_ROLE();
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, role));
        oracle.setPrice(address(aapl), 1e8, block.timestamp);
    }

    function test_rejectsFutureTimestampAndZeroPrice() public {
        vm.startPrank(admin);
        vm.expectRevert(MockPriceOracle.InvalidTimestamp.selector);
        oracle.setPrice(address(aapl), 1e8, block.timestamp + 1);
        vm.expectRevert(MockPriceOracle.InvalidPrice.selector);
        oracle.setPrice(address(aapl), 0, block.timestamp);
        vm.stopPrank();
    }

    function testFuzz_setAndRead(uint128 price, uint32 age) public {
        vm.assume(price > 0);
        age = uint32(bound(age, 0, 1 hours));
        vm.prank(admin);
        oracle.setPrice(address(nvda), price, block.timestamp - age);
        (uint256 p, ) = oracle.getPrice(address(nvda));
        assertEq(p, price);
    }
}
