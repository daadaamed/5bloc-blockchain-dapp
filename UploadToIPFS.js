require("dotenv").config();
const { create } = require("ipfs-http-client");
const fs = require("fs");

const projectId = process.env.INFURA_PROJECT_ID;
const projectSecret = process.env.INFURA_PROJECT_SECRET;
const auth = "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64");

// Configuration de l’API IPFS
const ipfs = create({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
    headers: {
        authorization: auth,
    },
});

async function uploadMetadata(name, description, imagePath) {
    const imageBuffer = fs.readFileSync(imagePath);
    const imageAdded = await ipfs.add(imageBuffer);
    const imageUrl = `https://ipfs.io/ipfs/${imageAdded.path}`;

    const metadata = {
        name: name,
        description: description,
        image: imageUrl,
    };

    const metadataAdded = await ipfs.add(JSON.stringify(metadata));
    const metadataUrl = `https://ipfs.io/ipfs/${metadataAdded.path}`;

    console.log("✅ Métadonnées uploadées sur IPFS : ", metadataUrl);
    return metadataUrl;
}

// Exemple d'utilisation
uploadMetadata("Épée légendaire", "Une arme magique puissante", "./assets/legendary_sword.png");
