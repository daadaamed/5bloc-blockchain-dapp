**Rapport Technique : Conception et Implémentation des Contrats Solidity et des Scripts de Test**

---

## 1. Introduction
Ce document détaille la conception, l'implémentation et les tests des contrats Solidity **Lock** et **PropertyToken**, ainsi que leurs scripts de déploiement et de test en JavaScript. L'objectif est d'assurer une gestion sûre et efficace des propriétés immobilisées sur la blockchain Ethereum.

---

## 2. Contrat Lock
Le contrat **Lock** est conçu pour détenir des fonds jusqu'à une date future définie lors de son déploiement.

### 2.1. Fonctionnalités principales
- **Stockage du montant verrouillé**
- **Définition d'une date de déverrouillage**
- **Retrait des fonds uniquement par le propriétaire à la date fixée**
- **Emet un événement lors du retrait**

### 2.2. Exigences et vérifications
- Le _timestamp_ doit être dans le futur lors de la création.
- Seul le propriétaire peut retirer les fonds.
- Le retrait est bloqué tant que la date de déverrouillage n'est pas atteinte.

---

## 3. Contrat PropertyToken
Le contrat **PropertyToken** gère la tokenisation et les transferts de propriétés immobilières sur Ethereum.

### 3.1. Fonctionnalités principales
- **Minting** d'un bien immobilier avec des métadonnées
- **Limite de 4 propriétés par utilisateur**
- **Verrouillage après minting (10 minutes)**
- **Transferts conditionnels (cooldown de 5 minutes)**
- **Historique des propriétaires**

### 3.2. Exigences et restrictions
- Un utilisateur ne peut pas dépasser **4 propriétés**.
- Un transfert est impossible si le destinataire est en cooldown.
- Après chaque action (mint ou transfert), un cooldown est appliqué.

---

## 4. Scripts de déploiement
### 4.1. Lock.js (Ignition)
- Initialise **Lock** avec un temps de déverrouillage et un montant.

### 4.2. PropertyToken.js (Ignition)
- Déploie simplement le contrat **PropertyToken**.

### 4.3. Deploy.js
- Déploie **PropertyToken** et attend la confirmation de transaction.

---

## 5. Scripts de test
### 5.1. Lock.js (Test)
- Teste la bonne initialisation du contrat.
- Vérifie les échecs et succès des retraits.
- Vérifie les événements et la modification de solde.

### 5.2. PropertyToken.js (Test)
- Teste le minting et les limites de propriétés.
- Teste les restrictions de cooldown.
- Teste les transferts et la mise à jour des propriétaires.

---

## 6. Conclusion
Les contrats Solidity et les scripts associés sont conçus pour garantir la sécurité et le respect des règles de gestion des propriétés et des fonds verrouillés. Les tests permettent de valider le bon fonctionnement et la résilience du système face aux usages prévus.

