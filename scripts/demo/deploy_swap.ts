const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    console.log("Account balance:", (await deployer.getBalance()).toString());


    const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexSwapExample.sol:ERC20WithFaucet");
    // token
    const tokenA = await ERC20WithFaucet.deploy('TestTokenA', 'TTA');
    const tokenB = await ERC20WithFaucet.deploy('TestTokenB', 'TTB');

    const YexSwapExample = await ethers.getContractFactory("YexSwapExample");
    const YexSwapPool = await ethers.getContractFactory("YexSwapPool");

    const yexSwapExample = await YexSwapExample.deploy(tokenA.address, tokenB.address);
    const pool2 = YexSwapPool.attach(await yexSwapExample.pool2());


    console.log("tokenA address:", tokenA.address);
    console.log("tokenB address:", tokenB.address);
    console.log("dex address:", yexSwapExample.address);
    console.log("pool2 address: ", pool2.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });