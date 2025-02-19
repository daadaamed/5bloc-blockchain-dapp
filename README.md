# Projet Web3 - Développement d'une DApp Blockchain

**Scenario: Virtual Real Estate Marketplace**

---

## 1. Concept

This project aims to simulate a virtual real estate market place. We have a DApp, where every property is represented as a unique token with its own metadata (name, type, value, IPFS hash, etc..) The system enforces business rules that guide how users can mint, exchange, and even upgrade these property tokens.

## 2. Business rules

In this virtual market place, users can perform these actions:

### Mint a property

Action: A user logs into the DApp and chooses to mint a new property token.
Business Rule: Each user can mint a maximum of 4 properties. the system checks that she has not already reached this limit.
Example: Alice mints a token for a “Cozy House” of type “Residential” with a value of 1000 units. The property’s metadata is stored along with timestamps marking its creation and last transfer.

### Sell a property (transfer)

Action: A user can sell a property to another investor.
Business Rule: Only the current owner can transfer a property, and the receiver must not already own 4 properties. The DApp records the change by updating the owner field and property's previous owner.
Example: Alice transfers her “Cozy House” token to Bob. The DApp updates the property’s record, ensuring that Bob’s portfolio remains within the allowed limit.

### Upgrade Properties:

Action: “upgrade” a property to a higher category by performing a reward transaction.
Business Rule: The DApp defines precise conversion multipliers between property types:
Converting a property from Residential to Commercial increases its value by 20% (multiplier 1.2).
Converting from Commercial to Luxury increases its value by 50% (multiplier 1.5).
Converting directly from Residential to Luxury increases its value by 80% (multiplier 1.8).
Example: Bob, now owning the “Cozy House” (a Residential property), decides to upgrade it. He initiates a reward transaction to convert it to a “Commercial” property. The system validates that the conversion is allowed, applies the multiplier, and updates the property’s type and value accordingly.

### Enforcing Time-Based Restrictions:

- A user Cannot posses more than **4 propriétés**.
- Stop transfert if receiver is in cooldown.
- After each mint or transfer, a cooldown is applied

**Rapport Technique : Conception et Implémentation des Contrats Solidity et des Scripts de Test**

## Description

Ce projet vise à concevoir une application décentralisée (DApp) pour satisfaire les régles métiers d'une boutique virtuelle d'immobiliers exploitant les technologies blockchain ( etherium dans notre dapp) pour gérer des actifs numériques sous forme de tokens. Ce document détaille la conception, l'implémentation et les tests des contrats Solidity, ainsi que leurs scripts de déploiement et de test en JavaScript. (les régles métiers sont introduits ci-dessus)

## Fonctionnalités principales

- **Tokenisation des ressources** : représentation des actifs sous forme de tokens (ex: biens immobiliers, objets de collection, etc.).
- **Échanges de tokens** : transactions sécurisées avec validation des règles métiers.
- **Limites de possession** : restriction du nombre de ressources détenues par utilisateur.
- **Contraintes temporelles** : mise en place de cooldowns et de verrous après certaines actions.
- **Stockage IPFS** : enregistrement des métadonnées des ressources sur IPFS.

## Technologies utilisées

- **Blockchain** : Ethereum
- **Smart Contracts** : Solidity (Ethereum)
- **Framework de développement** : Hardhat
- **Stockage décentralisé** : IPFS
- **Tests unitaires** : jest

## Installation et Configuration

```sh
git clone https://github.com/daadaamed/5bloc-blockchain-dapp.git
cd 5bloc-blockchain-dapp
npm install
npx hardhat compile
npx hardhat test
npx hardhat node
# in another terminal
npx hardhat run scripts/deploy.js --network localhost
```

## Structure du Projet

- **contracts/ → Contient les contrats Solidity**
- **scripts/ → Contient les scripts d’interaction**
- **test/ → Contient les tests**

## Format des métadonnées des tokens

```json
{
  "id": "Unique token identifier (uint256)",
  "owner": "Owner's Ethereum address",
  "name": "Name of the property (e.g., Cozy House)",
  "propertyType": "Type of property (e.g., Residential, Commercial, Luxury)",
  "value": "Property value (uint256)",
  "ipfsHash": "IPFS hash of the property document/image",
  "createdAt": "Timestamp of property creation",
  "lastTransferAt": "Timestamp of the last property transfer",
  "previousOwners": ["List of previous owner addresses"]
}
```

## Livrables

- Présentation du cas d'usage (pdf)
- Code source de la DApp
- Tests unitaires
- Rapport technique détaillant les choix de conception ( README.md)

## Auteurs

- **Ibrar Hamouda : ibhmd**
- **Mohamed Daadaa**
- **Rodney Maglo**
