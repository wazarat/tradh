// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {MockStockToken} from "../src/MockStockToken.sol";
import {MockUSD} from "../src/MockUSD.sol";
import {MockPriceOracle} from "../src/MockPriceOracle.sol";
import {MockSpotExchange} from "../src/MockSpotExchange.sol";
import {FeeController} from "../src/FeeController.sol";

abstract contract BaseTest is Test {
    address internal admin = makeAddr("admin");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal treasury = makeAddr("treasury");

    MockUSD internal usd;
    MockStockToken internal aapl;
    MockStockToken internal nvda;
    MockPriceOracle internal oracle;
    MockSpotExchange internal dex;
    FeeController internal fees;

    function setUp() public virtual {
        vm.warp(1_760_000_000);
        vm.startPrank(admin);
        usd = new MockUSD(admin);
        aapl = new MockStockToken("Mock Apple", "mAAPL", 18, "AAPL", admin);
        nvda = new MockStockToken("Mock Nvidia", "mNVDA", 18, "NVDA", admin);
        oracle = new MockPriceOracle(admin, 1 hours);
        fees = new FeeController(admin, treasury);
        dex = new MockSpotExchange(admin, address(usd), 30);
        dex.setFeeController(address(fees));
        dex.createPool(address(aapl));
        dex.createPool(address(nvda));

        // seed: 1,000 mAAPL vs 200,000 mUSD  => $200 ; 500 mNVDA vs 250,000 mUSD => $500
        aapl.mint(admin, 1_000e18);
        nvda.mint(admin, 500e18);
        usd.mint(admin, 450_000e6);
        aapl.approve(address(dex), type(uint256).max);
        nvda.approve(address(dex), type(uint256).max);
        usd.approve(address(dex), type(uint256).max);
        dex.addLiquidity(address(aapl), 1_000e18, 200_000e6);
        dex.addLiquidity(address(nvda), 500e18, 250_000e6);

        oracle.setPrice(address(aapl), 200e8, block.timestamp);
        oracle.setPrice(address(nvda), 500e8, block.timestamp);
        vm.stopPrank();
    }
}
