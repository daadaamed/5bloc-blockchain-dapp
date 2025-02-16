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
    uint256 constant LOCK_PERIOD = 600;     // 10 minutes for critical actions (minting)

    // Mapping from property ID to Property details
    mapping(uint256 => Property) public properties;

    // Mapping from owner address to list of property IDs owned
    mapping(address => uint256[]) public ownerProperties;

    // Mapping to record the next allowed transaction timestamp per user
    mapping(address => uint256) public nextAllowedTxTime;

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

        // Emit event for the property exchange
        emit PropertyExchanged(_propertyId, msg.sender, _receiver, block.timestamp);
    }
}
