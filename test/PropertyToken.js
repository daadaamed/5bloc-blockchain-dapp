const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PropertyToken Contract", function () {
  let PropertyToken, propertyToken, owner, addr1, addr2, addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const PropertyTokenFactory = await ethers.getContractFactory(
      "PropertyToken"
    );
    propertyToken = await PropertyTokenFactory.deploy();
    // Note: No need to call deployed() if it is not available
  });

  describe("mintProperty", function () {
    it("should mint a new property correctly", async function () {
      // Mint a property from the deployer (owner)
      const tx = await propertyToken.mintProperty(
        "Test Property",
        "House",
        100,
        "ipfs://test"
      );
      await tx.wait();

      // Check that the property is stored correctly
      const property = await propertyToken.properties(0);
      expect(property.name).to.equal("Test Property");
      expect(property.owner).to.equal(owner.address);

      // Check that ownerProperties mapping includes the new property
      const props = await propertyToken.getPropertiesByOwner(owner.address);
      expect(props.length).to.equal(1);
      expect(props[0]).to.equal(0);
    });

    it("should enforce maximum properties per user", async function () {
      // Mint maximum allowed properties (4) for the owner.
      for (let i = 0; i < 4; i++) {
        // Before each mint, advance time to bypass the lock period.
        if (i > 0) {
          await ethers.provider.send("evm_increaseTime", [600]); // 10 minutes
          await ethers.provider.send("evm_mine");
        }
        const tx = await propertyToken.mintProperty(
          `Property ${i}`,
          "Type",
          100,
          `ipfs://hash${i}`
        );
        await tx.wait();
      }

      // Advance time to bypass lock period for the next transaction
      await ethers.provider.send("evm_increaseTime", [600]);
      await ethers.provider.send("evm_mine");

      // Attempting to mint a fifth property should revert.
      await expect(
        propertyToken.mintProperty(
          "Extra Property",
          "Type",
          100,
          "ipfs://hashExtra"
        )
      ).to.be.revertedWith(
        "MaxPropertiesReached: You already own the maximum number of properties."
      );
    });

    it("should enforce minting lock period (cooldown)", async function () {
      // Mint the first property
      const tx1 = await propertyToken.mintProperty(
        "Test Property",
        "House",
        100,
        "ipfs://test"
      );
      await tx1.wait();

      // Immediately try to mint a second property which should fail because of the lock period.
      await expect(
        propertyToken.mintProperty(
          "Test Property 2",
          "Apartment",
          200,
          "ipfs://test2"
        )
      ).to.be.revertedWith(
        "Cooldown active: Please wait before initiating a new transaction."
      );
    });
  });

  describe("exchangeProperty", function () {
    beforeEach(async function () {
      // Mint a property from the owner
      const tx = await propertyToken.mintProperty(
        "Exchange Property",
        "House",
        100,
        "ipfs://exchange"
      );
      await tx.wait();

      // Advance time to bypass the minting lock so that the owner can exchange
      await ethers.provider.send("evm_increaseTime", [600]);
      await ethers.provider.send("evm_mine");
    });

    it("should exchange (transfer) property from owner to another user", async function () {
      // Transfer property with ID 0 from owner to addr1
      const tx = await propertyToken.exchangeProperty(0, addr1.address);
      await tx.wait();

      // Verify that the property owner has been updated
      const property = await propertyToken.properties(0);
      expect(property.owner).to.equal(addr1.address);

      // Instead of checking previousOwners (which may not be fully returned by the getter),
      // verify that lastTransferAt has been updated (i.e. is greater than createdAt).
      expect(property.lastTransferAt).to.be.gt(property.createdAt);

      // Verify that the ownership mappings are updated
      const ownerProps = await propertyToken.getPropertiesByOwner(
        owner.address
      );
      expect(ownerProps.length).to.equal(0);
      const addr1Props = await propertyToken.getPropertiesByOwner(
        addr1.address
      );
      expect(addr1Props.length).to.equal(1);
      expect(addr1Props[0]).to.equal(0);
    });

    it("should revert when a non-owner attempts to exchange a property", async function () {
      // Attempt to exchange property from addr1 (not the owner) should revert.
      await expect(
        propertyToken.connect(addr1).exchangeProperty(0, addr2.address)
      ).to.be.revertedWith(
        "NotOwner: Only the property owner can transfer it."
      );
    });

    it("should enforce cooldown for the receiver during an exchange", async function () {
      // Have addr2 mint a property to put addr2 into cooldown.
      const txReceiver = await propertyToken
        .connect(addr2)
        .mintProperty("Receiver Mint", "House", 100, "ipfs://receiver");
      await txReceiver.wait();
      // At this point, addr2's cooldown is set (until block.timestamp + 600).

      // Use the property minted in beforeEach (ID 0) for the exchange.
      // The owner should now be out of cooldown (advanced in beforeEach),
      // but addr2 is still in cooldown.
      await expect(
        propertyToken.exchangeProperty(0, addr2.address)
      ).to.be.revertedWith(
        "Receiver cooldown active: The receiver must wait before receiving a new property."
      );
    });
  });
  describe("rewardTransaction", function () {
    beforeEach(async function () {
      // Mint a Residential property
      await propertyToken.mintProperty(
        "House",
        "Residential",
        100,
        "ipfs://res"
      );
      // Advance time to bypass lock
      await ethers.provider.send("evm_increaseTime", [600]);
      await ethers.provider.send("evm_mine");
    });

    it("should convert Residential to Commercial with 1.2x value", async function () {
      await propertyToken.rewardTransaction(0, "Commercial");
      const prop = await propertyToken.properties(0);
      expect(prop.propertyType).to.equal("Commercial");
      expect(prop.value).to.equal(120);
    });

    it("should enforce cooldown after reward transaction", async function () {
      await propertyToken.rewardTransaction(0, "Commercial");
      await expect(
        propertyToken.rewardTransaction(0, "Luxury")
      ).to.be.revertedWith("Cooldown active");
    });
  });
});
