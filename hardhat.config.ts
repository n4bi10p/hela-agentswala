import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import dotenv from "dotenv";

dotenv.config();

const HELA_RPC_URL = process.env.HELA_RPC_URL || "https://testnet-rpc.helachain.com";
const HELA_CHAIN_ID = Number(process.env.HELA_CHAIN_ID || "8668");
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {},
    helaTestnet: {
      url: HELA_RPC_URL,
      chainId: HELA_CHAIN_ID,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  }
};

export default config;
