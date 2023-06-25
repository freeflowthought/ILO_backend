// SPDX-License-Identifier: MIT  
pragma solidity ^0.8.16;

import "../libraries/ERC20.sol";

contract testTokenAddrLimit is ERC20 {

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

    mapping(address => bool) public faucetedList;

    function faucet() public {
        require(!faucetedList[msg.sender], "fauceted");
        faucetedList[msg.sender] = true;
        _mint(msg.sender, _faucetAmount);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}