// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.16;

interface IYexSwapPool {
    function getReserves() external view returns (uint256, uint256);

    function swap(
        uint256 amountA,
        uint256 amountB
    ) external returns (uint256, uint256);
}
