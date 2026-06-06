/**
 * Show ETH + USDC balance of the agent wallet (or a passed address).
 *   pnpm balance
 *   pnpm balance 0xRecipient...
 */
import { formatEther, formatUnits, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ERC20_ABI, EXPLORER, USDC, chain, chainLabel, publicClient, log } from "./_shared";

async function main() {
  const arg = process.argv[2];
  let address: Address;
  if (arg) {
    address = arg as Address;
  } else {
    const pk = process.env.AGENT_PRIVATE_KEY;
    if (!pk) return log.err("Pass an address or set AGENT_PRIVATE_KEY (pnpm wallet:new).");
    address = privateKeyToAccount(pk as `0x${string}`).address;
  }

  const [eth, usdc] = await Promise.all([
    publicClient.getBalance({ address }),
    publicClient.readContract({
      address: USDC[chain.id],
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address],
    }),
  ]);

  log.title(`💰 Balance on ${chainLabel}`);
  log.info(`Address: ${address}`);
  log.info(`ETH:     ${formatEther(eth)}`);
  log.info(`USDC:    ${formatUnits(usdc as bigint, 6)}`);
  log.info(`${EXPLORER[chain.id]}/address/${address}`);
}

main().catch((e) => log.err(e.message));
