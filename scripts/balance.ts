/**
 * Show SOL + USDC balance of the agent wallet (or a passed address).
 *   pnpm balance
 *   pnpm balance <address>
 */
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getAccount,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import {
  USDC_MINT,
  cluster,
  clusterLabel,
  connection,
  EXPLORER,
  explorerQuery,
  parseSecretKey,
  log,
} from "./_shared";

async function main() {
  const arg = process.argv[2];
  let address: PublicKey;
  if (arg) {
    address = new PublicKey(arg);
  } else {
    const pk = process.env.AGENT_PRIVATE_KEY;
    if (!pk) return log.err("Pass an address or set AGENT_PRIVATE_KEY (pnpm wallet:new).");
    address = Keypair.fromSecretKey(parseSecretKey(pk)).publicKey;
  }

  const mint = new PublicKey(USDC_MINT[cluster]);
  const sol = await connection.getBalance(address);

  const ata = await getAssociatedTokenAddress(mint, address);
  let usdc = 0n;
  try {
    usdc = (await getAccount(connection, ata)).amount;
  } catch (err) {
    if (!(err instanceof TokenAccountNotFoundError)) throw err;
  }

  log.title(`💰 Balance on ${clusterLabel}`);
  log.info(`Address: ${address.toBase58()}`);
  log.info(`SOL:     ${sol / LAMPORTS_PER_SOL}`);
  log.info(`USDC:    ${Number(usdc) / 1_000_000}`);
  log.info(`${EXPLORER}/address/${address.toBase58()}${explorerQuery}`);
}

main().catch((e) => log.err(e.message));
