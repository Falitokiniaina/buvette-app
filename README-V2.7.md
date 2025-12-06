# 🎵 BUVETTE GOSPEL - APPLICATION v2.7

## 📦 CONTENU ARCHIVE

**Version 2.7 - Système de Réservations Temporaires**  
**Date : 5 Décembre 2025**  
**Pour : Concert ANTSA PRAISE - 6 Décembre 2025**

---

## 🎯 CETTE VERSION INCLUT

### Fonctionnalités Complètes
- ✅ **Commandes client** - Interface simple et rapide
- ✅ **Paiements multiples** - CB, Espèces, Chèque (v2.4)
- ✅ **Livraison partielle** - Cases à cocher (v2.6)
- ✅ **Réservations temporaires** - Protection survente (v2.7) ⭐ NOUVEAU
- ✅ **Stock temps réel** - Vue `v_stock_disponible` (v2.7) ⭐ NOUVEAU
- ✅ **Admin complet** - Stats, badges, historique
- ✅ **Paramétrage** - Ouverture/fermeture ventes (v2.5)
- ✅ **Images articles** - Système `image_url` ✅ CORRIGÉ

### Corrections Appliquées
- ✅ Utilisation de `image_url` (pas `image_data`)
- ✅ Schema SQL complet (pas de migration)
- ✅ Compatible avec votre base actuelle
- ✅ Toutes erreurs v2.6.x résolues

---

## 📂 STRUCTURE

```
buvette-app-v2.7/
├── backend/
│   ├── server.js                    (Endpoints réservations actifs)
│   ├── db.js
│   └── package.json
│
├── frontend/
│   ├── index.html                   (Page Client)
│   ├── caisse.html                  (Page Caisse)
│   ├── preparation.html             (Page Préparateur)
│   ├── admin.html                   (Page Admin)
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── config.js
│       ├── client.js                (Stock réel)
│       ├── caisse.js                (Gestion réservations ⭐)
│       ├── preparation.js
│       └── admin.js
│
├── database/
│   ├── schema-v2.7-complet.sql      ⭐ À EXÉCUTER EN PREMIER
│   ├── add-images-unsplash.sql      (Optionnel)
│   └── schema.sql                   (Ancien - ne pas utiliser)
│
├── DEPLOIEMENT-V2.7-COMPLET.md      📖 Guide détaillé
├── SCHEMA-VISUEL-V2.7.md            📊 Schémas système
├── QUICK-START-V2.7.md              ⚡ Démarrage rapide
└── README-V2.7.md                   📄 Ce fichier
```

---

## 🚀 DÉPLOIEMENT

### Option 1 : Quick Start (15 min)

**Voir : [QUICK-START-V2.7.md](./QUICK-START-V2.7.md)**

```bash
# 1. Base de données (5 min)
#    - Backup articles
#    - Exécuter schema-v2.7-complet.sql
#    - Restaurer articles

# 2. Application (3 min)
tar -xzf buvette-app-v2.7-FINAL-COMPLET.tar.gz
cd buvette-app
git add .
git commit -m "v2.7"
git push origin main

# 3. Tests (5 min)
#    - Articles OK
#    - Commande OK
#    - Réservation OK
```

### Option 2 : Guide Complet

**Voir : [DEPLOIEMENT-V2.7-COMPLET.md](./DEPLOIEMENT-V2.7-COMPLET.md)**

- Instructions détaillées étape par étape
- Vérifications à chaque étape
- Scénarios de test complets
- Dépannage inclus

---

## 🆕 NOUVEAUTÉS v2.7

### 1. Réservations Temporaires ⭐

**Problème résolu :**
```
v2.6 : 2 caissières → Peuvent survendre
v2.7 : 2 caissières → Protection automatique ✅
```

**Comment ça marche :**
```
1. Caissière clique "Encaisser"
   → Articles RÉSERVÉS temporairement
   → Stock visible diminué

2A. "Confirmer paiement"
    → Stock DÉCRÉMENTÉ
    → Réservation supprimée

2B. "Annuler"
    → Stock PAS touché
    → Réservation supprimée
    → Stock libéré immédiatement
```

### 2. Vue v_stock_disponible ⭐

**Formule :**
```sql
Stock Affiché = Stock Initial - Réservations Actives
```

**Visible partout :**
- Page Client
- Page Caisse
- Page Admin
- Page Préparateur

### 3. Cleanup Automatique ⭐

```
Réservations > 30 minutes → Supprimées auto
Évite blocage permanent du stock
```

### 4. Nouveaux Endpoints API

```
POST   /api/reservations/commande/:nom   (Créer)
DELETE /api/reservations/commande/:nom   (Supprimer)
GET    /api/reservations                 (Lister)
GET    /api/reservations/commande/:nom   (Détail)
```

---

## 📊 BASE DE DONNÉES v2.7

### Tables (7)
```sql
articles                   -- Produits
commandes                  -- Commandes clients
commande_items            -- Articles par commande
reservation_temporaire    -- ⭐ NOUVEAU
historique_stock          -- Mouvements stock
parametrage               -- Config app
utilisateurs              -- Comptes admin
```

### Vue (1)
```sql
v_stock_disponible        -- ⭐ NOUVEAU
  → Stock réel = stock - réservations
```

### Fonctions (5)
```sql
nettoyer_reservations_expirees()      -- ⭐ NOUVEAU
supprimer_reservations(nom)           -- ⭐ NOUVEAU
verifier_disponibilite_commande(id)
decrementer_stock_commande()
update_updated_at_column()
```

---

## 🔧 DIFFÉRENCES VERSIONS

```
┌─────────────────────┬──────────┬──────────┬──────────┐
│ Fonctionnalité      │  v2.4    │  v2.6.4  │   v2.7   │
├─────────────────────┼──────────┼──────────┼──────────┤
│ Commandes           │    ✅    │    ✅    │    ✅    │
│ Paiements multiples │    ✅    │    ✅    │    ✅    │
│ Livraison partielle │    ❌    │    ✅    │    ✅    │
│ Réservations        │    ❌    │    ❌    │    ✅    │
│ Stock temps réel    │    ❌    │    ❌    │    ✅    │
│ Protection survente │    ❌    │    ❌    │    ✅    │
│ Cleanup auto        │    ❌    │    ❌    │    ✅    │
│ image_url           │    ✅    │    ✅    │    ✅    │
└─────────────────────┴──────────┴──────────┴──────────┘
```

---

## 🎯 CAS D'UTILISATION

### Scénario 1 : Concert Normal (1 caisse)

```
✅ v2.6.4 suffit
✅ v2.7 fonctionne aussi (protection bonus)
```

### Scénario 2 : Grand Événement (2+ caisses)

```
⚠️ v2.6.4 : Risque survente
✅ v2.7 : Protection automatique OBLIGATOIRE
```

### Scénario 3 : Stock Limité

```
❌ v2.6.4 : Peut vendre plus que disponible
✅ v2.7 : Impossible de survendre
```

---

## 📖 DOCUMENTATION

### Guides
- **QUICK-START-V2.7.md** - Déploiement rapide (15 min)
- **DEPLOIEMENT-V2.7-COMPLET.md** - Guide détaillé complet
- **SCHEMA-VISUEL-V2.7.md** - Schémas et diagrammes
- **README-V2.7.md** - Ce fichier

### SQL
- **schema-v2.7-complet.sql** - Schema complet à exécuter
- **add-images-unsplash.sql** - Ajouter images (optionnel)

---

## ✅ CHECKLIST DÉPLOIEMENT

### Avant
- [ ] v2.6.4 fonctionne
- [ ] Backup articles créé
- [ ] Accès Supabase OK
- [ ] Accès Railway OK

### Base de Données
- [ ] Anciennes tables supprimées
- [ ] Schema v2.7 exécuté
- [ ] 7 tables créées
- [ ] 1 vue créée
- [ ] 5 fonctions créées
- [ ] Articles restaurés
- [ ] Tests SQL OK

### Application
- [ ] Code extrait
- [ ] Code pushé GitHub
- [ ] Railway "Success"
- [ ] Logs sans erreur

### Tests
- [ ] Articles visibles
- [ ] Commande créée
- [ ] Réservation OK
- [ ] Protection survente OK
- [ ] Annulation OK
- [ ] Workflow complet OK

---

## 🆘 SUPPORT

### Problèmes Fréquents

**Erreur : "column image_data does not exist"**
```
→ Utiliser schema-v2.7-complet.sql
→ PAS les anciennes migrations
```

**Erreur : "relation v_stock_disponible does not exist"**
```sql
-- Re-créer la vue
CREATE OR REPLACE VIEW v_stock_disponible AS...
```

**Stock pas décrémenté**
```sql
-- Vérifier trigger
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'commandes';
```

### Logs Importants

**Railway :**
```
Logs → Chercher "Erreur" ou "❌"
```

**Console Navigateur :**
```
F12 → Console
Chercher erreurs rouges
```

**Supabase :**
```
SQL Editor → Tester requêtes manuellement
```

---

## 🎉 RÉSULTAT FINAL

**Application complète avec :**
- ✅ Protection survente automatique
- ✅ Stock temps réel partout
- ✅ Workflow complet testé
- ✅ 4 interfaces utilisateur
- ✅ Paiements multiples
- ✅ Livraisons partielles
- ✅ Admin avec stats
- ✅ Images articles

**Prêt pour le concert ANTSA PRAISE ! 🎵🎤**

---

## 📞 INFORMATIONS CONCERT

**ANTSA PRAISE - Fête des récoltes**  
**Date :** Samedi 6 Décembre 2025 - 18h30  
**Lieu :** Espace Protestant Théodore Monod  
**Adresse :** 22 Rue Romain Rolland, 69120 Vaulx-en-Velin

**PAF :**
- Adultes : 20€
- Étudiants : 15€
- Sur place : 25€

---

**Version 2.7 - Production Ready ✅**  
**Date de création : 5 Décembre 2025**  
**Créé pour : EPMA Lyon**
