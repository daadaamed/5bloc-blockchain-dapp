# Web3 Project - Development of a Blockchain DApp: Scenario & Technical Configuration

## Scenario: Virtual Real Estate Marketplace

### 1. Concept

This project simulates a virtual real estate marketplace on the Solana blockchain. Each property is represented as a unique token with its own metadata (name, type, value, IPFS hash, etc.). The smart contract, developed using Rust and Anchor, enforces business rules governing how users can mint, exchange, and verify property tokens.

### 2. Business Rules

#### Minting Properties

- **Action**: A user logs into the DApp and mints a new property token.
- **Rule**: Each user can own a maximum of **4 properties**. The system checks this limit before minting.
- **Example**: Alice mints a **Residential** property named "Cozy House" valued at 1000 units. The system stores its metadata, including timestamps for creation and last transfer.

#### Transferring Properties

- **Action**: A user transfers a property token to another user.
- **Rule**:
  - Only the **current owner** can transfer a property.
  - The receiver **must not exceed** the 4-property limit.
  - The DApp updates the owner field and maintains the property’s history.
- **Example**: Alice transfers "Cozy House" to Bob. The DApp records the new ownership, ensuring Bob still has **4 properties or fewer**.

#### Upgrading Properties

- **Action**: Users can upgrade a property’s category through a **reward transaction**.
- **Rule**: Property value increases based on predefined conversion multipliers:
  - **Residential → Commercial**: **+20%** (multiplier: **1.2**)
  - **Commercial → Luxury**: **+50%** (multiplier: **1.5**)
  - **Residential → Luxury**: **+80%** (multiplier: **1.8**)
- **Example**: Bob upgrades "Cozy House" (Residential) to **Commercial**. The system validates the conversion, applies the **1.2 multiplier**, and updates the property type and value accordingly.

#### Enforcing Time-Based Restrictions

- **Rules**:
  - Users **cannot** own more than 4 properties.
  - Transfers **are blocked** if the receiver is in a cooldown period.
  - A **cooldown applies** after each mint or transfer to prevent excessive transactions.
  - The **IPFS hash validates** property type as a certificate (not fully implemented).

## Technical Report: Smart Contract Design & Implementation

### 1. Description

This project develops a **decentralized application (DApp)** that enforces the business rules of a virtual real estate marketplace using blockchain technology. This document outlines the design, implementation, and testing of the smart contracts.

### 2. Technologies Used

- **Blockchain**: Solana
- **Smart Contracts**: Rust with **Anchor framework**
- **Decentralized Storage**: IPFS
- **Unit Testing**: Anchor testing framework
- **Action:** A user can transfer a property token to another user.
- **Business Rule:** Only the current owner can transfer a property, and the recipient must not exceed the 4-property limit. The DApp records the change by updating the owner field and appending the previous owner to the property’s history.
- **Example:** User1 transfers her “Cozy House” token to User2. The DApp updates the property’s record, ensuring that User2's portfolio remains within the allowed limit.

### 3. Smart Contract Functions

- **initialize_user**: Creates and initializes a new user account.
- **mint_property**: Mints a property token, ensuring the user does not exceed the 4-property limit and verifying the IPFS hash.
- **exchange_property**: Manages property transfers, updating ownership records.
- **verify_property_metadata**: Validates the metadata, ensuring consistency with IPFS data.

## Installation & Configuration

````sh
cd propertytoken
npm install
### Enforcing Time-Based Restrictions:

- A user Cannot posses more than 4 properties.
- Stop transfert if receiver is in cooldown.
- After each mint or transfer, a cooldown is applied
- The ipfs hash determine the type of the property as a valid certificate(not fully implemented).

# Rapport Technique : Conception et Implémentation des Contrats Solidity et des Scripts de Test

## Description

This project aims to design a decentralized application (DApp) that satisfies the business rules of a virtual real estate marketplace using blockchain technolog (as described above). This document details the design, implementation, and testing of the smart contracts developed with screenshots at the end.

## Technologies Used

Blockchain: Solana
Development and Smart Contracts: Rust with the Anchor framework
Decentralized Storage: IPFS
Unit Testing: Anchor testing framework

## Main Features

The smart contract has been structured into several key functions:

-initialize_user: Creates and initializes a new user account to manage property tokens.
-mint_property: Allows users to mint a new property token after verifying that they have not exceeded the maximum property limit. It also verifies that the provided IPFS hash matches the expected property type.
-exchange_property: Manages the secure transfer of property tokens between users, updating both the property’s ownership history and the users’ property lists.
-verify_property_metadata: Provides additional validation of property metadata, ensuring that the information (especially the IPFS hash) is consistent with the specified property type.

## Test cases : name of test in anchor

Creates a new ownership token : crée un nouveau token de propriété.
Prevents a user from owning more than 4 properties : empêche un utilisateur de posséder plus de 4 propriétés.
Allows multiple transactions without delay : permet plusieurs transactions sans délai.
Enables instant property exchanges : permet des échanges de propriété immédiats.
Displays transfer limits and property ownership : montre les limites de transfert et la possession de propriétés.
Enforces the standard 5-minute cooldown : applique le cooldown normal de 5 minutes.
Applies a 10-minute penalty for violating the cooldown : applique la pénalité de 10 minutes en cas de non-respect du cooldown.
Enforces a 5-minute cooldown between property transfers : applique le cooldown de 5 minutes entre les transferts de propriétés.

## Installation and Configuration

        ```sh
        cd propertytoken
        npm i
        ```

````

<!-- git clone https://github.com/daadaamed/5bloc-blockchain-dapp  -->
<!-- cd propertytokenSolana/propertytoken -->

````

Build:
```sh
anchor build
````

Deploy:

```sh
solana-test-validator
anchor deploy
```

Run Tests:

```sh
anchor test
```

## Folder Structure

- **programs/devoir/src/lib.rs**: Smart contract
- **tests/devoir.ts**: Test cases
- **Anchor.toml**: Anchor configuration

## Managing IPFS Locally

```sh
ipfs add residential.json
ipfs add commercial.json
ipfs add luxurious.json
```

To verify property type:

```sh
http://127.0.0.1:8080/ipfs/<ipfs-hash>
```

## Authors

- **Ibrar Hamouda : ibhmd**
- **Mohamed Daadaa**
- **Rodney Maglo**

## Screenshots

(Screenshots from tests and deployment)

## Screenshots from tests and deploying

<img width="834" alt="Image" src="https://github.com/user-attachments/assets/4240e788-d310-47e8-a434-5fcc3981b146" />
<img width="1040" alt="Image" src="https://github.com/user-attachments/assets/8e07b2e8-7858-4983-9dbf-6e0c68d50f1b" />
