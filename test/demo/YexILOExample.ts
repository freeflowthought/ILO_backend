import {
    loadFixture
} from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe("YexILOExample", function () {

    async function deployYexILO() {

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const YexILOExample = await ethers.getContractFactory("YexILOExample");
        const yexILOExample = await YexILOExample.deploy();

        return { yexILOExample, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Deploy", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
        });
    });
    describe("Deposit", function () {
        it("deposit faile when not enough allowance", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());
            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();

            await expect(yexILOExample.connect(owner).deposit(0, 1)).to.revertedWith("Not allowance tokenB");
            await expect(yexILOExample.connect(otherAccount).deposit(1, 0)).to.revertedWith("Not allowance tokenA");

        });
        it("deposit amount should not be zero", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());
            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, await tokenA.balanceOf(otherAccount.address));
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));

            await expect(yexILOExample.connect(owner).deposit(0, 0)).to.revertedWith("deposit: INSUFFICIENT_INPUT_AMOUNT");
            await expect(yexILOExample.connect(otherAccount).deposit(0, 0)).to.revertedWith("deposit: INSUFFICIENT_INPUT_AMOUNT");

        });
        it("deposit fail when rasing time is over", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());
            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, await tokenA.balanceOf(otherAccount.address));
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));

            // deposit tokenA
            const balance = await tokenA.balanceOf(otherAccount.address);
            await yexILOExample.connect(otherAccount).deposit(BigInt(balance / 2), 0);
            // deposit tokenB
            await yexILOExample.connect(owner).deposit(0, await tokenB.balanceOf(owner.address));
            await yexILOExample.connect(owner).setRasingPaused();
            await expect(yexILOExample.connect(otherAccount).deposit(BigInt(balance / 4), 0)).to.revertedWith("deposit: raising time is over");


        });
        it("deposit", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());

            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, await tokenA.balanceOf(otherAccount.address));
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));


            // deposit tokenA
            const balance = await tokenA.balanceOf(otherAccount.address);
            await yexILOExample.connect(otherAccount).deposit(BigInt(balance / 2), 0);
            // deposit tokenB
            await yexILOExample.connect(owner).deposit(0, await tokenB.balanceOf(owner.address));

            await yexILOExample.connect(owner).setRasingPaused();

            expect(await yexILOExample.balanceOf(owner.address)).equal(353553390593273762200n);
            expect(await yexILOExample.balanceOf(otherAccount.address)).equal(353553390593273762200n);


        });
    });
    describe("set rasing paused", function () {
        it("set rasing paused when deposit amount is zero", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());

            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, await tokenA.balanceOf(otherAccount.address));
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));

            // deposit tokenB
            await yexILOExample.connect(owner).deposit(0, await tokenB.balanceOf(owner.address));

            // paused
            await yexILOExample.connect(owner).setRasingPaused();

            expect(await yexILOExample.deposited_TokenA()).equal(0);
        });
        it("set rasing paused fail when rasing paused is true", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());

            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, await tokenA.balanceOf(otherAccount.address));
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));


            // deposit tokenA
            const balance = await tokenA.balanceOf(otherAccount.address);
            await yexILOExample.connect(otherAccount).deposit(BigInt(balance / 2), 0);
            // deposit tokenB
            await yexILOExample.connect(owner).deposit(0, await tokenB.balanceOf(owner.address));

            await yexILOExample.connect(owner).setRasingPaused();

            await expect(yexILOExample.connect(owner).setRasingPaused()).to.revertedWith("rasing time is over");

        });
    });
    describe("Liquidity", function () {
        it("add liquidity fail when not enough allowance", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());

            // mint tokenA
            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, 500000000000000000n);
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));

            // otherAccount deposit tokenA
            await yexILOExample.connect(otherAccount).deposit(500000000000000000n, 0);
            // owner deposit tokenB
            await yexILOExample.connect(owner).deposit(0, await tokenB.balanceOf(owner.address));
            await yexILOExample.connect(owner).deposit(5000000000000000n, 0);

            await expect(yexILOExample.connect(otherAccount).addLiquidity(1, 0)).to.be.revertedWith("Not allowance tokenA");
            await expect(yexILOExample.connect(otherAccount).addLiquidity(0, 1)).to.be.revertedWith("Not allowance tokenB");

        });
        it("add liquidity fail when amount is zero", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());

            // mint tokenA
            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, await tokenA.balanceOf(otherAccount.address));
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));

            // otherAccount deposit tokenA
            await yexILOExample.connect(otherAccount).deposit(500000000000000000n, 0);
            // owner deposit tokenB
            await yexILOExample.connect(owner).deposit(0, await tokenB.balanceOf(owner.address));
            await yexILOExample.connect(owner).deposit(5000000000000000n, 0);

            await expect(yexILOExample.connect(otherAccount).addLiquidity(0, 0)).to.be.revertedWith("addLiquidity: INSUFFICIENT_INPUT_AMOUNT");

        });
        it("add liquidity fail when rasing time have not over", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());

            // mint tokenA
            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, await tokenA.balanceOf(otherAccount.address));
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));

            // otherAccount deposit tokenA
            await yexILOExample.connect(otherAccount).deposit(500000000000000000n, 0);
            // owner deposit tokenB
            await yexILOExample.connect(owner).deposit(0, await tokenB.balanceOf(owner.address));
            await yexILOExample.connect(owner).deposit(5000000000000000n, 0);

            await expect(yexILOExample.connect(otherAccount).addLiquidity(10000000000000, 0)).to.be.revertedWith("deposit: raising time has not over");

        });
        it("add liquidity", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());

            // mint tokenA
            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, await tokenA.balanceOf(otherAccount.address));
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));

            // otherAccount deposit tokenA
            await yexILOExample.connect(otherAccount).deposit(500000000000000000n, 0);
            // owner deposit tokenB
            await yexILOExample.connect(owner).deposit(0, await tokenB.balanceOf(owner.address));
            await yexILOExample.connect(owner).deposit(5000000000000000n, 0);

            await yexILOExample.connect(owner).setRasingPaused();
            await yexILOExample.connect(otherAccount).addLiquidity(10000000, 0);

            expect(await yexILOExample.balanceOf(owner.address)).equal(358834747812448846705n);
            expect(await yexILOExample.balanceOf(otherAccount.address)).equal(351798772372181902182n);


        });
        it("remove liquidity faile when not enough allowance", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());

            // mint tokenA
            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, await tokenA.balanceOf(otherAccount.address));
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));

            // otherAccount deposit tokenA
            await yexILOExample.connect(otherAccount).deposit(500000000000000000n, 0);
            // owner deposit tokenB
            await yexILOExample.connect(owner).deposit(0, await tokenB.balanceOf(owner.address));
            await yexILOExample.connect(owner).deposit(5000000000000000n, 0);

            await yexILOExample.connect(owner).setRasingPaused();
            await yexILOExample.connect(otherAccount).addLiquidity(10000000, 0);

            await expect(yexILOExample.connect(owner).removeLiquidity(await yexILOExample.balanceOf(owner.address), 1)).to.be.revertedWith("Not allowance LP token");

        });
        it("remove liquidity faile when remove amount is zero", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());

            // mint tokenA
            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, await tokenA.balanceOf(otherAccount.address));
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));

            // otherAccount deposit tokenA
            await yexILOExample.connect(otherAccount).deposit(500000000000000000n, 0);
            // owner deposit tokenB
            await yexILOExample.connect(owner).deposit(0, await tokenB.balanceOf(owner.address));
            await yexILOExample.connect(owner).deposit(5000000000000000n, 0);

            await yexILOExample.connect(owner).setRasingPaused();
            await yexILOExample.connect(otherAccount).addLiquidity(10000000, 0);

            // approve
            await yexILOExample.connect(owner).approve(yexILOExample.address, await yexILOExample.balanceOf(owner.address));

            await expect(yexILOExample.connect(owner).removeLiquidity(0, 1)).to.be.revertedWith("removeLiquidity: INSUFFICIENT_INPUT_AMOUNT");

        });
        it("remove liquidity faile when withdrawl approch is illegal", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());

            // mint tokenA
            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, await tokenA.balanceOf(otherAccount.address));
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));

            // otherAccount deposit tokenA
            await yexILOExample.connect(otherAccount).deposit(500000000000000000n, 0);
            // owner deposit tokenB
            await yexILOExample.connect(owner).deposit(0, await tokenB.balanceOf(owner.address));
            await yexILOExample.connect(owner).deposit(5000000000000000n, 0);

            await yexILOExample.connect(owner).setRasingPaused();
            await yexILOExample.connect(otherAccount).addLiquidity(10000000, 0);

            // approve
            await yexILOExample.connect(owner).approve(yexILOExample.address, await yexILOExample.balanceOf(owner.address));

            await expect(yexILOExample.connect(owner).removeLiquidity(1, 3)).to.be.revertedWith("withdraw_A_or_B_or_Both should be 0, 1 or 2");

        });
        it("remove liquidity approch 0", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());

            // mint tokenA
            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, await tokenA.balanceOf(otherAccount.address));
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));

            // otherAccount deposit tokenA
            await yexILOExample.connect(otherAccount).deposit(500000000000000000n, 0);
            // owner deposit tokenB
            await yexILOExample.connect(owner).deposit(0, await tokenB.balanceOf(owner.address));
            await yexILOExample.connect(owner).deposit(5000000000000000n, 0);

            await yexILOExample.connect(owner).setRasingPaused();
            await yexILOExample.connect(otherAccount).addLiquidity(10000000, 0);

            // approve
            await yexILOExample.connect(owner).approve(yexILOExample.address, await yexILOExample.balanceOf(owner.address));

            // remove liquidity
            await yexILOExample.connect(owner).removeLiquidity(await yexILOExample.balanceOf(owner.address), 0);

            expect(await yexILOExample.balanceOf(owner.address)).equal(0);
            expect(await tokenA.balanceOf(owner.address)).equal(1250000000002524752n);
            expect(await tokenB.balanceOf(owner.address)).equal(504950495044505441643213n);

        });
        it("remove liquidity approch 1", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());

            // mint tokenA
            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, await tokenA.balanceOf(otherAccount.address));
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));

            // otherAccount deposit tokenA
            await yexILOExample.connect(otherAccount).deposit(500000000000000000n, 0);
            // owner deposit tokenB
            await yexILOExample.connect(owner).deposit(0, await tokenB.balanceOf(owner.address));
            await yexILOExample.connect(owner).deposit(5000000000000000n, 0);

            await yexILOExample.connect(owner).setRasingPaused();
            await yexILOExample.connect(otherAccount).addLiquidity(10000000, 0);

            // approve
            await yexILOExample.connect(owner).approve(yexILOExample.address, await yexILOExample.balanceOf(owner.address));

            // remove liquidity
            await yexILOExample.connect(owner).removeLiquidity(await yexILOExample.balanceOf(owner.address), 1);

            expect(await yexILOExample.balanceOf(owner.address)).equal(0);
            expect(await tokenA.balanceOf(owner.address)).equal(1376237623767425744n);
            expect(await tokenB.balanceOf(owner.address)).equal(0);

        });
        it("remove liquidity approch 2", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());

            // mint tokenA
            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, await tokenA.balanceOf(otherAccount.address));
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));

            // otherAccount deposit tokenA
            await yexILOExample.connect(otherAccount).deposit(500000000000000000n, 0);
            // owner deposit tokenB
            await yexILOExample.connect(owner).deposit(0, await tokenB.balanceOf(owner.address));
            await yexILOExample.connect(owner).deposit(5000000000000000n, 0);

            await yexILOExample.connect(owner).setRasingPaused();
            await yexILOExample.connect(otherAccount).addLiquidity(10000000, 0);

            // approve
            await yexILOExample.connect(owner).approve(yexILOExample.address, await yexILOExample.balanceOf(owner.address));

            // remove liquidity
            await yexILOExample.connect(owner).removeLiquidity(await yexILOExample.balanceOf(owner.address), 2);

            expect(await yexILOExample.balanceOf(owner.address)).equal(0);
            expect(await tokenA.balanceOf(owner.address)).equal(995000000000000000n);
            expect(await tokenB.balanceOf(owner.address)).equal(754925987643319768708578n);

        });
    });
    describe("withdrawl", function () {
        it("withdrawl failed when rasing has not over", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());

            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, await tokenA.balanceOf(otherAccount.address));
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));

            // deposit tokenB
            await yexILOExample.connect(owner).deposit(0, await tokenB.balanceOf(owner.address));
            await expect(yexILOExample.connect(owner).withdraw()).to.revertedWith("fund rasing has not over");
        });
        it("withdrawl failed when rasing is success", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());

            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, await tokenA.balanceOf(otherAccount.address));
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));

            // deposit tokenA
            const balance = await tokenA.balanceOf(otherAccount.address);
            await yexILOExample.connect(otherAccount).deposit(BigInt(balance / 2), 0);
            // deposit tokenB
            await yexILOExample.connect(owner).deposit(0, await tokenB.balanceOf(owner.address));

            await yexILOExample.connect(owner).setRasingPaused();

            expect(await yexILOExample.deposited_TokenA()).greaterThan(0);

            await expect(yexILOExample.connect(owner).withdraw()).to.revertedWith("only withdraw when the fund raising fails");
        });
        it("withdrawl failed if msg.sender is not tokenB provider", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());

            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, await tokenA.balanceOf(otherAccount.address));
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));

            // deposit tokenB
            await yexILOExample.connect(owner).deposit(0, await tokenB.balanceOf(owner.address));

            await yexILOExample.connect(owner).setRasingPaused();

            expect(await yexILOExample.deposited_TokenA()).equal(0);

            expect(await tokenB.balanceOf(owner.address)).equal(0);

            await expect(yexILOExample.connect(otherAccount).withdraw()).to.revertedWith("only tokenB provider can withdraw");

        });
        it("withdrawl", async function () {
            const { yexILOExample, owner, otherAccount } = await loadFixture(deployYexILO);
            // erc20 pair
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexILOExample.sol:ERC20WithFaucet");
            const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
            // token
            const tokenA = ERC20WithFaucet.attach(await yexILOExample.tokenA());
            const tokenB = ERC20Mintable.attach(await yexILOExample.tokenB());

            await tokenA.connect(otherAccount).faucet();
            await tokenA.connect(owner).faucet();
            await tokenA.connect(otherAccount).approve(yexILOExample.address, await tokenA.balanceOf(otherAccount.address));
            await tokenA.connect(owner).approve(yexILOExample.address, await tokenA.balanceOf(owner.address));
            await tokenB.connect(owner).approve(yexILOExample.address, await tokenB.balanceOf(owner.address));

            // deposit tokenB
            await yexILOExample.connect(owner).deposit(0, await tokenB.balanceOf(owner.address));

            await yexILOExample.connect(owner).setRasingPaused();

            expect(await yexILOExample.deposited_TokenA()).equal(0);

            expect(await tokenB.balanceOf(owner.address)).equal(0);

            await yexILOExample.connect(owner).withdraw();
            expect(await tokenB.balanceOf(owner.address)).greaterThan(0);

            // await expect(yexILOExample.connect(owner).withdraw()).to.revertedWith("only withdraw when the fund raising fails");
        });
    });
});
