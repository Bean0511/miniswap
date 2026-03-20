require("@nomicfoundation/hardhat-toolbox");
const dotenv = require("dotenv");
dotenv.config();
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;
module.exports = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [SEPOLIA_PRIVATE_KEY],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  }
};