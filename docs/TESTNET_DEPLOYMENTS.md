# Testnet deployments — Robinhood Chain Testnet (46630)

Deployed 2026-10-19 from commit `16e1dcb` by the throwaway deployer `0x2087c36f35f16a5b07e288d9a8f985baa2da9591` (key kept in `packages/contracts/.env`, never committed). Compiler solc 0.8.28, optimizer 200 runs, evm `paris`. All contracts are source-verified on Blockscout.

| Contract | Address | Deploy tx | Verified |
| --- | --- | --- | --- |
| MockUSD | [`0x5b465501348A226d4B12E040d8912d4c4776d966`](https://explorer.testnet.chain.robinhood.com/address/0x5b465501348A226d4B12E040d8912d4c4776d966) | [`0x53ee149f…`](https://explorer.testnet.chain.robinhood.com/tx/0x53ee149fdc8eec69c044d25e5c25964500f839cd3b1fbccf9a938e02d9f39dbc) | yes |
| MockPriceOracle | [`0x528B5bdF97A8b02cB37710C31b1812aBBd551A13`](https://explorer.testnet.chain.robinhood.com/address/0x528B5bdF97A8b02cB37710C31b1812aBBd551A13) | [`0x9863da5e…`](https://explorer.testnet.chain.robinhood.com/tx/0x9863da5e3b68491d0e43f4804650fa4d8fa940bea409613598bebe63b118ed6c) | yes |
| FeeController | [`0x1eD65E775048E2D37DEf2bd5F87BA9C90F3c38A3`](https://explorer.testnet.chain.robinhood.com/address/0x1eD65E775048E2D37DEf2bd5F87BA9C90F3c38A3) | [`0x86d17074…`](https://explorer.testnet.chain.robinhood.com/tx/0x86d17074b8a1cbd970018173a665d0392e84602c401c485a3266b30759a4f9dc) | yes |
| MockSpotExchange | [`0x4831D16cF7115884dEe21F8443B2dD2c717141ab`](https://explorer.testnet.chain.robinhood.com/address/0x4831D16cF7115884dEe21F8443B2dD2c717141ab) | [`0x462493b8…`](https://explorer.testnet.chain.robinhood.com/tx/0x462493b868d7a0852f2c3c65e1956c82747a138650d0adaa9133bc688a2ea61c) | yes |
| mAAPL | [`0x93b801322633159709B2EE7e3374d2D19665e629`](https://explorer.testnet.chain.robinhood.com/address/0x93b801322633159709B2EE7e3374d2D19665e629) | [`0x1a7aa3a8…`](https://explorer.testnet.chain.robinhood.com/tx/0x1a7aa3a8d9bfe43ed06f1a5ac147c9cf752ba7c3f0fe709af298826763a5fca8) | yes |
| mMSFT | [`0xb6590F23ce0551B26e0323ADAE89838e5c0Ed57E`](https://explorer.testnet.chain.robinhood.com/address/0xb6590F23ce0551B26e0323ADAE89838e5c0Ed57E) | [`0x200f79ff…`](https://explorer.testnet.chain.robinhood.com/tx/0x200f79ffc74192a35e65921b51379030e0e552e65cf06bbe24694e7ce1889475) | yes |
| mNVDA | [`0x656ca061BeD6Cb51139ef0A835E5371D19F76c0b`](https://explorer.testnet.chain.robinhood.com/address/0x656ca061BeD6Cb51139ef0A835E5371D19F76c0b) | [`0xdb9afd80…`](https://explorer.testnet.chain.robinhood.com/tx/0xdb9afd8072fde569d5d5c05e107ad37a88584e8d107ae63ac9c9d6e984b23398) | yes |

mUSD is the `MockUSD` contract above (6 decimals, faucet 10,000 per 24 h, 100,000 lifetime per wallet).

## Pools (MockSpotExchange, LP fee 30 bps, protocol fee 0)

| Pair | Reference price at seed | Pool creation tx | First liquidity tx |
| --- | --- | --- | --- |
| mAAPL/mUSD | $345.00 with 250,000 mUSD | [`0xf3c2b47b…`](https://explorer.testnet.chain.robinhood.com/tx/0xf3c2b47b181320ed741bf084bb2653be7e70976c96f362c9c07b3640c682cb7c) | [`0x64645ca0…`](https://explorer.testnet.chain.robinhood.com/tx/0x64645ca0ed24e039ee579bc208364b2455535529db513122e6b38ef48e630f16) |
| mMSFT/mUSD | $520.00 with 250,000 mUSD | [`0xa6f695a4…`](https://explorer.testnet.chain.robinhood.com/tx/0xa6f695a4b26e5a1a7ed15a053cc77a5d0274ad52f94dfc8e23f04994e8783e89) | [`0x12338a92…`](https://explorer.testnet.chain.robinhood.com/tx/0x12338a92afd7ddf80ca1dee35b50d9aa458f0507c10971783ffbf74c3cc08148) |
| mNVDA/mUSD | $190.00 with 250,000 mUSD | [`0x199b5d58…`](https://explorer.testnet.chain.robinhood.com/tx/0x199b5d58b9bfdf66bc4cb051de7c551a002af9dd484fa90df6d69d34709adcb9) | [`0x13851e75…`](https://explorer.testnet.chain.robinhood.com/tx/0x13851e758e7b525442cc7fc2c77f2d055875f3f5e27adb9aa51febc54921b017) |

Oracle prices were set in the same run (`MockPriceOracle.setPrice`, max age 1 h). Prices are moved for demos with `cast send <oracle> "setPrice(address,uint256,uint256)" <asset> <price1e8> <timestamp>` from the deployer.

## Manifests
- App manifest (the code reads this): `packages/chain/deployments/46630.json`
- CanHav-format manifest with commit, compiler, runtime code hash and transactions: `docs/testnet-manifest.46630.json`
- Check script that calls a view on every address and compares code hashes: `node packages/chain/scripts/check-manifest.mjs`

## Cost
27 transactions, about 0.00008 ETH at 0.01 gwei. Deployer balance after: 0.0099 ETH.
