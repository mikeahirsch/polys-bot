require("dotenv").config();
const express = require("express");
const http = require("http");
const Web3 = require("web3");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const moment = require("moment-timezone");
const _ = require("lodash");

// SERVER CONFIG
const PORT = process.env.PORT || 4000;
const app = express();
const server = http
  .createServer(app)
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

// WEB3 CONFIG
const web3 = new Web3(
  new HDWalletProvider(process.env.PRIVATE_KEY, process.env.RPC_URL)
);

// Polys: https://etherscan.io/address/0x7effbc54d8066e3717230fff5d245d7c11ad4d22
const POLYS_ABI = [
  {
    name: "availableBalance",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [{ type: "address", name: "input" }],
    constant: true,
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    name: "withdraw",
    outputs: [],
    inputs: [],
    constant: false,
    payable: true,
    type: "function",
  },
];
const POLYS_ADDRESS = "0x7EffBC54d8066E3717230Fff5D245d7c11AD4d22";
const polysContract = new web3.eth.Contract(POLYS_ABI, POLYS_ADDRESS);

const checkBalance = async () => {
  try {
    const balanceResult = await polysContract.methods
      .availableBalance(process.env.ADDRESS)
      .call();

    const balance = Number(balanceResult);

    console.log(`You have a balance of: ${balance}`);

    if (balance > 0) {
      await polysContract.methods.withdraw().send({
        gasLimit: 8000000, // Override gas settings: https://github.com/ethers-io/ethers.js/issues/469
        gasPrice: web3.utils.toWei("50", "Gwei"),
        from: process.env.ADDRESS,
      });
    }
  } catch (e) {
    console.log(e);
  }
};

let isRunning = false;

const run = async () => {
  if (isRunning) {
    return;
  }

  isRunning = true;

  await checkBalance();

  isRunning = false;
};

// Check markets every n seconds
const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 1000 * 60 * 60; // 1 hour
run(); // run now and then every hour
setInterval(async () => {
  await run();
}, POLLING_INTERVAL);
