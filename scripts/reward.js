// scripts/rewardTransaction.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Deploy the contract (or connect to an already deployed instance)
  const PropertyToken = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken = await PropertyToken.deploy();
  console.log("PropertyToken deployed to:", propertyToken.address);

  // Mint a property
  let tx = await propertyToken.mintProperty(
    "Cozy House",
    "Residential",
    1000,
    "ipfsHash123"
  );
  await tx.wait();
  console.log("Property minted by", deployer.address);

  // Increase time to bypass the lock period for reward transactions
  await hre.network.provider.send("evm_increaseTime", [610]);
  await hre.network.provider.send("evm_mine");

  // Execute a reward transaction to upgrade from Residential to Commercial (20% increase)
  tx = await propertyToken.rewardTransaction(0, "Commercial");
  await tx.wait();
  console.log(
    "Property upgraded from Residential to Commercial by",
    deployer.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
