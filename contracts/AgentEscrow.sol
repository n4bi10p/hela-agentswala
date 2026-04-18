// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
}

interface IAgentRegistry {
    struct Agent {
        uint256 id;
        string name;
        string description;
        string agentType;
        uint256 priceHLUSD;
        address developer;
        bool isActive;
        string configSchema;
    }

    function getAgent(uint256 id) external view returns (Agent memory);
}

contract AgentEscrow {
    IERC20 public immutable hlusd;
    IAgentRegistry public immutable registry;
    uint256 public activationCount;

    struct ActivationRecord {
        uint256 activationId;
        uint256 agentId;
        address buyer;
        string config;
        uint256 paidAmount;
        uint256 timestamp;
    }

    mapping(address => uint256[]) public userActiveAgents;
    mapping(uint256 => ActivationRecord[]) public activationsByAgent;
    mapping(address => mapping(uint256 => bool)) public hasActivatedAgent;

    event AgentActivated(
        uint256 indexed activationId,
        uint256 indexed agentId,
        address indexed buyer,
        string config,
        uint256 paidAmount,
        uint256 timestamp
    );

    constructor(address registryAddress, address hlusdAddress) {
        require(registryAddress != address(0), "invalid registry");
        require(hlusdAddress != address(0), "invalid hlusd");

        registry = IAgentRegistry(registryAddress);
        hlusd = IERC20(hlusdAddress);
    }

    function activateAgent(uint256 agentId, string calldata userConfig) external {
        IAgentRegistry.Agent memory agent = registry.getAgent(agentId);

        require(agent.isActive, "agent inactive");
        require(agent.developer != address(0), "invalid developer");
        require(!hasActivatedAgent[msg.sender][agentId], "already activated");

        uint256 paidAmount = 0;

        if (agent.priceHLUSD > 0) {
            bool received = hlusd.transferFrom(msg.sender, address(this), agent.priceHLUSD);
            require(received, "payment failed");

            bool paid = hlusd.transfer(agent.developer, agent.priceHLUSD);
            require(paid, "developer payout failed");

            paidAmount = agent.priceHLUSD;
        }

        activationCount += 1;
        uint256 activationId = activationCount;

        hasActivatedAgent[msg.sender][agentId] = true;
        userActiveAgents[msg.sender].push(agentId);
        activationsByAgent[agentId].push(
            ActivationRecord({
                activationId: activationId,
                agentId: agentId,
                buyer: msg.sender,
                config: userConfig,
                paidAmount: paidAmount,
                timestamp: block.timestamp
            })
        );

        emit AgentActivated(activationId, agentId, msg.sender, userConfig, paidAmount, block.timestamp);
    }

    function getActivationCountForAgent(uint256 agentId) external view returns (uint256) {
        return activationsByAgent[agentId].length;
    }

    function getUserActiveAgents(address user) external view returns (uint256[] memory) {
        return userActiveAgents[user];
    }

    function getUserActiveAgentCount(address user) external view returns (uint256) {
        return userActiveAgents[user].length;
    }

    function isAgentActivatedByUser(address user, uint256 agentId) external view returns (bool) {
        return hasActivatedAgent[user][agentId];
    }
}
