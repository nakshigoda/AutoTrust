import { ethers } from 'ethers';
import AutoTrustABI from './AutoTrustABI.json';

export const CONTRACT_ADDRESS = "0x3C115EB578c6f335352371CA4aF843AdB8a1B0C4";

export async function getContract() {
  if (!window.ethereum) {
    throw new Error("MetaMask (or a Web3 wallet) is required to view real blockchain data. Please install it.");
  }
  
  // Use MetaMask provider
  const provider = new ethers.BrowserProvider(window.ethereum);
  
  // Check network
  const network = await provider.getNetwork();
  if (network.chainId !== 11155111n) {
    throw new Error("Please switch your MetaMask to the Ethereum Sepolia testnet to view blockchain records.");
  }

  // Read-only connection is fine for the Passport
  const contract = new ethers.Contract(CONTRACT_ADDRESS, AutoTrustABI, provider);
  return contract;
}

export async function getContractWithSigner() {
  if (!window.ethereum) {
    throw new Error("MetaMask is required to interact with the blockchain. Please install it.");
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  if (network.chainId !== 11155111n) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });
    } catch {
      throw new Error("Please switch your MetaMask to the Ethereum Sepolia testnet (Chain ID: 11155111).");
    }
  }

  const accounts = await provider.send("eth_requestAccounts", []);
  const activeAccount = accounts[0];
  const signer = await provider.getSigner(activeAccount);
  
  console.log("--- ETHEREUM.JS DIAGNOSTIC ---");
  console.log("Provider Type:", provider.constructor.name);
  console.log("Signer Address:", await signer.getAddress());
  console.log("Contract Target:", CONTRACT_ADDRESS);
  console.log("------------------------------");

  return new ethers.Contract(CONTRACT_ADDRESS, AutoTrustABI, signer);
}

// Helper to convert ethers BigInts or Proxy objects to plain JS values where needed
export const formatOnChainRecord = (record) => {
  return record;
};

// AutoTrust Contract Deployment Block on Sepolia
export const DEPLOYMENT_BLOCK = 11850100;

export async function getAllEvents(contract, filter) {
  const provider = contract.runner?.provider || contract.runner;
  const latestBlock = await provider.getBlockNumber();
  const events = [];
  
  // Chunk size must be <= 10000 for standard free RPCs
  const chunkSize = 9000;
  
  // Starting from deployment block up to latest
  for (let fromBlock = DEPLOYMENT_BLOCK; fromBlock <= latestBlock; fromBlock += chunkSize) {
    const toBlock = Math.min(fromBlock + chunkSize - 1, latestBlock);
    const chunk = await contract.queryFilter(filter, fromBlock, toBlock);
    events.push(...chunk);
  }
  
  return events;
}
