import * as hre from 'hardhat'
import * as dotenv from 'dotenv'
import { verify } from './verify-contract'

dotenv.config()

async function main() {
  const factoryAddy = await deployFactory(process.env.FEE_WALLET)
  await deployRouter02(factoryAddy, process.env.WETH_ADDY)
}

async function deployFactory(feeWalletAddy: string) {
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

async function deployRouter02(factoryContractAddy: string, WETHAddy: string) {
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
