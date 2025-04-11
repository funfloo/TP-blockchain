const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TraceabiliteProduit - Test Suite", function () {
  let TraceabiliteProduit;
  let traceabilite;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // Récupération des comptes disponibles
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Déploiement du contrat
    const TraceabiliteProduitFactory = await ethers.getContractFactory("TraceabiliteProduit");
    traceabilite = await TraceabiliteProduitFactory.deploy();
    await traceabilite.deployed();
  });

  describe("Gestion de la propriété", function () {
    it("Le propriétaire initial doit être l'adresse du déployeur", async function () {
      expect(await traceabilite.owner()).to.equal(owner.address);
    });

    it("Le propriétaire peut transférer la propriété", async function () {
      await traceabilite.transferOwnership(addr1.address);
      expect(await traceabilite.owner()).to.equal(addr1.address);
    });
  });

  describe("Gestion de la whitelist", function () {
    it("Le propriétaire peut ajouter une adresse à la whitelist", async function () {
      await expect(traceabilite.addWhitelist(addr1.address))
        .to.emit(traceabilite, "WhitelistedAdded")
        .withArgs(addr1.address);
      // Vérification de l'ajout dans le mapping
      expect(await traceabilite.whitelist(addr1.address)).to.equal(true);
    });

    it("Seul le propriétaire peut ajouter une adresse à la whitelist", async function () {
      // Tentative d'ajout par addr1 qui n'est pas propriétaire
      await expect(traceabilite.connect(addr1).addWhitelist(addr2.address))
        .to.be.revertedWith("Seul le proprietaire peut appeler cette fonction");
    });
  });

  describe("Gestion des lots de produits", function () {
    beforeEach(async function () {
      // Ajout de addr1 à la whitelist pour qu'il puisse gérer les lots
      await traceabilite.addWhitelist(addr1.address);
    });

    it("Devrait permettre à un acteur autorisé d'ajouter un lot", async function () {
      const lotId = 1;
      const nomProduit = "Produit Test";
      const nombreTotal = 100;
      const dernierProprietaire = "Fabricant";
      const dateAchat = Math.floor(Date.now() / 1000);

      // addr1 (whitelisted) ajoute un lot
      await expect(
        traceabilite.connect(addr1).ajouterLot(
          lotId,
          nomProduit,
          nombreTotal,
          dernierProprietaire,
          dateAchat
        )
      )
        .to.emit(traceabilite, "LotAjoute")
        .withArgs(lotId, addr1.address, nomProduit, nombreTotal, dernierProprietaire, dateAchat);

      // Vérification des informations stockées sur le lot
      const lot = await traceabilite.consulterLot(lotId);
      expect(lot.lotId).to.equal(lotId);
      expect(lot.fabricant).to.equal(addr1.address);
      expect(lot.nomProduit).to.equal(nomProduit);
      expect(lot.nombreTotal).to.equal(nombreTotal);
      expect(lot.dernierProprietaire).to.equal(dernierProprietaire);
      expect(lot.dateAchat).to.equal(dateAchat);
    });

    it("Ne devrait pas permettre à une adresse non autorisée d'ajouter un lot", async function () {
      const lotId = 2;
      const nomProduit = "Produit Non Autorisé";
      const nombreTotal = 50;
      const dernierProprietaire = "Fabricant";
      const dateAchat = Math.floor(Date.now() / 1000);

      // addr2 n'est pas dans la whitelist, on s'attend à un revert
      await expect(
        traceabilite.connect(addr2).ajouterLot(
          lotId,
          nomProduit,
          nombreTotal,
          dernierProprietaire,
          dateAchat
        )
      ).to.be.revertedWith("L'adresse n'est pas dans la whitelist");
    });

    it("Devrait permettre le transfert de propriété d'un lot par un acteur autorisé", async function () {
      const lotId = 3;
      const nomProduit = "Produit A Transférer";
      const nombreTotal = 150;
      const dernierProprietaire = "Fabricant";
      const dateAchat = Math.floor(Date.now() / 1000);

      // addr1 ajoute le lot
      await traceabilite.connect(addr1).ajouterLot(
        lotId,
        nomProduit,
        nombreTotal,
        dernierProprietaire,
        dateAchat
      );

      // Transfert du lot
      const nouveauProprietaire = "Revendeur";
      const nouveauDateAchat = dateAchat + 3600; // une heure plus tard

      await expect(
        traceabilite.connect(addr1).transfererLot(lotId, nouveauProprietaire, nouveauDateAchat)
      )
        .to.emit(traceabilite, "LotMisAJour")
        .withArgs(lotId, nouveauProprietaire, nouveauDateAchat);

      // Vérification des informations mises à jour
      const lot = await traceabilite.consulterLot(lotId);
      expect(lot.dernierProprietaire).to.equal(nouveauProprietaire);
      expect(lot.dateAchat).to.equal(nouveauDateAchat);
    });

    it("Ne devrait pas permettre le transfert d'un lot inexistant", async function () {
      const lotId = 999; // Lot non créé
      const nouveauProprietaire = "Revendeur";
      const dateAchat = Math.floor(Date.now() / 1000);

      await expect(
        traceabilite.connect(addr1).transfererLot(lotId, nouveauProprietaire, dateAchat)
      ).to.be.revertedWith("Le lot n'existe pas");
    });
  });
});