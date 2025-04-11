// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./SupplyChainTraceability.sol"; // Assure-toi que le chemin est correct

contract TestSupplyChainTraceability {
    SupplyChainTraceability public SupplyChainTraceability;
    address public owner;
    address public addr1;
    address public addr2;

    // Fonction exécutée avant chaque test
    function setUp() public {
        // Obtenir les comptes de test
        owner = 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4; // Remplace par l'adresse du déployeur
        addr1 = 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2; // Remplace par une autre adresse
        addr2 = 0x1aE0EA34a72D944a8C7603FfB3eC30a6669E454C; // Remplace par une autre adresse

        // Déployer le contrat
        SupplyChainTraceability = new SupplyChainTraceability();
    }

    // Test pour ajouter un participant à la liste blanche
    function testAddToWhitelist() public {
        setUp();
        SupplyChainTraceability.addToWhitelist(addr1);
        assert(SupplyChainTraceability.whitelist(addr1) == true);
    }

    // Test pour supprimer un participant de la liste blanche
    function testRemoveFromWhitelist() public {
        setUp();
        SupplyChainTraceability.addToWhitelist(addr1);
        SupplyChainTraceability.removeFromWhitelist(addr1);
        assert(SupplyChainTraceability.whitelist(addr1) == false);
    }

    // Test pour créer un produit
    function testCreateProduct() public {
        setUp();
        SupplyChainTraceability.addToWhitelist(addr1);
        SupplyChainTraceability.createProduct(
            "Manufacturer",
            1,
            "ProductName",
            "LotId",
            100,
            uint256(1700000000) // Timestamp
        );

        Product memory product = SupplyChainTraceability.getProduct(0);
        assert(product.manufacturer == "Manufacturer");
        assert(product.currentOwner == addr1);
    }

    // Test pour transférer la propriété d'un produit
    function testTransferOwnership() public {
        setUp();
        SupplyChainTraceability.addToWhitelist(addr1);
        SupplyChainTraceability.addToWhitelist(addr2);

        SupplyChainTraceability.createProduct(
            "Manufacturer",
            1,
            "ProductName",
            "LotId",
            100,
            uint256(1700000000) // Timestamp
        );

        SupplyChainTraceability.transferOwnership(0, addr2);
        Product memory product = SupplyChainTraceability.getProduct(0);
        assert(product.currentOwner == addr2);
    }
}
