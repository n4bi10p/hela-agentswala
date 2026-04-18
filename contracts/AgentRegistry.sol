// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentRegistry {
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

    uint256 public agentCount;
    mapping(uint256 => Agent) public agents;

    event AgentPublished(
        uint256 indexed id,
        string name,
        string agentType,
        uint256 priceHLUSD,
        address indexed developer
    );

    function publishAgent(
        string calldata name,
        string calldata description,
        string calldata agentType,
        uint256 priceHLUSD,
        string calldata configSchema
    ) external returns (uint256) {
        require(bytes(name).length > 0, "name required");
        require(bytes(agentType).length > 0, "type required");

        agentCount += 1;
        uint256 newId = agentCount;

        agents[newId] = Agent({
            id: newId,
            name: name,
            description: description,
            agentType: agentType,
            priceHLUSD: priceHLUSD,
            developer: msg.sender,
            isActive: true,
            configSchema: configSchema
        });

        emit AgentPublished(newId, name, agentType, priceHLUSD, msg.sender);
        return newId;
    }

    function setAgentActive(uint256 id, bool active) external {
        Agent storage agent = agents[id];
        require(agent.id != 0, "agent not found");
        require(agent.developer == msg.sender, "not developer");
        agent.isActive = active;
    }

    function getAgent(uint256 id) external view returns (Agent memory) {
        Agent memory agent = agents[id];
        require(agent.id != 0, "agent not found");
        return agent;
    }

    function getAllAgents() external view returns (Agent[] memory) {
        Agent[] memory allAgents = new Agent[](agentCount);
        for (uint256 i = 1; i <= agentCount; i++) {
            allAgents[i - 1] = agents[i];
        }
        return allAgents;
    }
}
