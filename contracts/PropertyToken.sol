// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PropertyToken {
    // Struct to store property metadata
    struct Property {
        uint256 id;
        address owner;
        string name;
        string propertyType;
        uint256 value;
        string ipfsHash;
        uint256 createdAt;
        uint256 lastTransferAt;
        address[] previousOwners;
    }

    // Auto-incrementing property ID
    uint256 public nextPropertyId;

    // Maximum properties allowed per user
    uint256 constant MAX_PROPERTIES_PER_USER = 4;

    // Time constraints (in seconds)
    uint256 constant COOLDOWN_PERIOD = 300; // 5 minutes for transfers
    uint256 constant LOCK_PERIOD = 600;     // 10 minutes for minting

    // Testing environement time constraints 
    uint256 constant TEST_COOLDOWN_PERIOD = 5; // 5 seconds for transfers
    uint256 constant TEST_LOCK_PERIOD = 10;     // 10 seconds for minting

    // Mapping from property ID to Property details
    mapping(uint256 => Property) public properties;

    // Mapping from owner address to list of property IDs owned
    mapping(address => uint256[]) public ownerProperties;

    // Mapping to record the next allowed transaction timestamp per user
    mapping(address => uint256) public nextAllowedTxTime;

    // Mapping to record the last transaction timestamp per user (similar to Solana's last_transaction)
    mapping(address => uint256) public lastTransaction;

    // Events
    event PropertyMinted(
        uint256 indexed propertyId,
        address indexed owner,
        string name,
        string propertyType,
        uint256 value,
        string ipfsHash,
        uint256 timestamp
    );
    
    event PropertyExchanged(
        uint256 indexed propertyId,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 timestamp
    );
    
    event RewardTransactionExecuted(
        uint256 indexed propertyId,
        string oldType,
        string newType,
        uint256 oldValue,
        uint256 newValue,
        uint256 timestamp
    );

    /**
     * @dev Mint a new property token with metadata.
     * Requirements:
     * - The sender must own fewer than MAX_PROPERTIES_PER_USER properties.
     * - The sender must not be in a cooldown/lock period.
     * After minting, a LOCK_PERIOD (10 minutes) is applied.
     */
    function mintProperty(
        string memory _name,
        string memory _propertyType,
        uint256 _value,
        string memory _ipfsHash
    ) public {
        // Enforce cooldown/lock for the sender.
        require(
            block.timestamp >= nextAllowedTxTime[msg.sender],
            "Cooldown active: Please wait before initiating a new transaction."
        );

        // Ensure the sender does not exceed the property limit
        require(
            ownerProperties[msg.sender].length < MAX_PROPERTIES_PER_USER,
            "MaxPropertiesReached: You already own the maximum number of properties."
        );

        // Create the property token
        uint256 propertyId = nextPropertyId;
        nextPropertyId++;

        uint256 currentTime = block.timestamp;

        Property storage newProperty = properties[propertyId];
        newProperty.id = propertyId;
        newProperty.owner = msg.sender;
        newProperty.name = _name;
        newProperty.propertyType = _propertyType;
        newProperty.value = _value;
        newProperty.ipfsHash = _ipfsHash;
        newProperty.createdAt = currentTime;
        newProperty.lastTransferAt = currentTime;
        // previousOwners remains empty at creation

        // Record ownership
        ownerProperties[msg.sender].push(propertyId);

        // Update the user's last transaction time
        lastTransaction[msg.sender] = currentTime;

        // Set lock: after minting, user is locked for 10 minutes.
        nextAllowedTxTime[msg.sender] = currentTime + LOCK_PERIOD;

        // Emit event for the minted property
        emit PropertyMinted(propertyId, msg.sender, _name, _propertyType, _value, _ipfsHash, currentTime);
    }

    // A helper function to retrieve a user's property IDs
    function getPropertiesByOwner(address _owner) public view returns (uint256[] memory) {
        return ownerProperties[_owner];
    }
    
    /**
     * @dev Exchange (transfer) a property from the sender to a new owner.
     * Requirements:
     * - The sender must be the current owner of the property.
     * - The receiver must own fewer than MAX_PROPERTIES_PER_USER properties.
     * - Both sender and receiver must not be in a cooldown period.
     * After the transfer, both parties are subject to a COOLDOWN_PERIOD (5 minutes).
     */
    function exchangeProperty(uint256 _propertyId, address _receiver) public {
        // Check that sender is allowed to initiate a transaction.
        require(
            block.timestamp >= nextAllowedTxTime[msg.sender],
            "Sender cooldown active: Please wait before initiating a new transaction."
        );
        // Check that receiver is also not in cooldown.
        require(
            block.timestamp >= nextAllowedTxTime[_receiver],
            "Receiver cooldown active: The receiver must wait before receiving a new property."
        );

        // Check that receiver is valid and not the sender.
        require(_receiver != address(0), "Invalid receiver address.");
        require(_receiver != msg.sender, "Cannot transfer property to yourself.");
        
        Property storage property = properties[_propertyId];
        require(property.owner == msg.sender, "NotOwner: Only the property owner can transfer it.");
        require(
            ownerProperties[_receiver].length < MAX_PROPERTIES_PER_USER,
            "MaxPropertiesReached: Receiver already owns the maximum number of properties."
        );

        // Update property history and transfer details
        property.previousOwners.push(msg.sender);
        property.owner = _receiver;
        property.lastTransferAt = block.timestamp;

        // Remove property from sender's list
        uint256[] storage senderProps = ownerProperties[msg.sender];
        for (uint256 i = 0; i < senderProps.length; i++) {
            if (senderProps[i] == _propertyId) {
                senderProps[i] = senderProps[senderProps.length - 1];
                senderProps.pop();
                break;
            }
        }

        // Add property to receiver's list
        ownerProperties[_receiver].push(_propertyId);

        // Update cooldowns for both sender and receiver
        nextAllowedTxTime[msg.sender] = block.timestamp + COOLDOWN_PERIOD;
        nextAllowedTxTime[_receiver] = block.timestamp + COOLDOWN_PERIOD;

        // Update last transaction timestamps for both parties
        lastTransaction[msg.sender] = block.timestamp;
        lastTransaction[_receiver] = block.timestamp;

        // Emit event for the property exchange
        emit PropertyExchanged(_propertyId, msg.sender, _receiver, block.timestamp);
    }
    
    /**
     * @dev Reward transaction to convert property types with specific multipliers.
     * Conversion rules:
     *  - Residential -> Commercial: multiplier 1.2
     *  - Commercial -> Luxury: multiplier 1.5
     *  - Residential -> Luxury: multiplier 1.8
     * Any other conversion is not allowed.
     */
    function rewardTransaction(uint256 _propertyId, string memory _newType) public {
        Property storage property = properties[_propertyId];
        require(block.timestamp >= nextAllowedTxTime[msg.sender], "Cooldown active");
        require(property.owner == msg.sender, "NotOwner: Only the property owner can perform reward transactions.");
        
        string memory currentType = property.propertyType;
        uint256 newValue;
        bool validConversion = false;
        
        // Convert using keccak256 for string comparison
        if (
            keccak256(bytes(currentType)) == keccak256(bytes("Residential")) &&
            keccak256(bytes(_newType)) == keccak256(bytes("Commercial"))
        ) {
            newValue = (property.value * 120) / 100;
            validConversion = true;
        } else if (
            keccak256(bytes(currentType)) == keccak256(bytes("Commercial")) &&
            keccak256(bytes(_newType)) == keccak256(bytes("Luxury"))
        ) {
            newValue = (property.value * 150) / 100;
            validConversion = true;
        } else if (
            keccak256(bytes(currentType)) == keccak256(bytes("Residential")) &&
            keccak256(bytes(_newType)) == keccak256(bytes("Luxury"))
        ) {
            newValue = (property.value * 180) / 100;
            validConversion = true;
        }

        nextAllowedTxTime[msg.sender] = block.timestamp + COOLDOWN_PERIOD;
        
        require(validConversion, "Conversion not allowed between these property types");
        
        uint256 oldValue = property.value;
        string memory oldType = property.propertyType;
        
        // Update the property's type and value
        property.propertyType = _newType;
        property.value = newValue;
        
        // Emit event for the reward transaction
        emit RewardTransactionExecuted(_propertyId, oldType, _newType, oldValue, newValue, block.timestamp);
    }
}
