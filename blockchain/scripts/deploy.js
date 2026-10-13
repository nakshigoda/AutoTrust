const hre = require("hardhat");

async function main() {
  // Get the deployer wallet from Hardhat config
  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;

  console.log("=========================================");
  console.log("Deploying AutoTrust Contract");
  console.log("=========================================");
  console.log("Network:          ", networkName);
  console.log("Deployer Address: ", deployer.address);

  // Get deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance: ", hre.ethers.formatEther(balance), "ETH");
  console.log("=========================================\n");

  console.log("Initiating deployment...");
  
  // Deploy the contract
  const AutoTrust = await hre.ethers.getContractFactory("AutoTrust");
  const autoTrust = await AutoTrust.deploy();

  // Wait for the deployment to complete
  await autoTrust.waitForDeployment();
  
  // Retrieve the deployed contract address
  const contractAddress = await autoTrust.getAddress();
  
  // Retrieve the transaction hash
  const deploymentTx = autoTrust.deploymentTransaction();

  console.log("\n=========================================");
  console.log("DEPLOYMENT SUCCESSFUL");
  console.log("=========================================");
  console.log("Contract Address: ", contractAddress);
  if (deploymentTx && deploymentTx.hash) {
    console.log("Transaction Hash: ", deploymentTx.hash);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
