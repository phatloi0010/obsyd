import { describe, expect, it, vi } from "vitest";
import { Keypair } from "@stellar/stellar-sdk";
import { isValidStellarAddress } from "../stellar";
import {
  config,
  horizon,
  looksLikeStellarAddress,
  networkPassphrase,
  parseNetwork,
  rpcServer,
} from "../config";

describe("address validation", () => {
  it("accepts a real ed25519 account id", () => {
    expect(isValidStellarAddress(Keypair.random().publicKey())).toBe(true);
    expect(isValidStellarAddress("  " + Keypair.random().publicKey() + "  ")).toBe(true);
  });

  it("rejects junk, contracts and malformed checksums", () => {
    for (const bad of ["", "G", "not an address", "0x1234", "g".repeat(56)]) {
      expect(isValidStellarAddress(bad), bad).toBe(false);
    }
    // A contract id (C…) is a valid strkey but not an account.
    expect(isValidStellarAddress("CCJUD55AG6W5HAI5LRVNKAE5WDP5XGZBUDS5WNTIVDU7O264UZZE7BRD")).toBe(false);
  });
});

describe("network configuration", () => {
  it("is testnet unless told otherwise, and the passphrase follows it", () => {
    expect(["testnet", "public"]).toContain(config.network);
    expect(networkPassphrase).toBe(
      config.network === "public"
        ? "Public Global Stellar Network ; September 2015"
        : "Test SDF Network ; September 2015",
    );
  });

  it("endpoints match the configured network", () => {
    const host = new URL(config.horizonUrl).hostname;
    if (config.network === "testnet") {
      expect(host).toContain("testnet");
      expect(new URL(config.sorobanRpcUrl).hostname).toContain("testnet");
    } else {
      expect(host).not.toContain("testnet");
    }
  });

  it("the strict address matcher is the 56-character G form", () => {
    expect(looksLikeStellarAddress(Keypair.random().publicKey())).toBe(true);
    expect(looksLikeStellarAddress("M" + "A".repeat(55))).toBe(false);
  });

  it("throws on an invalid NEXT_PUBLIC_NETWORK value at startup", async () => {
    expect(() => parseNetwork("mainnet")).toThrow(/Invalid NEXT_PUBLIC_NETWORK/);
    expect(() => parseNetwork("devnet")).toThrow(/Invalid NEXT_PUBLIC_NETWORK/);
    expect(parseNetwork("testnet")).toBe("testnet");
    expect(parseNetwork("public")).toBe("public");

    const prev = process.env.NEXT_PUBLIC_NETWORK;
    process.env.NEXT_PUBLIC_NETWORK = "mainnet";
    vi.resetModules();
    try {
      await expect(import("../config")).rejects.toThrow(/Invalid NEXT_PUBLIC_NETWORK/);
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_NETWORK;
      else process.env.NEXT_PUBLIC_NETWORK = prev;
      vi.resetModules();
    }
  });

  it("exports shared horizon() and rpcServer() clients from config", () => {
    expect(horizon()).toBe(horizon());
    expect(rpcServer()).toBe(rpcServer());
  });
});
