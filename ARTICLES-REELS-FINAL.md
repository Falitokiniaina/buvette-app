# ✅ SCHEMA FINAL - AVEC TES ARTICLES

## 📦 ARTICLES INCLUS (6)

```
✅ Box Salé           5€  - 50 stock
✅ Box Sucré          5€  - 50 stock
✅ Bagnat Catless     8€  - 30 stock
✅ Hot Dog + Frites   8€  - 40 stock
✅ Vary Anana         8€  - 35 stock
✅ Boisson            1€  - 150 stock
```

**Images depuis GitHub :**
```
https://raw.githubusercontent.com/Falitokiniaina/buvette-app/main/images/
  ├── box_sale.jpg
  ├── box_sucre.jpg
  ├── bagnat.jpg
  ├── hot_dog.jpg
  ├── vary_anana.jpg
  └── boisson.jpg
```

---

## 🚀 APPLICATION (2 MIN)

### Étape 1 : Supabase SQL Editor

**Copie/Colle TOUT le fichier :**
```
database/schema-v2.7-COMPLET-FINAL.sql
```

### Étape 2 : Run

⏱️ **30 secondes**

### Étape 3 : Vérifie

```sql
-- Articles créés
SELECT id, nom, prix, stock_disponible 
FROM articles 
ORDER BY prix, nom;
```

**Résultat attendu :**
```
id | nom              | prix | stock
---+------------------+------+-------
6  | Boisson          | 1.00 | 150
1  | Box Salé         | 5.00 | 50
2  | Box Sucré        | 5.00 | 50
3  | Bagnat Catless   | 8.00 | 30
4  | Hot Dog + Frites | 8.00 | 40
5  | Vary Anana       | 8.00 | 35
```

---

## ✅ VÉRIFICATIONS COMPLÈTES

### 1. Vues SQL
```sql
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Attendu :**
```
v_commandes_details      ✅
v_stats_articles         ✅
v_stock_disponible       ✅
```

### 2. Paramètres
```sql
SELECT cle, valeur FROM parametrage ORDER BY cle;
```

**Attendu :**
```
message_fermeture         | Les ventes sont...
mot_de_passe_admin        | admin123
mot_de_passe_caisse       | caisse123
mot_de_passe_preparation  | prep123
vente_ouverte             | true
```

### 3. Articles avec Images
```sql
SELECT nom, image_url FROM articles ORDER BY id;
```

**Attendu : 6 articles avec URLs GitHub** ✅

---

## 🧪 TESTS APPLICATION

### Test 1 : Page Client
```
https://web-production-d4660.up.railway.app

Résultat attendu:
✅ 6 articles affichés
✅ Images GitHub visibles
✅ Prix corrects (1€, 5€, 8€)
✅ Stock visible
```

### Test 2 : Créer Commande
```
1. Ajouter "Box Salé" x2
2. Ajouter "Boisson" x1
3. Total = 11€
4. Commander → Nom "TEST"
5. ✅ Commande créée
```

### Test 3 : Page Caisse
```
https://web-production-d4660.up.railway.app/caisse.html

Mot de passe: caisse123

1. Chercher "TEST"
2. ✅ Commande visible
3. Encaisser
4. ✅ Réservation créée
5. ✅ Stock diminue
```

### Test 4 : Page Admin
```
https://web-production-d4660.up.railway.app/admin.html

Mot de passe: admin123

✅ Stats affichées
✅ Historique fonctionne
✅ Plus d'erreurs Railway
```

---

## 📊 DÉTAILS ARTICLES

### Box Salé (5€)
- **Description :** Assortiment savoureux de snacks salés
- **Stock :** 50
- **Image :** box_sale.jpg

### Box Sucré (5€)
- **Description :** Délices sucrés et gourmands
- **Stock :** 50
- **Image :** box_sucre.jpg

### Bagnat Catless (8€)
- **Description :** Sandwich niçois revisité
- **Stock :** 30
- **Image :** bagnat.jpg

### Hot Dog + Frites (8€)
- **Description :** Hot dog gourmand avec frites croustillantes
- **Stock :** 40
- **Image :** hot_dog.jpg

### Vary Anana (8€)
- **Description :** Vary @anana + saosisy gasy + boulettes maison
- **Stock :** 35
- **Image :** vary_anana.jpg

### Boisson (1€)
- **Description :** Cannette ou bouteille
- **Stock :** 150
- **Image :** boisson.jpg

---

## 🎯 DIFFÉRENCES

### AVANT (Articles génériques)
```
❌ 12 articles Unsplash
❌ Pas les vrais produits
❌ URLs Unsplash
```

### APRÈS (Tes articles réels)
```
✅ 6 articles réels
✅ Noms exacts
✅ Prix exacts
✅ Stock exact
✅ Images GitHub
```

---

## 🔧 SI BESOIN MODIFIER STOCK

```sql
-- Exemple: Augmenter stock Box Salé
UPDATE articles 
SET stock_disponible = 100 
WHERE nom = 'Box Salé';

-- Exemple: Modifier prix Boisson
UPDATE articles 
SET prix = 2.00 
WHERE nom = 'Boisson';
```

---

## ✅ RÉSUMÉ

**Fichier mis à jour :**
```
database/schema-v2.7-COMPLET-FINAL.sql
```

**Ce qui est inclus :**
- ✅ Tables complètes (7)
- ✅ Vues admin (3)
- ✅ Fonctions réservations (5)
- ✅ Paramètres (5)
- ✅ **Tes 6 articles réels** ⭐
- ✅ **Images GitHub** ⭐

**Temps déploiement :**
```
⏱️ 2 minutes
```

**Résultat :**
```
✅ Erreurs Railway résolues
✅ Articles réels affichés
✅ Images GitHub visibles
✅ Application 100% opérationnelle
```

---

**🚀 EXÉCUTE LE SCHEMA MAINTENANT !**

**🎵 Tes articles sont prêts pour le concert ! 🎤**
