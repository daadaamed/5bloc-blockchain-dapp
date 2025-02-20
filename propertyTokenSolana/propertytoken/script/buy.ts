import * as anchor from "@project-serum/anchor";

const provider = anchor.AnchorProvider.local();
anchor.setProvider(provider);
const program = anchor.workspace.Propertytoken;

async function buyProperty(propertyPublicKey: string, sellerPublicKey: string) {
    const property = new anchor.web3.PublicKey(propertyPublicKey);
    const seller = new anchor.web3.PublicKey(sellerPublicKey);

    await program.rpc.buyProperty({
        accounts: {
            property,
            buyer: provider.wallet.publicKey,
            seller,
        },
    });

    console.log(`Propriété ${propertyPublicKey} achetée par ${provider.wallet.publicKey.toString()}`);
}

//  Remplace par l'ID de la propriété et du vendeur
buyProperty("YOUR_PROPERTY_PUBLIC_KEY_HERE", "SELLER_PUBLIC_KEY_HERE").catch(console.error);
