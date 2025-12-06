# ⚡ CORRECTION ERREUR "total_vendu does not exist"

## 🎯 PROBLÈME

```
❌ Erreur stats articles: column "total_vendu" does not exist
❌ GET /api/stats/articles 500
```

**Cause :** Vue SQL utilise `quantite_vendue` mais backend attend `total_vendu`

---

## ✅ SOLUTION RAPIDE (30 SEC)

### Option 1 : Script Rapide (RECOMMANDÉ)

**Dans Supabase SQL Editor :**

1. **Copie/colle ce fichier :**
```
database/fix-vue-stats-articles.sql
```

2. **Clique "Run"**

⏱️ **10 secondes**

---

### Option 2 : Commande Manuelle

**Dans Supabase SQL Editor, copie/colle :**

```sql
-- Supprimer ancienne vue
DROP VIEW IF EXISTS v_stats_articles CASCADE;

-- Recréer avec "total_vendu"
CREATE OR REPLACE VIEW v_stats_articles AS
SELECT 
    a.id,
    a.nom,
    a.prix,
    a.stock_disponible,
    COALESCE(SUM(ci.quantite), 0)::INTEGER as total_vendu,
    COALESCE(SUM(ci.quantite * ci.prix_unitaire), 0)::DECIMAL(10,2) as chiffre_affaires,
    COUNT(DISTINCT c.id)::INTEGER as nb_commandes
FROM articles a
LEFT JOIN commande_items ci ON a.id = ci.article_id
LEFT JOIN commandes c ON ci.commande_id = c.id AND c.statut IN ('payee', 'livree', 'livree_partiellement')
WHERE a.actif = TRUE
GROUP BY a.id, a.nom, a.prix, a.stock_disponible
ORDER BY total_vendu DESC;
```

3. **Clique "Run"**

---

## 🧪 VÉRIFICATION

```sql
-- Tester la vue
SELECT * FROM v_stats_articles LIMIT 1;
```

**Colonnes attendues :**
```
id, nom, prix, stock_disponible,
total_vendu, chiffre_affaires, nb_commandes
```

---

## 🔄 TEST APPLICATION

### 1. Rafraîchir Page Admin

```
https://web-production-d4660.up.railway.app/admin.html
```

**Résultat attendu :**
- ✅ Stats affichées
- ✅ Pas d'erreur console
- ✅ Tableau articles visible

### 2. Vérifier Logs Railway

**Avant :**
```
❌ GET /api/stats/articles 500
❌ Erreur: column "total_vendu" does not exist
```

**Après :**
```
✅ GET /api/stats/articles 200
```

---

## 📊 DIFFÉRENCE

### Ancienne Vue (FAUX)
```sql
COALESCE(SUM(ci.quantite), 0) as quantite_vendue  ❌
ORDER BY quantite_vendue DESC  ❌
```

### Nouvelle Vue (CORRECT)
```sql
COALESCE(SUM(ci.quantite), 0) as total_vendu  ✅
ORDER BY total_vendu DESC  ✅
```

---

## 🎯 POURQUOI ?

**Backend attend :**
```javascript
// server.js ligne 735
SELECT * FROM v_stats_articles ORDER BY total_vendu DESC
```

**Vue SQL doit avoir :**
```sql
... as total_vendu  -- PAS quantite_vendue
```

---

## ✅ RÉSUMÉ

**Fichiers :**
- `database/fix-vue-stats-articles.sql` (correction rapide)
- `database/schema-v2.7-COMPLET-FINAL.sql` (déjà corrigé)

**Action :**
1. Exécuter fix-vue-stats-articles.sql
2. Rafraîchir page admin
3. ✅ Erreur résolue !

**Temps :**
```
⏱️ 30 secondes
```

---

## 🔧 SI ÇA NE MARCHE PAS

### Vérifier que la vue existe
```sql
SELECT * FROM information_schema.views 
WHERE table_name = 'v_stats_articles';
```

### Vérifier les colonnes
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'v_stats_articles'
ORDER BY ordinal_position;
```

**Doit inclure :**
- total_vendu ✅
- chiffre_affaires ✅
- nb_commandes ✅

---

**⚡ EXÉCUTE fix-vue-stats-articles.sql MAINTENANT !**

**✅ Erreur résolue en 30 secondes ! 🚀**
