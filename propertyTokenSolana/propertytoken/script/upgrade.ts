import * as anchor from "@project-serum/anchor";

const provider = anchor.AnchorProvider.local();
anchor.setProvider(provider);
const program = anchor.workspace.SolanaPropertyToken;

async function upgradeProperty(propertyPublicKey: string) {
    const property = new anchor.web3.PublicKey(propertyPublicKey);

    await program.rpc.upgradeProperty("Commercial", new anchor.BN(200), {
        accounts: {
            property,
            owner: provider.wallet.publicKey,
        },
    });

    console.log("Property upgraded:", property.toString());
}

upgradeProperty("YOUR_PROPERTY_PUBLIC_KEY_HERE").catch(console.error);
