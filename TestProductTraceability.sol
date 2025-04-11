// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./ProductTraceability.sol"; // Assure-toi que le chemin est correct

contract TestProductTraceability {
    ProductTraceability public productTraceability;
    address public owner;
    address public addr1;
    address public addr2;

    // Fonction exécutée avant chaque test
    function setUp() public {
        // Obtenir les comptes de test
        owner = 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4; // Remplace par l'adresse du déployeur
        addr1 = 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2; // Remplace par une autre adresse
        addr2 = 0x4B20993Bc48aAdNC8c643iKaB2Ff43LQ89zB17dD; // Remplace par une autre adresse

        // Déployer le contrat
        productTraceability = new ProductTraceability();
    }

    // Test pour ajouter un participant à la liste blanche
    function testAddToWhitelist() public {
        setUp();
        productTraceability.addToWhitelist(addr1);
        assert(productTraceability.whitelist(addr1) == true);
    }

    // Test pour supprimer un participant de la liste blanche
    function testRemoveFromWhitelist() public {
        setUp();
        productTraceability.addToWhitelist(addr1);
        productTraceability.removeFromWhitelist(addr1);
        assert(productTraceability.whitelist(addr1) == false);
    }

    // Test pour créer un produit
    function testCreateProduct() public {
        setUp();
        productTraceability.addToWhitelist(addr1);
        productTraceability.createProduct(
            "Manufacturer",
            1,
            "ProductName",
            "LotId",
            100,
            uint256(1700000000) // Timestamp
        );

        Product memory product = productTraceability.getProduct(0);
        assert(product.manufacturer == "Manufacturer");
        assert(product.currentOwner == addr1);
    }

    // Test pour transférer la propriété d'un produit
    function testTransferOwnership() public {
        setUp();
        productTraceability.addToWhitelist(addr1);
        productTraceability.addToWhitelist(addr2);

        productTraceability.createProduct(
            "Manufacturer",
            1,
            "ProductName",
            "LotId",
            100,
            uint256(1700000000) // Timestamp
        );

        productTraceability.transferOwnership(0, addr2);
        Product memory product = productTraceability.getProduct(0);
        assert(product.currentOwner == addr2);
    }
}
