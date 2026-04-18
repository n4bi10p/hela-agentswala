import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import dotenv from "dotenv";

dotenv.config();

const HELA_RPC_URL = process.env.HELA_RPC_URL || "https://testnet-rpc.helachain.com";
const HELA_CHAIN_ID = Number(process.env.HELA_CHAIN_ID || "666888");
const rawPrivateKey = (process.env.PRIVATE_KEY || "").trim();
const normalizedPrivateKey = rawPrivateKey
  ? rawPrivateKey.startsWith("0x")
    ? rawPrivateKey
    : `0x${rawPrivateKey}`
  : "";
const hasValidPrivateKey = /^0x[0-9a-fA-F]{64}$/.test(normalizedPrivateKey);

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
      accounts: hasValidPrivateKey ? [normalizedPrivateKey] : []
    }
  }
};

export default config;
