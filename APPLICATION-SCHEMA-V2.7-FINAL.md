# 🔧 APPLICATION SCHEMA v2.7 COMPLET FINAL

## 🎯 OBJECTIF

Corriger les erreurs Railway :
- ❌ `relation "v_commandes_details" does not exist`
- ❌ `relation "v_stats_articles" does not exist`
- ❌ `mot_de_passe_admin` 404

---

## ✅ SOLUTION

**Nouveau fichier :** `database/schema-v2.7-COMPLET-FINAL.sql`

**Ajouts par rapport à la version précédente :**
- ✅ Vue `v_commandes_details` (pour historique admin)
- ✅ Vue `v_stats_articles` (pour stats admin)
- ✅ Paramètre `mot_de_passe_admin`
- ✅ Paramètres `mot_de_passe_preparation` et `mot_de_passe_caisse`
- ✅ **12 articles pré-insérés** basés sur l'affiche du concert

---

## 🚀 APPLICATION IMMÉDIATE (5 MIN)

### Étape 1 : Backup Articles (1 min)

**Dans Supabase SQL Editor :**

```sql
-- Sauvegarder articles existants (si tu en as déjà)
CREATE TABLE IF NOT EXISTS articles_backup_$(date +%Y%m%d) AS 
SELECT * FROM articles;
```

---

### Étape 2 : Exécuter Nouveau Schema (2 min)

**Dans Supabase SQL Editor :**

1. **Copier TOUT** le contenu de `database/schema-v2.7-COMPLET-FINAL.sql`
2. **Coller** dans Supabase SQL Editor
3. **Cliquer "Run"**

⏱️ **Temps d'exécution : ~30 secondes**

---

### Étape 3 : Vérifier (1 min)

**Exécuter ces vérifications :**

```sql
-- 1. Vérifier les vues
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Résultat attendu:
-- v_commandes_details     ✅
-- v_stats_articles        ✅
-- v_stock_disponible      ✅

-- 2. Vérifier les paramètres
SELECT cle FROM parametrage ORDER BY cle;

-- Résultat attendu:
-- message_fermeture           ✅
-- mot_de_passe_admin          ✅ NOUVEAU
-- mot_de_passe_caisse         ✅ NOUVEAU
-- mot_de_passe_preparation    ✅ NOUVEAU
-- vente_ouverte               ✅

-- 3. Vérifier les articles
SELECT COUNT(*) as nb_articles FROM articles;

-- Résultat attendu: 12 articles ✅

-- 4. Tester la vue v_stats_articles
SELECT * FROM v_stats_articles LIMIT 1;

-- Doit fonctionner ✅

-- 5. Tester la vue v_commandes_details
SELECT * FROM v_commandes_details LIMIT 1;

-- Doit fonctionner ✅
```

---

### Étape 4 : Redémarrer Railway (1 min)

**Optionnel mais recommandé :**

1. Aller sur Railway Dashboard
2. Cliquer sur "Restart" (ou push un commit vide)
3. Attendre "Success"

**OU simplement attendre que Railway détecte les changements**

---

## 📊 CE QUI EST CRÉÉ

### Tables (7)
```
✅ articles
✅ reservation_temporaire
✅ commandes
✅ commande_items
✅ historique_stock
✅ parametrage
✅ utilisateurs
```

### Vues (3)
```
✅ v_stock_disponible       (Stock réel - réservations)
✅ v_commandes_details      (Historique commandes pour admin) ⭐ NOUVEAU
✅ v_stats_articles         (Stats ventes par article) ⭐ NOUVEAU
```

### Fonctions (5)
```
✅ nettoyer_reservations_expirees()
✅ supprimer_reservations(nom)
✅ verifier_disponibilite_commande(id)
✅ decrementer_stock_commande()
✅ update_updated_at_column()
```

### Paramètres (5)
```
✅ vente_ouverte = true
✅ message_fermeture = "Les ventes sont..."
✅ mot_de_passe_admin = "admin123"          ⭐ NOUVEAU
✅ mot_de_passe_preparation = "prep123"     ⭐ NOUVEAU
✅ mot_de_passe_caisse = "caisse123"        ⭐ NOUVEAU
```

### Articles (12)
```
Basés sur l'affiche du concert:

1. Assiette 5€ (Nems, Sambos, etc.) - 100 en stock
2. Saucisse & Frites 8€ - 80 en stock

Boissons 2€:
3. Coca Cola 33cl - 150 en stock
4. Orangina 33cl - 100 en stock
5. Ice Tea 33cl - 100 en stock
6. Eau Minérale 50cl - 200 en stock

Vins 10€:
7. Vin Rouge 75cl - 30 en stock
8. Vin Blanc 75cl - 30 en stock

Supplémentaires:
9. Sandwich Jambon - 60 en stock
10. Sandwich Poulet - 50 en stock
11. Jus d'Orange 25cl - 80 en stock
12. Café - 100 en stock
```

---

## ✅ RÉSULTAT ATTENDU

### Logs Railway - AVANT (Erreurs)
```
❌ Erreur historique commandes: relation "v_commandes_details" does not exist
❌ Erreur stats articles: relation "v_stats_articles" does not exist
❌ GET /api/parametrage/mot_de_passe_admin 404
```

### Logs Railway - APRÈS (Succès)
```
✅ GET /api/historique/commandes 200
✅ GET /api/stats/articles 200
✅ GET /api/parametrage/mot_de_passe_admin 200
```

---

## 🧪 TESTS POST-DÉPLOIEMENT

### Test 1 : Page Admin

```
1. Ouvrir: https://web-production-d4660.up.railway.app/admin.html
2. Entrer mot de passe: admin123
3. Vérifier:
   ✅ Stats affichées
   ✅ Historique fonctionne
   ✅ Pas d'erreurs console
```

### Test 2 : Page Client

```
1. Ouvrir: https://web-production-d4660.up.railway.app
2. Vérifier:
   ✅ 12 articles affichés
   ✅ Images visibles
   ✅ Stock correct
```

### Test 3 : Créer Commande

```
1. Page Client
2. Ajouter "Assiette 5€" x2
3. Commander → Nom: "TEST"
4. Vérifier:
   ✅ Commande créée
   ✅ Montant = 10€
```

### Test 4 : Page Caisse

```
1. Ouvrir: https://web-production-d4660.up.railway.app/caisse.html
2. Entrer mot de passe: caisse123
3. Chercher "TEST"
4. Encaisser
5. Vérifier:
   ✅ Réservation créée
   ✅ Stock diminué
```

---

## 🔍 DÉTAILS VUES AJOUTÉES

### v_commandes_details

**Utilisation :** Page Admin - Historique

**Colonnes :**
```sql
id, nom_commande, statut, montant_total,
montant_cb, montant_especes, montant_cheque,
created_at, date_paiement, date_livraison,
nb_articles, articles_liste
```

**Exemple :**
```
nom_commande: "Jean"
articles_liste: "Assiette 5€ x2, Coca Cola 33cl x1"
montant_total: 12.00
statut: "payee"
```

### v_stats_articles

**Utilisation :** Page Admin - Statistiques

**Colonnes :**
```sql
id, nom, prix, stock_disponible,
quantite_vendue, chiffre_affaires, nb_commandes
```

**Exemple :**
```
nom: "Assiette 5€"
quantite_vendue: 15
chiffre_affaires: 75.00
nb_commandes: 8
```

---

## 📝 AJUSTEMENTS POSSIBLES

### Si tu veux modifier les stocks

```sql
-- Exemple: Augmenter stock Assiette
UPDATE articles 
SET stock_disponible = 200 
WHERE nom = 'Assiette 5€';

-- Exemple: Désactiver un article
UPDATE articles 
SET actif = FALSE 
WHERE nom = 'Café';
```

### Si tu veux modifier les mots de passe

```sql
-- Exemple: Changer mot de passe admin
UPDATE parametrage 
SET valeur = 'nouveauMotDePasse' 
WHERE cle = 'mot_de_passe_admin';
```

### Si tu veux ajouter des articles

```sql
INSERT INTO articles (nom, description, prix, stock_disponible, image_url) 
VALUES ('Nouveau Produit', 'Description', 5.00, 50, 'https://...');
```

---

## 🎯 DIFFÉRENCE AVEC VERSION PRÉCÉDENTE

```
schema-v2.7-complet.sql (ANCIEN):
  ✅ Tables
  ✅ v_stock_disponible
  ✅ Fonctions
  ❌ v_commandes_details      MANQUANT
  ❌ v_stats_articles          MANQUANT
  ❌ mot_de_passe_admin        MANQUANT
  ❌ Articles pré-insérés      MANQUANT

schema-v2.7-COMPLET-FINAL.sql (NOUVEAU):
  ✅ Tables
  ✅ v_stock_disponible
  ✅ v_commandes_details       AJOUTÉ ⭐
  ✅ v_stats_articles          AJOUTÉ ⭐
  ✅ Fonctions
  ✅ mot_de_passe_admin        AJOUTÉ ⭐
  ✅ 12 articles pré-insérés   AJOUTÉ ⭐
```

---

## 🎉 RÉSUMÉ

**Fichier à exécuter :**
```
database/schema-v2.7-COMPLET-FINAL.sql
```

**Temps total :**
```
⏱️ 5 minutes
```

**Résultat :**
```
✅ Erreurs Railway résolues
✅ Page Admin fonctionnelle
✅ 12 articles prêts pour le concert
✅ Mots de passe configurés
✅ Application 100% opérationnelle
```

---

**🚀 EXÉCUTE LE SCHEMA MAINTENANT !**

**🎵 Prêt pour ANTSA PRAISE demain ! 🎤**
