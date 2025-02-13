// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PropertyToken is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    struct Property {
        string name;
        string propertyType;
        uint256 value;
        string hashIPFS;
        address[] previousOwners;
        uint256 createdAt;
        uint256 lastTransferAt;
    }

    mapping(uint256 => Property) public properties;

    event PropertyMinted(uint256 tokenId, string name, string propertyType, address owner);

    constructor() ERC721("PropertyToken", "PROP") {}

    function mintProperty(
        string memory _name,
        string memory _propertyType,
        uint256 _value,
        string memory _hashIPFS
    ) public onlyOwner {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        // Création d'un tableau dynamique vide pour previousOwners
        address[] memory emptyArray = new address[](0);

        properties[tokenId] = Property({
            name: _name,
            propertyType: _propertyType,
            value: _value,
            hashIPFS: _hashIPFS,
            previousOwners: emptyArray,
            createdAt: block.timestamp,
            lastTransferAt: block.timestamp
        });

        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, _hashIPFS);

        emit PropertyMinted(tokenId, _name, _propertyType, msg.sender);
    }

    function getProperty(uint256 tokenId) public view returns (Property memory) {
        return properties[tokenId];
    }
}
