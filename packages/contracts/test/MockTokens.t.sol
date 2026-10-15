// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {BaseTest} from "./Base.t.sol";
import {MockUSD} from "../src/MockUSD.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

contract MockTokensTest is BaseTest {
    function test_stockTokenIsMockAndDecimals() public view {
        assertTrue(aapl.isMock());
        assertEq(aapl.decimals(), 18);
        assertEq(aapl.underlyingSymbol(), "AAPL");
    }

    function test_onlyMinterCanMint() public {
        bytes32 role = aapl.MINTER_ROLE();
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, role));
        aapl.mint(alice, 1e18);
    }

    function test_faucetMintsOncePerCooldown() public {
        vm.startPrank(alice);
        usd.faucet();
        assertEq(usd.balanceOf(alice), usd.FAUCET_AMOUNT());
        vm.expectRevert(abi.encodeWithSelector(MockUSD.FaucetCooldown.selector, block.timestamp + usd.FAUCET_COOLDOWN()));
        usd.faucet();
        vm.warp(block.timestamp + usd.FAUCET_COOLDOWN());
        usd.faucet();
        assertEq(usd.balanceOf(alice), 2 * usd.FAUCET_AMOUNT());
        vm.stopPrank();
    }

    function test_faucetLifetimeCap() public {
        vm.startPrank(alice);
        uint256 claims = usd.FAUCET_LIFETIME_CAP() / usd.FAUCET_AMOUNT();
        for (uint256 i = 0; i < claims; i++) {
            usd.faucet();
            vm.warp(block.timestamp + usd.FAUCET_COOLDOWN());
        }
        vm.expectRevert(MockUSD.FaucetCapReached.selector);
        usd.faucet();
        vm.stopPrank();
    }
}
