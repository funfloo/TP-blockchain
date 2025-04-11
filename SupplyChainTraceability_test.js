const SupplyChainTraceability = artifacts.require("SupplyChainTraceability");

contract("SupplyChainTraceability", function (accounts) {
  let supplyChain;
  // On définit quelques comptes pour les tests
  const owner = accounts[0];
  const participant = accounts[1];
  const nonParticipant = accounts[2];

  // Avant chaque test, on déploie une nouvelle instance du contrat
  beforeEach(async function () {
    supplyChain = await SupplyChainTraceability.new({ from: owner });
  });

  describe("Gestion de la propriété", function () {
    it("Doit définir le déployeur comme propriétaire initial", async function () {
      const currentOwner = await supplyChain.owner();
      assert.equal(currentOwner, owner, "Le propriétaire initial devrait être l'adresse du déployeur");
    });

    it("Le propriétaire peut transférer la propriété", async function () {
      await supplyChain.transferOwnership(participant, { from: owner });
      const newOwner = await supplyChain.owner();
      assert.equal(newOwner, participant, "Le transfert de propriété n'a pas fonctionné correctement");
    });
  });

  describe("Gestion de la whitelist", function () {
    it("Le propriétaire peut ajouter une adresse à la whitelist", async function () {
      const tx = await supplyChain.addWhitelist(participant, { from: owner });
      // Vérification via le mapping
      const isWhitelisted = await supplyChain.whitelist(participant);
      assert.equal(isWhitelisted, true, "L'adresse devrait être présente dans la whitelist");
    });

    it("Une adresse non propriétaire ne peut pas ajouter à la whitelist", async function () {
      try {
        await supplyChain.addWhitelist(nonParticipant, { from: nonParticipant });
        assert.fail("La transaction aurait dû échouer car seul le propriétaire peut ajouter à la whitelist");
      } catch (error) {
        // On vérifie que l'erreur contient le message attendu
        assert(
          error.message.includes("Seul le proprietaire peut appeler cette fonction"),
          "Erreur inattendue lors de l'ajout à la whitelist par un non propriétaire"
        );
      }
    });
  });

  describe("Gestion des lots de produits", function () {
    // On ajoute participant à la whitelist avant de tester la gestion des lots
    beforeEach(async function () {
      await supplyChain.addWhitelist(participant, { from: owner });
    });

    it("Permet à une adresse autorisée d'ajouter un lot", async function () {
      const lotId = 1;
      const nomProduit = "Produit Test";
      const nombreTotal = 100;
      const dernierProprietaire = "Fabricant";
      const dateAchat = Math.floor(Date.now() / 1000);

      // participant, qui fait partie de la whitelist, ajoute un lot
      const tx = await supplyChain.ajouterLot(
        lotId,
        nomProduit,
        nombreTotal,
        dernierProprietaire,
        dateAchat,
        { from: participant }
      );

      // On peut vérifier que l'événement LotAjoute a bien été émis
      const event = tx.logs.find((log) => log.event === "LotAjoute");
      assert(event, "L'événement LotAjoute n'a pas été déclenché");

      // Vérification des informations enregistrées pour le lot
      const lot = await supplyChain.consulterLot(lotId);
      assert.equal(lot.lotId.toNumber(), lotId, "L'identifiant du lot ne correspond pas");
      assert.equal(lot.fabricant, participant, "Le fabricant doit correspondre à l'adresse qui a ajouté le lot");
      assert.equal(lot.nomProduit, nomProduit, "Le nom du produit n'est pas correctement enregistré");
      assert.equal(lot.nombreTotal.toNumber(), nombreTotal, "Le nombre total de produits est incorrect");
      assert.equal(lot.dernierProprietaire, dernierProprietaire, "Le dernier propriétaire initial n'est pas correctement enregistré");
      assert.equal(lot.dateAchat.toNumber(), dateAchat, "La date d'achat n'est pas correctement enregistrée");
    });

    it("Ne permet pas à une adresse non autorisée d'ajouter un lot", async function () {
      const lotId = 2;
      const nomProduit = "Produit Non Autorisé";
      const nombreTotal = 50;
      const dernierProprietaire = "Fabricant";
      const dateAchat = Math.floor(Date.now() / 1000);

      try {
        await supplyChain.ajouterLot(
          lotId,
          nomProduit,
          nombreTotal,
          dernierProprietaire,
          dateAchat,
          { from: nonParticipant }
        );
        assert.fail("La transaction aurait dû échouer pour une adresse non autorisée");
      } catch (error) {
        assert(
          error.message.includes("L'adresse n'est pas dans la whitelist"),
          "L'erreur attendue n'a pas été retournée pour un ajout de lot par une adresse non autorisée"
        );
      }
    });

    it("Permet de transférer la propriété d'un lot par une adresse autorisée", async function () {
      const lotId = 3;
      const nomProduit = "Produit à Transférer";
      const nombreTotal = 150;
      const dernierProprietaire = "Fabricant";
      const dateAchat = Math.floor(Date.now() / 1000);

      // participant ajoute un nouveau lot
      await supplyChain.ajouterLot(
        lotId,
        nomProduit,
        nombreTotal,
        dernierProprietaire,
        dateAchat,
        { from: participant }
      );

      // Transfert du lot : on met à jour le dernier propriétaire et la date d'achat
      const nouveauProprietaire = "Revendeur";
      const nouveauDateAchat = dateAchat + 3600; // ajout d'une heure

      const tx = await supplyChain.transfererLot(
        lotId,
        nouveauProprietaire,
        nouveauDateAchat,
        { from: participant }
      );

      const event = tx.logs.find((log) => log.event === "LotMisAJour");
      assert(event, "L'événement LotMisAJour n'a pas été déclenché lors du transfert");

      // Vérification des modifications enregistrées
      const lot = await supplyChain.consulterLot(lotId);
      assert.equal(lot.dernierProprietaire, nouveauProprietaire, "Le nouveau propriétaire n'est pas correctement mis à jour");
      assert.equal(lot.dateAchat.toNumber(), nouveauDateAchat, "La nouvelle date d'achat n'est pas correctement mise à jour");
    });

    it("Ne permet pas le transfert d'un lot inexistant", async function () {
      const lotId = 999; // Identifiant inexistant
      const nouveauProprietaire = "Revendeur";
      const dateAchat = Math.floor(Date.now() / 1000);

      try {
        await supplyChain.transfererLot(lotId, nouveauProprietaire, dateAchat, { from: participant });
        assert.fail("Le transfert d'un lot inexistant aurait dû échouer");
      } catch (error) {
        assert(
          error.message.includes("Le lot n'existe pas"),
          "L'erreur retournée n'est pas celle attendue pour un lot inexistant"
        );
      }
    });
  });
});