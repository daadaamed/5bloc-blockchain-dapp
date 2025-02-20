# Projet Web3 - Développement d'une DApp Blockchain: Scenario & Confifuration technique

**Scenario: Virtual Real Estate Marketplace**

---

## 1. Concept

This project simulates a virtual real estate marketplace on the Solana blockchain. In our DApp, each property is represented as a unique chain token with its own metadata (name, property type, value, IPFS hash, etc.). The smart contract, developed using Rust and Anchor, defining the business rules that manage how users can mint, exchange, and verify property tokens.

## 2. Business rules

In this virtual market place, users can perform these actions:

### Mint a property

- **Action:** A user logs into the DApp and chooses to mint a new property token.
- **Business Rule:** Each user can mint a maximum of 4 properties. The system checks that the user has not already reached this limit.
- **Example:** User1 mints a token for a "Example House” of type “Residential” with a value of 1000 units. The property’s metadata (including an IPFS hash, creation timestamp, and last transfer timestamp) is stored.

### Sell a property (transfer)

- **Action:** A user can transfer a property token to another user.
- **Business Rule:** Only the current owner can transfer a property, and the recipient must not exceed the 4-property limit. The DApp records the change by updating the owner field and appending the previous owner to the property’s history.
- **Example:** User1 transfers her “Cozy House” token to User2. The DApp updates the property’s record, ensuring that Bob’s portfolio remains within the allowed limit.

### Verify Property Metadata:

- **Action:** A system component that checks the verification of a property's metadata.
- **Business Rule:** The smart contract verifies that the IPFS hash provided in the metadata corresponds to the expected property type (residential, commercial, or luxurious) based on predefined hashes.
- **Example:** When User1 submits metadata for verification, the system checks the IPFS hash against known values and logs a verification message, ensuring data integrity.

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

## Installation and Configuration

        ```sh
        cd propertytoken
        npm i
        ```

```
<!-- git clone https://github.com/daadaamed/5bloc-blockchain-dapp  -->
<!-- cd propertytokenSolana/propertytoken -->
```

    ```sh
    anchor build
    ```

    Deploy:

    ```sh
    solana-test-validator
    anchor deploy
    ```

    ```sh
    solana-test-validator
    anchor deploy
    ```

    Run Tests:

    ```sh
    anchor test
    ```

## Folder structure

- `programs/devoir/src/lib.rs`: Smart contract
- `tests/devoir.ts`: Tests cases
- `Anchor.toml`: Anchor Configuration

## Steps to manage ipfs locally:

````sh
ipfs add residential.json
```

```sh
ipfs add commercial.json
```

```sh
add luxirious.json
```

Go to this url to verify the type of the real estate ( you should have ipfs daemon working locally(init)):
```sh
http://127.0.0.1:8080/ipfs/<ipfs-hash>
```
## Authors

- **Ibrar Hamouda : ibhmd**
- **Mohamed Daadaa**
- **Rodney Maglo**
````

## Screenshots from tests and deploying
