const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChainTraceability", function () {
  let supplyChain;
  let owner, addr1, addr2, addrs;

  beforeEach(async function () {
    // Récupération des comptes de test et déclaration explicite de toutes les variables
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    // Déploiement du contrat en utilisant le nom entièrement qualifié
    const SupplyChainFactory = await ethers.getContractFactory("SupplyChainTraceability.sol:SupplyChainTraceability");
    supplyChain = await SupplyChainFactory.deploy();
    await supplyChain.deployed();
  });

  describe("Déploiement", function () {
    it("Doit définir le propriétaire initial correctement", async function () {
      expect(await supplyChain.owner()).to.equal(owner.address);
    });

    it("Doit ajouter le propriétaire à la whitelist lors du déploiement", async function () {
      expect(await supplyChain.whitelist(owner.address)).to.equal(true);
    });
  });

  describe("Gestion de la propriété", function () {
    it("Doit permettre le transfert de propriété par le propriétaire", async function () {
      await expect(supplyChain.transferOwnership(addr1.address))
        .to.emit(supplyChain, "OwnershipTransferred")
        .withArgs(owner.address, addr1.address);
      expect(await supplyChain.owner()).to.equal(addr1.address);
      // Le nouveau propriétaire doit également être en whitelist
      expect(await supplyChain.whitelist(addr1.address)).to.equal(true);
    });

    it("Doit rejeter le transfert de propriété par un non-propriétaire", async function () {
      await expect(supplyChain.connect(addr1).transferOwnership(addr2.address))
        .to.be.revertedWith("Seul le proprietaire peut effectuer cette operation");
    });
  });

  describe("Gestion de la Whitelist", function () {
    it("Le propriétaire peut ajouter un participant", async function () {
      await expect(supplyChain.addParticipant(addr1.address))
        .to.emit(supplyChain, "ParticipantAdded")
        .withArgs(addr1.address);
      expect(await supplyChain.whitelist(addr1.address)).to.equal(true);
    });

    it("Le propriétaire peut retirer un participant", async function () {
      // Ajout d'abord du participant
      await supplyChain.addParticipant(addr1.address);
      await expect(supplyChain.removeParticipant(addr1.address))
        .to.emit(supplyChain, "ParticipantRemoved")
        .withArgs(addr1.address);
      expect(await supplyChain.whitelist(addr1.address)).to.equal(false);
    });

    it("Un non-propriétaire ne peut pas ajouter de participant", async function () {
      await expect(
        supplyChain.connect(addr1).addParticipant(addr2.address)
      ).to.be.revertedWith("Seul le proprietaire peut effectuer cette operation");
    });

    it("Un non-propriétaire ne peut pas retirer de participant", async function () {
      // Le propriétaire ajoute addr1, puis addr1 tente de se retirer
      await supplyChain.addParticipant(addr1.address);
      await expect(
        supplyChain.connect(addr1).removeParticipant(addr1.address)
      ).to.be.revertedWith("Seul le proprietaire peut effectuer cette operation");
    });
  });

  describe("Gestion des Produits", function () {
    // Données de test pour un produit
    const totalLots = 10;
    const productName = "Produit Test";
    const batchIdentifier = "Batch-001";
    const totalProducts = 100;
    const lastOwner = "Fabricant A";
    const purchaseDate = 1633036800; // Exemple de timestamp Unix

    it("Doit permettre à une adresse whitelisted d'ajouter un produit", async function () {
      await expect(
        supplyChain.addProduct(totalLots, productName, batchIdentifier, totalProducts, lastOwner, purchaseDate)
      )
        .to.emit(supplyChain, "ProductAdded")
        .withArgs(1, productName, batchIdentifier);

      const product = await supplyChain.products(1);
      expect(product.manufacturer).to.equal(owner.address);
      expect(product.totalLots).to.equal(totalLots);
      expect(product.productName).to.equal(productName);
      expect(product.batchIdentifier).to.equal(batchIdentifier);
      expect(product.totalProducts).to.equal(totalProducts);
      expect(product.lastOwner).to.equal(lastOwner);
      expect(product.purchaseDate).to.equal(purchaseDate);
    });

    it("Doit rejeter l'ajout d'un produit par une adresse non-whitelisted", async function () {
      await expect(
        supplyChain.connect(addr1).addProduct(totalLots, productName, batchIdentifier, totalProducts, lastOwner, purchaseDate)
      ).to.be.revertedWith("Adresse non autorisee");
    });

    it("Doit permettre la mise à jour des informations d'un produit", async function () {
      // Ajout d'un produit
      await supplyChain.addProduct(totalLots, productName, batchIdentifier, totalProducts, lastOwner, purchaseDate);
      // Mise à jour du produit
      const newLastOwner = "Nouveau Propriétaire";
      const newPurchaseDate = purchaseDate + 1000;
      await expect(
        supplyChain.updateProduct(1, newLastOwner, newPurchaseDate)
      )
        .to.emit(supplyChain, "ProductUpdated")
        .withArgs(1, newLastOwner, newPurchaseDate);

      const product = await supplyChain.products(1);
      expect(product.lastOwner).to.equal(newLastOwner);
      expect(product.purchaseDate).to.equal(newPurchaseDate);
    });

    it("Doit rejeter la mise à jour pour un identifiant de produit invalide", async function () {
      await expect(
        supplyChain.updateProduct(99, "Fake Owner", purchaseDate)
      ).to.be.revertedWith("Identifiant du produit invalide");
    });

    it("Doit rejeter la mise à jour d'un produit par une adresse non-whitelisted", async function () {
      await supplyChain.addProduct(totalLots, productName, batchIdentifier, totalProducts, lastOwner, purchaseDate);
      await expect(
        supplyChain.connect(addr1).updateProduct(1, "Fake Owner", purchaseDate)
      ).to.be.revertedWith("Adresse non autorisee");
    });
  });
});