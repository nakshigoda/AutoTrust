const hre = require("hardhat");

async function main() {
  const contractAddress = "0xEAc8314781DDA7cA18Ad30FefCC788c57f6c04F8";
  
  const account1_owner = "0x16822BCEd3f80c1FF64265535735c27e51b1b679";
  const account2_service = "0x8603c24E33EBa4a9b6EC5A0A48167A80C481c331";
  const account3_insurance = "0xa8D9D31d45F2dd41E575313e00Dd3318C9734fa3";

  // Get the deployer wallet (admin) from Hardhat config
  const [admin] = await hre.ethers.getSigners();
  console.log("Running setup using admin account:", admin.address);
  console.log("Contract Address:", contractAddress);

  // Attach to the deployed contract using ethers v6 syntax
  const AutoTrust = await hre.ethers.getContractFactory("AutoTrust");
  const autoTrust = AutoTrust.attach(contractAddress);

  console.log("\n=========================================");
  console.log("EXECUTING TRANSACTIONS");
  console.log("=========================================");

  // 1. Approve Service Center
  console.log("\n1. Approving Account 2 as Service Center...");
  const tx1 = await autoTrust.approveServiceCenter(account2_service);
  console.log("Transaction Hash:", tx1.hash);
  console.log("Waiting for confirmation...");
  await tx1.wait();
  console.log("✓ Confirmed!");

  // 2. Approve Insurance Company
  console.log("\n2. Approving Account 3 as Insurance Company...");
  const tx2 = await autoTrust.approveInsuranceCompany(account3_insurance);
  console.log("Transaction Hash:", tx2.hash);
  console.log("Waiting for confirmation...");
  await tx2.wait();
  console.log("✓ Confirmed!");

  // 3. Register Vehicle
  console.log("\n3. Registering Test Vehicle (MH04XY5678)...");
  // Arguments: _vehicleId, _regNumber, _model, _manufacturingYear, _owner
  const tx3 = await autoTrust.registerVehicle(
    "AT001",
    "MH04XY5678",
    "Honda City",
    2022,
    account1_owner
  );
  console.log("Transaction Hash:", tx3.hash);
  console.log("Waiting for confirmation...");
  await tx3.wait();
  console.log("✓ Confirmed!");

  console.log("\n=========================================");
  console.log("VERIFYING FINAL STATE");
  console.log("=========================================");
  
  const isServiceCenter = await autoTrust.isServiceCenter(account2_service);
  console.log(`isServiceCenter(${account2_service}):`, isServiceCenter);

  const isInsuranceCompany = await autoTrust.isInsuranceCompany(account3_insurance);
  console.log(`isInsuranceCompany(${account3_insurance}):`, isInsuranceCompany);

  const isVehicleRegistered = await autoTrust.isVehicleRegistered("MH04XY5678");
  console.log(`isVehicleRegistered("MH04XY5678"):`, isVehicleRegistered);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
