# ⚡ QUICK START v2.7

## 🎯 DÉPLOIEMENT RAPIDE (15 MIN)

### 📋 PRÉREQUIS

- ✅ v2.6.4 actuellement en production
- ✅ Accès Supabase SQL Editor
- ✅ Accès GitHub/Railway
- ✅ Sauvegarder articles existants

---

## 🚀 ÉTAPES

### 1️⃣ BASE DE DONNÉES (5 min)

#### Backup

```sql
-- Sauvegarder articles
CREATE TABLE articles_backup AS SELECT * FROM articles;
```

#### Nettoyage

```sql
-- Supprimer tout
DROP TABLE IF EXISTS reservation_temporaire CASCADE;
DROP TABLE IF EXISTS commande_items CASCADE;
DROP TABLE IF EXISTS commandes CASCADE;
DROP TABLE IF EXISTS historique_stock CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS parametrage CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;

DROP VIEW IF EXISTS v_stock_disponible CASCADE;
DROP VIEW IF EXISTS v_articles_stock_reel CASCADE;

DROP FUNCTION IF EXISTS nettoyer_reservations_expirees() CASCADE;
DROP FUNCTION IF EXISTS supprimer_reservations(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS verifier_disponibilite_commande(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS decrementer_stock_commande() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

#### Nouveau Schema

```sql
-- Copier/coller TOUT le contenu de:
-- database/schema-v2.7-complet.sql
-- Exécuter dans Supabase SQL Editor
```

#### Restaurer Articles

```sql
-- Depuis backup
INSERT INTO articles (nom, description, prix, stock_disponible, image_url, actif)
SELECT nom, description, prix, stock_disponible, image_url, actif
FROM articles_backup;

-- OU insérer manuellement vos articles
```

#### Vérifier

```sql
-- Tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
-- Attendu: 7 tables dont reservation_temporaire

-- Vue
SELECT * FROM v_stock_disponible LIMIT 1;
-- Doit fonctionner

-- Fonctions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' ORDER BY routine_name;
-- Attendu: 5 fonctions dont nettoyer_reservations_expirees
```

---

### 2️⃣ CODE APPLICATION (3 min)

```bash
# Extraire
tar -xzf buvette-app-v2.7-FINAL-COMPLET.tar.gz
cd buvette-app

# Push
git add .
git commit -m "v2.7: Réservations temporaires + protection survente"
git push origin main

# Attendre Railway → "Success" ✅
```

---

### 3️⃣ TESTS (5 min)

#### Test 1 : Articles

```
https://web-production-d4660.up.railway.app
→ Articles visibles ✅
→ Stock correct ✅
```

#### Test 2 : Commande

```
Page Client → Créer commande "TEST"
→ Succès ✅
```

#### Test 3 : Réservation

```sql
-- Mettre stock faible
UPDATE articles SET stock_disponible = 5 
WHERE nom LIKE '%Sandwich%';
```

```
1. Créer commande "A" avec Sandwich x3
2. Créer commande "B" avec Sandwich x3

3. Page Caisse → Encaisser "A"
   → Console: "Réservation créée" ✅
   
4. Vérifier Supabase:
   SELECT * FROM reservation_temporaire;
   → 1 ligne (A → 3 sandwichs)
   
   SELECT * FROM v_stock_disponible 
   WHERE nom LIKE '%Sandwich%';
   → stock_reel = 2 (5 - 3)

5. Page Caisse (autre onglet) → Encaisser "B"
   → ERREUR "Stock insuffisant" ✅

6. Annuler "A"
   → Réservation supprimée ✅
   → Stock réel = 5 ✅

7. Encaisser "B" maintenant
   → Succès ✅
```

---

## ✅ CHECKLIST RAPIDE

### Base de Données
- [ ] articles_backup créée
- [ ] Tables supprimées
- [ ] Schema v2.7 exécuté
- [ ] 7 tables + 1 vue + 5 fonctions OK
- [ ] Articles restaurés
- [ ] Test vue OK

### Application
- [ ] Code pushé
- [ ] Railway "Success"
- [ ] Logs sans erreur

### Tests
- [ ] Articles visibles
- [ ] Commande créée
- [ ] Réservation fonctionne
- [ ] Protection survente OK
- [ ] Annulation OK

---

## 📊 NOUVEAUTÉS v2.7

```
TABLE: reservation_temporaire
  → Stocke réservations temporaires

VUE: v_stock_disponible
  → Stock réel = stock - réservations

FONCTIONS:
  → nettoyer_reservations_expirees()
  → supprimer_reservations(nom)

ENDPOINTS:
  → POST   /api/reservations/commande/:nom
  → DELETE /api/reservations/commande/:nom
  → GET    /api/reservations
```

---

## 🎯 AVANTAGES v2.7

```
✅ Protection survente automatique
✅ Stock temps réel partout
✅ Annulation libère stock
✅ Cleanup auto 30 min
✅ Compatible image_url
✅ Workflow complet testé
```

---

## 🆘 PROBLÈMES FRÉQUENTS

### Erreur: "column image_data does not exist"
```
→ Utiliser schema-v2.7-complet.sql (pas migration)
```

### Erreur: "relation v_stock_disponible does not exist"
```
→ Re-exécuter section VUE du schema
```

### Réservations pas créées
```
→ Vérifier logs Railway
→ Vérifier console navigateur
```

### Stock pas décrémenté
```sql
-- Vérifier trigger
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'commandes';
```

---

## 📦 FICHIERS IMPORTANTS

```
database/
  └── schema-v2.7-complet.sql      ⭐ À EXÉCUTER

DEPLOIEMENT-V2.7-COMPLET.md         📖 Guide détaillé
SCHEMA-VISUEL-V2.7.md               📊 Schémas
QUICK-START-V2.7.md                 ⚡ Ce fichier
```

---

## 🎉 RÉSULTAT

**Application v2.7 opérationnelle avec protection survente ! 🚀**

**Prêt pour ANTSA PRAISE le 6 décembre ! 🎵🎤**

---

**Questions ? Voir DEPLOIEMENT-V2.7-COMPLET.md**
