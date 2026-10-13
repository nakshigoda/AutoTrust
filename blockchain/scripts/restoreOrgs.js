const hre = require("hardhat");

async function main() {
  const contractAddress = "0x3C115EB578c6f335352371CA4aF843AdB8a1B0C4";
  const AutoTrust = await hre.ethers.getContractFactory("AutoTrust");
  const autoTrust = await AutoTrust.attach(contractAddress);

  console.log("Restoring organization approvals...");

  const scWallet = "0x8603c24E33EBa4a9b6EC5A0A48167A80C481c331";
  const icWallet = "0xa8D9D31d45F2dd41E575313e00Dd3318C9734fa3";

  try {
    let tx1 = await autoTrust.approveServiceCenter(scWallet, "AutoTrust Prime Garage");
    console.log("Approving Service Center... Hash:", tx1.hash);
    await tx1.wait();

    let tx2 = await autoTrust.approveInsuranceCompany(icWallet, "SecureDrive Insurance Ltd");
    console.log("Approving Insurance Company... Hash:", tx2.hash);
    await tx2.wait();

    console.log("All demo organizations restored successfully!");
  } catch (err) {
    console.error("Failed to approve organizations:", err);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
