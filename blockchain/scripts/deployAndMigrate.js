const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const AutoTrust = await hre.ethers.getContractFactory("AutoTrust");
  console.log("Deploying new AutoTrust...");
  const autoTrust = await AutoTrust.deploy();
  await autoTrust.waitForDeployment();
  const address = await autoTrust.getAddress();
  
  console.log("AutoTrust deployed to:", address);

  // Setup roles
  const scWallet = "0x8603c24E33EBa4a9b6EC5A0A48167A80C481c331";
  const icWallet = "0xa8D9D31d45F2dd41E575313e00Dd3318C9734fa3";

  console.log("Approving organizations...");
  let tx = await autoTrust.approveServiceCenter(scWallet, "AutoTrust Prime Garage");
  await tx.wait();
  tx = await autoTrust.approveInsuranceCompany(icWallet, "SecureDrive Insurance Ltd");
  await tx.wait();

  console.log("Registering vehicle MH04XY5678...");
  tx = await autoTrust.registerVehicle(
    "VH-001", "MH04XY5678", "Toyota", "Corolla", "Silver", "Petrol",
    "CH-192837", "EN-847291", 2021, "0x16822BCEd3f80c1FF64265535735c27e51b1b679", "Alice Admin"
  );
  await tx.wait();
  
  console.log("Registering vehicle MH10PQ9999...");
  tx = await autoTrust.registerVehicle(
    "AB001", "MH10PQ9999", "Hyundai", "i20", "Blue", "Diesel",
    "CH-999999", "EN-111111", 2022, "0x16822BCEd3f80c1FF64265535735c27e51b1b679", "Alice Admin"
  );
  await tx.wait();

  // Export ABI and address
  const abiFile = path.join(__dirname, "../../src/lib/AutoTrustABI.json");
  const artifact = require("../artifacts/contracts/AutoTrust.sol/AutoTrust.json");
  fs.writeFileSync(abiFile, JSON.stringify(artifact.abi, null, 2));
  
  console.log("ABI updated.");
  console.log("Next: manually update src/lib/ethereum.js with the new contract address and deployment block.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
