// On récupère l'artefact compilé du contrat
const SupplyChainTraceability = artifacts.require("SupplyChainTraceability");

contract("SupplyChainTraceability", function (accounts) {

  // accounts est un tableau contenant les comptes disponibles
  // Par exemple, accounts[0] sera utilisé pour déployer et effectuer les transactions par défaut.

  let supplyChainInstance;

  // La fonction before permet de déployer le contrat avant l'exécution des tests
  before(async function () {
    // Déploiement d'une nouvelle instance de SupplyChainTraceability
    supplyChainInstance = await SupplyChainTraceability.new({ from: accounts[0] });
  });

  it("devrait ajouter un produit correctement", async function () {
    // Appel de la fonction addProduct pour ajouter un produit avec l'id 1 et le nom "Produit Test"
    await supplyChainInstance.addProduct(1, "Produit Test", { from: accounts[0] });
    
    // Récupération des informations du produit ajouté.
    // Ici, on suppose que getProduct retourne un tuple avec [nom, id, proprietaire]
    const product = await supplyChainInstance.getProduct(1);
    
    // Vérifications des valeurs retournées
    assert.equal(product[0], "Produit Test", "Le nom du produit devrait être 'Produit Test'");
    assert.equal(Number(product[1]), 1, "L'ID du produit devrait être 1");
    assert.equal(product[2], accounts[0], "Le propriétaire du produit doit être le premier compte");
  });

  it("devrait transférer la propriété d'un produit", async function () {
    // Ajout d'un nouveau produit dont l'id est 2 et le nom est "Autre Produit"
    await supplyChainInstance.addProduct(2, "Autre Produit", { from: accounts[0] });
    
    // On vérifie que le propriétaire initial est accounts[0]
    let product = await supplyChainInstance.getProduct(2);
    assert.equal(product[2], accounts[0], "Le propriétaire initial devrait être le premier compte");

    // Transfert du produit à accounts[1]
    await supplyChainInstance.transferProduct(2, accounts[1], { from: accounts[0] });
    
    // Vérification que le propriétaire a bien été mis à jour
    product = await supplyChainInstance.getProduct(2);
    assert.equal(product[2], accounts[1], "Le propriétaire après transfert devrait être le second compte");
  });

});