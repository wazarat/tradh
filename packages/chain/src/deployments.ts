import { z } from "zod";
import testnet from "../deployments/46630.json" with { type: "json" };

const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/).transform((s) => s as `0x${string}`);

export const deploymentManifestSchema = z.object({
  chainId: z.number().int(),
  network: z.string(),
  deployed: z.boolean(),
  deployedAt: z.string().nullable(),
  deployer: address.nullable(),
  commit: z.string().nullable(),
  contracts: z.record(
    z.string(),
    z.object({
      address,
      txHash: z.string().nullable().optional(),
      verified: z.boolean().default(false),
    }),
  ),
  assets: z.array(
    z.object({
      symbol: z.string(),
      name: z.string(),
      address,
      decimals: z.number().int(),
      kind: z.enum(["mock", "issuer"]),
      underlyingSymbol: z.string().nullable(),
      isQuote: z.boolean().default(false),
    }),
  ),
});

export type DeploymentManifest = z.infer<typeof deploymentManifestSchema>;

const manifests: Record<number, DeploymentManifest> = {
  46630: deploymentManifestSchema.parse(testnet),
};

export function getDeployment(chainId: number): DeploymentManifest | undefined {
  return manifests[chainId];
}

export function requireContract(chainId: number, name: string): `0x${string}` {
  const m = manifests[chainId];
  const c = m?.contracts[name];
  if (!m?.deployed || !c) throw new Error(`contract ${name} is not deployed on chain ${chainId}`);
  return c.address;
}
