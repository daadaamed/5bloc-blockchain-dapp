# Projet Web3 - Développement d'une DApp Blockchain

## Description
Ce projet vise à concevoir une application décentralisée (DApp) exploitant les technologies blockchain pour gérer des actifs numériques sous forme de tokens. L'objectif est d'intégrer des contraintes métiers précises afin d'illustrer les avantages du Web3.

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
- **Tests unitaires** : Hardhat

## Installation et Configuration
```sh
git clone https://github.com/daadaamed/5bloc-blockchain-dapp.git
cd project-web3
npm install
npx hardhat compile
npx hardhat test
```

## Structure du Projet
 - **contracts/ → Contient les contrats Solidity**
 - **scripts/ → Contient les scripts d’interaction**
 - **test/ → Contient les tests**

## Format des métadonnées des tokens
```json
{
    "name": "Nom de la ressource",
    "type": "Type de ressource",
    "value": "Valeur associée",
    "hash": "Hash IPFS du document",
    "previousOwners": ["Adresses des anciens propriétaires"],
    "createdAt": "Timestamp de création",
    "lastTransferAt": "Timestamp du dernier transfert"
}
```

## Livrables
- Présentation du cas d'usage
- Code source de la DApp
- Tests unitaires
- Rapport technique détaillant les choix de conception

## Critères d'évaluation
- Originalité et pertinence du cas d’usage
- Qualité du code et respect des contraintes techniques
- Qualité et couverture des tests unitaires
- Clarté de la documentation

## Auteurs
- **Ibrar Hamouda : ibhmd**
- **Mohamed Daadaa**
- **Rodney Maglo**
