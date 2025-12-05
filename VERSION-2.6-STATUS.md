# 🎯 VERSION 2.6 - LIVRAISON PARTIELLE

## ✅ DÉJÀ FAIT (Partie 1/2)

### 1. Base de Données ✅
- [x] Ajout statut 'livree_partiellement' dans commandes
- [x] Ajout champ 'est_livre' dans commande_items
- [x] Ajout 3 mots de passe dans parametrage
- [x] Script migration-v2.6.sql créé

### 2. Backend ✅
- [x] Max connexions augmenté à 500

### 3. Authentification ✅
- [x] auth.js réécrit pour utiliser l'API
- [x] admin.html utilise le nouveau système
- [x] caisse.html protégée par mot de passe
- [x] preparateur.html protégée par mot de passe

---

## ⏳ À FAIRE (Partie 2/2)

### 4. Backend API
- [ ] Modifier GET /commandes/nom/:nom → case-insensitive (LOWER())
- [ ] Modifier PUT /commandes/:id/livrer → livraison partielle
- [ ] Nouveau endpoint : PUT /commandes/:id/livrer-articles
- [ ] Logique: calculer statut selon articles livrés

### 5. Frontend Préparateur
- [ ] Modal avec cases à cocher par article
- [ ] Case "tout cocher/décocher"
- [ ] Articles déjà livrés: case grisée
- [ ] Message conditionnel
- [ ] Appel API livraison partielle
- [ ] Afficher statut dans les cartes commandes
- [ ] Afficher commandes 'payee' ET 'livree_partiellement'

### 6. Frontend Client
- [ ] Fix bouton "Nouvelle commande" après reset

---

## 📥 DÉPLOIEMENT PARTIEL

**Archive actuelle :** buvette-app-v2.6-partial.tar.gz

**Contient :**
- ✅ Schema SQL modifié
- ✅ Migration SQL
- ✅ db.js (500 connexions)
- ✅ auth.js réécrit
- ✅ Pages HTML avec protection

**NE contient PAS ENCORE :**
- ❌ API livraison partielle
- ❌ Frontend préparateur avec cases à cocher
- ❌ Fix bouton client

---

## 🔄 PROCHAINES ÉTAPES

1. Continuer les modifications backend et frontend
2. Tester en local
3. Créer archive complète v2.6-final
4. Déployer

---

**Status :** 🟡 50% Complété
**À suivre...**
