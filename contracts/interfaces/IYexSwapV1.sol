pragma solidity ^0.8.16;

import "./IERC20.sol";

interface IYexSwapV1 {
    function feeTo() external view returns (address);

    // function poolInfoMap(
    //     address tokenA,
    //     address tokenB
    // ) external view returns (poolInfo memory);

    // function createPool(
    //     address tokenA,
    //     address tokenB,
    //     uint112 reserveA,
    //     uint112 reserveB,
    //     PoolType poolType
    // ) external returns (address);

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external returns (uint256 liquidity);
}
