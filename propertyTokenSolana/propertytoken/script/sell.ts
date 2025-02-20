import * as anchor from "@project-serum/anchor";

const provider = anchor.AnchorProvider.local();
anchor.setProvider(provider);
const program = anchor.workspace.Propertytoken;

async function listForSale(propertyPublicKey: string, price: number) {
    const property = new anchor.web3.PublicKey(propertyPublicKey);

    await program.rpc.listPropertyForSale(new anchor.BN(price), {
        accounts: {
            property,
            owner: provider.wallet.publicKey,
        },
    });

    console.log(`Propriété ${propertyPublicKey} mise en vente à ${price} SOL`);
}

// ⚠Remplace par l'ID de ta propriété et le prix en SOL
listForSale("YOUR_PROPERTY_PUBLIC_KEY_HERE", 2).catch(console.error);
