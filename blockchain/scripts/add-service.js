const hre = require("hardhat");

async function main() {
  const contractAddress = "0xEAc8314781DDA7cA18Ad30FefCC788c57f6c04F8";
  const vehicleRegNumber = "MH04XY5678";
  const targetWalletAddress = "0x8603c24E33EBa4a9b6EC5A0A48167A80C481c331";

  // Attempt to find Account 2 in the configured signers.
  // If you temporarily swapped your .env PRIVATE_KEY to Account 2, signers[0] will be used.
  // If you added multiple accounts to hardhat.config.js, it will find the exact match.
  const signers = await hre.ethers.getSigners();
  let serviceCenterSigner = signers.find(s => s.address.toLowerCase() === targetWalletAddress.toLowerCase());

  // Fallback: use an explicit environment variable if provided, or default to the primary signer
  if (!serviceCenterSigner) {
    if (process.env.SERVICE_CENTER_PRIVATE_KEY) {
      serviceCenterSigner = new hre.ethers.Wallet(process.env.SERVICE_CENTER_PRIVATE_KEY, hre.ethers.provider);
    } else {
      console.warn(`\n[WARNING] Wallet ${targetWalletAddress} was not found in the Hardhat accounts.`);
      console.warn(`Falling back to the primary configured wallet (${signers[0].address}).`);
      console.warn(`If this is not your approved Service Center wallet, the transaction will revert.\n`);
      serviceCenterSigner = signers[0];
    }
  }

  console.log("=========================================");
  console.log("ADDING SERVICE RECORD");
  console.log("=========================================");
  console.log("Using Wallet:    ", serviceCenterSigner.address);
  console.log("Target Vehicle:  ", vehicleRegNumber);
  console.log("Contract Address:", contractAddress);

  // Attach to the deployed contract and connect the specific signer
  const AutoTrust = await hre.ethers.getContractFactory("AutoTrust");
  const autoTrust = AutoTrust.attach(contractAddress).connect(serviceCenterSigner);

  // Service record parameters
  const serviceType = "Oil Change";
  const timestamp = Math.floor(Date.now() / 1000); // Current Unix timestamp
  const mileage = 28500;
  const cost = 3500;
  const documentHash = "0x0000000000000000000000000000000000000000000000000000000000000000";

  console.log("\nSending transaction...");
  
  // Call addServiceRecord
  const tx = await autoTrust.addServiceRecord(
    vehicleRegNumber,
    serviceType,
    timestamp,
    mileage,
    cost,
    documentHash
  );

  console.log("Transaction Hash:", tx.hash);
  console.log("Waiting for confirmation...");
  
  // Wait for the transaction to be mined
  const receipt = await tx.wait();
  
  console.log("\n=========================================");
  console.log("✓ TRANSACTION CONFIRMED");
  console.log("=========================================");
  console.log("Block Number:", receipt.blockNumber);
  console.log("Gas Used:    ", receipt.gasUsed.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
