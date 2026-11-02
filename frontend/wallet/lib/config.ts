// Obsyd — Stellar network configuration (original implementation).
// Defaults to testnet. All values overridable via NEXT_PUBLIC_* env.

import { Horizon, Networks, rpc } from "@stellar/stellar-sdk";

export type NetworkName = "testnet" | "public";

export function parseNetwork(
  raw: string | undefined = process.env.NEXT_PUBLIC_NETWORK,
): NetworkName {
  const value = (raw || "testnet").trim();
  if (value !== "testnet" && value !== "public") {
    throw new Error(
      `Invalid NEXT_PUBLIC_NETWORK "${value}": expected "testnet" or "public"`,
    );
  }
  return value;
}

const network = parseNetwork(process.env.NEXT_PUBLIC_NETWORK);

export const config = {
  network,
  horizonUrl:
    process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org",
  sorobanRpcUrl:
    process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",
  friendbotUrl:
    process.env.NEXT_PUBLIC_FRIENDBOT_URL ||
    "https://friendbot.stellar.org",
};

export const networkPassphrase =
  config.network === "public" ? Networks.PUBLIC : Networks.TESTNET;

const allowHttp = config.network === "testnet";
let horizonClient: Horizon.Server | null = null;
let rpcClient: rpc.Server | null = null;

export function horizon(): Horizon.Server {
  if (!horizonClient) {
    horizonClient = new Horizon.Server(config.horizonUrl, { allowHttp });
  }
  return horizonClient;
}

export function rpcServer(): rpc.Server {
  if (!rpcClient) {
    rpcClient = new rpc.Server(config.sorobanRpcUrl, { allowHttp });
  }
  return rpcClient;
}

/** Validate a Stellar account address (G… for accounts, M… for muxed). */
export function looksLikeStellarAddress(addr: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(addr.trim());
}
