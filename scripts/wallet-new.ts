/**
 * Mint a fresh test wallet for the server agent.
 *   pnpm wallet:new
 * Copy AGENT_PRIVATE_KEY into .env.local, then fund it from a faucet.
 * NEVER use a wallet holding real funds for hacking.
 */
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { clusterLabel, log } from "./_shared";

const keypair = Keypair.generate();
const secretKey = bs58.encode(keypair.secretKey);

log.title(`🔑 New agent wallet (${clusterLabel})`);
log.info(`Address:    ${keypair.publicKey.toBase58()}`);
log.info(`Secret key: ${secretKey}`);
console.log();
log.warn("Add to .env.local:");
console.log(`AGENT_PRIVATE_KEY=${secretKey}`);
console.log(
  `X402_PAY_TO_ADDRESS=${keypair.publicKey.toBase58()}  # (or use a separate receiving wallet)`,
);
console.log();
log.info(
  "Fund it: https://faucet.solana.com (SOL) + https://faucet.circle.com (USDC, select Solana Devnet)",
);
