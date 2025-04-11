// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProductTraceability {
    struct Product {
        string manufacturer;
        uint256 lotNumber;
        string productName;
        string lotId;
        uint256 totalProducts;
        address currentOwner;
        uint256 purchaseDate;
    }

    address public owner;
    mapping(address => bool) public whitelist;
    mapping(uint256 => Product) public products;
    uint256 public productCount;

    event ProductCreated(uint256 productId, address indexed owner);
    event OwnershipTransferred(uint256 productId, address indexed from, address indexed to);
    event WhitelistUpdated(address indexed participant, bool isAdded);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "Not whitelisted");
        _;
    }

    constructor() {
        owner = msg.sender;
        whitelist[owner] = true;
    }

    function addToWhitelist(address participant) public onlyOwner {
        whitelist[participant] = true;
        emit WhitelistUpdated(participant, true);
    }

    function removeFromWhitelist(address participant) public onlyOwner {
        whitelist[participant] = false;
        emit WhitelistUpdated(participant, false);
    }

    function createProduct(
        string memory manufacturer,
        uint256 lotNumber,
        string memory productName,
        string memory lotId,
        uint256 totalProducts,
        uint256 purchaseDate
    ) public onlyWhitelisted returns (uint256) {
        products[productCount] = Product({
            manufacturer: manufacturer,
            lotNumber: lotNumber,
            productName: productName,
            lotId: lotId,
            totalProducts: totalProducts,
            currentOwner: msg.sender,
            purchaseDate: purchaseDate
        });

        emit ProductCreated(productCount, msg.sender);
        productCount++;
        return productCount - 1;
    }

    function transferOwnership(uint256 productId, address newOwner) public onlyWhitelisted {
        require(products[productId].currentOwner == msg.sender, "Not the current owner");
        require(whitelist[newOwner], "New owner not whitelisted");

        products[productId].currentOwner = newOwner;
        emit OwnershipTransferred(productId, msg.sender, newOwner);
    }

    function getProduct(uint256 productId) public view returns (Product memory) {
        return products[productId];
    }
}
