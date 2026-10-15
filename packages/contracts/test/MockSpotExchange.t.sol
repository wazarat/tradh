// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {BaseTest} from "./Base.t.sol";
import {MockSpotExchange} from "../src/MockSpotExchange.sol";
import {ISpotExchange} from "../src/interfaces/ISpotExchange.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract MockSpotExchangeTest is BaseTest {
    function _fund(address who, uint256 usdAmt, uint256 aaplAmt) internal {
        vm.startPrank(admin);
        if (usdAmt > 0) usd.mint(who, usdAmt);
        if (aaplAmt > 0) aapl.mint(who, aaplAmt);
        vm.stopPrank();
        vm.startPrank(who);
        usd.approve(address(dex), type(uint256).max);
        aapl.approve(address(dex), type(uint256).max);
        vm.stopPrank();
    }

    function test_quoteMatchesConstantProduct() public view {
        // buy mAAPL with 1,000 mUSD; lp fee 30bps -> netIn 997 mUSD
        ISpotExchange.Quote memory q = dex.quoteExactIn(address(usd), address(aapl), 1_000e6);
        uint256 netIn = 1_000e6 - 3e6;
        uint256 expectedOut = (netIn * 1_000e18) / (200_000e6 + netIn);
        assertEq(q.amountOut, expectedOut);
        assertEq(q.lpFee, 3e6);
        assertEq(q.protocolFee, 0);
        // spot: 1000 mAAPL / 200000 mUSD = 0.005 mAAPL per mUSD
        assertEq(q.spotPrice1e18, 0.005e18);
        assertGt(q.priceImpactBps, 0);
        assertLt(q.priceImpactBps, 100); // < 1% on a 0.5% pool share
    }

    function test_swapBuyThenSell() public {
        _fund(alice, 1_000e6, 0);
        ISpotExchange.Quote memory q = dex.quoteExactIn(address(usd), address(aapl), 1_000e6);
        vm.prank(alice);
        uint256 out = dex.swapExactIn(address(usd), address(aapl), 1_000e6, q.amountOut, alice, block.timestamp + 60);
        assertEq(out, q.amountOut);
        assertEq(aapl.balanceOf(alice), out);
        assertEq(usd.balanceOf(alice), 0);
        (uint256 rA, uint256 rQ) = dex.getReserves(address(aapl));
        assertEq(rA, 1_000e18 - out);
        assertEq(rQ, 200_000e6 + 1_000e6); // full input incl. lp fee stays in pool

        vm.prank(alice);
        uint256 back = dex.swapExactIn(address(aapl), address(usd), out, 0, alice, block.timestamp + 60);
        assertLt(back, 1_000e6); // round trip loses fees + impact
        assertGt(back, 990e6);
    }

    function test_slippageProtection() public {
        _fund(alice, 1_000e6, 0);
        ISpotExchange.Quote memory q = dex.quoteExactIn(address(usd), address(aapl), 1_000e6);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(MockSpotExchange.SlippageExceeded.selector, q.amountOut, q.amountOut + 1));
        dex.swapExactIn(address(usd), address(aapl), 1_000e6, q.amountOut + 1, alice, block.timestamp + 60);
    }

    function test_deadlineEnforced() public {
        _fund(alice, 1_000e6, 0);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(MockSpotExchange.Expired.selector, block.timestamp - 1));
        dex.swapExactIn(address(usd), address(aapl), 1_000e6, 0, alice, block.timestamp - 1);
    }

    function test_unsupportedPairAndMissingPool() public {
        vm.expectRevert(abi.encodeWithSelector(MockSpotExchange.UnsupportedPair.selector, address(aapl), address(nvda)));
        dex.quoteExactIn(address(aapl), address(nvda), 1e18);
        vm.expectRevert(abi.encodeWithSelector(MockSpotExchange.PoolMissing.selector, address(0xBEEF)));
        dex.quoteExactIn(address(usd), address(0xBEEF), 1e6);
    }

    function test_pauseBlocksSwaps() public {
        _fund(alice, 1_000e6, 0);
        vm.prank(admin);
        dex.pause();
        vm.prank(alice);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        dex.swapExactIn(address(usd), address(aapl), 1_000e6, 0, alice, block.timestamp + 60);
    }

    function test_protocolFeeRoutedToTreasury() public {
        vm.prank(admin);
        fees.setProtocolFeeBps(10); // 0.1%
        _fund(alice, 1_000e6, 0);
        vm.prank(alice);
        dex.swapExactIn(address(usd), address(aapl), 1_000e6, 0, alice, block.timestamp + 60);
        assertEq(usd.balanceOf(treasury), 1e6);
        (, uint256 rQ) = dex.getReserves(address(aapl));
        assertEq(rQ, 200_000e6 + 1_000e6 - 1e6);
    }

    function test_liquidityRoundTrip() public {
        _fund(bob, 20_000e6, 100e18);
        vm.prank(bob);
        (uint256 a, uint256 q, uint256 shares) = dex.addLiquidity(address(aapl), 100e18, 20_000e6);
        assertEq(a, 100e18);
        assertEq(q, 20_000e6);
        assertGt(shares, 0);
        vm.prank(bob);
        (uint256 outA, uint256 outQ) = dex.removeLiquidity(address(aapl), shares);
        assertApproxEqAbs(outA, 100e18, 1e12);
        assertApproxEqAbs(outQ, 20_000e6, 1);
    }

    function test_feeBounded() public {
        vm.prank(admin);
        vm.expectRevert(MockSpotExchange.FeeTooHigh.selector);
        dex.setLpFeeBps(101);
    }

    /// @dev k never decreases across swaps and output is always strictly less than the reserve.
    function testFuzz_swapKeepsInvariant(uint96 amountIn, bool buy) public {
        amountIn = uint96(bound(amountIn, buy ? 1e6 : 1e15, buy ? 50_000e6 : 200e18));
        _fund(alice, buy ? amountIn : 0, buy ? 0 : amountIn);
        (uint256 rA0, uint256 rQ0) = dex.getReserves(address(aapl));
        uint256 k0 = rA0 * rQ0;
        vm.prank(alice);
        uint256 out = dex.swapExactIn(buy ? address(usd) : address(aapl), buy ? address(aapl) : address(usd), amountIn, 0, alice, block.timestamp + 60);
        (uint256 rA1, uint256 rQ1) = dex.getReserves(address(aapl));
        assertGe(rA1 * rQ1, k0);
        assertLt(out, buy ? rA0 : rQ0);
    }
}
