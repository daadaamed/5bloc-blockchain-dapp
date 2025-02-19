const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Minting d'une propriété par :", deployer.address);

  // Charger l'adresse du contrat depuis `contractAddress.txt`
  const contractAddress = fs.readFileSync("./contractAddress.txt", "utf-8").trim();
  console.log("Chargement du contrat depuis :", contractAddress);

  // connexion au contrat existant
  const PropertyToken = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken = PropertyToken.attach(contractAddress);

  // Mint une propriété
  const tx = await propertyToken.mintProperty(
    "Cozy House",
    "Residential",
    hre.ethers.utils.parseEther("1"), // Si c'est une valeur en ETH, sinon garder 1000
    "ipfsHash123"
  );
  await tx.wait();

  console.log("Propriété mintée avec succès !");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erreur :", error);
    process.exit(1);
  });
