# @tradh/contracts

Foundry workspace for the tradh. Phase 1 testnet contracts. See `docs/CONTRACTS.md` for the design and `docs/TESTNET_DEPLOYMENTS.md` for addresses.

```bash
forge build
forge test                 # unit + fuzz
forge test -vvv --match-test testFuzz_swapKeepsInvariant
```

Deploy (throwaway key in `.env`, funded from the Robinhood Chain Testnet faucet):

```bash
cp .env.example .env
forge script script/DeployTestnet.s.sol --rpc-url robinhood_testnet --broadcast
```

Then verify each contract on Blockscout, copy `deployments/46630.raw.json` into `packages/chain/deployments/46630.json`, and run `pnpm --filter @tradh/chain abis`.

All contracts here are testnet-only development contracts with no audit. Mock assets have no monetary value and are not Robinhood-issued Stock Tokens.
