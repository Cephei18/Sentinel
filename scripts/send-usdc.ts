/**
 * Send USDC from the agent wallet via CLI — handy for seeding demo wallets.
 *   pnpm send-usdc <toAddress> <amount>
 *   pnpm send-usdc 0xabc... 1.5
 */
import { createWalletClient, http, parseUnits, isAddress, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ERC20_ABI, EXPLORER, RPC, USDC, chain, chainLabel, publicClient, log } from "./_shared";

async function main() {
  const [to, amount] = process.argv.slice(2);
  if (!to || !amount) return log.err("Usage: pnpm send-usdc <toAddress> <amount>");
  if (!isAddress(to)) return log.err("Invalid recipient address.");

  const pk = process.env.AGENT_PRIVATE_KEY;
  if (!pk) return log.err("Set AGENT_PRIVATE_KEY in .env.local (pnpm wallet:new).");

  const account = privateKeyToAccount(pk as `0x${string}`);
  const wallet = createWalletClient({ account, chain, transport: http(RPC[chain.id]) });

  log.title(`Sending ${amount} USDC on ${chainLabel}`);
  log.info(`From: ${account.address}`);
  log.info(`To:   ${to}`);

  // Simulate first so reverts surface with a reason before we spend gas.
  const { request } = await publicClient.simulateContract({
    account,
    address: USDC[chain.id],
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [to as Address, parseUnits(amount, 6)],
  });

  const hash = await wallet.writeContract(request);
  log.ok(`Submitted: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === "success") log.ok(`Confirmed in block ${receipt.blockNumber}`);
  else log.err("Transaction reverted");
  log.info(`${EXPLORER[chain.id]}/tx/${hash}`);
}

main().catch((e) => log.err(e.shortMessage || e.message));
