const hre = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();

async function main() {
  const registryAddress = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS;
  console.log("Registry Address:", registryAddress);
  const registry = await hre.ethers.getContractAt("AgentRegistry", registryAddress);
  
  console.log("Updating agent 1...");
  try {
    const tx = await registry.updateAgent(
      1,
      "Updated Agent Name",
      "Updated Description",
      hre.ethers.parseUnits("9.99", 18)
    );
    console.log("Waiting for tx...");
    await tx.wait();
    console.log("Success!");
  } catch (error) {
    console.error("Failed to update agent:", error.message);
  }
}

main().catch(console.error);
