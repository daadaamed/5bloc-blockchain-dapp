const anchor = require("@coral-xyz/anchor");
const { SystemProgram } = anchor.web3;
const assert = require("assert");

describe("Smart Contract Test - Simple & Clair", () => {
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);
  const program = anchor.workspace.MySmartContract;

  let owner = anchor.web3.Keypair.generate();
  let buyer = anchor.web3.Keypair.generate();
  let propertyAccount = anchor.web3.Keypair.generate();

  it("Airdrop des utilisateurs", async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(owner.publicKey, 1e9),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(buyer.publicKey, 1e9),
      "confirmed"
    );
  });

  it("Crée une propriété NFT", async () => {
    await program.methods
      .createProperty("Maison de Test", new anchor.BN(100))
      .accounts({
        propertyAccount: propertyAccount.publicKey,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner, propertyAccount])
      .rpc();
    
    const property = await program.account.property.fetch(propertyAccount.publicKey);
    assert.strictEqual(property.name, "Maison de Test", "Nom incorrect");
    assert.strictEqual(property.price.toNumber(), 100, "Prix incorrect");
  });

  it("Tente de vendre la propriété avant cooldown", async () => {
    try {
      await program.methods
        .sellProperty()
        .accounts({
          propertyAccount: propertyAccount.publicKey,
          seller: owner.publicKey,
        })
        .signers([owner])
        .rpc();
      assert.fail("La transaction aurait dû échouer (cooldown)");
    } catch (error) {
      assert.ok(error.message.includes("Cooldown en cours"), "Mauvaise erreur");
    }
  });
});
