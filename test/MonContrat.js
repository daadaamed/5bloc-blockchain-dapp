const { expect } = require("chai");

describe("MonContrat", function () {
  let monContrat, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const MonContrat = await ethers.getContractFactory("MonContrat");
    monContrat = await MonContrat.deploy();
    await monContrat.waitForDeployment();
  });

  it("devrait être bien déployé", async function () {
    expect(monContrat).to.not.be.null;
    expect(await monContrat.getAddress()).to.properAddress;
  });

  it("devrait retourner la bonne valeur après exécution", async function () {
    const tx = await monContrat.maFonctionExemple();
    await tx.wait();
    const valeur = await monContrat.valeurStockee();
    expect(valeur).to.equal(42); // Juste un exemple
  });

  it("devrait empêcher les non-propriétaires de modifier la valeur", async function () {
    await expect(monContrat.connect(addr1).modifieValeur(100)).to.be.revertedWith("Accès refusé");
  });
});
