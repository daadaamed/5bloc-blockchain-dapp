require("dotenv").config();
const { create } = require("ipfs-http-client");
const fs = require("fs");

// Chargement des identifiants Infura depuis les variables d’environnement
const projectId = process.env.INFURA_PROJECT_ID;
const projectSecret = process.env.INFURA_PROJECT_SECRET;
const auth = "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64");

// Connexion à IPFS via Infura
const ipfs = create({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
    headers: {
        authorization: auth,
    },
});

/**
 * Upload d'un fichier sur IPFS
 * @param {string} filePath - Chemin du fichier à uploader
 * @returns {Promise<string>} - URL IPFS du fichier
 */
async function uploadToIPFS(filePath) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const addedFile = await ipfs.add(fileBuffer);
        return `https://ipfs.io/ipfs/${addedFile.path}`;
    } catch (error) {
        console.error("Erreur lors de l'upload sur IPFS :", error);
        return null;
    }
}

/**
 * Upload des métadonnées d'un bien immobilier sur IPFS
 * @param {Object} propertyData - Données du bien immobilier
 * @returns {Promise<string>} - URL IPFS des métadonnées
 */
async function uploadPropertyMetadata(propertyData) {
    try {
        const { name, propertyType, value, imagePath, owner } = propertyData;

        // Upload de l'image sur IPFS
        const imageUrl = await uploadToIPFS(imagePath);
        if (!imageUrl) throw new Error("Échec de l'upload de l'image.");

        // Création de l'objet JSON des métadonnées
        const metadata = {
            id: Date.now(), // Génération d'un identifiant unique
            owner: owner,
            name: name,
            propertyType: propertyType,
            value: value,
            ipfsHash: imageUrl,
            createdAt: new Date().toISOString(),
            lastTransferAt: null,
            previousOwners: [],
        };

        // Upload des métadonnées sur IPFS
        const metadataAdded = await ipfs.add(JSON.stringify(metadata));
        const metadataUrl = `https://ipfs.io/ipfs/${metadataAdded.path}`;

        console.log("Métadonnées du bien immobilier uploadées :", metadataUrl);
        return metadataUrl;
    } catch (error) {
        console.error("Erreur lors de l'upload des métadonnées :", error);
        return null;
    }
}

// Exemple d'utilisation
const property = {
    name: "Villa de luxe",
    propertyType: "Residential",
    value: 500000, // En unités arbitraires (ex: Wei ou ETH)
    imagePath: "./assets/luxury_villa.png", // Image du bien
    owner: "0x1234567890abcdef1234567890abcdef12345678", // Adresse Ethereum du propriétaire
};

uploadPropertyMetadata(property);
