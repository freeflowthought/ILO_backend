
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from 'dotenv';
import { HardhatUserConfig } from "hardhat/config";
import "solidity-coverage";
dotenv.config();

const config: HardhatUserConfig = {
  gasReporter: {
    enabled: true,
  },
  solidity: {
    version: "0.8.16",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    scrollTestnet: {
      url: process.env.SCROLL_TESTNET_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    polygon_mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  },
  etherscan: {
    apiKey: {
      scrollAlpha: 'abc',
      polygon_mumbai: process.env.POLYGONSCAN_API_KEY !== undefined ? process.env.POLYGONSCAN_API_KEY : '',
    },
    customChains: [
      {
        network: 'scrollAlpha',
        chainId: 534353,
        urls: {
          apiURL: 'https://blockscout.scroll.io/api',
          browserURL: 'https://blockscout.scroll.io/'
        },
      },
      {
        network: 'polygon_mumbai',
        chainId: 80001,
        urls: {
          apiURL: 'https://rpc-mumbai.maticvigil.com/',
          browserURL: 'https://polygonscan.com/'
        },
      },
    ],
  },

};
export default config;
