// ignition/modules/propertyToken.js
// Ce module utilise Hardhat Ignition pour déployer le contrat PropertyToken.

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("PropertyTokenModule", (m) => {
  // Déploiement du contrat PropertyToken.
  const propertyToken = m.contract("PropertyToken", [], {
    gasLimit: 5000000,
    from: m.deployer,
  });

  m.onDeploy(async () => {
    console.log("Déploiement de PropertyToken en cours...");
  });

  m.onDeployComplete(async (context) => {
    const deployedToken = context.contracts.propertyToken;
    console.log("PropertyToken déployé à l'adresse :", deployedToken.address);

    // Exemple d'appel de fonction : vérification de l'initialisation du token.
    // Ici, nous vérifions simplement que le tokenId 0 n'existe pas encore (puisque rien n'a été minté).
    try {
      await deployedToken.getProperty(0);
    } catch (error) {
      console.log("Aucun token minté pour le moment.");
    }
  });

  return { propertyToken };
});
