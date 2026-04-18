// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentExecutor {
    event ExecutionLogged(
        uint256 indexed agentId,
        address indexed user,
        string action,
        string result,
        uint256 timestamp
    );

    function logExecution(uint256 agentId, address user, string calldata action, string calldata result) external {
        require(user != address(0), "invalid user");
        emit ExecutionLogged(agentId, user, action, result, block.timestamp);
    }
}
