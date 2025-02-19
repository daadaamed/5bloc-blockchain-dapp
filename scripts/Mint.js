const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  // Deploy the contract (or connect to an already deployed instance)
  const PropertyToken = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken = await PropertyToken.deploy();
  // await propertyToken.deployed();
  console.log("PropertyToken deployed to:", propertyToken.address);

  // Mint a property
  const tx = await propertyToken.mintProperty(
    "Cozy House",
    "Residential",
    1000,
    "ipfsHash123"
  );
  await tx.wait();
  console.log("Property minted successfully by", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
