// Calls a view on every contract in the manifest and compares runtime code hashes (CanHav review: pool-manifest).
import { readFileSync } from "node:fs";
import { createPublicClient, http, keccak256, parseAbi } from "viem";
const man = JSON.parse(readFileSync(new URL("../../../docs/testnet-manifest.46630.json", import.meta.url), "utf8"));
const client = createPublicClient({ transport: http(man.network.rpc) });
const abi = parseAbi(["function decimals() view returns (uint8)", "function isMock() view returns (bool)", "function maxPriceAge() view returns (uint256)", "function protocolFeeBps() view returns (uint16)", "function lpFeeBps() view returns (uint16)", "function listedAssetCount() view returns (uint256)"]);
const views = { MockUSD: "decimals", MockPriceOracle: "maxPriceAge", FeeController: "protocolFeeBps", MockSpotExchange: "lpFeeBps" };
let ok = true;
for (const [name, r] of [...Object.entries(man.contracts), ...Object.entries(man.tokens)]) {
  const fn = views[name] ?? "isMock";
  const code = await client.getCode({ address: r.address });
  const hashOk = code && keccak256(code) === r.runtimeCodeHash;
  let val;
  try { val = await client.readContract({ address: r.address, abi, functionName: fn }); } catch (e) { val = `ERR ${e.shortMessage ?? e.message}`; ok = false; }
  if (!hashOk) ok = false;
  console.log(`${name.padEnd(18)} ${r.address} ${fn}()=${String(val).padEnd(12)} codeHash ${hashOk ? "match" : "MISMATCH"}`);
}
console.log(ok ? "manifest OK" : "manifest CHECK FAILED");
process.exit(ok ? 0 : 1);
