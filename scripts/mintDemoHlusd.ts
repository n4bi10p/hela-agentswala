import { isAddress, parseUnits } from "ethers";
import { ethers, network } from "hardhat";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function requireAddress(name: string, value: string | undefined): string {
  if (!value || !isAddress(value)) {
    throw new Error(`${name} must be a valid EVM address`);
  }
  return value;
}

async function main() {
  const tokenAddress = requireAddress(
    "HLUSD_ADDRESS",
    process.env.HLUSD_ADDRESS || process.env.NEXT_PUBLIC_HLUSD_ADDRESS
  );
  const recipient = requireAddress("MINT_TO", process.env.MINT_TO);
  const amount = (process.env.MINT_AMOUNT || "100").trim();

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("MINT_AMOUNT must be a positive number");
  }

  const [owner] = await ethers.getSigners();
  const chain = await ethers.provider.getNetwork();
  const token = await ethers.getContractAt("DemoHLUSD", tokenAddress);

  const [decimals, symbol] = await Promise.all([token.decimals(), token.symbol()]);
  const mintAmount = parseUnits(amount, Number(decimals));

  console.log("Minting HLUSD...");
  console.log("Network:", network.name);
  console.log("Chain ID:", chain.chainId.toString());
  console.log("Owner:", owner.address);
  console.log("Token:", tokenAddress);
  console.log("Recipient:", recipient);
  console.log("Amount:", `${amount} ${symbol}`);

  const tx = await token.mint(recipient, mintAmount);
  const receipt = await tx.wait();

  const recipientBalance = await token.balanceOf(recipient);

  console.log("Mint tx:", receipt?.hash || tx.hash);
  console.log("Recipient balance:", `${ethers.formatUnits(recipientBalance, Number(decimals))} ${symbol}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
