// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentExecutor {
    address public owner;
    mapping(address => bool) public authorizedLoggers;

    event ExecutionLogged(
        uint256 indexed agentId,
        address indexed user,
        string action,
        string result,
        uint256 timestamp
    );

    event OwnerUpdated(address indexed previousOwner, address indexed newOwner);
    event LoggerAuthorizationUpdated(address indexed logger, bool isAuthorized);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "invalid owner");

        address previousOwner = owner;
        owner = newOwner;
        emit OwnerUpdated(previousOwner, newOwner);
    }

    function setAuthorizedLogger(address logger, bool isAuthorized) external onlyOwner {
        require(logger != address(0), "invalid logger");

        authorizedLoggers[logger] = isAuthorized;
        emit LoggerAuthorizationUpdated(logger, isAuthorized);
    }

    function logExecution(uint256 agentId, address user, string calldata action, string calldata result) external {
        require(user != address(0), "invalid user");
        require(bytes(action).length > 0, "action required");
        require(_canLog(msg.sender, user), "not authorized logger");

        emit ExecutionLogged(agentId, user, action, result, block.timestamp);
    }

    function _canLog(address caller, address user) private view returns (bool) {
        return caller == owner || authorizedLoggers[caller] || caller == user;
    }
}
