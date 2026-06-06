/**
 * Mint a fresh test wallet for the server agent.
 *   pnpm wallet:new
 * Copy AGENT_PRIVATE_KEY into .env.local, then fund it from a faucet.
 * NEVER use a wallet holding real funds for hacking.
 */
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { chainLabel, log } from "./_shared";

const pk = generatePrivateKey();
const account = privateKeyToAccount(pk);

log.title(`🔑 New agent wallet (${chainLabel})`);
log.info(`Address:     ${account.address}`);
log.info(`Private key: ${pk}`);
console.log();
log.warn("Add to .env.local:");
console.log(`AGENT_PRIVATE_KEY=${pk}`);
console.log(`X402_PAY_TO_ADDRESS=${account.address}  # (or use a separate receiving wallet)`);
console.log();
log.info("Fund it: https://portal.cdp.coinbase.com/products/faucet (ETH) + https://faucet.circle.com (USDC)");
