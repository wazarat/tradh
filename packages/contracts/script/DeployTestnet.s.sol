// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {MockStockToken} from "../src/MockStockToken.sol";
import {MockUSD} from "../src/MockUSD.sol";
import {MockPriceOracle} from "../src/MockPriceOracle.sol";
import {MockSpotExchange} from "../src/MockSpotExchange.sol";
import {FeeController} from "../src/FeeController.sol";

/// @notice Deploys the Phase 1 mock venue to Robinhood Chain Testnet and seeds liquidity.
///         Run:  forge script script/DeployTestnet.s.sol --rpc-url robinhood_testnet --broadcast
///         Needs DEPLOYER_PRIVATE_KEY in .env (throwaway key funded from the faucet).
contract DeployTestnet is Script {
    struct Seed {
        string name;
        string symbol;
        string underlying;
        uint256 priceUsd1e8; // reference price at deploy time
        uint256 poolUsd;     // mUSD liquidity per pool (6 decimals)
    }

    MockUSD internal usd;
    MockPriceOracle internal oracle;
    FeeController internal fees;
    MockSpotExchange internal dex;
    address[] internal tokenAddrs;
    Seed[] internal seeds;

    function run() external {
        require(block.chainid == 46630, "DeployTestnet: wrong chain");
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);

        seeds.push(Seed("Mock Apple", "mAAPL", "AAPL", 345e8, 250_000e6));
        seeds.push(Seed("Mock Nvidia", "mNVDA", "NVDA", 190e8, 250_000e6));
        seeds.push(Seed("Mock Microsoft", "mMSFT", "MSFT", 520e8, 250_000e6));

        vm.startBroadcast(pk);
        _deployCore(deployer);
        for (uint256 i = 0; i < seeds.length; i++) {
            _deployAsset(deployer, seeds[i]);
        }
        vm.stopBroadcast();

        _writeManifest(deployer);
    }

    function _deployCore(address deployer) internal {
        usd = new MockUSD(deployer);
        oracle = new MockPriceOracle(deployer, 1 hours);
        fees = new FeeController(deployer, deployer);
        dex = new MockSpotExchange(deployer, address(usd), 30);
        dex.setFeeController(address(fees));
        usd.approve(address(dex), type(uint256).max);
        console2.log("MockUSD", address(usd));
        console2.log("MockPriceOracle", address(oracle));
        console2.log("FeeController", address(fees));
        console2.log("MockSpotExchange", address(dex));
    }

    function _deployAsset(address deployer, Seed memory s) internal {
        MockStockToken t = new MockStockToken(s.name, s.symbol, 18, s.underlying, deployer);
        tokenAddrs.push(address(t));
        // qty such that pool price == reference price: qty = poolUsd / price (6dp usd -> 18dp token)
        uint256 qty = (s.poolUsd * 1e8 * 1e12) / s.priceUsd1e8;
        t.mint(deployer, qty);
        usd.mint(deployer, s.poolUsd);
        t.approve(address(dex), type(uint256).max);
        dex.createPool(address(t));
        dex.addLiquidity(address(t), qty, s.poolUsd);
        oracle.setPrice(address(t), s.priceUsd1e8, block.timestamp);
        console2.log(s.symbol, address(t));
    }

    function _assetJson(string memory key, string memory symbol, string memory name, address addr, uint256 decimals, bool isQuote, string memory underlying)
        internal
        returns (string memory)
    {
        vm.serializeString(key, "symbol", symbol);
        vm.serializeString(key, "name", name);
        vm.serializeAddress(key, "address", addr);
        vm.serializeUint(key, "decimals", decimals);
        vm.serializeString(key, "kind", "mock");
        vm.serializeBool(key, "isQuote", isQuote);
        return vm.serializeString(key, "underlyingSymbol", underlying);
    }

    function _writeManifest(address deployer) internal {
        string memory contractsOut;
        {
            string memory c = "contracts";
            vm.serializeAddress(c, "MockUSD", address(usd));
            vm.serializeAddress(c, "MockPriceOracle", address(oracle));
            vm.serializeAddress(c, "FeeController", address(fees));
            contractsOut = vm.serializeAddress(c, "MockSpotExchange", address(dex));
        }
        string memory assetsOut;
        {
            string memory a = "assets";
            for (uint256 i = 0; i < seeds.length; i++) {
                Seed memory s = seeds[i];
                string memory one = _assetJson(string.concat("asset", vm.toString(i)), s.symbol, s.name, tokenAddrs[i], 18, false, s.underlying);
                assetsOut = vm.serializeString(a, s.symbol, one);
            }
            string memory u = _assetJson("assetUsd", "mUSD", "Mock USD", address(usd), 6, true, "USD");
            assetsOut = vm.serializeString(a, "mUSD", u);
        }
        string memory json = "deployment";
        vm.serializeUint(json, "chainId", 46630);
        vm.serializeString(json, "network", "robinhood-chain-testnet");
        vm.serializeBool(json, "deployed", true);
        vm.serializeAddress(json, "deployer", deployer);
        vm.serializeString(json, "contracts", contractsOut);
        string memory out = vm.serializeString(json, "assets", assetsOut);
        vm.writeJson(out, "./deployments/46630.raw.json");
    }
}
