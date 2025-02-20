# Web3 Project - Development of a Blockchain DApp: Scenario & Technical Configuration

## Scenario: Virtual Real Estate Marketplace

### 1. Concept

This project simulates a virtual real estate marketplace on the Solana blockchain. Each property is represented as a unique token with its own metadata (name, type, value, IPFS hash, etc.). The smart contract, developed using Rust and Anchor, enforces business rules governing how users can mint, exchange, and verify property tokens. The ipfs stock is included to validate the type of a property.

### 2. Business Rules

#### Minting Properties

- **Action**: A user logs into the DApp and mints a new property token.
- **Rule**: Each user can own a maximum of **4 properties**. The system checks this limit before minting. The smart contract verifies that the provided IPFS hash matches the expected value for the declared property type. If the IPFS hash is not valid (i.e. does not match the predefined constant for that property type), the transaction is rejected.

#### Transferring Properties

- **Action**: A user transfers a property token to another user.
- **Rule**:
  - Only the **current owner** can transfer a property.
  - The receiver **must not exceed** the 4-property limit.
  - The DApp updates the owner field and maintains the property’s history.
  - A cooldown period is enforced after each transfer to prevent excessive transactions.

#### Verifying And Reading Property Data

- **Action**: The DApp offers a function to verify property metadata and to read property token’s data.
- **Rule**:
  - The provided IPFS hash must exactly match one of the predefined constants for the property type(residential, commercial, or luxurious).
  - This should serve as a decentralized certificate of authenticity for the property’s type(not fully implemented).

#### Reading Property Data

- **Action**: Retrieve a property token’s data.
- **Rule**:
  - A simple read function returns the property’s owner, name, type, value, and IPFS hash.
    **Example**: A user can view the details of a property token they own or that is publicly available.

#### Enforcing Time-Based Restrictions & rules

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

### 3. Smart Contract Functions

- **initialize_user**: Creates and initializes a new user account.
- **mint_property**: Mints a property token, ensuring the user does not exceed the 4-property limit and verifying the IPFS hash.
- **exchange_property**: Manages property transfers, updating ownership records.
- **verify_property_metadata**: Validates the metadata, ensuring consistency with IPFS data.
- **get_property_datas**: A simple read-only function that retrieves and logs the details of a property (owner, name, type, value, and IPFS hash).

### 4. Testing

The test suite (written in TypeScript using Anchor's testing framework) includes the following tests:
The following tests are included:

crée un nouveau token de propriété:
Mints a new property token and displays its details.

empêche un utilisateur de posséder plus de 4 propriétés:
Verifies that a user cannot mint more than 4 properties.

permet plusieurs transactions sans délai quand le cooldown est écoulé:
Ensures that after the cooldown period, multiple transactions can occur.

permet des échanges de propriété immédiats:
Tests property exchange functionality and validates ownership history.

applique le cooldown normal de 5 minutes:
Checks that a mint operation fails if attempted too soon after a previous transaction.

applique la pénalité de 10 minutes en cas de non-respect du cooldown:
Verifies that transactions during a penalty period are rejected.

applique le cooldown de 5 minutes entre les transferts de propriétés:
Validates that property transfers are subject to a cooldown.

vérifie la validité des métadonnées de propriété:
Tests the metadata verification function with both valid and invalid metadata.

récupère les données d'une propriété:
Calls the get_property_datas function to read and log property details.

## Installation and Configuration

        ```sh
        cd propertytoken
        npm i
        ```

```

<!-- git clone https://github.com/daadaamed/5bloc-blockchain-dapp  -->
<!-- cd propertytokenSolana/propertytoken -->

```

Build and test:

```sh
anchor build
npm i
anchor test
```

Deploy:

```sh
solana-test-validator
anchor deploy
```

## Folder Structure

- **programs/propoertytoken/src/lib.rs**: Smart contract
- **tests/propoertytoken.ts**: Test cases
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

<img width="1086" alt="Image" src="https://github.com/user-attachments/assets/9238e119-87fc-4035-9044-13f3c9ff527f" />

<img width="1086" alt="Image" src="https://github.com/user-attachments/assets/575fd883-4780-44cc-98bd-210b33f92e3a" />

<img width="1422" alt="Image" src="https://github.com/user-attachments/assets/3317e0c0-28fd-4eca-adc7-bcfd3af43691" />
