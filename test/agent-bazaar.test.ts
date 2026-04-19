import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs.js";

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
    const platformFeeBps = 500;
    const escrow = await escrowFactory.deploy(
      await registry.getAddress(),
      await token.getAddress(),
      owner.address,
      platformFeeBps
    );
    await escrow.waitForDeployment();

    const executorFactory = await ethers.getContractFactory("AgentExecutor");
    const executor = await executorFactory.deploy();
    await executor.waitForDeployment();

    return { owner, developer, buyer, outsider, registry, token, escrow, executor, platformFeeBps };
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

      await expect(registry.connect(developer).setAgentActive(1, false))
        .to.emit(registry, "AgentStatusUpdated")
        .withArgs(1n, false, developer.address);
    });

    it("rejects invalid publish inputs", async function () {
      const { registry, developer } = await loadFixture(deployFixture);

      await expect(
        registry.connect(developer).publishAgent("", "desc", "trading", 1, "{}")
      ).to.be.revertedWith("name required");

      await expect(
        registry.connect(developer).publishAgent("Trading Agent", "desc", "", 1, "{}")
      ).to.be.revertedWith("type required");

      await expect(
        registry.connect(developer).publishAgent("Trading Agent", "", "trading", 1, "{}")
      ).to.be.revertedWith("description required");

      await expect(
        registry.connect(developer).publishAgent("Trading Agent", "desc", "invalid", 1, "{}")
      ).to.be.revertedWith("invalid type");

      await expect(
        registry.connect(developer).publishAgent("Trading Agent", "desc", "trading", 1, "")
      ).to.be.revertedWith("config schema required");
    });

    it("supports pagination", async function () {
      const { registry, developer } = await loadFixture(deployFixture);

      await registry.connect(developer).publishAgent("A1", "d1", "trading", 1, "{}");
      await registry.connect(developer).publishAgent("A2", "d2", "farming", 2, "{}");
      await registry.connect(developer).publishAgent("A3", "d3", "business", 3, "{}");

      const page = await registry.getAgentsPaginated(1, 2);
      expect(page.length).to.equal(2);
      expect(page[0].id).to.equal(2n);
      expect(page[1].id).to.equal(3n);

      const emptyPage = await registry.getAgentsPaginated(10, 2);
      expect(emptyPage.length).to.equal(0);
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
    it("activates paid agents and splits the payment between developer and platform", async function () {
      const { owner, registry, token, escrow, developer, buyer, platformFeeBps } = await loadFixture(deployFixture);

      const price = ethers.parseUnits("10", 18);
      const expectedPlatformFee = (price * BigInt(platformFeeBps)) / 10_000n;
      const expectedDeveloperPayout = price - expectedPlatformFee;
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
        .withArgs(1n, 1n, buyer.address, '{"threshold":"0.98"}', price, anyValue);

      expect(await token.balanceOf(developer.address)).to.equal(expectedDeveloperPayout);
      expect(await token.balanceOf(owner.address)).to.equal(expectedPlatformFee);
      expect(await escrow.getActivationCountForAgent(1)).to.equal(1n);
      expect(await escrow.activationCount()).to.equal(1n);
      expect(await escrow.userActiveAgents(buyer.address, 0)).to.equal(1n);
      expect(await escrow.getUserActiveAgentCount(buyer.address)).to.equal(1n);
      expect(await escrow.isAgentActivatedByUser(buyer.address, 1)).to.equal(true);

      const userAgents = await escrow.getUserActiveAgents(buyer.address);
      expect(userAgents.length).to.equal(1);
      expect(userAgents[0]).to.equal(1n);
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
        .withArgs(1n, 1n, buyer.address, "{}", 0n, anyValue);
    });

    it("prevents duplicate activations for same user-agent pair", async function () {
      const { registry, token, escrow, developer, buyer } = await loadFixture(deployFixture);

      const price = ethers.parseUnits("2", 18);
      await registry.connect(developer).publishAgent("A", "d", "content", price, "{}");

      await token.mint(buyer.address, price * 2n);
      await token.connect(buyer).approve(await escrow.getAddress(), price * 2n);

      await escrow.connect(buyer).activateAgent(1, "{}");
      await expect(escrow.connect(buyer).activateAgent(1, "{}"))
        .to.be.revertedWith("already activated");
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

    it("rejects invalid platform fee configuration", async function () {
      const [owner] = await ethers.getSigners();

      const registryFactory = await ethers.getContractFactory("AgentRegistry");
      const registry = await registryFactory.deploy();
      await registry.waitForDeployment();

      const tokenFactory = await ethers.getContractFactory("MockERC20");
      const token = await tokenFactory.deploy();
      await token.waitForDeployment();

      const escrowFactory = await ethers.getContractFactory("AgentEscrow");

      await expect(
        escrowFactory.deploy(await registry.getAddress(), await token.getAddress(), ethers.ZeroAddress, 500)
      ).to.be.revertedWith("invalid fee recipient");

      await expect(
        escrowFactory.deploy(await registry.getAddress(), await token.getAddress(), owner.address, 10_001)
      ).to.be.revertedWith("invalid fee bps");
    });
  });

  describe("AgentExecutor", function () {
    it("allows owner and user self-logging", async function () {
      const { executor, buyer } = await loadFixture(deployFixture);

      await expect(executor.logExecution(1, buyer.address, "analyze", "success"))
        .to.emit(executor, "ExecutionLogged")
        .withArgs(1n, buyer.address, "analyze", "success", anyValue);

      await expect(executor.connect(buyer).logExecution(2, buyer.address, "self", "ok"))
        .to.emit(executor, "ExecutionLogged")
        .withArgs(2n, buyer.address, "self", "ok", anyValue);
    });

    it("rejects zero user in logs", async function () {
      const { executor } = await loadFixture(deployFixture);

      await expect(executor.logExecution(1, ethers.ZeroAddress, "act", "res"))
        .to.be.revertedWith("invalid user");
    });

    it("enforces authorization for third-party logging", async function () {
      const { executor, owner, buyer, outsider } = await loadFixture(deployFixture);

      await expect(executor.connect(outsider).logExecution(1, buyer.address, "act", "res"))
        .to.be.revertedWith("not authorized logger");

      await expect(executor.connect(outsider).setAuthorizedLogger(outsider.address, true))
        .to.be.revertedWith("not owner");

      await expect(executor.connect(owner).setAuthorizedLogger(outsider.address, true))
        .to.emit(executor, "LoggerAuthorizationUpdated")
        .withArgs(outsider.address, true);

      await expect(executor.connect(outsider).logExecution(3, buyer.address, "relay", "done"))
        .to.emit(executor, "ExecutionLogged")
        .withArgs(3n, buyer.address, "relay", "done", anyValue);
    });

    it("allows owner transfer and validates action text", async function () {
      const { executor, owner, buyer, outsider } = await loadFixture(deployFixture);

      await expect(executor.connect(owner).setOwner(outsider.address))
        .to.emit(executor, "OwnerUpdated")
        .withArgs(owner.address, outsider.address);

      await expect(executor.connect(owner).setAuthorizedLogger(buyer.address, true))
        .to.be.revertedWith("not owner");

      await expect(executor.connect(buyer).logExecution(1, buyer.address, "", "res"))
        .to.be.revertedWith("action required");
    });
  });
});
