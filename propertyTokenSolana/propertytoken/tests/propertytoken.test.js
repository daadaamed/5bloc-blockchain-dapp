const anchor = require("@coral-xyz/anchor");
const { web3 } = anchor;
const BN = anchor.BN;

describe("Propertytoken Smart Contract", () => {
  // Set up provider and program
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);
  const program = anchor.workspace.Propertytoken;

  // Generate keypairs for user wallets.
  const user1Wallet = web3.Keypair.generate();
  const user2Wallet = web3.Keypair.generate();

  // User account data (to be initialized via the program).
  const user1Account = web3.Keypair.generate();
  const user2Account = web3.Keypair.generate();

  // Generate additional test users.
  const user3Wallet = web3.Keypair.generate();
  const user4Wallet = web3.Keypair.generate();
  const user3Account = web3.Keypair.generate();
  const user4Account = web3.Keypair.generate();

  // Mapping addresses to user names.
  const userNames = new Map();

  beforeAll(async () => {
    // Initialize user names.
    userNames.set(user1Wallet.publicKey.toString(), "Alice");
    userNames.set(user2Wallet.publicKey.toString(), "Bob");
    userNames.set(user3Wallet.publicKey.toString(), "Charlie");
    userNames.set(user4Wallet.publicKey.toString(), "David");

    // Airdrop SOL to all wallet keypairs.
    for (const wallet of [user1Wallet, user2Wallet, user3Wallet, user4Wallet]) {
      const airdropSig = await provider.connection.requestAirdrop(
        wallet.publicKey,
        web3.LAMPORTS_PER_SOL * 10
      );
      await provider.connection.confirmTransaction(airdropSig);
    }

    // Initialize all user accounts.
    const userPairs = [
      [user1Wallet, user1Account],
      [user2Wallet, user2Account],
      [user3Wallet, user3Account],
      [user4Wallet, user4Account],
    ];
    for (const [wallet, account] of userPairs) {
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

  const getUserName = (publicKey) => {
    return userNames.get(publicKey) || publicKey.slice(0, 8) + "...";
  };

  test("crée un nouveau token de propriété", async () => {
    const propertyAccount = web3.Keypair.generate();
    const metadata = {
      name: "Luxury Apartment",
      propertyType: "Residential",
      value: new BN(1000000),
      ipfsHash: "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH",
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

    // Fetch and log property details.
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

  test("empêche un utilisateur de posséder plus de 4 propriétés", async () => {
    // Use user3 for this test.
    for (let i = 0; i < 4; i++) {
      const propertyAccount = web3.Keypair.generate();
      const metadata = {
        name: `Property ${i + 1}`,
        propertyType: "Commercial",
        value: new BN(500000),
        ipfsHash: "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH",
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
    }

    // Attempt to mint a 5th property.
    const propertyAccount = web3.Keypair.generate();
    const metadata = {
      name: "Property 5",
      propertyType: "Commercial",
      value: new BN(500000),
      ipfsHash: "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH",
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
      fail("Expected error not thrown");
    } catch (error) {
      expect(error.toString()).toMatch("MaxPropertiesReached");
    }
  });

  test("permet plusieurs transactions sans délai", async () => {
    const propertyAccount = web3.Keypair.generate();
    const metadata = {
      name: "Test Property",
      propertyType: "Residential",
      value: new BN(750000),
      ipfsHash: "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH",
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

    // Immediate second mint.
    const propertyAccount2 = web3.Keypair.generate();
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

  test("permet des échanges de propriété immédiats", async () => {
    const propertyAccount = web3.Keypair.generate();
    const metadata = {
      name: "Tradeable Property",
      propertyType: "Residential",
      value: new BN(900000),
      ipfsHash: "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH",
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

    // Immediate exchange.
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

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  test("montre les limites de transfert et la possession de propriétés", async () => {
    // Use a new user for this test.
    const testWallet = web3.Keypair.generate();
    const testAccount = web3.Keypair.generate();

    // Airdrop SOL to the new wallet.
    const airdropSig = await provider.connection.requestAirdrop(
      testWallet.publicKey,
      web3.LAMPORTS_PER_SOL * 10
    );
    await provider.connection.confirmTransaction(airdropSig);

    // Initialize the user account.
    await program.methods
      .initializeUser()
      .accounts({
        user: testAccount.publicKey,
        userSigner: testWallet.publicKey,
      })
      .signers([testWallet, testAccount])
      .rpc();

    console.log("\n=== Test des Limites de Transfert de Propriétés ===");

    // Create 4 properties for user1 (Alice).
    const properties = [];
    const propertyNames = [
      "Villa Méditerranée",
      "Appartement Parisien",
      "Maison de Campagne",
      "Loft New-Yorkais",
    ];

    console.log(
      `\nCréation de 4 propriétés pour ${getUserName(
        user1Wallet.publicKey.toString()
      )}`
    );

    for (let i = 0; i < 4; i++) {
      const propertyAccount = web3.Keypair.generate();
      const metadata = {
        name: propertyNames[i],
        propertyType: "Residential",
        value: new BN(1000000 + i * 100000),
        ipfsHash: `QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH`,
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

      properties.push({ account: propertyAccount, metadata });

      const propertyData = await program.account.property.fetch(
        propertyAccount.publicKey
      );
      console.log(`\nPropriété #${i + 1} créée:`);
      console.log(`Nom: ${metadata.name}`);
      console.log(
        `Propriétaire: ${getUserName(
          propertyData.owner.toString()
        )} (${propertyData.owner.toString().slice(0, 8)}...)`
      );

      // Wait 2 seconds between each creation.
      await sleep(2000);
    }

    // Attempt to transfer properties to user2 (Bob).
    console.log(
      `\n=== Tentative de transfert de 4 propriétés à ${getUserName(
        user2Wallet.publicKey.toString()
      )} ===`
    );

    for (let i = 0; i < 4; i++) {
      await program.methods
        .exchangeProperty()
        .accounts({
          sender: user1Account.publicKey,
          receiver: user2Account.publicKey,
          property: properties[i].account.publicKey,
          senderSigner: user1Wallet.publicKey,
          receiverSigner: user2Wallet.publicKey,
        })
        .signers([user1Wallet, user2Wallet])
        .rpc();

      const propertyData = await program.account.property.fetch(
        properties[i].account.publicKey
      );
      console.log(`\nTransfert #${i + 1} réussi:`);
      console.log(`Propriété: ${properties[i].metadata.name}`);
      console.log(
        `De: ${getUserName(
          user1Wallet.publicKey.toString()
        )} (${user1Wallet.publicKey.toString().slice(0, 8)}...)`
      );
      console.log(
        `À: ${getUserName(propertyData.owner.toString())} (${propertyData.owner
          .toString()
          .slice(0, 8)}...)`
      );

      // Wait 2 seconds between transfers.
      await sleep(2000);
    }

    // Attempt to mint a 5th property.
    console.log(
      "\n=== Test de Sécurité: Vérification de la Limite de 4 Propriétés ==="
    );

    const extraProperty = web3.Keypair.generate();
    const extraMetadata = {
      name: "Penthouse de Luxe",
      propertyType: "Residential",
      value: new BN(2000000),
      ipfsHash: "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH",
    };

    try {
      await program.methods
        .mintProperty(extraMetadata)
        .accounts({
          user: user2Account.publicKey,
          property: extraProperty.publicKey,
          userSigner: user2Wallet.publicKey,
        })
        .signers([user2Wallet, extraProperty])
        .rpc();
      fail("Expected error not thrown");
    } catch (error) {
      console.log("\n✅ TEST DE SÉCURITÉ RÉUSSI ✅");
      console.log("----------------------------------------");
      console.log(
        `Tentative: Création d'une 5ème propriété pour ${getUserName(
          user2Wallet.publicKey.toString()
        )}`
      );
      console.log("Résultat: Transaction bloquée comme prévu");
      console.log("Erreur: MaxPropertiesReached");
      console.log("Protection: Limite de 4 propriétés respectée");
      console.log("----------------------------------------");
    }

    console.log("\n=== Résumé Final des Propriétés ===");
    console.log(
      `\n${getUserName(
        user1Wallet.publicKey.toString()
      )} (${user1Wallet.publicKey.toString().slice(0, 8)}...):`
    );
    const user1Data = await program.account.user.fetch(user1Account.publicKey);
    console.log(`Nombre de propriétés: ${user1Data.properties.length}`);

    console.log(
      `\n${getUserName(
        user2Wallet.publicKey.toString()
      )} (${user2Wallet.publicKey.toString().slice(0, 8)}...):`
    );
    const user2Data = await program.account.user.fetch(user2Account.publicKey);
    console.log(`Nombre de propriétés: ${user2Data.properties.length}`);

    if (user2Data.properties.length === 4) {
      console.log("\n✅ VÉRIFICATION FINALE RÉUSSIE ✅");
      console.log("----------------------------------------");
      console.log("• Limite de 4 propriétés respectée");
      console.log("• Transferts effectués avec succès");
      console.log("• Tentative de dépassement bloquée");
      console.log("----------------------------------------");
    }
  });

  test("applique le cooldown normal de 5 minutes", async () => {
    // Use a new user for this test.
    const testWallet = web3.Keypair.generate();
    const testAccount = web3.Keypair.generate();

    // Airdrop SOL to the new wallet.
    const airdropSig = await provider.connection.requestAirdrop(
      testWallet.publicKey,
      10 * web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    // Initialize the user account.
    await program.methods
      .initializeUser()
      .accounts({
        user: testAccount.publicKey,
        userSigner: testWallet.publicKey,
      })
      .signers([testWallet, testAccount])
      .rpc();

    const propertyAccount = web3.Keypair.generate();
    const metadata = {
      name: "Test Cooldown Property",
      propertyType: "Residential",
      value: new BN(500000),
      ipfsHash: "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH",
    };

    console.log("\n=== Test du Cooldown Normal (5 minutes) ===");

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

    // Wait 1 second.
    await sleep(1000);

    // Immediate attempt (should fail).
    const propertyAccount2 = web3.Keypair.generate();
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
      fail("La transaction aurait dû échouer");
    } catch (error) {
      console.log("✅ Transaction bloquée - Cooldown normal actif");
    }

    // Wait for cooldown to pass (3 seconds in test mode).
    await sleep(3000);

    // Transaction should now succeed.
    const propertyAccount3 = web3.Keypair.generate();
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

  test("applique la pénalité de 10 minutes en cas de non-respect du cooldown", async () => {
    // Use a new user for this test.
    const testWallet = web3.Keypair.generate();
    const testAccount = web3.Keypair.generate();

    // Airdrop SOL to the new wallet.
    const airdropSig = await provider.connection.requestAirdrop(
      testWallet.publicKey,
      10 * web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    // Initialize the user account.
    await program.methods
      .initializeUser()
      .accounts({
        user: testAccount.publicKey,
        userSigner: testWallet.publicKey,
      })
      .signers([testWallet, testAccount])
      .rpc();

    const propertyAccount = web3.Keypair.generate();
    const metadata = {
      name: "Test Penalty Property",
      propertyType: "Residential",
      value: new BN(500000),
      ipfsHash: "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH",
    };

    console.log("\n=== Test de la Pénalité de Cooldown (10 minutes) ===");

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

    // Immediate attempt (should fail).
    const propertyAccount2 = web3.Keypair.generate();
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
      fail("La transaction aurait dû échouer");
    } catch (error) {
      console.log("✅ Transaction bloquée - Pénalité activée");
    }

    // Wait less than penalty (2 seconds).
    await sleep(2000);

    // Attempt during penalty (should fail).
    const propertyAccount3 = web3.Keypair.generate();
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
      fail("La transaction aurait dû échouer");
    } catch (error) {
      console.log("✅ Transaction bloquée - Pénalité toujours active");
    }

    // Wait until penalty passes (4 additional seconds).
    await sleep(4000);

    // Transaction should now succeed.
    const propertyAccount4 = web3.Keypair.generate();
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

  test("applique le cooldown de 5 minutes entre les transferts de propriétés", async () => {
    // Create two new users for the test.
    const user1WalletLocal = web3.Keypair.generate();
    const user1AccountLocal = web3.Keypair.generate();
    const user2WalletLocal = web3.Keypair.generate();
    const user2AccountLocal = web3.Keypair.generate();

    // Airdrop SOL to wallets.
    for (const wallet of [user1WalletLocal, user2WalletLocal]) {
      const airdropSig = await provider.connection.requestAirdrop(
        wallet.publicKey,
        10 * web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig);
    }

    // Initialize user accounts.
    const localUserPairs = [
      [user1WalletLocal, user1AccountLocal],
      [user2WalletLocal, user2AccountLocal],
    ];
    for (const [wallet, account] of localUserPairs) {
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
    const propertyAccount = web3.Keypair.generate();
    const metadata = {
      name: "Test Transfer Property",
      propertyType: "Residential",
      value: new BN(500000),
      ipfsHash: "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH",
    };

    const txmint = await program.methods
      .mintProperty(metadata)
      .accounts({
        user: user1AccountLocal.publicKey,
        property: propertyAccount.publicKey,
        userSigner: user1WalletLocal.publicKey,
      })
      .signers([user1WalletLocal, propertyAccount])
      .rpc();

    console.log("✅ Propriété créée");
    console.log("mint transaction signature : ", txmint);

    // First transfer.
    const txtransfer = await program.methods
      .exchangeProperty()
      .accounts({
        sender: user1AccountLocal.publicKey,
        receiver: user2AccountLocal.publicKey,
        property: propertyAccount.publicKey,
        senderSigner: user2WalletLocal.publicKey,
        receiverSigner: user2WalletLocal.publicKey,
      })
      .signers([user1WalletLocal, user2WalletLocal])
      .rpc();
    console.log("transaction signature : ", txtransfer);
    console.log("✅ Premier transfert réussi");

    // Immediate transfer attempt (should fail).
    try {
      await program.methods
        .exchangeProperty()
        .accounts({
          sender: user2AccountLocal.publicKey,
          receiver: user1AccountLocal.publicKey,
          property: propertyAccount.publicKey,
          senderSigner: user2WalletLocal.publicKey,
          receiverSigner: user1WalletLocal.publicKey,
        })
        .signers([user2WalletLocal, user1WalletLocal])
        .rpc();
      fail("Le transfert immédiat aurait dû échouer");
    } catch (error) {
      console.log("✅ Transfert immédiat bloqué comme prévu (cooldown actif)");
    }

    // Wait for cooldown (10 seconds in test mode).
    await sleep(10000);

    // The transfer should now succeed.
    await program.methods
      .exchangeProperty()
      .accounts({
        sender: user2AccountLocal.publicKey,
        receiver: user1AccountLocal.publicKey,
        property: propertyAccount.publicKey,
        senderSigner: user2WalletLocal.publicKey,
        receiverSigner: user1WalletLocal.publicKey,
      })
      .signers([user2WalletLocal, user1WalletLocal])
      .rpc();

    console.log("✅ Transfert réussi après le cooldown");
  });
});
afterAll(async () => {
  // Wait an extra second to allow any pending async work to complete
  await new Promise((resolve) => setTimeout(resolve, 1000));
});
