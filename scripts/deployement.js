const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(" Déploiement en cours par :", deployer.address);

  // Déploiement du contrat PropertyToken
  const PropertyToken = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken = await PropertyToken.deploy();
  await propertyToken.deployed();

  console.log("PropertyToken déployé à :", propertyToken.address);

  // Sauvegarde de l'adresse du contrat dans un fichier pour la réutilisation
  const fs = require("fs");
  fs.writeFileSync("./contractAddress.txt", propertyToken.address);

  console.log(" Adresse du contrat sauvegardée dans `contractAddress.txt`");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erreur :", error);
    process.exit(1);
  });
