import { parseEther } from 'viem';

// X Layer Chain ID
export const CHAIN_ID = 196;

// 铸造所需的 ODOG 数量 (100 ODOG, 假设 ODOG 是 18 位精度)
export const MINT_AMOUNT = parseEther('100'); 

// 合约地址
export const NFT_CONTRACT_ADDRESS = '0x8ed8ed9f316016fcE26722A84B214ADE7E3c7917';
export const ODOG_TOKEN_ADDRESS = '0xc3F431Cd1B7220cCa703Ee08C24ca645A71e72c8';

// ODOG 代币的 ERC-20 ABI (仅包含关键的 approve 和 allowance)
export const ODOG_ABI = [
  {
    "constant": false,
    "inputs": [
      { "name": "_spender", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_owner", "type": "address" },
      { "name": "_spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function",
    "stateMutability": "view"
  }
];

// OdogMessageWall NFT 合约的 ABI (仅包含 writeMessage 铸造函数)
export const NFT_ABI = [
  {
    "constant": false,
    "inputs": [{ "internalType": "string", "name": "message", "type": "string" }],
    "name": "writeMessage",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];