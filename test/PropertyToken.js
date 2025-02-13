const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PropertyToken", function () {
  let propertyToken;
  let owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const PropertyToken = await ethers.getContractFactory("PropertyToken");
    propertyToken = await PropertyToken.deploy();
    // Attendre que le contrat soit déployé (ethers v6)
    await propertyToken.waitForDeployment();
  });

  describe("Minting", function () {
    it("Should mint a property token correctly", async function () {
      const name = "Maison de Campagne";
      const propertyType = "maison";
      const value = 1000;
      const hashIPFS = "QmTestHash123";

      await expect(
        propertyToken.mintProperty(name, propertyType, value, hashIPFS)
      )
        .to.emit(propertyToken, "PropertyMinted")
        .withArgs(0, name, propertyType, owner.address);

      const property = await propertyToken.getProperty(0);
      expect(property.name).to.equal(name);
      expect(property.propertyType).to.equal(propertyType);
      expect(property.value).to.equal(value);
      expect(property.hashIPFS).to.equal(hashIPFS);
    });

    it("Should fail minting if called by non-owner", async function () {
      await expect(
        propertyToken
          .connect(addr1)
          .mintProperty("Test", "gare", 500, "QmTestHash456")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
