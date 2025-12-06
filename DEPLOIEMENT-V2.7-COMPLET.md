# 🚀 DÉPLOIEMENT VERSION 2.7 COMPLÈTE

## 📋 APERÇU

**Version 2.7 - Système de Réservations Temporaires**

### Nouvelles Fonctionnalités
- ✅ Réservations temporaires lors de l'encaissement
- ✅ Protection automatique contre survente
- ✅ Stock libéré automatiquement si annulation
- ✅ Cleanup automatique (30 minutes)
- ✅ Vue SQL `v_stock_disponible` pour stock réel

### Corrections Appliquées
- ✅ Utilisation de `image_url` (pas `image_data`)
- ✅ Compatible avec votre base actuelle
- ✅ Schema SQL complet (pas de migration)

---

## 📦 FICHIERS INCLUS

```
buvette-app-v2.7-FINAL-COMPLET/
├── backend/
│   └── server.js (endpoints réservations actifs)
├── frontend/
│   ├── js/
│   │   ├── caisse.js (gestion réservations)
│   │   └── client.js (stock réel)
│   └── ...
└── database/
    ├── schema-v2.7-complet.sql (NOUVEAU ⭐)
    └── add-images-unsplash.sql
```

---

## 🎯 PLAN DE DÉPLOIEMENT

### Étape 1 : Base de Données (5 min) 🗄️
### Étape 2 : Code Application (3 min) 💻
### Étape 3 : Tests (5 min) 🧪

**Temps total : ~15 minutes**

---

## 🗄️ ÉTAPE 1 : BASE DE DONNÉES

### 1.1 Sauvegarder Vos Articles Existants (IMPORTANT !)

**Dans Supabase SQL Editor :**

```sql
-- Créer une table de backup
CREATE TABLE articles_backup AS 
SELECT * FROM articles;

-- Vérifier
SELECT COUNT(*) FROM articles_backup;
```

**💾 Note les données à restaurer après :**
- Noms articles
- Prix
- Stock
- URLs images

---

### 1.2 Supprimer Anciennes Tables

**Dans Supabase SQL Editor :**

```sql
-- Supprimer tout (ordre important à cause des foreign keys)
DROP TABLE IF EXISTS reservation_temporaire CASCADE;
DROP TABLE IF EXISTS commande_items CASCADE;
DROP TABLE IF EXISTS commandes CASCADE;
DROP TABLE IF EXISTS historique_stock CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS parametrage CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;

-- Supprimer vues et fonctions
DROP VIEW IF EXISTS v_stock_disponible CASCADE;
DROP VIEW IF EXISTS v_articles_stock_reel CASCADE;

DROP FUNCTION IF EXISTS nettoyer_reservations_expirees() CASCADE;
DROP FUNCTION IF EXISTS supprimer_reservations(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS verifier_disponibilite_commande(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS decrementer_stock_commande() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

---

### 1.3 Créer Nouveau Schema v2.7

**Dans Supabase SQL Editor :**

1. Ouvrir le fichier `database/schema-v2.7-complet.sql`
2. Copier TOUT le contenu
3. Coller dans Supabase SQL Editor
4. Cliquer "Run"

**⏱️ Temps d'exécution : ~30 secondes**

---

### 1.4 Vérifier Création

**Exécuter ces requêtes de vérification :**

```sql
-- 1. Vérifier les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Résultat attendu:
-- articles
-- commande_items
-- commandes
-- historique_stock
-- parametrage
-- reservation_temporaire ⭐ NOUVEAU
-- utilisateurs

-- 2. Vérifier la vue
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';

-- Résultat attendu:
-- v_stock_disponible ⭐ NOUVEAU

-- 3. Vérifier les fonctions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Résultat attendu:
-- decrementer_stock_commande
-- nettoyer_reservations_expirees ⭐ NOUVEAU
-- supprimer_reservations ⭐ NOUVEAU
-- update_updated_at_column
-- verifier_disponibilite_commande

-- 4. Tester la vue
SELECT * FROM v_stock_disponible LIMIT 1;

-- Doit retourner les colonnes:
-- id, nom, description, prix
-- stock_initial, quantite_reservee, stock_reel_disponible
-- image_url, actif, created_at, updated_at
```

**✅ Si tout est OK, passer à l'étape suivante**

---

### 1.5 Restaurer Vos Articles

**Option A : Depuis la backup**

```sql
-- Restaurer depuis articles_backup
INSERT INTO articles (nom, description, prix, stock_disponible, image_url, actif)
SELECT nom, description, prix, stock_disponible, image_url, actif
FROM articles_backup;

-- Vérifier
SELECT id, nom, prix, stock_disponible FROM articles;
```

**Option B : Insérer manuellement**

```sql
-- Exemple selon l'affiche du concert
INSERT INTO articles (nom, description, prix, stock_disponible, image_url) VALUES
('Assiette 5€', 'Nems, Sambos, Boulettes, Mofo Anana, Lasary Gasy', 5.00, 100, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'),
('Saucisse & Frites 8€', 'Saucisse avec frites', 8.00, 80, 'https://images.unsplash.com/photo-1612392166886-ee4c0e0a836c?w=400'),
('Boisson Soft 2€', 'Coca Cola, Orangina, Ice Tea, Eau', 2.00, 200, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400'),
('Bouteille de Vin 10€', 'Vin rouge ou blanc', 10.00, 30, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400');
```

**Option C : Utiliser le script images**

```sql
-- Exécuter database/add-images-unsplash.sql
-- Ajoute automatiquement des images selon les noms
```

---

### 1.6 Vérifier Stock Réel

**Tester la vue v_stock_disponible :**

```sql
-- Voir le stock réel pour tous les articles
SELECT 
    nom,
    stock_initial,
    quantite_reservee,
    stock_reel_disponible
FROM v_stock_disponible
ORDER BY nom;

-- Au départ:
-- stock_initial = stock que tu as mis
-- quantite_reservee = 0 (pas encore de réservations)
-- stock_reel_disponible = stock_initial - 0 = stock_initial
```

**✅ Base de données prête !**

---

## 💻 ÉTAPE 2 : CODE APPLICATION

### 2.1 Extraire Archive

```bash
# Dans ton dossier de travail
tar -xzf buvette-app-v2.7-FINAL-COMPLET.tar.gz
cd buvette-app
```

---

### 2.2 Vérifier Modifications

**Fichiers modifiés en v2.7 :**

```bash
# Backend
cat backend/server.js | grep -A 5 "v_stock_disponible"
# → Doit utiliser la vue

cat backend/server.js | grep -A 3 "POST.*reservations"
# → Endpoints réservations actifs

# Frontend (déjà OK)
cat frontend/js/caisse.js | grep -A 3 "CRÉER LA RÉSERVATION"
# → Logique de création
```

---

### 2.3 Push sur GitHub

```bash
# Vérifier status
git status

# Ajouter tous les fichiers
git add .

# Commit
git commit -m "v2.7: Système réservations temporaires + image_url"

# Push
git push origin main
```

---

### 2.4 Vérifier Déploiement Railway

```
1. Aller sur Railway Dashboard
2. Voir le déploiement automatique
3. Attendre status "Success" (vert) ✅
4. Vérifier logs: pas d'erreur
```

**⏱️ Temps : 1-2 minutes**

---

## 🧪 ÉTAPE 3 : TESTS

### Test 1 : Articles Visibles

```
1. Ouvrir https://web-production-d4660.up.railway.app
2. Page Client doit afficher les articles
3. Stock visible correct
4. Images affichées (si URL remplies)
```

**✅ Attendu : Tous articles listés**

---

### Test 2 : Créer Commande Simple

```
1. Page Client
2. Ajouter "Assiette 5€" x1
3. Cliquer "Commander"
4. Entrer nom "TEST1"
5. Valider
```

**✅ Attendu : "Commande créée avec succès"**

---

### Test 3 : Workflow Réservation Complet

**Scénario : Protection contre survente**

#### 3.1 Préparer les données

```sql
-- Mettre un stock faible pour tester
UPDATE articles SET stock_disponible = 5 WHERE nom LIKE '%Assiette%';
```

#### 3.2 Créer 2 commandes

```
Commande A:
- Assiette x3
- Nom: "CAISSE-A"

Commande B:
- Assiette x3
- Nom: "CAISSE-B"
```

#### 3.3 Test Caisse 1

```
1. Ouvrir page Caisse
2. Chercher "CAISSE-A"
3. Cliquer "Encaisser"
4. → Console: "✅ Réservation temporaire créée"
```

**Vérifier dans Supabase :**

```sql
-- Voir les réservations actives
SELECT * FROM reservation_temporaire;

-- Voir le stock réel
SELECT nom, stock_initial, quantite_reservee, stock_reel_disponible
FROM v_stock_disponible
WHERE nom LIKE '%Assiette%';

-- Résultat attendu:
-- stock_initial = 5
-- quantite_reservee = 3 (réservé par CAISSE-A)
-- stock_reel_disponible = 2 (5 - 3)
```

#### 3.4 Test Caisse 2 (Protection)

```
1. Ouvrir NOUVELLE page Caisse (onglet incognito)
2. Chercher "CAISSE-B"
3. Cliquer "Encaisser"
4. → ERREUR: "⚠️ Stock insuffisant" ✅
```

**Explication :**
- Stock réel = 2
- CAISSE-B veut 3
- IMPOSSIBLE → Protection fonctionne ! ✅

#### 3.5 Annulation

```
1. Caisse 1: Cliquer "Annuler"
2. → Console: "✅ Réservation supprimée"
```

**Vérifier dans Supabase :**

```sql
SELECT * FROM reservation_temporaire;
-- → Vide (réservation supprimée)

SELECT nom, stock_initial, quantite_reservee, stock_reel_disponible
FROM v_stock_disponible
WHERE nom LIKE '%Assiette%';

-- Résultat:
-- stock_initial = 5
-- quantite_reservee = 0
-- stock_reel_disponible = 5 (stock libéré !)
```

#### 3.6 Maintenant CAISSE-B peut encaisser

```
1. Caisse 2: Cliquer "Encaisser"
2. → Succès ✅
3. Confirmer paiement
4. → Stock décrémenté
```

**Vérifier :**

```sql
SELECT nom, stock_disponible FROM articles WHERE nom LIKE '%Assiette%';
-- → stock_disponible = 2 (5 - 3)
```

---

### Test 4 : Cleanup Automatique

```sql
-- Créer une réservation manuelle vieille de 40 minutes
INSERT INTO reservation_temporaire (nom_commande, article_id, quantite, created_at)
VALUES ('TEST-VIEUX', 1, 1, NOW() - INTERVAL '40 minutes');

-- Vérifier
SELECT * FROM reservation_temporaire;

-- Appeler cleanup
SELECT nettoyer_reservations_expirees();

-- Vérifier à nouveau
SELECT * FROM reservation_temporaire;
-- → TEST-VIEUX supprimé ✅
```

---

### Test 5 : Workflow Complet Client → Caisse → Préparateur

```
1. CLIENT: Créer commande "WORKFLOW-TEST"
   - Assiette x2
   - Coca x1

2. CAISSE: Encaisser
   - Réservation créée ✅
   - Stock visible diminué
   
3. CAISSE: Payer
   - CB: 12€
   - Confirmer
   - Réservation supprimée ✅
   - Stock décrémenté ✅

4. PRÉPARATEUR: Livrer
   - Cocher articles
   - Valider
   - Statut → "Livrée" ✅

5. ADMIN: Vérifier
   - Stats mises à jour
   - Historique visible
```

---

## 📊 CHECKLIST DÉPLOIEMENT

### Base de Données
- [ ] Backup articles créée
- [ ] Anciennes tables supprimées
- [ ] Schema v2.7 exécuté
- [ ] 7 tables créées
- [ ] 1 vue créée (v_stock_disponible)
- [ ] 5 fonctions créées
- [ ] Articles restaurés
- [ ] Vue testée

### Application
- [ ] Archive extraite
- [ ] Code pushé GitHub
- [ ] Railway déployé "Success"
- [ ] Logs sans erreur

### Tests Fonctionnels
- [ ] Articles visibles
- [ ] Commande créée
- [ ] Réservation fonctionne
- [ ] Protection survente OK
- [ ] Annulation libère stock
- [ ] Paiement décrémente stock
- [ ] Cleanup auto testé
- [ ] Workflow complet OK

---

## 🎯 RÉSULTAT FINAL

**Application v2.7 avec :**
- ✅ Réservations temporaires actives
- ✅ Protection survente automatique
- ✅ Stock réel partout (client, caisse, admin)
- ✅ Annulation libère stock immédiatement
- ✅ Cleanup auto toutes les requêtes
- ✅ Images via `image_url`
- ✅ Compatible ta base actuelle

---

## 🆘 DÉPANNAGE

### Erreur : "column image_data does not exist"
```
→ Tu as oublié d'utiliser schema-v2.7-complet.sql
→ Re-exécuter le schema complet
```

### Erreur : "relation v_stock_disponible does not exist"
```sql
-- Vérifier que la vue existe
SELECT * FROM information_schema.views 
WHERE table_name = 'v_stock_disponible';

-- Si vide, re-créer:
CREATE OR REPLACE VIEW v_stock_disponible AS...
```

### Réservations pas supprimées
```sql
-- Cleanup manuel
DELETE FROM reservation_temporaire 
WHERE created_at < NOW() - INTERVAL '30 minutes';
```

### Stock pas décrémenté
```sql
-- Vérifier le trigger
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'commandes';

-- Doit avoir: trigger_decrement_stock
```

---

## 📝 NOTES IMPORTANTES

### Différences v2.6.4 → v2.7

```
┌─────────────────────┬───────────┬──────────┐
│ Fonctionnalité      │  v2.6.4   │   v2.7   │
├─────────────────────┼───────────┼──────────┤
│ Articles            │     ✅    │    ✅    │
│ Commandes           │     ✅    │    ✅    │
│ Paiements           │     ✅    │    ✅    │
│ Livraisons          │     ✅    │    ✅    │
│ Admin               │     ✅    │    ✅    │
│ Réservations        │     ❌    │    ✅    │
│ Protection survente │     ❌    │    ✅    │
│ Stock temps réel    │     ❌    │    ✅    │
│ Cleanup auto        │     ❌    │    ✅    │
└─────────────────────┴───────────┴──────────┘
```

### Nouveaux Objets SQL

```sql
-- Table
reservation_temporaire

-- Vue
v_stock_disponible

-- Fonctions
nettoyer_reservations_expirees()
supprimer_reservations(nom_commande)
```

### Endpoints API v2.7

```
POST   /api/reservations/commande/:nom   → Créer réservations
DELETE /api/reservations/commande/:nom   → Supprimer réservations
GET    /api/reservations                 → Lister toutes
GET    /api/reservations/commande/:nom   → Lister une commande
GET    /api/articles                     → Utilise v_stock_disponible
```

---

## 🎉 FÉLICITATIONS !

**Tu as maintenant :**
- ✅ v2.7 déployée
- ✅ Protection contre survente
- ✅ Workflow complet testé
- ✅ Prêt pour le concert du 6 décembre ! 🎵

---

**Bon concert ANTSA PRAISE ! 🎤🎶**
