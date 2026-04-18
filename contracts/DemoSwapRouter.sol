// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Like {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract DemoSwapRouter {
    struct PairRate {
        uint256 rateWad;
        bool supported;
    }

    address public owner;
    mapping(address => mapping(address => PairRate)) public pairRates;

    event OwnerUpdated(address indexed previousOwner, address indexed newOwner);
    event PairRateUpdated(address indexed tokenIn, address indexed tokenOut, uint256 rateWad);
    event LiquiditySeeded(address indexed token, uint256 amount);
    event LiquidityWithdrawn(address indexed token, uint256 amount);
    event SwapExecuted(
        address indexed sender,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address to
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero address");
        emit OwnerUpdated(owner, newOwner);
        owner = newOwner;
    }

    function setPairRate(address tokenIn, address tokenOut, uint256 rateWad) external onlyOwner {
        require(tokenIn != address(0) && tokenOut != address(0), "zero address");
        require(rateWad > 0, "rate zero");

        pairRates[tokenIn][tokenOut] = PairRate({ rateWad: rateWad, supported: true });
        emit PairRateUpdated(tokenIn, tokenOut, rateWad);
    }

    function seedLiquidity(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "zero address");
        require(amount > 0, "amount zero");
        bool ok = IERC20Like(token).transferFrom(msg.sender, address(this), amount);
        require(ok, "seed transfer failed");
        emit LiquiditySeeded(token, amount);
    }

    function withdrawLiquidity(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "zero address");
        require(amount > 0, "amount zero");
        bool ok = IERC20Like(token).transfer(msg.sender, amount);
        require(ok, "withdraw transfer failed");
        emit LiquidityWithdrawn(token, amount);
    }

    function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts) {
        require(path.length == 2, "path length");
        require(amountIn > 0, "amount zero");

        PairRate memory pair = pairRates[path[0]][path[1]];
        require(pair.supported, "pair unsupported");

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = (amountIn * pair.rateWad) / 1e18;
        require(amounts[1] > 0, "amount out zero");
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256
    ) external returns (uint256[] memory amounts) {
        require(to != address(0), "zero address");

        amounts = getAmountsOut(amountIn, path);
        uint256 amountOut = amounts[1];
        require(amountOut >= amountOutMin, "slippage");

        bool transferredIn = IERC20Like(path[0]).transferFrom(msg.sender, address(this), amountIn);
        require(transferredIn, "input transfer failed");

        bool transferredOut = IERC20Like(path[1]).transfer(to, amountOut);
        require(transferredOut, "output transfer failed");

        emit SwapExecuted(msg.sender, path[0], path[1], amountIn, amountOut, to);
    }
}
