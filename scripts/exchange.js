// scripts/exchangeProperty.js
const hre = require("hardhat");

async function main() {
  const [deployer, receiver] = await hre.ethers.getSigners();
  console.log("Using deployer:", deployer.address);
  console.log("Receiver:", receiver.address);

  // Deploy the contract (or connect to an already deployed instance)
  const PropertyToken = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken = await PropertyToken.deploy();
  console.log("PropertyToken deployed to:", propertyToken.address);

  // Deployer mints a property
  let tx = await propertyToken.mintProperty(
    "Test appart 1",
    "Residential",
    1000,
    "ipfsHash123"
  );
  await tx.wait();
  console.log("Property minted by deployer.");

  // Increase time to bypass the lock period (simulate waiting period)
  await hre.network.provider.send("evm_increaseTime", [610]);
  await hre.network.provider.send("evm_mine");

  // Get the minted property ID (first token minted will have id 0)
  const props = await propertyToken.getPropertiesByOwner(deployer.address);
  const propertyId = props[0];

  // Transfer property from deployer to receiver
  tx = await propertyToken.exchangeProperty(propertyId, receiver.address);
  await tx.wait();
  console.log(
    `Property (ID: ${propertyId}) transferred from ${deployer.address} to ${receiver.address}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
