import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("HeLa Agent Bazaar contracts", function () {
  async function deployFixture() {
    const [owner, developer, buyer, outsider] = await ethers.getSigners();

    const registryFactory = await ethers.getContractFactory("AgentRegistry");
    const registry = await registryFactory.deploy();
    await registry.waitForDeployment();

    const tokenFactory = await ethers.getContractFactory("MockERC20");
    const token = await tokenFactory.deploy();
    await token.waitForDeployment();

    const escrowFactory = await ethers.getContractFactory("AgentEscrow");
    const escrow = await escrowFactory.deploy(await registry.getAddress(), await token.getAddress());
    await escrow.waitForDeployment();

    const executorFactory = await ethers.getContractFactory("AgentExecutor");
    const executor = await executorFactory.deploy();
    await executor.waitForDeployment();

    return { owner, developer, buyer, outsider, registry, token, escrow, executor };
  }

  describe("AgentRegistry", function () {
    it("publishes and fetches agents", async function () {
      const { registry, developer } = await loadFixture(deployFixture);

      const price = ethers.parseUnits("5", 18);
      await expect(
        registry.connect(developer).publishAgent(
          "Scheduling Agent",
          "Recurring payment bot",
          "scheduling",
          price,
          '{"recipient":"address"}'
        )
      )
        .to.emit(registry, "AgentPublished")
        .withArgs(1n, "Scheduling Agent", "scheduling", price, developer.address);

      const agent = await registry.getAgent(1);
      expect(agent.id).to.equal(1n);
      expect(agent.name).to.equal("Scheduling Agent");
      expect(agent.developer).to.equal(developer.address);
      expect(agent.isActive).to.equal(true);

      const allAgents = await registry.getAllAgents();
      expect(allAgents.length).to.equal(1);
      expect(allAgents[0].id).to.equal(1n);
    });

    it("rejects invalid publish inputs", async function () {
      const { registry, developer } = await loadFixture(deployFixture);

      await expect(
        registry.connect(developer).publishAgent("", "desc", "trading", 1, "{}")
      ).to.be.revertedWith("name required");

      await expect(
        registry.connect(developer).publishAgent("Trading Agent", "desc", "", 1, "{}")
      ).to.be.revertedWith("type required");
    });

    it("enforces ownership when toggling activity", async function () {
      const { registry, developer, outsider } = await loadFixture(deployFixture);

      await registry.connect(developer).publishAgent(
        "Portfolio Agent",
        "Rebalancer",
        "rebalancing",
        1,
        "{}"
      );

      await expect(registry.connect(outsider).setAgentActive(1, false)).to.be.revertedWith("not developer");

      await registry.connect(developer).setAgentActive(1, false);
      const agent = await registry.getAgent(1);
      expect(agent.isActive).to.equal(false);
    });

    it("reverts for missing agents", async function () {
      const { registry } = await loadFixture(deployFixture);

      await expect(registry.getAgent(999)).to.be.revertedWith("agent not found");
      await expect(registry.setAgentActive(999, false)).to.be.revertedWith("agent not found");
    });
  });

  describe("AgentEscrow", function () {
    it("activates paid agents and pays developer", async function () {
      const { registry, token, escrow, developer, buyer } = await loadFixture(deployFixture);

      const price = ethers.parseUnits("10", 18);
      await registry.connect(developer).publishAgent(
        "Trading Agent",
        "Threshold watcher",
        "trading",
        price,
        "{}"
      );

      await token.mint(buyer.address, price);
      await token.connect(buyer).approve(await escrow.getAddress(), price);

      await expect(escrow.connect(buyer).activateAgent(1, '{"threshold":"0.98"}'))
        .to.emit(escrow, "AgentActivated")
        .withArgs(1n, buyer.address, '{"threshold":"0.98"}', anyValue);

      expect(await token.balanceOf(developer.address)).to.equal(price);
      expect(await escrow.getActivationCountForAgent(1)).to.equal(1n);
      expect(await escrow.userActiveAgents(buyer.address, 0)).to.equal(1n);
    });

    it("allows free agent activation without token transfer", async function () {
      const { registry, escrow, developer, buyer } = await loadFixture(deployFixture);

      await registry.connect(developer).publishAgent(
        "Business Assistant",
        "QnA agent",
        "business",
        0,
        "{}"
      );

      await expect(escrow.connect(buyer).activateAgent(1, "{}"))
        .to.emit(escrow, "AgentActivated")
        .withArgs(1n, buyer.address, "{}", anyValue);
    });

    it("reverts when activation targets inactive agent", async function () {
      const { registry, escrow, developer, buyer } = await loadFixture(deployFixture);

      await registry.connect(developer).publishAgent(
        "Farming Agent",
        "Yield bot",
        "farming",
        1,
        "{}"
      );
      await registry.connect(developer).setAgentActive(1, false);

      await expect(escrow.connect(buyer).activateAgent(1, "{}"))
        .to.be.revertedWith("agent inactive");
    });

    it("reverts on token transfer failures", async function () {
      const { registry, token, escrow, developer, buyer } = await loadFixture(deployFixture);

      const price = ethers.parseUnits("3", 18);
      await registry.connect(developer).publishAgent(
        "Content Agent",
        "Reply generator",
        "content",
        price,
        "{}"
      );

      await token.mint(buyer.address, price);
      await token.connect(buyer).approve(await escrow.getAddress(), price);

      await token.setFailTransferFrom(true);
      await expect(escrow.connect(buyer).activateAgent(1, "{}"))
        .to.be.revertedWith("payment failed");

      await token.setFailTransferFrom(false);
      await token.setFailTransfer(true);
      await expect(escrow.connect(buyer).activateAgent(1, "{}"))
        .to.be.revertedWith("developer payout failed");
    });
  });

  describe("AgentExecutor", function () {
    it("logs execution events", async function () {
      const { executor, buyer } = await loadFixture(deployFixture);

      await expect(executor.logExecution(1, buyer.address, "analyze", "success"))
        .to.emit(executor, "ExecutionLogged")
        .withArgs(1n, buyer.address, "analyze", "success", anyValue);
    });

    it("rejects zero user in logs", async function () {
      const { executor } = await loadFixture(deployFixture);

      await expect(executor.logExecution(1, ethers.ZeroAddress, "act", "res"))
        .to.be.revertedWith("invalid user");
    });
  });
});
