const hre = require("hardhat");

async function main() {
  const contractAddress = "0xEAc8314781DDA7cA18Ad30FefCC788c57f6c04F8";
  const vehicleRegNumber = "MH04XY5678";

  console.log(`Connecting to AutoTrust at ${contractAddress}...`);
  const AutoTrust = await hre.ethers.getContractFactory("AutoTrust");
  
  // Connect to the deployed contract using the default provider
  const autoTrust = AutoTrust.attach(contractAddress);

  console.log(`\n=========================================`);
  console.log(`FETCHING DATA FOR VEHICLE: ${vehicleRegNumber}`);
  console.log(`=========================================\n`);

  // 1. Read Vehicle Details
  console.log("--- 1. VEHICLE DETAILS ---");
  try {
    const vehicle = await autoTrust.getVehicle(vehicleRegNumber);
    console.log("Vehicle ID:        ", vehicle.vehicleId);
    console.log("Registration:      ", vehicle.registrationNumber);
    console.log("Model:             ", vehicle.model);
    console.log("Manufacturing Year:", vehicle.manufacturingYear.toString());
    console.log("Current Owner:     ", vehicle.currentOwner);
    console.log("Registration Date: ", new Date(Number(vehicle.registrationTimestamp) * 1000).toLocaleString());
  } catch (err) {
    console.error("Failed to fetch vehicle details:", err.message);
  }

  // 2. Read Service Records
  console.log("\n--- 2. SERVICE RECORDS ---");
  try {
    const serviceRecords = await autoTrust.getServiceRecords(vehicleRegNumber);
    if (serviceRecords.length === 0) {
      console.log("No service records found.");
    } else {
      serviceRecords.forEach((record, index) => {
        console.log(`\nService Record #${index + 1}:`);
        console.log("  Service Type:   ", record.serviceType);
        console.log("  Date:           ", new Date(Number(record.date) * 1000).toLocaleString());
        console.log("  Mileage (km):   ", record.mileage.toString());
        console.log("  Cost (₹):       ", record.cost.toString());
        console.log("  Service Center: ", record.serviceCenter);
        console.log("  Document Hash:  ", record.documentHash);
      });
    }
  } catch (err) {
    console.error("Failed to fetch service records:", err.message);
  }

  // 3. Read Accident Records
  console.log("\n--- 3. ACCIDENT RECORDS ---");
  try {
    const accidentRecords = await autoTrust.getAccidentRecords(vehicleRegNumber);
    if (accidentRecords.length === 0) {
      console.log("No accident records found.");
    } else {
      accidentRecords.forEach((record, index) => {
        console.log(`\nAccident Record #${index + 1}:`);
        console.log("  Date:              ", new Date(Number(record.date) * 1000).toLocaleString());
        console.log("  Damage Description:", record.damageDescription);
        console.log("  Repair Cost (₹):   ", record.repairCost.toString());
        console.log("  Insurance Company: ", record.insuranceCompany);
        console.log("  Document Hash:     ", record.documentHash);
      });
    }
  } catch (err) {
    console.error("Failed to fetch accident records:", err.message);
  }

  // 4. Read Ownership History
  console.log("\n--- 4. OWNERSHIP HISTORY ---");
  try {
    const ownershipHistory = await autoTrust.getOwnershipHistory(vehicleRegNumber);
    if (ownershipHistory.length === 0) {
      console.log("No ownership history found.");
    } else {
      ownershipHistory.forEach((record, index) => {
        console.log(`\nTransfer #${index + 1}:`);
        console.log("  From:      ", record.from);
        console.log("  To:        ", record.to);
        console.log("  Timestamp: ", new Date(Number(record.timestamp) * 1000).toLocaleString());
      });
    }
  } catch (err) {
    console.error("Failed to fetch ownership history:", err.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
