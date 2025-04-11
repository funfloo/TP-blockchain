// Récupération de l'artefact compilé du contrat SupplyChainTraceability
const SupplyChainTraceability = artifacts.require("SupplyChainTraceability");

contract("SupplyChainTraceability", (accounts) => {
  let instance;

  // On déploie une instance du contrat avant de démarrer les tests
  before(async () => {
    instance = await SupplyChainTraceability.new({ from: accounts[0] });
  });

  describe("Ajout d'un produit", () => {
    it("devrait ajouter un produit et vérifier ses propriétés", async () => {
      // On ajoute un produit d'ID 1 et nommé "Produit Test"
      await instance.addProduct(1, "Produit Test", { from: accounts[0] });
      
      // Récupération des informations du produit ajouté
      // Ici, nous supposons que getProduct(1) renvoie un tuple [nom, id, propriétaire]
      const product = await instance.getProduct(1);
      
      // Vérifications basiques
      assert.equal(product[0], "Produit Test", "Le nom du produit devrait être 'Produit Test'");
      assert.equal(Number(product[1]), 1, "L'ID du produit devrait être 1");
      assert.equal(product[2], accounts[0], "Le propriétaire devrait être l'account 0");
    });
  });

  describe("Transfert de produit", () => {
    it("devrait transférer la propriété d'un produit", async () => {
      // Ajout d'un second produit avec l'ID 2
      await instance.addProduct(2, "Autre Produit", { from: accounts[0] });
      
      // Vérification que le propriétaire initial est accounts[0]
      let product = await instance.getProduct(2);
      assert.equal(product[2], accounts[0], "Le propriétaire initial doit être accounts[0]");

      // Exécution du transfert de propriété vers accounts[1]
      await instance.transferProduct(2, accounts[1], { from: accounts[0] });

      // Vérification du changement de propriétaire
      product = await instance.getProduct(2);
      assert.equal(product[2], accounts[1], "Le propriétaire après transfert doit être accounts[1]");
    });
  });

  describe("Cas d'erreur et robustesse", () => {
    it("devrait rejeter le transfert si l'appelant n'est pas le propriétaire", async () => {
      // On ajoute un produit pour tester un transfert non autorisé
      await instance.addProduct(3, "Produit Non Transférable", { from: accounts[0] });
      
      // Tenter un transfert depuis un compte différent (accounts[1] ne devrait pas être autorisé)
      try {
        await instance.transferProduct(3, accounts[2], { from: accounts[1] });
        assert.fail("Le transfert non autorisé devrait échouer");
      } catch (error) {
        // On s'attend à une erreur; vérifiez que le message d'erreur contient une indication de rejet
        assert(
          error.message.includes("revert"),
          "Le message d'erreur doit contenir 'revert' pour un transfert non autorisé"
        );
      }
    });
  });
});