import { ContractFactory, providers, Wallet, ethers } from 'ethers'
import * as dotenv from 'dotenv'
import { verify } from './verify-contract'
import UniswapV2Factory from '../artifacts/contracts/core/UniswapV2Factory.sol/UniswapV2Factory.json'
import * as hre from 'hardhat'
dotenv.config()

async function main() {
    await deployRouter02(process.env.FACTORY_ADDY, process.env.WETH_ADDY)
  }


async function deployRouter02(factoryContractAddy: any, WETHAddy: any) {
    const router02 = await hre.ethers.getContractFactory("UniswapV2Router02")
    const router02Contract = await router02.deploy(factoryContractAddy, WETHAddy)
  
    await router02Contract.deployed()
    console.log(`UniswapV2Router02 contract deployed to ${router02Contract.address}`)
  
    console.log("Waiting for blocks confirmations...")
    await router02Contract.deployTransaction.wait(6)
    console.log("Confirmed!")
  
    await verify(router02Contract.address, [factoryContractAddy, WETHAddy])
  }

  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })

