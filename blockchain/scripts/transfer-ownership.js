const hre = require("hardhat");

async function main() {
  const contractAddress = "0xEAc8314781DDA7cA18Ad30FefCC788c57f6c04F8";
  const vehicleRegNumber = "MH04XY5678";
  
  const expectedCurrentOwner = "0x16822BCEd3f80c1FF64265535735c27e51b1b679";
  const newOwnerAddress = "0x8603c24E33EBa4a9b6EC5A0A48167A80C481c331";

  // Account 1 (the current owner) should be the primary signer in your Hardhat configuration (.env PRIVATE_KEY)
  const [currentOwnerSigner] = await hre.ethers.getSigners();
  
  if (currentOwnerSigner.address.toLowerCase() !== expectedCurrentOwner.toLowerCase()) {
    console.warn("\n[WARNING] The primary Hardhat signer does not match Account 1.");
    console.warn(`Expected: ${expectedCurrentOwner}`);
    console.warn(`Found:    ${currentOwnerSigner.address}`);
    console.warn("If this wallet is not the current owner of the vehicle, the transaction will revert.\n");
  }

  console.log("=========================================");
  console.log("TRANSFERRING VEHICLE OWNERSHIP");
  console.log("=========================================");
  console.log("Contract:      ", contractAddress);
  console.log("Vehicle:       ", vehicleRegNumber);
  console.log("Current Owner: ", currentOwnerSigner.address);
  console.log("New Owner:     ", newOwnerAddress);

  // Attach to the deployed contract and connect the signer
  const AutoTrust = await hre.ethers.getContractFactory("AutoTrust");
  const autoTrust = AutoTrust.attach(contractAddress).connect(currentOwnerSigner);

  console.log("\nSending transaction...");
  
  // Call transferOwnership
  const tx = await autoTrust.transferOwnership(vehicleRegNumber, newOwnerAddress);

  console.log("Transaction Hash:", tx.hash);
  console.log("Waiting for confirmation...");
  
  // Wait for the transaction to be mined
  const receipt = await tx.wait();
  
  console.log("\n=========================================");
  console.log("✓ OWNERSHIP TRANSFER CONFIRMED");
  console.log("=========================================");
  console.log("Block Number:", receipt.blockNumber);
  console.log("Gas Used:    ", receipt.gasUsed.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
