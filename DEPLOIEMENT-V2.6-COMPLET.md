# 🚀 VERSION 2.6 - GUIDE DÉPLOIEMENT COMPLET

## ✅ TOUTES LES MODIFICATIONS INCLUSES

### Backend ✅
- Max connexions DB: 500
- Endpoint livraison partielle avec article_ids
- Case insensitive pour noms commandes
- Statut 'livree_partiellement'
- Mots de passe en base parametrage

### Frontend ✅
- auth.js: Mots de passe depuis API
- caisse.html: Protection mot de passe
- preparateur.html: Protection mot de passe
- client.js: Bouton "Commencer ma commande"
- preparateur.js: **Cases à cocher complètes**
- preparateur.js: Affichage statuts avec badges
- style.css: Badges de statut

---

## 📦 FICHIERS MODIFIÉS

### Backend (7 fichiers)
1. backend/db.js - Max 500 connexions
2. backend/server.js - Endpoint livraison partielle
3. database/schema.sql - Statut + est_livre
4. database/migration-v2.5-v2.6.sql - Script migration

### Frontend (5 fichiers)
1. frontend/js/auth.js - Déjà OK ✅
2. frontend/caisse.html - Déjà OK ✅
3. frontend/preparateur.html - Déjà OK ✅
4. frontend/js/client.js - Déjà OK ✅
5. frontend/js/preparateur.js - **CASES À COCHER ✅**
6. frontend/css/style.css - **BADGES ✅**

---

## 🎯 DÉPLOIEMENT (10 MINUTES)

### ÉTAPE 1 : Migration SQL (2 min)

```sql
-- Dans Supabase SQL Editor
-- Copier-coller: database/migration-v2.5-v2.6.sql

-- ============================================
-- MIGRATION v2.5 → v2.6
-- ============================================

ALTER TABLE commandes 
DROP CONSTRAINT IF EXISTS commandes_statut_check;

ALTER TABLE commandes 
ADD CONSTRAINT commandes_statut_check 
CHECK (statut IN ('en_attente', 'payee', 'livree', 'livree_partiellement', 'annulee'));

ALTER TABLE commande_items 
ADD COLUMN IF NOT EXISTS est_livre BOOLEAN DEFAULT FALSE;

INSERT INTO parametrage (cle, valeur_texte, description) VALUES
    ('mot_de_passe_admin', 'FPMA123456', 'Mot de passe pour accéder à la page admin'),
    ('mot_de_passe_caisse', 'FPMA123', 'Mot de passe pour accéder à la page caisse'),
    ('mot_de_passe_preparateur', 'FPMA1234', 'Mot de passe pour accéder à la page préparateur')
ON CONFLICT (cle) DO NOTHING;

-- Vérification
SELECT * FROM parametrage WHERE cle LIKE 'mot_de_passe%';
```

**✅ Résultat attendu :** 3 lignes de mots de passe

---

### ÉTAPE 2 : Push Code (3 min)

```bash
# Extraire l'archive
tar -xzf buvette-app-v2.6-COMPLET.tar.gz
cd buvette-app

# Push GitHub
git add .
git commit -m "v2.6: Livraison partielle + Cases à cocher + Badges"
git push origin main
```

---

### ÉTAPE 3 : Vérifier Railway (2 min)

```
1. Railway Dashboard
2. Voir le déploiement automatique
3. Attendre "Success" (vert)
4. ⏳ 1-2 minutes
```

---

### ÉTAPE 4 : Tests (3 min)

#### Test 1 : API Health
```bash
curl https://web-production-d4660.up.railway.app/api/health
```
✅ `{"status":"OK","database":"connected"}`

#### Test 2 : Mots de passe
```bash
curl https://web-production-d4660.up.railway.app/api/parametrage/mot_de_passe_admin
```
✅ `{"valeur_texte":"FPMA123456"}`

#### Test 3 : Pages protégées
- Ouvrir `/admin.html` → Mot de passe demandé
- Ouvrir `/caisse.html` → Mot de passe demandé
- Ouvrir `/preparateur.html` → Mot de passe demandé

#### Test 4 : Client
- Ouvrir `/index.html`
- Créer commande "test"
- Aller en caisse, payer
- Revenir client, clic "Nouvelle commande"
- ✅ Bouton "Commencer ma commande" visible

#### Test 5 : Préparateur - Cases à cocher ⭐
- Ouvrir `/preparateur.html`
- Mot de passe: FPMA1234
- Voir commande payée
- Clic "Voir le détail - Marquer comme livrée"
- ✅ Cases à cocher devant chaque article
- ✅ Case "Tout cocher / Tout décocher"
- ✅ Badge statut visible
- Décocher un article
- ✅ Message change: "Livraison partielle"
- Valider
- ✅ Commande passe en "Livrée partiellement"
- Rouvrir même commande
- ✅ Article livré = case cochée et grisée
- Cocher les articles restants
- Valider
- ✅ Commande passe en "Livrée"

---

## 🎊 FONCTIONNALITÉS v2.6

### 1. Livraison Partielle ✅
- Statut "Livrée partiellement"
- Colonne `est_livre` par article
- Logique automatique:
  - Tous livrés → "Livrée"
  - Partiellement → "Livrée partiellement"
  - Aucun → "Payée"

### 2. Cases à Cocher Préparateur ✅
- Case devant chaque article
- Case "Tout cocher / décocher"
- Articles déjà livrés = grisés
- Message adaptatif:
  - Tout coché → "Confirmez que tous..."
  - Partiel → "Livraison partielle..."
- Badge statut visible

### 3. Mots de Passe en Base ✅
- Admin: FPMA123456
- Caisse: FPMA123
- Préparateur: FPMA1234
- Modifiables via admin

### 4. Case Insensitive ✅
- "faly" = "Faly" = "FALY"
- Création et recherche

### 5. Bouton Client ✅
- "Commencer ma commande" après paiement
- Plus de "Création en cours..."

### 6. Max Connexions ✅
- 500 connexions DB (vs 20)

---

## 📊 RÉCAPITULATIF MODIFICATIONS

### Base de Données
```sql
✅ commandes.statut: + 'livree_partiellement'
✅ commande_items.est_livre: BOOLEAN
✅ parametrage: + 3 mots de passe
```

### API Backend
```javascript
✅ PUT /commandes/:id/livrer { article_ids: [...] }
✅ GET /commandes/statut/payee → inclut partiellement
✅ GET /commandes/nom/:nom → LOWER() case insensitive
✅ POST /commandes → LOWER() vérification
```

### Frontend
```javascript
✅ auth.js: 3 fonctions vérification
✅ preparateur.js: ouvrirLivraison() avec checkboxes
✅ preparateur.js: confirmerLivraison() avec article_ids
✅ preparateur.js: afficherCommandesListe() avec badges
✅ preparateur.js: toggleTousArticles()
✅ preparateur.js: verifierStatutCochage()
✅ preparateur.js: afficherStatut()
✅ preparateur.js: getBadgeClass()
✅ style.css: .badge styles
```

---

## ✅ CHECKLIST FINALE

### Avant Déploiement
- [x] Archive extraite
- [x] Toutes les modifications incluses
- [x] Guide de déploiement créé

### Déploiement
- [ ] Migration SQL exécutée
- [ ] Code pushé sur GitHub
- [ ] Railway redéployé
- [ ] Tests API réussis

### Tests Fonctionnels
- [ ] Mots de passe fonctionnent
- [ ] Client: bouton correct
- [ ] Préparateur: cases à cocher visibles
- [ ] Livraison partielle fonctionne
- [ ] Badges statuts affichés
- [ ] Case insensitive OK

---

## 🎉 APRÈS DÉPLOIEMENT

**Ton application v2.6 aura :**
- ✅ Livraison article par article
- ✅ Interface préparateur intuitive
- ✅ Statuts visuels clairs
- ✅ Sécurité renforcée
- ✅ UX optimisée

**Bon déploiement ! 🚀**
