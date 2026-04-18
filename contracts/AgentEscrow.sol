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

    struct ActivationRecord {
        uint256 agentId;
        address buyer;
        string config;
        uint256 timestamp;
    }

    mapping(address => uint256[]) public userActiveAgents;
    mapping(uint256 => ActivationRecord[]) public activationsByAgent;

    event AgentActivated(uint256 indexed agentId, address indexed buyer, string config, uint256 timestamp);

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

        if (agent.priceHLUSD > 0) {
            bool received = hlusd.transferFrom(msg.sender, address(this), agent.priceHLUSD);
            require(received, "payment failed");

            bool paid = hlusd.transfer(agent.developer, agent.priceHLUSD);
            require(paid, "developer payout failed");
        }

        userActiveAgents[msg.sender].push(agentId);
        activationsByAgent[agentId].push(
            ActivationRecord({agentId: agentId, buyer: msg.sender, config: userConfig, timestamp: block.timestamp})
        );

        emit AgentActivated(agentId, msg.sender, userConfig, block.timestamp);
    }

    function getActivationCountForAgent(uint256 agentId) external view returns (uint256) {
        return activationsByAgent[agentId].length;
    }
}
