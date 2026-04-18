import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const hlusdAddress = process.env.HLUSD_ADDRESS;
  if (!hlusdAddress) {
    throw new Error("HLUSD_ADDRESS is required in .env");
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const registryFactory = await ethers.getContractFactory("AgentRegistry");
  const registry = await registryFactory.deploy();
  await registry.waitForDeployment();

  const escrowFactory = await ethers.getContractFactory("AgentEscrow");
  const escrow = await escrowFactory.deploy(await registry.getAddress(), hlusdAddress);
  await escrow.waitForDeployment();

  const executorFactory = await ethers.getContractFactory("AgentExecutor");
  const executor = await executorFactory.deploy();
  await executor.waitForDeployment();

  console.log("AgentRegistry:", await registry.getAddress());
  console.log("AgentEscrow:", await escrow.getAddress());
  console.log("AgentExecutor:", await executor.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
