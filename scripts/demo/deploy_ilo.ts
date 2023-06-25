const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    console.log("Account balance:", (await deployer.getBalance()).toString());


    const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
    const ERC20Mintable = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20Mintable");

    const YexILOExample = await ethers.getContractFactory("YexILOExample");


    const yexILOExample = await YexILOExample.deploy(); // one hour
    const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
    const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());

    await yexILOExample.deployTransaction.wait(6)

    console.log("tokenA address:", tokenA.address);
    console.log("tokenB address:", tokenB.address);
    console.log("yexILOExample address: ", yexILOExample.address);

    // deposit
    // console.log(await tokenB.balanceOf(deployer.address));
    const approveTx = await tokenB.approve(yexILOExample.address, await tokenB.balanceOf(deployer.address));
    await approveTx.wait(6);
    const depositTx = await yexILOExample.connect(deployer).deposit(0, ethers.utils.parseEther("1.0"));
    await depositTx.wait(6);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });