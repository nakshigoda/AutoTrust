const hre = require("hardhat");

async function main() {
  const contractAddress = "0xEAc8314781DDA7cA18Ad30FefCC788c57f6c04F8";
  const vehicleRegNumber = "MH04XY5678";
  const targetWalletAddress = "0xa8D9D31d45F2dd41E575313e00Dd3318C9734fa3";

  // Attempt to find Account 3 in the configured signers.
  const signers = await hre.ethers.getSigners();
  let insuranceSigner = signers.find(s => s.address.toLowerCase() === targetWalletAddress.toLowerCase());

  // Fallback: use an explicit environment variable if provided, or default to the primary signer
  if (!insuranceSigner) {
    if (process.env.INSURANCE_PRIVATE_KEY) {
      insuranceSigner = new hre.ethers.Wallet(process.env.INSURANCE_PRIVATE_KEY, hre.ethers.provider);
    } else {
      console.warn(`\n[WARNING] Wallet ${targetWalletAddress} was not found in the Hardhat accounts.`);
      console.warn(`Falling back to the primary configured wallet (${signers[0].address}).`);
      console.warn(`If this is not your approved Insurance Company wallet, the transaction will revert.\n`);
      insuranceSigner = signers[0];
    }
  }

  console.log("=========================================");
  console.log("ADDING ACCIDENT RECORD");
  console.log("=========================================");
  console.log("Using Wallet:    ", insuranceSigner.address);
  console.log("Target Vehicle:  ", vehicleRegNumber);
  console.log("Contract Address:", contractAddress);

  // Attach to the deployed contract and connect the specific signer
  const AutoTrust = await hre.ethers.getContractFactory("AutoTrust");
  const autoTrust = AutoTrust.attach(contractAddress).connect(insuranceSigner);

  // Accident record parameters
  const timestamp = Math.floor(Date.now() / 1000); // Current Unix timestamp
  const damageDescription = "Front bumper and left fender damage";
  const repairCost = 45000;
  const documentHash = "0x0000000000000000000000000000000000000000000000000000000000000000";

  console.log("\nSending transaction...");
  
  // Call addAccidentRecord
  const tx = await autoTrust.addAccidentRecord(
    vehicleRegNumber,
    timestamp,
    damageDescription,
    repairCost,
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
