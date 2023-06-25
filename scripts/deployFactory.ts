import { ContractFactory, providers, Wallet, ethers } from 'ethers'
import * as dotenv from 'dotenv'
import { verify } from './verify-contract'
import UniswapV2Factory from '../artifacts/contracts/core/UniswapV2Factory.sol/UniswapV2Factory.json'
import * as hre from 'hardhat'
dotenv.config()

async function main() {
  const factoryAddy = await deployFactory(process.env.FEE_WALLET)
  console.log(factoryAddy)
}

async function deployFactory(feeWalletAddy:any) {
  const factory = await hre.ethers.getContractFactory("UniswapV2Factory")
  const factoryContract = await factory.deploy(feeWalletAddy)

  await factoryContract.deployed()
  console.log(`UniswapV2Factory contract deployed to ${factoryContract.address}`)

  console.log("Waiting for blocks confirmations...")
  await factoryContract.deployTransaction.wait(6)
  console.log("Confirmed!")

  await verify(factoryContract.address, [process.env.FEE_WALLET])

  return factoryContract.address
}


main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})