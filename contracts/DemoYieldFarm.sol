// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DemoYieldFarm is Ownable {
    IERC20 public immutable stakingToken;
    mapping(bytes32 => bool) public supportedPools;
    mapping(address => mapping(bytes32 => uint256)) private _stakes;

    event PoolSupportUpdated(bytes32 indexed poolId, string poolKey, bool supported);
    event Deposited(address indexed user, bytes32 indexed poolId, string poolKey, uint256 amount);
    event Withdrawn(address indexed user, bytes32 indexed poolId, string poolKey, uint256 amount);

    constructor(address stakingTokenAddress) Ownable(msg.sender) {
        require(stakingTokenAddress != address(0), "staking token required");
        stakingToken = IERC20(stakingTokenAddress);
    }

    function getPoolId(string memory poolKey) public pure returns (bytes32) {
        return keccak256(bytes(poolKey));
    }

    function setSupportedPool(string calldata poolKey, bool supported) external onlyOwner {
        bytes32 poolId = getPoolId(poolKey);
        supportedPools[poolId] = supported;
        emit PoolSupportUpdated(poolId, poolKey, supported);
    }

    function deposit(string calldata poolKey, uint256 amount) external {
        require(amount > 0, "amount must be positive");
        bytes32 poolId = getPoolId(poolKey);
        require(supportedPools[poolId], "unsupported pool");

        bool ok = stakingToken.transferFrom(msg.sender, address(this), amount);
        require(ok, "stake transfer failed");

        _stakes[msg.sender][poolId] += amount;
        emit Deposited(msg.sender, poolId, poolKey, amount);
    }

    function withdraw(string calldata poolKey, uint256 amount) external {
        require(amount > 0, "amount must be positive");
        bytes32 poolId = getPoolId(poolKey);
        uint256 currentStake = _stakes[msg.sender][poolId];
        require(currentStake >= amount, "insufficient staked balance");

        _stakes[msg.sender][poolId] = currentStake - amount;
        bool ok = stakingToken.transfer(msg.sender, amount);
        require(ok, "withdraw transfer failed");

        emit Withdrawn(msg.sender, poolId, poolKey, amount);
    }

    function stakeOf(address user, string calldata poolKey) external view returns (uint256) {
        return _stakes[user][getPoolId(poolKey)];
    }
}
