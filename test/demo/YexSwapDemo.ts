import {
    loadFixture,
    time,
} from '@nomicfoundation/hardhat-network-helpers';
import { expect } from "chai";
import { ethers } from "hardhat";

describe("YexSwapDemo", function () {

    async function deployYexSwap() {

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        // erc20 pair
        const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexSwapExample.sol:ERC20WithFaucet");
        // token
        const tokenA = await ERC20WithFaucet.deploy('TestTokenA', 'TTA');
        const tokenB = await ERC20WithFaucet.deploy('TestTokenB', 'TTB');

        const YexSwapExample = await ethers.getContractFactory("YexSwapExample");
        const yexSwapExample = await YexSwapExample.deploy(tokenA.address, tokenB.address);

        return { yexSwapExample, tokenA, tokenB, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Deploy", async function () {
            const { yexSwapExample, tokenA, tokenB, owner, otherAccount } = await loadFixture(deployYexSwap);

            const YexSwapPool = await ethers.getContractFactory("YexSwapPool");

            const pool1 = YexSwapPool.attach(await yexSwapExample.pool1());
            const pool2 = YexSwapPool.attach(await yexSwapExample.pool2());

            // init
            const pool1_reserve = await pool1.getReserves();
            expect(pool1_reserve[0]).to.equal(1000000000000000000n);
            expect(pool1_reserve[1]).to.equal(1000000000000000000n);

        });
    });
    describe("Add liquidity", function () {
        it("add liquidity", async function () {
            const { yexSwapExample, tokenA, tokenB, owner, otherAccount } = await loadFixture(deployYexSwap);

            const YexSwapPool = await ethers.getContractFactory("YexSwapPool");

            const pool1 = YexSwapPool.attach(await yexSwapExample.pool1());
            const pool2 = YexSwapPool.attach(await yexSwapExample.pool2());

            // faucet to owner
            await tokenA.connect(owner).faucet();
            await tokenB.connect(owner).faucet();

            const owner_tokenA = await tokenA.balanceOf(owner.address);
            const owner_tokenB = await tokenA.balanceOf(owner.address);

            // approve pool1
            await tokenA.connect(owner).approve(pool1.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool1.address, owner_tokenB);

            // approve pool2
            await tokenA.connect(owner).approve(pool2.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool2.address, owner_tokenB);

            // add liquidity 
            // pool1 init 1: 1 -- > 1.1: 1.4
            // pool2 init 1: 1 -- > 1.2: 1.5
            await pool1.connect(owner).addLiquidity((owner_tokenA / 10).toString(), (owner_tokenB / 10 * 4).toString());
            await pool2.connect(owner).addLiquidity((owner_tokenA / 10 * 2).toString(), (owner_tokenB / 10 * 5).toString());
        })
    });
    describe("Remove liquidity", function () {
        it("remove liquidity", async function () {
            const { yexSwapExample, tokenA, tokenB, owner, otherAccount } = await loadFixture(deployYexSwap);

            const YexSwapPool = await ethers.getContractFactory("YexSwapPool");

            const pool1 = YexSwapPool.attach(await yexSwapExample.pool1());

            // faucet to owner
            await tokenA.connect(owner).faucet();
            await tokenB.connect(owner).faucet();
            // faucet
            await tokenA.connect(otherAccount).faucet();
            await tokenB.connect(otherAccount).faucet();

            const owner_tokenA = await tokenA.balanceOf(owner.address);
            const owner_tokenB = await tokenA.balanceOf(owner.address);

            // approve pool1
            await tokenA.connect(owner).approve(pool1.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool1.address, owner_tokenB);
            await tokenA.connect(otherAccount).approve(pool1.address, owner_tokenA);
            await tokenB.connect(otherAccount).approve(pool1.address, owner_tokenB);


            // add liquidity 
            await pool1.connect(otherAccount).addLiquidity((owner_tokenA / 10).toString(), (owner_tokenB / 10 * 4).toString());
            await pool1.connect(owner).addLiquidity((owner_tokenA / 10).toString(), (owner_tokenB / 10 * 4).toString());


            // console.log(await pool1.balanceOf(owner.address));
            await pool1.connect(owner).removeLiquidity(await pool1.balanceOf(owner.address), 0);


            const after_owner_tokenA = await tokenA.balanceOf(owner.address);
            const after_owner_tokenB = await tokenA.balanceOf(owner.address);



        })
    });
    describe("performUpkeep", function () {
        it("performUpkeep failed when no one deposit", async function () {
            const { yexSwapExample, tokenA, tokenB, owner, otherAccount } = await loadFixture(deployYexSwap);

            const YexSwapPool = await ethers.getContractFactory("YexSwapPool");

            const pool1 = YexSwapPool.attach(await yexSwapExample.pool1());
            const pool2 = YexSwapPool.attach(await yexSwapExample.pool2());

            // faucet to owner
            await tokenA.connect(owner).faucet();
            await tokenB.connect(owner).faucet();

            // faucet
            await tokenA.connect(otherAccount).faucet();
            await tokenB.connect(otherAccount).faucet();

            const owner_tokenA = await tokenA.balanceOf(owner.address);
            const owner_tokenB = await tokenA.balanceOf(owner.address);

            const other_tokenA_balance = await tokenA.balanceOf(otherAccount.address);
            const other_tokenB_balance = await tokenB.balanceOf(otherAccount.address);

            // approve pool1
            await tokenA.connect(owner).approve(pool1.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool1.address, owner_tokenB);

            // approve pool2
            await tokenA.connect(owner).approve(pool2.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool2.address, owner_tokenB);

            // approve
            await tokenA.connect(otherAccount).approve(yexSwapExample.address, other_tokenA_balance);
            await tokenB.connect(otherAccount).approve(yexSwapExample.address, other_tokenB_balance);

            // add liquidity 
            // pool1 init 1: 1 -- > 1.1: 1.4
            // pool2 init 1: 1 -- > 1.2: 1.5
            await pool1.connect(owner).addLiquidity((owner_tokenA / 10).toString(), (owner_tokenB / 10 * 4).toString());
            await pool2.connect(owner).addLiquidity((owner_tokenA / 10 * 2).toString(), (owner_tokenB / 10 * 5).toString());

            await expect(yexSwapExample.performUpkeep("0x")).to.revertedWith("not need to perform");

        });
        it("performUpkeep failed when someone deposit but time has not yet come", async function () {
            const { yexSwapExample, tokenA, tokenB, owner, otherAccount } = await loadFixture(deployYexSwap);

            const YexSwapPool = await ethers.getContractFactory("YexSwapPool");

            const pool1 = YexSwapPool.attach(await yexSwapExample.pool1());
            const pool2 = YexSwapPool.attach(await yexSwapExample.pool2());

            // faucet to owner
            await tokenA.connect(owner).faucet();
            await tokenB.connect(owner).faucet();

            // faucet
            await tokenA.connect(otherAccount).faucet();
            await tokenB.connect(otherAccount).faucet();

            const owner_tokenA = await tokenA.balanceOf(owner.address);
            const owner_tokenB = await tokenA.balanceOf(owner.address);

            const other_tokenA_balance = await tokenA.balanceOf(otherAccount.address);
            const other_tokenB_balance = await tokenB.balanceOf(otherAccount.address);

            // approve pool1
            await tokenA.connect(owner).approve(pool1.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool1.address, owner_tokenB);

            // approve pool2
            await tokenA.connect(owner).approve(pool2.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool2.address, owner_tokenB);

            // approve
            await tokenA.connect(otherAccount).approve(yexSwapExample.address, other_tokenA_balance);
            await tokenB.connect(otherAccount).approve(yexSwapExample.address, other_tokenB_balance);

            // add liquidity 
            // pool1 init 1: 1 -- > 1.1: 1.4
            // pool2 init 1: 1 -- > 1.2: 1.5
            await pool1.connect(owner).addLiquidity((owner_tokenA / 10).toString(), (owner_tokenB / 10 * 4).toString());
            await pool2.connect(owner).addLiquidity((owner_tokenA / 10 * 2).toString(), (owner_tokenB / 10 * 5).toString());

            await expect(yexSwapExample.performUpkeep("0x")).to.revertedWith("not need to perform");
            await yexSwapExample.connect(otherAccount).deposit(10000000000, 12600000000);
            await time.increase(10);
            await yexSwapExample.performUpkeep("0x");

            await time.increase(10);
            await yexSwapExample.connect(otherAccount).deposit(10000000000, 12600000000);
            await expect(yexSwapExample.performUpkeep("0x")).to.revertedWith("not need to perform");

        })
    });
    describe("Deposit", function () {
        it("deposit", async function () {
            const { yexSwapExample, tokenA, tokenB, owner, otherAccount } = await loadFixture(deployYexSwap);

            const YexSwapPool = await ethers.getContractFactory("YexSwapPool");

            const pool1 = YexSwapPool.attach(await yexSwapExample.pool1());
            const pool2 = YexSwapPool.attach(await yexSwapExample.pool2());

            // faucet to owner
            await tokenA.connect(owner).faucet();
            await tokenB.connect(owner).faucet();

            // faucet
            await tokenA.connect(otherAccount).faucet();
            await tokenB.connect(otherAccount).faucet();

            const owner_tokenA = await tokenA.balanceOf(owner.address);
            const owner_tokenB = await tokenA.balanceOf(owner.address);

            const other_tokenA_balance = await tokenA.balanceOf(otherAccount.address);
            const other_tokenB_balance = await tokenB.balanceOf(otherAccount.address);

            // approve pool1
            await tokenA.connect(owner).approve(pool1.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool1.address, owner_tokenB);

            // approve pool2
            await tokenA.connect(owner).approve(pool2.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool2.address, owner_tokenB);

            // approve
            await tokenA.connect(otherAccount).approve(yexSwapExample.address, other_tokenA_balance);
            await tokenB.connect(otherAccount).approve(yexSwapExample.address, other_tokenB_balance);

            // add liquidity 
            // pool1 init 1: 1 -- > 1.1: 1.4
            // pool2 init 1: 1 -- > 1.2: 1.5
            await pool1.connect(owner).addLiquidity((owner_tokenA / 10).toString(), (owner_tokenB / 10 * 4).toString());
            await pool2.connect(owner).addLiquidity((owner_tokenA / 10 * 2).toString(), (owner_tokenB / 10 * 5).toString());

            await expect(yexSwapExample.performUpkeep("0x")).to.revertedWith("not need to perform");

            await yexSwapExample.connect(otherAccount).deposit(10000000000, 12600000000);
            await time.increase(10);
            await yexSwapExample.performUpkeep("0x");

            await time.increase(10);
            await yexSwapExample.connect(otherAccount).deposit(10000000000, 12600000000);
            await expect(yexSwapExample.performUpkeep("0x")).to.revertedWith("not need to perform");
            await time.increase(10);
            await yexSwapExample.performUpkeep("0x");

        });
        it("redeposit", async function () {
            const { yexSwapExample, tokenA, tokenB, owner, otherAccount } = await loadFixture(deployYexSwap);

            const YexSwapPool = await ethers.getContractFactory("YexSwapPool");

            const pool1 = YexSwapPool.attach(await yexSwapExample.pool1());
            const pool2 = YexSwapPool.attach(await yexSwapExample.pool2());

            // faucet to owner
            await tokenA.connect(owner).faucet();
            await tokenB.connect(owner).faucet();

            // faucet
            await tokenA.connect(otherAccount).faucet();
            await tokenB.connect(otherAccount).faucet();

            const owner_tokenA = await tokenA.balanceOf(owner.address);
            const owner_tokenB = await tokenA.balanceOf(owner.address);

            const other_tokenA_balance = await tokenA.balanceOf(otherAccount.address);
            const other_tokenB_balance = await tokenB.balanceOf(otherAccount.address);

            // approve pool1
            await tokenA.connect(owner).approve(pool1.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool1.address, owner_tokenB);

            // approve pool2
            await tokenA.connect(owner).approve(pool2.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool2.address, owner_tokenB);

            // approve
            await tokenA.connect(otherAccount).approve(yexSwapExample.address, other_tokenA_balance);
            await tokenB.connect(otherAccount).approve(yexSwapExample.address, other_tokenB_balance);

            // add liquidity 
            // pool1 init 1: 1 -- > 1.1: 1.4
            // pool2 init 1: 1 -- > 1.2: 1.5
            await pool1.connect(owner).addLiquidity((owner_tokenA / 10).toString(), (owner_tokenB / 10 * 4).toString());
            await pool2.connect(owner).addLiquidity((owner_tokenA / 10 * 2).toString(), (owner_tokenB / 10 * 5).toString());

            await expect(yexSwapExample.performUpkeep("0x")).to.revertedWith("not need to perform");

            await yexSwapExample.connect(otherAccount).deposit(10000000000, 0);
            await yexSwapExample.connect(otherAccount).deposit(10000000000, 0);
            await time.increase(10);
            await yexSwapExample.performUpkeep("0x");
            expect(await tokenB.balanceOf(otherAccount.address)).to.equal(1000000025454544992n);

            await yexSwapExample.connect(otherAccount).deposit(10000000000, 0);
            await yexSwapExample.connect(otherAccount).deposit(10000000000, 0);
            await time.increase(10);
            await yexSwapExample.performUpkeep("0x");

        })
    });
    describe("Auction", function () {
        it("auction expected tokenB", async function () {
            const { yexSwapExample, tokenA, tokenB, owner, otherAccount } = await loadFixture(deployYexSwap);

            const YexSwapPool = await ethers.getContractFactory("YexSwapPool");

            const pool1 = YexSwapPool.attach(await yexSwapExample.pool1());
            const pool2 = YexSwapPool.attach(await yexSwapExample.pool2());

            // faucet to owner
            await tokenA.connect(owner).faucet();
            await tokenB.connect(owner).faucet();

            // faucet
            await tokenA.connect(otherAccount).faucet();
            await tokenB.connect(otherAccount).faucet();

            const owner_tokenA = await tokenA.balanceOf(owner.address);
            const owner_tokenB = await tokenA.balanceOf(owner.address);

            const other_tokenA_balance = await tokenA.balanceOf(otherAccount.address);
            const other_tokenB_balance = await tokenB.balanceOf(otherAccount.address);

            // approve pool1
            await tokenA.connect(owner).approve(pool1.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool1.address, owner_tokenB);

            // approve pool2
            await tokenA.connect(owner).approve(pool2.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool2.address, owner_tokenB);

            // approve
            await tokenA.connect(otherAccount).approve(yexSwapExample.address, other_tokenA_balance);
            await tokenB.connect(otherAccount).approve(yexSwapExample.address, other_tokenB_balance);

            // add liquidity 
            // pool1 init 1: 1 -- > 1.1: 1.4
            // pool2 init 1: 1 -- > 1.2: 1.5
            await pool1.connect(owner).addLiquidity((owner_tokenA / 10).toString(), (owner_tokenB / 10 * 4).toString());
            await pool2.connect(owner).addLiquidity((owner_tokenA / 10 * 2).toString(), (owner_tokenB / 10 * 5).toString());

            const expectedAmountOut = await yexSwapExample.getExpectedAmountOut(tokenA.address, 10000);

            await yexSwapExample.connect(otherAccount).deposit(10000, 0);
            await time.increase(10);
            await yexSwapExample.performUpkeep("0x");

            const tokenB_balance = await tokenB.balanceOf(otherAccount.address);
            expect(tokenB_balance.sub(other_tokenB_balance)).to.equal(expectedAmountOut);


        });
        it("auction expected tokenA", async function () {
            const { yexSwapExample, tokenA, tokenB, owner, otherAccount } = await loadFixture(deployYexSwap);

            const YexSwapPool = await ethers.getContractFactory("YexSwapPool");

            const pool1 = YexSwapPool.attach(await yexSwapExample.pool1());
            const pool2 = YexSwapPool.attach(await yexSwapExample.pool2());

            // faucet to owner
            await tokenA.connect(owner).faucet();
            await tokenB.connect(owner).faucet();

            // faucet
            await tokenA.connect(otherAccount).faucet();
            await tokenB.connect(otherAccount).faucet();

            const owner_tokenA = await tokenA.balanceOf(owner.address);
            const owner_tokenB = await tokenA.balanceOf(owner.address);

            const other_tokenA_balance = await tokenA.balanceOf(otherAccount.address);
            const other_tokenB_balance = await tokenB.balanceOf(otherAccount.address);

            // approve pool1
            await tokenA.connect(owner).approve(pool1.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool1.address, owner_tokenB);

            // approve pool2
            await tokenA.connect(owner).approve(pool2.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool2.address, owner_tokenB);

            // approve
            await tokenA.connect(otherAccount).approve(yexSwapExample.address, other_tokenA_balance);
            await tokenB.connect(otherAccount).approve(yexSwapExample.address, other_tokenB_balance);

            // add liquidity 
            // pool1 init 1: 1 -- > 1.1: 1.4
            // pool2 init 1: 1 -- > 1.2: 1.5
            await pool1.connect(owner).addLiquidity((owner_tokenA / 10).toString(), (owner_tokenB / 10 * 4).toString());
            await pool2.connect(owner).addLiquidity((owner_tokenA / 10 * 2).toString(), (owner_tokenB / 10 * 5).toString());

            const expectedAmountOut = await yexSwapExample.getExpectedAmountOut(tokenB.address, 10000);


            await yexSwapExample.connect(otherAccount).deposit(0, 10000);

            await time.increase(10);

            await yexSwapExample.performUpkeep("0x");

            const tokenA_balance = await tokenA.balanceOf(otherAccount.address);
            expect(tokenA_balance.sub(other_tokenA_balance)).to.equal(expectedAmountOut);

        });
        it("auction between", async function () {
            const { yexSwapExample, tokenA, tokenB, owner, otherAccount } = await loadFixture(deployYexSwap);

            const YexSwapPool = await ethers.getContractFactory("YexSwapPool");

            const pool1 = YexSwapPool.attach(await yexSwapExample.pool1());
            const pool2 = YexSwapPool.attach(await yexSwapExample.pool2());

            // faucet to owner
            await tokenA.connect(owner).faucet();
            await tokenB.connect(owner).faucet();

            // faucet
            await tokenA.connect(otherAccount).faucet();
            await tokenB.connect(otherAccount).faucet();

            const owner_tokenA = await tokenA.balanceOf(owner.address);
            const owner_tokenB = await tokenA.balanceOf(owner.address);

            const other_tokenA_balance = await tokenA.balanceOf(otherAccount.address);
            const other_tokenB_balance = await tokenB.balanceOf(otherAccount.address);

            // approve pool1
            await tokenA.connect(owner).approve(pool1.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool1.address, owner_tokenB);

            // approve pool2
            await tokenA.connect(owner).approve(pool2.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool2.address, owner_tokenB);

            // approve
            await tokenA.connect(otherAccount).approve(yexSwapExample.address, other_tokenA_balance);
            await tokenB.connect(otherAccount).approve(yexSwapExample.address, other_tokenB_balance);

            // add liquidity 
            // pool1 init 1: 1 -- > 1.1: 1.4
            // pool2 init 1: 1 -- > 1.2: 1.5
            await pool1.connect(owner).addLiquidity((owner_tokenA / 10).toString(), (owner_tokenB / 10 * 4).toString());
            await pool2.connect(owner).addLiquidity((owner_tokenA / 10 * 2).toString(), (owner_tokenB / 10 * 5).toString());



            await yexSwapExample.connect(otherAccount).deposit(10000000000, 12600000000);

            await time.increase(10);

            await yexSwapExample.performUpkeep("0x");

            const tokenA_balance = await tokenA.balanceOf(otherAccount.address);
            const tokenB_balance = await tokenB.balanceOf(otherAccount.address);

            expect(other_tokenA_balance).to.equal(tokenA_balance);
            expect(other_tokenB_balance).to.equal(tokenB_balance);

        });
        it("auction greater", async function () {
            const { yexSwapExample, tokenA, tokenB, owner, otherAccount } = await loadFixture(deployYexSwap);

            const YexSwapPool = await ethers.getContractFactory("YexSwapPool");
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexSwapExample.sol:ERC20WithFaucet");

            const pool1 = YexSwapPool.attach(await yexSwapExample.pool1());
            const pool2 = YexSwapPool.attach(await yexSwapExample.pool2());

            // faucet to owner
            await tokenA.connect(owner).faucet();
            await tokenB.connect(owner).faucet();

            // faucet
            await tokenA.connect(otherAccount).faucet();
            await tokenB.connect(otherAccount).faucet();

            const owner_tokenA = await tokenA.balanceOf(owner.address);
            const owner_tokenB = await tokenA.balanceOf(owner.address);

            const other_tokenA_balance = await tokenA.balanceOf(otherAccount.address);
            const other_tokenB_balance = await tokenB.balanceOf(otherAccount.address);

            // approve pool1
            await tokenA.connect(owner).approve(pool1.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool1.address, owner_tokenB);

            // approve pool2
            await tokenA.connect(owner).approve(pool2.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool2.address, owner_tokenB);

            // approve
            await tokenA.connect(otherAccount).approve(yexSwapExample.address, other_tokenA_balance);
            await tokenB.connect(otherAccount).approve(yexSwapExample.address, other_tokenB_balance);

            // add liquidity 
            // pool1 init price 1: 1 -- > 1.1: 1.4
            // pool2 init price 1: 1 -- > 1.2: 1.5
            await pool1.connect(owner).addLiquidity((owner_tokenA / 10).toString(), (owner_tokenB / 10 * 4).toString());
            await pool2.connect(owner).addLiquidity((owner_tokenA / 10 * 2).toString(), (owner_tokenB / 10 * 5).toString());

            const before_reseves = await pool2.getReserves();

            await yexSwapExample.connect(otherAccount).deposit(10000000000, 12900000000);

            await time.increase(10);

            await yexSwapExample.performUpkeep("0x");

            const tokenA_balance = await tokenA.balanceOf(otherAccount.address);
            const tokenB_balance = await tokenB.balanceOf(otherAccount.address);

            expect(other_tokenA_balance).to.lessThan(tokenA_balance);
            expect(other_tokenB_balance).to.greaterThan(tokenB_balance);

            // expect min_price pool's price increase 
            const after_reserves = await pool2.getReserves();
            expect(after_reserves[0]).to.lessThan(before_reseves[0]);
            expect(after_reserves[1]).to.greaterThan(before_reseves[1]);




        });
        it("auction less", async function () {
            const { yexSwapExample, tokenA, tokenB, owner, otherAccount } = await loadFixture(deployYexSwap);

            const YexSwapPool = await ethers.getContractFactory("YexSwapPool");
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexSwapExample.sol:ERC20WithFaucet");

            const pool1 = YexSwapPool.attach(await yexSwapExample.pool1());
            const pool2 = YexSwapPool.attach(await yexSwapExample.pool2());

            // faucet to owner
            await tokenA.connect(owner).faucet();
            await tokenB.connect(owner).faucet();

            // faucet
            await tokenA.connect(otherAccount).faucet();
            await tokenB.connect(otherAccount).faucet();

            const owner_tokenA = await tokenA.balanceOf(owner.address);
            const owner_tokenB = await tokenA.balanceOf(owner.address);

            const other_tokenA_balance = await tokenA.balanceOf(otherAccount.address);
            const other_tokenB_balance = await tokenB.balanceOf(otherAccount.address);

            // approve pool1
            await tokenA.connect(owner).approve(pool1.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool1.address, owner_tokenB);

            // approve pool2
            await tokenA.connect(owner).approve(pool2.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool2.address, owner_tokenB);

            // approve
            await tokenA.connect(otherAccount).approve(yexSwapExample.address, other_tokenA_balance);
            await tokenB.connect(otherAccount).approve(yexSwapExample.address, other_tokenB_balance);
            // add liquidity 
            // pool1 init 1: 1 -- > 1.1: 1.4  B/A = 1.27 
            // pool2 init 1: 1 -- > 1.2: 1.5  B/A = 1.25
            await pool1.connect(owner).addLiquidity((owner_tokenA / 10).toString(), (owner_tokenB / 10 * 4).toString());
            await pool2.connect(owner).addLiquidity((owner_tokenA / 10 * 2).toString(), (owner_tokenB / 10 * 5).toString());

            const before_reseves = await pool1.getReserves();

            await yexSwapExample.connect(otherAccount).deposit(10000000000, 12000000000);
            await time.increase(10);

            await yexSwapExample.performUpkeep("0x");

            const tokenA_balance = await tokenA.balanceOf(otherAccount.address);
            const tokenB_balance = await tokenB.balanceOf(otherAccount.address);

            expect(other_tokenA_balance).to.greaterThan(tokenA_balance);
            expect(other_tokenB_balance).to.lessThan(tokenB_balance);

            // expect max_price pool's price decrease
            const after_reserves = await pool1.getReserves();
            expect(after_reserves[0]).to.greaterThan(before_reseves[0]);
            expect(after_reserves[1]).to.lessThan(before_reseves[1]);


        });
        it("auction tokenA deposit is zero", async function () {
            const { yexSwapExample, tokenA, tokenB, owner, otherAccount } = await loadFixture(deployYexSwap);

            const YexSwapPool = await ethers.getContractFactory("YexSwapPool");
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexSwapExample.sol:ERC20WithFaucet");

            const pool1 = YexSwapPool.attach(await yexSwapExample.pool1());
            const pool2 = YexSwapPool.attach(await yexSwapExample.pool2());

            // faucet to owner
            await tokenA.connect(owner).faucet();
            await tokenB.connect(owner).faucet();

            // faucet
            await tokenA.connect(otherAccount).faucet();
            await tokenB.connect(otherAccount).faucet();

            const owner_tokenA = await tokenA.balanceOf(owner.address);
            const owner_tokenB = await tokenA.balanceOf(owner.address);

            const other_tokenA_balance = await tokenA.balanceOf(otherAccount.address);
            const other_tokenB_balance = await tokenB.balanceOf(otherAccount.address);

            // approve pool1
            await tokenA.connect(owner).approve(pool1.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool1.address, owner_tokenB);

            // approve pool2
            await tokenA.connect(owner).approve(pool2.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool2.address, owner_tokenB);

            // approve
            await tokenA.connect(otherAccount).approve(yexSwapExample.address, other_tokenA_balance);
            await tokenB.connect(otherAccount).approve(yexSwapExample.address, other_tokenB_balance);
            // add liquidity 
            // pool1 init 1: 1 -- > 1.1: 1.4  B/A = 1.27 
            // pool2 init 1: 1 -- > 1.2: 1.5  B/A = 1.25
            await pool1.connect(owner).addLiquidity((owner_tokenA / 10).toString(), (owner_tokenB / 10 * 4).toString());
            await pool2.connect(owner).addLiquidity((owner_tokenA / 10 * 2).toString(), (owner_tokenB / 10 * 5).toString());

            await yexSwapExample.connect(otherAccount).deposit(0, 2000000000);
            await time.increase(10);

            await yexSwapExample.performUpkeep("0x");

            const tokenA_balance = await tokenA.balanceOf(otherAccount.address);
            const tokenB_balance = await tokenB.balanceOf(otherAccount.address);

            expect(other_tokenA_balance).to.lessThan(tokenA_balance);
            expect(other_tokenB_balance).to.greaterThan(tokenB_balance);

        });
        it("auction tokenB deposit is zero", async function () {
            const { yexSwapExample, tokenA, tokenB, owner, otherAccount } = await loadFixture(deployYexSwap);

            const YexSwapPool = await ethers.getContractFactory("YexSwapPool");
            const ERC20WithFaucet = await ethers.getContractFactory("contracts/core/YexSwapExample.sol:ERC20WithFaucet");

            const pool1 = YexSwapPool.attach(await yexSwapExample.pool1());
            const pool2 = YexSwapPool.attach(await yexSwapExample.pool2());

            // faucet to owner
            await tokenA.connect(owner).faucet();
            await tokenB.connect(owner).faucet();

            // faucet
            await tokenA.connect(otherAccount).faucet();
            await tokenB.connect(otherAccount).faucet();

            const owner_tokenA = await tokenA.balanceOf(owner.address);
            const owner_tokenB = await tokenA.balanceOf(owner.address);

            const other_tokenA_balance = await tokenA.balanceOf(otherAccount.address);
            const other_tokenB_balance = await tokenB.balanceOf(otherAccount.address);

            // approve pool1
            await tokenA.connect(owner).approve(pool1.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool1.address, owner_tokenB);

            // approve pool2
            await tokenA.connect(owner).approve(pool2.address, owner_tokenA);
            await tokenB.connect(owner).approve(pool2.address, owner_tokenB);

            // approve
            await tokenA.connect(otherAccount).approve(yexSwapExample.address, other_tokenA_balance);
            await tokenB.connect(otherAccount).approve(yexSwapExample.address, other_tokenB_balance);
            // add liquidity 
            // pool1 init 1: 1 -- > 1.1: 1.4  B/A = 1.27 
            // pool2 init 1: 1 -- > 1.2: 1.5  B/A = 1.25
            await pool1.connect(owner).addLiquidity((owner_tokenA / 10).toString(), (owner_tokenB / 10 * 4).toString());
            await pool2.connect(owner).addLiquidity((owner_tokenA / 10 * 2).toString(), (owner_tokenB / 10 * 5).toString());

            await yexSwapExample.connect(otherAccount).deposit(10000000000, 0);
            await time.increase(10);

            await yexSwapExample.performUpkeep("0x");

            const tokenA_balance = await tokenA.balanceOf(otherAccount.address);
            const tokenB_balance = await tokenB.balanceOf(otherAccount.address);

            expect(other_tokenA_balance).to.greaterThan(tokenA_balance);
            expect(other_tokenB_balance).to.lessThan(tokenB_balance);

        });
    });

});
