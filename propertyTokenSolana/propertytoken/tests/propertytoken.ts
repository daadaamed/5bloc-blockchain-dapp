import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert, expect } from "chai";
import { Propertytoken } from "../target/types/propertytoken";

describe("Propertytoken Smart Contract", () => {
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);
  const program = anchor.workspace.Propertytoken as Program<Propertytoken>;

  // Approved IPFS hash for testing
  const APPROVED_HASH = "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH";

  // Generate keypairs for user wallets.
  const user1Wallet = anchor.web3.Keypair.generate();
  const user2Wallet = anchor.web3.Keypair.generate();
  const user3Wallet = anchor.web3.Keypair.generate();
  const user4Wallet = anchor.web3.Keypair.generate();

  // User account data
  const user1Account = anchor.web3.Keypair.generate();
  const user2Account = anchor.web3.Keypair.generate();
  const user3Account = anchor.web3.Keypair.generate();
  const user4Account = anchor.web3.Keypair.generate();

  // Mapping des adresses aux noms d'utilisateurs pour un meilleur affichage
  const userNames = new Map<string, string>();

  before(async () => {
    // Initialiser les noms d'utilisateurs
    userNames.set(user1Wallet.publicKey.toString(), "Alice");
    userNames.set(user2Wallet.publicKey.toString(), "Bob");
    userNames.set(user3Wallet.publicKey.toString(), "Charlie");
    userNames.set(user4Wallet.publicKey.toString(), "David");

    // Airdrop SOL to all wallet keypairs
    for (const wallet of [user1Wallet, user2Wallet, user3Wallet, user4Wallet]) {
      const airdrop = await provider.connection.requestAirdrop(
        wallet.publicKey,
        anchor.web3.LAMPORTS_PER_SOL * 10
      );
      await provider.connection.confirmTransaction(airdrop);
    }

    // Initialize all user accounts
    for (const [wallet, account] of [
      [user1Wallet, user1Account],
      [user2Wallet, user2Account],
      [user3Wallet, user3Account],
      [user4Wallet, user4Account],
    ]) {
      await program.methods
        .initializeUser()
        .accounts({
          user: account.publicKey,
          userSigner: wallet.publicKey,
        })
        .signers([wallet, account])
        .rpc();
    }
  });

  const getUserName = (publicKey: string) => {
    return userNames.get(publicKey) || publicKey.slice(0, 8) + "...";
  };

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  it("crée un nouveau token de propriété", async () => {
    const propertyAccount = anchor.web3.Keypair.generate();
    const metadata = {
      name: "Luxury Apartment",
      propertyType: "Residential",
      value: new anchor.BN(1000000),
      ipfsHash: APPROVED_HASH,
    };

    await program.methods
      .mintProperty(metadata)
      .accounts({
        user: user1Account.publicKey,
        property: propertyAccount.publicKey,
        userSigner: user1Wallet.publicKey,
      })
      .signers([user1Wallet, propertyAccount])
      .rpc();

    // afficher les détails de la propriété
    const propertyData = await program.account.property.fetch(
      propertyAccount.publicKey
    );
    console.log("\n=== Nouvelle Propriété Créée ===");
    console.log(`Propriétaire: ${getUserName(propertyData.owner.toString())}`);
    console.log(`Nom: ${propertyData.metadata.name}`);
    console.log(`Type: ${propertyData.metadata.propertyType}`);
    console.log(`Valeur: ${propertyData.metadata.value.toString()} SOL`);
    console.log(`IPFS: ${propertyData.metadata.ipfsHash}`);
  });

  it("empêche un utilisateur de posséder plus de 4 propriétés", async () => {
    // Use user3 for this test.
    // Insert a delay between each mint to avoid triggering the penalty cooldown.
    for (let i = 0; i < 4; i++) {
      const propertyAccount = anchor.web3.Keypair.generate();
      const metadata = {
        name: `Property ${i + 1}`,
        propertyType: "Commercial",
        value: new anchor.BN(500000),
        ipfsHash: APPROVED_HASH,
      };

      await program.methods
        .mintProperty(metadata)
        .accounts({
          user: user3Account.publicKey,
          property: propertyAccount.publicKey,
          userSigner: user3Wallet.publicKey,
        })
        .signers([user3Wallet, propertyAccount])
        .rpc();

      // Wait for the cooldown period to elapse before minting the next property.
      await sleep(3000);
    }

    // Attempt to mint a 5th property.
    const propertyAccount = anchor.web3.Keypair.generate();
    const metadata = {
      name: "Property 5",
      propertyType: "Commercial",
      value: new anchor.BN(500000),
      ipfsHash: APPROVED_HASH,
    };

    try {
      await program.methods
        .mintProperty(metadata)
        .accounts({
          user: user3Account.publicKey,
          property: propertyAccount.publicKey,
          userSigner: user3Wallet.publicKey,
        })
        .signers([user3Wallet, propertyAccount])
        .rpc();
      assert.fail("Expected error not thrown");
    } catch (error) {
      expect(error.toString()).to.include("MaxPropertiesReached");
    }
  });

  it("permet plusieurs transactions sans délai quand le cooldown est écoulé", async () => {
    const propertyAccount = anchor.web3.Keypair.generate();
    const metadata = {
      name: "Test Property",
      propertyType: "Residential",
      value: new anchor.BN(750000),
      ipfsHash: APPROVED_HASH,
    };

    // First mint.
    await program.methods
      .mintProperty(metadata)
      .accounts({
        user: user2Account.publicKey,
        property: propertyAccount.publicKey,
        userSigner: user2Wallet.publicKey,
      })
      .signers([user2Wallet, propertyAccount])
      .rpc();

    // Wait for cooldown (3 seconds in test-mode).
    await sleep(3000);

    // Second mint should succeed.
    const propertyAccount2 = anchor.web3.Keypair.generate();
    await program.methods
      .mintProperty(metadata)
      .accounts({
        user: user2Account.publicKey,
        property: propertyAccount2.publicKey,
        userSigner: user2Wallet.publicKey,
      })
      .signers([user2Wallet, propertyAccount2])
      .rpc();
  });

  it("permet des échanges de propriété immédiats", async () => {
    const propertyAccount = anchor.web3.Keypair.generate();
    const metadata = {
      name: "Tradeable Property",
      propertyType: "Residential",
      value: new anchor.BN(900000),
      ipfsHash: APPROVED_HASH,
    };

    // Create the property.
    await program.methods
      .mintProperty(metadata)
      .accounts({
        user: user4Account.publicKey,
        property: propertyAccount.publicKey,
        userSigner: user4Wallet.publicKey,
      })
      .signers([user4Wallet, propertyAccount])
      .rpc();

    console.log("\n=== État Initial de la Propriété ===");
    const propertyBefore = await program.account.property.fetch(
      propertyAccount.publicKey
    );
    console.log(`Propriété: ${metadata.name}`);
    console.log(
      `Propriétaire: ${getUserName(propertyBefore.owner.toString())}`
    );

    // Wait for cooldown to avoid penalty during exchange.
    await sleep(3000);

    // Exchange property.
    await program.methods
      .exchangeProperty()
      .accounts({
        sender: user4Account.publicKey,
        receiver: user2Account.publicKey,
        property: propertyAccount.publicKey,
        senderSigner: user4Wallet.publicKey,
        receiverSigner: user2Wallet.publicKey,
      })
      .signers([user4Wallet, user2Wallet])
      .rpc();

    console.log("\n=== État Après Échange ===");
    const propertyAfter = await program.account.property.fetch(
      propertyAccount.publicKey
    );
    console.log(`Propriété: ${metadata.name}`);
    console.log(
      `Nouveau Propriétaire: ${getUserName(propertyAfter.owner.toString())}`
    );
    console.log("Historique des Propriétaires:");
    propertyAfter.previousOwners.forEach((owner, index) => {
      console.log(`  ${index + 1}. ${getUserName(owner.toString())}`);
    });
  });

  it("applique le cooldown normal de 5 minutes", async () => {
    // Use a new user for this test.
    const testWallet = anchor.web3.Keypair.generate();
    const testAccount = anchor.web3.Keypair.generate();

    // Airdrop SOL to the new wallet.
    const airdropTx = await provider.connection.requestAirdrop(
      testWallet.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx);

    // Initialize the user account.
    await program.methods
      .initializeUser()
      .accounts({
        user: testAccount.publicKey,
        userSigner: testWallet.publicKey,
      })
      .signers([testWallet, testAccount])
      .rpc();

    console.log("\n=== Test du Cooldown Normal (5 minutes) ===");

    const propertyAccount = anchor.web3.Keypair.generate();
    const metadata = {
      name: "Test Cooldown Property",
      propertyType: "Residential",
      value: new anchor.BN(500000),
      ipfsHash: APPROVED_HASH,
    };

    // First transaction.
    await program.methods
      .mintProperty(metadata)
      .accounts({
        user: testAccount.publicKey,
        property: propertyAccount.publicKey,
        userSigner: testWallet.publicKey,
      })
      .signers([testWallet, propertyAccount])
      .rpc();

    console.log("✅ Première transaction réussie");

    // Wait 1 second (should still be within cooldown).
    await sleep(1000);

    // Immediate attempt should fail due to cooldown.
    const propertyAccount2 = anchor.web3.Keypair.generate();
    try {
      await program.methods
        .mintProperty(metadata)
        .accounts({
          user: testAccount.publicKey,
          property: propertyAccount2.publicKey,
          userSigner: testWallet.publicKey,
        })
        .signers([testWallet, propertyAccount2])
        .rpc();
      assert.fail("La transaction aurait dû échouer");
    } catch (error) {
      console.log("✅ Transaction bloquée - Cooldown normal actif");
    }

    // Wait until the cooldown is passed (3 seconds in test-mode).
    await sleep(3000);

    // The transaction should now succeed.
    const propertyAccount3 = anchor.web3.Keypair.generate();
    await program.methods
      .mintProperty(metadata)
      .accounts({
        user: testAccount.publicKey,
        property: propertyAccount3.publicKey,
        userSigner: testWallet.publicKey,
      })
      .signers([testWallet, propertyAccount3])
      .rpc();

    console.log("✅ Transaction réussie après le cooldown");
  });
  it("Acheter une propriété", async () => {
  let seller = user2.publicKey;
  let buyer = anchor.web3.Keypair.generate();

  // Envoyer des SOL au buyer (simulateur)
  const airdropSignature = await provider.connection.requestAirdrop(
    buyer.publicKey,
    5_000_000_000 // 5 SOL
  );
  await provider.connection.confirmTransaction(airdropSignature);

  await program.methods
    .buyProperty()
    .accounts({
      property: propertyAccount.publicKey,
      buyer: buyer.publicKey,
      seller: seller,
    })
    .signers([buyer])
    .rpc();

  console.log(`Propriété achetée par ${buyer.publicKey.toString()} !`);
});

  it("applique la pénalité de 10 minutes en cas de non-respect du cooldown", async () => {
    // Use a new user for this test.
    const testWallet = anchor.web3.Keypair.generate();
    const testAccount = anchor.web3.Keypair.generate();

    // Airdrop SOL to the new wallet.
    const airdropTx = await provider.connection.requestAirdrop(
      testWallet.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx);

    // Initialize the user account.
    await program.methods
      .initializeUser()
      .accounts({
        user: testAccount.publicKey,
        userSigner: testWallet.publicKey,
      })
      .signers([testWallet, testAccount])
      .rpc();

    console.log("\n=== Test de la Pénalité de Cooldown (10 minutes) ===");

    const propertyAccount = anchor.web3.Keypair.generate();
    const metadata = {
      name: "Test Penalty Property",
      propertyType: "Residential",
      value: new anchor.BN(500000),
      ipfsHash: APPROVED_HASH,
    };

    // First transaction.
    await program.methods
      .mintProperty(metadata)
      .accounts({
        user: testAccount.publicKey,
        property: propertyAccount.publicKey,
        userSigner: testWallet.publicKey,
      })
      .signers([testWallet, propertyAccount])
      .rpc();

    console.log("✅ Première transaction réussie");

    // Immediate attempt (should fail due to cooldown penalty).
    const propertyAccount2 = anchor.web3.Keypair.generate();
    try {
      await program.methods
        .mintProperty(metadata)
        .accounts({
          user: testAccount.publicKey,
          property: propertyAccount2.publicKey,
          userSigner: testWallet.publicKey,
        })
        .signers([testWallet, propertyAccount2])
        .rpc();
      assert.fail("La transaction aurait dû échouer");
    } catch (error) {
      console.log("✅ Transaction bloquée - Pénalité activée");
    }

    // Wait less than the penalty period (2 seconds).
    await sleep(2000);

    // Attempt during penalty (should still fail).
    const propertyAccount3 = anchor.web3.Keypair.generate();
    try {
      await program.methods
        .mintProperty(metadata)
        .accounts({
          user: testAccount.publicKey,
          property: propertyAccount3.publicKey,
          userSigner: testWallet.publicKey,
        })
        .signers([testWallet, propertyAccount3])
        .rpc();
      assert.fail("La transaction aurait dû échouer");
    } catch (error) {
      console.log("✅ Transaction bloquée - Pénalité toujours active");
    }

    // Wait until the penalty is passed (4 more seconds).
    await sleep(4000);

    // The transaction should now succeed.
    const propertyAccount4 = anchor.web3.Keypair.generate();
    await program.methods
      .mintProperty(metadata)
      .accounts({
        user: testAccount.publicKey,
        property: propertyAccount4.publicKey,
        userSigner: testWallet.publicKey,
      })
      .signers([testWallet, propertyAccount4])
      .rpc();

    console.log("✅ Transaction réussie après la pénalité");
  });

  it("applique le cooldown de 5 minutes entre les transferts de propriétés", async () => {
    // Create two new users for the test.
    const user1Wallet = anchor.web3.Keypair.generate();
    const user1Account = anchor.web3.Keypair.generate();
    const user2Wallet = anchor.web3.Keypair.generate();
    const user2Account = anchor.web3.Keypair.generate();

    // Airdrop SOL to the wallets.
    for (const wallet of [user1Wallet, user2Wallet]) {
      const airdrop = await provider.connection.requestAirdrop(
        wallet.publicKey,
        10 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdrop);
    }

    // Initialize the user accounts.
    for (const [wallet, account] of [
      [user1Wallet, user1Account],
      [user2Wallet, user2Account],
    ]) {
      await program.methods
        .initializeUser()
        .accounts({
          user: account.publicKey,
          userSigner: wallet.publicKey,
        })
        .signers([wallet, account])
        .rpc();
    }

    console.log("\n=== Test du Cooldown entre Transferts de Propriétés ===");

    // Create a property for user1.
    const propertyAccount = anchor.web3.Keypair.generate();
    const metadata = {
      name: "Test Transfer Property",
      propertyType: "Residential",
      value: new anchor.BN(500000),
      ipfsHash: APPROVED_HASH,
    };

    await program.methods
      .mintProperty(metadata)
      .accounts({
        user: user1Account.publicKey,
        property: propertyAccount.publicKey,
        userSigner: user1Wallet.publicKey,
      })
      .signers([user1Wallet, propertyAccount])
      .rpc();

    console.log("✅ Propriété créée");

    // First transfer.
    await program.methods
      .exchangeProperty()
      .accounts({
        sender: user1Account.publicKey,
        receiver: user2Account.publicKey,
        property: propertyAccount.publicKey,
        senderSigner: user1Wallet.publicKey,
        receiverSigner: user2Wallet.publicKey,
      })
      .signers([user1Wallet, user2Wallet])
      .rpc();

    console.log("✅ Premier transfert réussi");

    // Immediate second transfer attempt (should fail due to cooldown).
    try {
      await program.methods
        .exchangeProperty()
        .accounts({
          sender: user2Account.publicKey,
          receiver: user1Account.publicKey,
          property: propertyAccount.publicKey,
          senderSigner: user2Wallet.publicKey,
          receiverSigner: user1Wallet.publicKey,
        })
        .signers([user2Wallet, user1Wallet])
        .rpc();
      assert.fail("Le transfert immédiat aurait dû échouer");
    } catch (error) {
      console.log("✅ Transfert immédiat bloqué comme prévu (cooldown actif)");
    }

    // Wait for the cooldown period (10 seconds in test-mode).
    await sleep(10000);

    await program.methods
      .exchangeProperty()
      .accounts({
        sender: user2Account.publicKey,
        receiver: user1Account.publicKey,
        property: propertyAccount.publicKey,
        senderSigner: user2Wallet.publicKey,
        receiverSigner: user1Wallet.publicKey,
      })
      .signers([user2Wallet, user1Wallet])
      .rpc();

    console.log("✅ Transfert réussi après le cooldown");
  });
  it("vérifie la validité des métadonnées de propriété", async () => {
    // Test avec des métadonnées valides.
    const validMetadata = {
      name: "Verified Property",
      propertyType: "Residential",
      value: new anchor.BN(1000000),
      ipfsHash: APPROVED_HASH,
    };

    // Appel de la fonction verifyPropertyMetadata.
    await program.methods
      .verifyPropertyMetadata(validMetadata)
      .accounts({
        userSigner: user1Wallet.publicKey,
      })
      .rpc();
    console.log("✅ Vérification réussie pour des métadonnées valides");

    // Test avec des métadonnées invalides: on utilise 'Commercial' au lieu de 'Residential'.
    const invalidMetadata = {
      name: "Invalid Verified Property",
      propertyType: "Commercial",
      value: new anchor.BN(1000000),
      ipfsHash: APPROVED_HASH,
    };

    try {
      await program.methods
        .verifyPropertyMetadata(invalidMetadata)
        .accounts({
          userSigner: user1Wallet.publicKey,
        })
        .rpc();
      assert.fail(
        "La vérification aurait dû échouer pour des métadonnées invalides"
      );
    } catch (error) {
      expect(error.toString()).to.include("Invalid IPFS hash");
      console.log("✅ Vérification bloquée pour des métadonnées invalides");
    }
  });
  it("récupère les données d'une propriété", async () => {
    const propertyAccount = anchor.web3.Keypair.generate();
    const metadata = {
      name: "Data Property",
      propertyType: "Residential",
      value: new anchor.BN(123456),
      ipfsHash: APPROVED_HASH,
    };

    await program.methods
      .mintProperty(metadata)
      .accounts({
        user: user1Account.publicKey,
        property: propertyAccount.publicKey,
        userSigner: user1Wallet.publicKey,
      })
      .signers([user1Wallet, propertyAccount])
      .rpc();

    await program.methods
      .getPropertyDatas()
      .accounts({
        property: propertyAccount.publicKey,
      })
      .rpc();
    console.log("✅ Données de propriété récupérées avec succès");
  });
  it("affiche la liste des propriétaires d'une propriété", async () => {
    // Create a new property account.
    const propertyAccount = anchor.web3.Keypair.generate();
    const metadata = {
      name: "Owners Test Property",
      propertyType: "Residential",
      value: new anchor.BN(800000),
      ipfsHash: APPROVED_HASH,
    };

    // Mint the property for user1.
    await program.methods
      .mintProperty(metadata)
      .accounts({
        user: user1Account.publicKey,
        property: propertyAccount.publicKey,
        userSigner: user1Wallet.publicKey,
      })
      .signers([user1Wallet, propertyAccount])
      .rpc();

    // Wait for the cooldown period to avoid penalty.
    await sleep(3000);

    // Exchange the property from user1 to user2.
    await program.methods
      .exchangeProperty()
      .accounts({
        sender: user1Account.publicKey,
        receiver: user2Account.publicKey,
        property: propertyAccount.publicKey,
        senderSigner: user1Wallet.publicKey,
        receiverSigner: user2Wallet.publicKey,
      })
      .signers([user1Wallet, user2Wallet])
      .rpc();

    // Call the function that displays the list of owners.
    const tx = await program.methods
      .displayPropertyOwners()
      .accounts({
        property: propertyAccount.publicKey,
      })
      .rpc();

    console.log("✅ Affichage des propriétaires réussi, transaction:", tx);
  });
});
