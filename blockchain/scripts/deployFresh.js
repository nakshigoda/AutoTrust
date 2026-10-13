const hre = require("hardhat");

async function main() {
  console.log("Deploying new AutoTrust (Clean Slate)...");
  const AutoTrust = await hre.ethers.getContractFactory("AutoTrust");
  const autoTrust = await AutoTrust.deploy();
  await autoTrust.waitForDeployment();
  const address = await autoTrust.getAddress();
  console.log(`AutoTrust deployed to: ${address}`);

  const fs = require('fs');
  const path = require('path');
  const abiPath = path.join(__dirname, '../../src/lib/AutoTrustABI.json');
  const artifact = require('../artifacts/contracts/AutoTrust.sol/AutoTrust.json');
  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
  console.log("ABI updated.");
  
  // Also update ethereum.js automatically
  const ethJsPath = path.join(__dirname, '../../src/lib/ethereum.js');
  let ethJs = fs.readFileSync(ethJsPath, 'utf8');
  ethJs = ethJs.replace(/export const CONTRACT_ADDRESS = "0x[a-fA-F0-9]{40}";/, `export const CONTRACT_ADDRESS = "${address}";`);
  fs.writeFileSync(ethJsPath, ethJs);
  console.log("ethereum.js updated.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
