const hre = require("hardhat");
async function main() {
  const contractAddress = "0x3C115EB578c6f335352371CA4aF843AdB8a1B0C4";
  const AutoTrust = await hre.ethers.getContractFactory("AutoTrust");
  const autoTrust = await AutoTrust.attach(contractAddress);
  console.log("Admin:", await autoTrust.admin());
  console.log("SC 0x8603c24E33EBa4a9b6EC5A0A48167A80C481c331:", await autoTrust.isServiceCenter("0x8603c24E33EBa4a9b6EC5A0A48167A80C481c331"));
  console.log("IC 0xa8D9D31d45F2dd41E575313e00Dd3318C9734fa3:", await autoTrust.isInsuranceCompany("0xa8D9D31d45F2dd41E575313e00Dd3318C9734fa3"));
}
main().catch(console.error);
