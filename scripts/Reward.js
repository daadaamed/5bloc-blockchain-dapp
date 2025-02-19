const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Exécution de la transaction de récompense par :", deployer.address);

  // Charger l'adresse du contrat depuis `contractAddress.txt`
  const contractAddress = fs.readFileSync("./contractAddress.txt", "utf-8").trim();
  const PropertyToken = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken = PropertyToken.attach(contractAddress);

  // Augmenter le temps sur Hardhat (Simulation de la période de verrouillage)
  console.log("Simulation d'une augmentation du temps..");
  await hre.network.provider.send("evm_increaseTime", [610]);
  await hre.network.provider.send("evm_mine");

  // Exécuter la transaction de récompense
  const tx = await propertyToken.rewardTransaction(0, "Commercial");
  await tx.wait();

  console.log("Propriété mise à niveau avec succès !");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erreur :", error);
    process.exit(1);
  });
