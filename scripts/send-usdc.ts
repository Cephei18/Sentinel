/**
 * Send USDC from the agent wallet via CLI — handy for seeding demo wallets.
 *   pnpm send-usdc <toAddress> <amount>
 *   pnpm send-usdc 7xKXtg2CW3ED5FZQ2GfSepjTa4bZ5EgQ8jZUqoW9fQ2 1.5
 */
import {
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
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
  const [to, amount] = process.argv.slice(2);
  if (!to || !amount) return log.err("Usage: pnpm send-usdc <toAddress> <amount>");

  let recipient: PublicKey;
  try {
    recipient = new PublicKey(to);
  } catch {
    return log.err("Invalid recipient address.");
  }

  const pk = process.env.AGENT_PRIVATE_KEY;
  if (!pk) return log.err("Set AGENT_PRIVATE_KEY in .env.local (pnpm wallet:new).");
  const payer = Keypair.fromSecretKey(parseSecretKey(pk));

  log.title(`Sending ${amount} USDC on ${clusterLabel}`);
  log.info(`From: ${payer.publicKey.toBase58()}`);
  log.info(`To:   ${recipient.toBase58()}`);

  const mint = new PublicKey(USDC_MINT[cluster]);
  const [sourceAta, destAta] = await Promise.all([
    getAssociatedTokenAddress(mint, payer.publicKey),
    getAssociatedTokenAddress(mint, recipient),
  ]);

  const instructions: TransactionInstruction[] = [];
  try {
    await getAccount(connection, destAta);
  } catch (err) {
    if (!(err instanceof TokenAccountNotFoundError)) throw err;
    instructions.push(
      createAssociatedTokenAccountIdempotentInstruction(payer.publicKey, destAta, recipient, mint),
    );
  }
  const amountBaseUnits = BigInt(Math.round(Number(amount) * 1_000_000));
  instructions.push(
    createTransferInstruction(sourceAta, destAta, payer.publicKey, amountBaseUnits),
  );

  const transaction = new Transaction({ feePayer: payer.publicKey }).add(...instructions);
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
  log.ok(`Confirmed: ${signature}`);
  log.info(`${EXPLORER}/tx/${signature}${explorerQuery}`);
}

main().catch((e) => log.err(e.message));
