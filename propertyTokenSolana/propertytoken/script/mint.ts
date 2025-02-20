import * as anchor from "@project-serum/anchor";

const provider = anchor.AnchorProvider.local();
anchor.setProvider(provider);
const program = anchor.workspace.SolanaPropertyToken;

async function mintProperty() {
    const property = anchor.web3.Keypair.generate();

    await program.rpc.mintProperty("Luxury Villa", "Residential", new anchor.BN(1000), {
        accounts: {
            property: property.publicKey,
            owner: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [property],
    });

    console.log("Property minted with address:", property.publicKey.toString());
}

mintProperty().catch(console.error);
