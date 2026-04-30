// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentRegistry {
    uint256 private constant MAX_NAME_LENGTH = 64;
    uint256 private constant MAX_DESCRIPTION_LENGTH = 512;
    uint256 private constant MAX_CONFIG_SCHEMA_LENGTH = 2048;

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

    event AgentStatusUpdated(uint256 indexed id, bool isActive, address indexed updatedBy);

    function publishAgent(
        string calldata name,
        string calldata description,
        string calldata agentType,
        uint256 priceHLUSD,
        string calldata configSchema
    ) external returns (uint256) {
        require(bytes(name).length > 0, "name required");
        require(bytes(name).length <= MAX_NAME_LENGTH, "name too long");
        require(bytes(description).length > 0, "description required");
        require(bytes(description).length <= MAX_DESCRIPTION_LENGTH, "description too long");
        require(bytes(agentType).length > 0, "type required");
        require(_isValidAgentType(agentType), "invalid type");
        require(bytes(configSchema).length > 0, "config schema required");
        require(bytes(configSchema).length <= MAX_CONFIG_SCHEMA_LENGTH, "config schema too long");

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

        emit AgentStatusUpdated(id, active, msg.sender);
    }

    event AgentUpdated(
        uint256 indexed id,
        string name,
        string description,
        uint256 priceHLUSD,
        address indexed updatedBy
    );

    function updateAgent(
        uint256 id,
        string calldata name,
        string calldata description,
        uint256 priceHLUSD
    ) external {
        Agent storage agent = agents[id];
        require(agent.id != 0, "agent not found");
        require(agent.developer == msg.sender, "not developer");
        require(bytes(name).length > 0, "name required");
        require(bytes(name).length <= MAX_NAME_LENGTH, "name too long");
        require(bytes(description).length > 0, "description required");
        require(bytes(description).length <= MAX_DESCRIPTION_LENGTH, "description too long");

        agent.name = name;
        agent.description = description;
        agent.priceHLUSD = priceHLUSD;

        emit AgentUpdated(id, name, description, priceHLUSD, msg.sender);
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

    function getAgentsPaginated(uint256 offset, uint256 limit) external view returns (Agent[] memory) {
        if (agentCount == 0 || limit == 0 || offset >= agentCount) {
            return new Agent[](0);
        }

        uint256 remaining = agentCount - offset;
        uint256 resultSize = limit < remaining ? limit : remaining;

        Agent[] memory page = new Agent[](resultSize);
        for (uint256 i = 0; i < resultSize; i++) {
            page[i] = agents[offset + i + 1];
        }
        return page;
    }

    function _isValidAgentType(string calldata agentType) private pure returns (bool) {
        bytes32 t = keccak256(bytes(agentType));
        return
            t == keccak256("trading") ||
            t == keccak256("farming") ||
            t == keccak256("scheduling") ||
            t == keccak256("rebalancing") ||
            t == keccak256("content") ||
            t == keccak256("business");
    }
}
