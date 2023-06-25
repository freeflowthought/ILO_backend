// SPDX-License-Identifier: MIT  
pragma solidity ^0.8.16;

import "../libraries/ERC20.sol";

contract testTokenTimeLimit is ERC20 {

    uint256 public _faucetAmount;
    uint8 public _decimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 faucetAmount_,
        uint8 decimals_
    ) ERC20(name_, symbol_) {
        _faucetAmount = faucetAmount_ * 10 **decimals_;
        _decimals = decimals_;
    }

    mapping(address => uint256) public lastFaucetTime;

    function faucet() public {
        require(
            block.timestamp - lastFaucetTime[msg.sender] > 1 days,
            "fauceted"
        );
        lastFaucetTime[msg.sender] = block.timestamp;
        _mint(msg.sender, _faucetAmount);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}