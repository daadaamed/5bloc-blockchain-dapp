// scripts/deploy.js

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const PropertyToken = await ethers.getContractFactory("PropertyToken");
  const propertyToken = await PropertyToken.deploy();

  // If deployTransaction is available, wait for it to be mined.
  if (
    propertyToken.deployTransaction &&
    typeof propertyToken.deployTransaction.wait === "function"
  ) {
    await propertyToken.deployTransaction.wait();
  } else {
    // Otherwise, wait a few seconds to allow the transaction to be mined.
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  console.log("PropertyToken deployed to:", propertyToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
