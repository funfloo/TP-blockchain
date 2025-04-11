// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChainTraceability {
    // Adresse du propriétaire du contrat
    address public owner;

    // Mapping pour la liste blanche des adresses autorisées
    mapping(address => bool) public whitelist;

    // Événements pour suivre les changements
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ParticipantAdded(address indexed participant);
    event ParticipantRemoved(address indexed participant);
    event ProductAdded(uint256 productId, string productName, string batchIdentifier);
    event ProductUpdated(uint256 productId, string lastOwner, uint256 purchaseDate);

    // Constructeur initialisé avec l'adresse de déploiement
    constructor() {
        owner = msg.sender;
        whitelist[msg.sender] = true;
    }

    // Modificateur pour restreindre l'accès aux fonctions réservées au propriétaire
    modifier onlyOwner() {
        require(msg.sender == owner, "Seul le proprietaire peut effectuer cette operation");
        _;
    }
    
    // Modificateur pour restreindre l'accès aux adresses de la whitelist
    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "Adresse non autorisee");
        _;
    }

    // Fonction pour transférer la propriété du contrat
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Nouvel adresse invalide");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
        whitelist[newOwner] = true; // On peut ajouter automatiquement le nouveau proprietaire à la whitelist
    }

    // Gestion de la whitelist des participants
    function addParticipant(address participant) external onlyOwner {
        whitelist[participant] = true;
        emit ParticipantAdded(participant);
    }
    
    function removeParticipant(address participant) external onlyOwner {
        whitelist[participant] = false;
        emit ParticipantRemoved(participant);
    }

    // Définition de la structure d'un produit / lot
    struct Product {
        address manufacturer;     // Identification du fabricant (l'adresse qui ajoute le produit)
        uint256 totalLots;        // Nombre de lots (peut représenter le nombre de batches si nécessaire)
        string productName;       // Nom du produit
        string batchIdentifier;   // Identifiant unique du lot
        uint256 totalProducts;    // Nombre total de produits par lot
        string lastOwner;         // Nom du dernier propriétaire (souvent mis à jour lors du transfert)
        uint256 purchaseDate;     // Date d'achat sous forme de timestamp Unix
    }

    // Stockage des produits dans un mapping et compteur d'identifiants
    mapping(uint256 => Product) public products;
    uint256 public productCount;

    // Fonction pour ajouter un nouveau produit / lot
    function addProduct(
        uint256 totalLots,
        string memory productName,
        string memory batchIdentifier,
        uint256 totalProducts,
        string memory lastOwner,
        uint256 purchaseDate
    ) external onlyWhitelisted returns (uint256) {
        productCount++;
        products[productCount] = Product(
            msg.sender,
            totalLots,
            productName,
            batchIdentifier,
            totalProducts,
            lastOwner,
            purchaseDate
        );
        emit ProductAdded(productCount, productName, batchIdentifier);
        return productCount;
    }

    // Fonction pour mettre à jour les informations d'un produit après transfert (ex. changement de propriétaire)
    function updateProduct(
        uint256 productId,
        string memory newLastOwner,
        uint256 newPurchaseDate
    ) external onlyWhitelisted {
        require(productId > 0 && productId <= productCount, "Identifiant du produit invalide");
        Product storage p = products[productId];
        p.lastOwner = newLastOwner;
        p.purchaseDate = newPurchaseDate;
        emit ProductUpdated(productId, newLastOwner, newPurchaseDate);
    }

    // D'autres fonctions (lecture, filtrage, historique) peuvent être ajoutées suivant les besoins.
}