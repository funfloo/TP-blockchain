// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/* =======================================================
   Module Ownable : Gestion de la propriété du contrat
   ======================================================= */
contract Ownable {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // Le constructeur définit l'adresse du déployeur comme propriétaire initial
    constructor() {
        owner = msg.sender;
    }

    // Restriction pour les fonctions réservées au propriétaire
    modifier onlyOwner() {
        require(msg.sender == owner, "Seul le proprietaire peut appeler cette fonction");
        _;
    }

    // Permet de transférer la propriété du contrat à une nouvelle adresse
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Adresse non valide");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

/* =======================================================
   Module Whitelist : Gestion d'une liste blanche de participants
   ======================================================= */
contract Whitelist is Ownable {
    mapping(address => bool) public whitelist;

    event WhitelistedAdded(address indexed account);
    event WhitelistedRemoved(address indexed account);

    // Restriction aux comptes enregistrés dans la whitelist
    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "L'adresse n'est pas dans la whitelist");
        _;
    }

    // Permet d'ajouter un compte dans la whitelist (seul le propriétaire peut le faire)
    function addWhitelist(address account) public onlyOwner {
        require(!whitelist[account], "Adresse deja autorisee");
        whitelist[account] = true;
        emit WhitelistedAdded(account);
    }

    // Permet de retirer un compte de la whitelist (seul le propriétaire peut le faire)
    function removeWhitelist(address account) public onlyOwner {
        require(whitelist[account], "L'adresse n'est pas autorisee");
        whitelist[account] = false;
        emit WhitelistedRemoved(account);
    }
}

/* =======================================================
   Contrat TraceabiliteProduit : Suivi des produits et lots
   ======================================================= */
contract TraceabiliteProduit is Whitelist {
    // Définition de la structure d'un lot de produits
    struct Lot {
        address fabricant;         // Adresse du fabricant ou producteur
        uint lotId;                // Identifiant unique du lot (doit être non nul)
        string nomProduit;         // Nom du produit
        uint nombreTotal;          // Nombre total de produits dans le lot
        string dernierProprietaire;// Nom du dernier propriétaire du lot
        uint dateAchat;            // Date d'achat (par exemple, un timestamp)
    }

    // Mapping permettant d'associer un identifiant de lot à ses informations
    mapping(uint => Lot) public lots;
    // Compteur du nombre total de lots créés
    uint public nombreDeLots;

    // Événements pour le suivi des opérations sur les lots
    event LotAjoute(uint indexed lotId, address fabricant, string nomProduit, uint nombreTotal, string dernierProprietaire, uint dateAchat);
    event LotMisAJour(uint indexed lotId, string nouveauProprietaire, uint dateAchat);

    /**
     * @notice Ajoute un nouveau lot de produits.
     * @dev Seuls les comptes de la whitelist peuvent ajouter un lot.
     * @param _lotId Identifiant du lot (doit être non nul et unique)
     * @param _nomProduit Nom du produit associé au lot
     * @param _nombreTotal Nombre total de produits dans le lot
     * @param _dernierProprietaire Nom initial du dernier propriétaire (par exemple, le fabricant)
     * @param _dateAchat Date de l'achat ou de création du lot
     */
    function ajouterLot(
        uint _lotId,
        string calldata _nomProduit,
        uint _nombreTotal,
        string calldata _dernierProprietaire,
        uint _dateAchat
    ) external onlyWhitelisted {
        require(_lotId > 0, "L'identifiant du lot doit etre superieur a 0");
        // Vérifie qu'aucun lot n'existe déjà avec cet ID
        require(lots[_lotId].lotId == 0, "Un lot avec cet identifiant existe deja");

        lots[_lotId] = Lot({
            fabricant: msg.sender,
            lotId: _lotId,
            nomProduit: _nomProduit,
            nombreTotal: _nombreTotal,
            dernierProprietaire: _dernierProprietaire,
            dateAchat: _dateAchat
        });

        nombreDeLots++;
        emit LotAjoute(_lotId, msg.sender, _nomProduit, _nombreTotal, _dernierProprietaire, _dateAchat);
    }

    /**
     * @notice Transfère la propriété d'un lot à un nouveau propriétaire.
     * @dev Seuls les comptes de la whitelist peuvent transférer un lot.
     * @param _lotId Identifiant du lot à transférer
     * @param _nouveauProprietaire Nom du nouveau propriétaire
     * @param _dateAchat Date de transfert ou d'achat correspondant au changement de propriétaire
     */
    function transfererLot(
        uint _lotId,
        string calldata _nouveauProprietaire,
        uint _dateAchat
    ) external onlyWhitelisted {
        require(lots[_lotId].lotId != 0, "Le lot n'existe pas");

        // Mise à jour du dernier propriétaire et de la date d'achat
        lots[_lotId].dernierProprietaire = _nouveauProprietaire;
        lots[_lotId].dateAchat = _dateAchat;
        emit LotMisAJour(_lotId, _nouveauProprietaire, _dateAchat);
    }

    /**
     * @notice Permet de consulter les informations d'un lot.
     * @param _lotId Identifiant du lot à consulter
     * @return Les informations du lot (structure Lot)
     */
    function consulterLot(uint _lotId) external view returns (Lot memory) {
        require(lots[_lotId].lotId != 0, "Le lot n'existe pas");
        return lots[_lotId];
    }
}