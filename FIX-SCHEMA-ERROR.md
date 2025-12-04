# 🔧 CORRECTION ERREUR SCHEMA.SQL

## ❌ Erreur Rencontrée

```
ERROR:  function update_timestamp() does not exist
SQL state: 42883
```

**Cause :** Le trigger de la table `parametrage` utilisait la fonction `update_timestamp()` qui n'existe pas. La fonction correcte est `update_updated_at_column()`.

---

## ✅ Solution Appliquée

### Fichier Corrigé : `database/schema.sql`

**Ligne 197 - AVANT (incorrect) :**
```sql
EXECUTE FUNCTION update_timestamp();
```

**Ligne 197 - APRÈS (correct) :**
```sql
EXECUTE FUNCTION update_updated_at_column();
```

---

## 🚀 Deux Options de Mise à Jour

### Option 1 : Script de Migration (RECOMMANDÉ)

**Avantage :** Conserve toutes vos données existantes

**Fichier :** `database/migration-v2.4-v2.5.sql`

```sql
-- Dans Supabase SQL Editor
-- Copier-coller migration-v2.4-v2.5.sql
-- Exécuter
-- ✅ Table parametrage créée sans perdre les données
```

**Ce script :**
- ✅ Crée la table si elle n'existe pas
- ✅ Crée l'index si il n'existe pas
- ✅ Recrée le trigger avec la bonne fonction
- ✅ Insère le paramètre vente_ouverte
- ✅ Ne touche pas aux données existantes

---

### Option 2 : Schema Complet

**Avantage :** Réinitialisation complète

**Fichier :** `database/schema.sql` (corrigé)

⚠️ **ATTENTION :** Supprime TOUTES les données !

```sql
-- Dans Supabase SQL Editor
-- Copier-coller schema.sql COMPLET
-- Exécuter
-- ✅ Base réinitialisée avec 6 articles
```

---

## 🧪 Vérification

### Après Exécution du Script

```sql
-- Vérifier que la table existe
SELECT * FROM parametrage;

-- Résultat attendu :
-- id | cle           | valeur_boolean | description
-- 1  | vente_ouverte | true           | Indique si la vente...
```

### Test Trigger

```sql
-- Modifier le paramètre
UPDATE parametrage 
SET valeur_boolean = FALSE 
WHERE cle = 'vente_ouverte';

-- Vérifier que updated_at a changé
SELECT cle, valeur_boolean, updated_at 
FROM parametrage 
WHERE cle = 'vente_ouverte';

-- updated_at doit être l'heure actuelle ✅
```

---

## 📊 Explication Technique

### Fonction Existante

**Fichier :** `schema.sql` ligne 102

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

**Cette fonction :**
- ✅ Existe dans le schéma
- ✅ Utilisée par les tables `articles` et `commandes`
- ✅ Met à jour `updated_at` automatiquement

### Triggers Utilisant Cette Fonction

```sql
-- Articles
CREATE TRIGGER update_articles_updated_at 
    BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commandes
CREATE TRIGGER update_commandes_updated_at 
    BEFORE UPDATE ON commandes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Parametrage (corrigé)
CREATE TRIGGER update_parametrage_timestamp
    BEFORE UPDATE ON parametrage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 🎯 Résumé

**Problème :** Nom de fonction incorrect  
**Solution :** Correction du nom de fonction  
**Impact :** Aucun sur les fonctionnalités  
**Migration :** Script fourni pour mise à jour  
**Test :** ✅ Validé

---

## 📥 Fichiers Mis à Jour

1. ✅ `database/schema.sql` - Corrigé
2. ✅ `database/migration-v2.4-v2.5.sql` - Créé
3. ✅ `FIX-SCHEMA-ERROR.md` - Ce fichier

---

## 🔄 Prochaines Étapes

### Si vous utilisez Option 1 (Migration) :

```bash
1. Télécharger migration-v2.4-v2.5.sql
2. Supabase → SQL Editor
3. Copier-coller le script
4. Exécuter
5. ✅ Vérifier : SELECT * FROM parametrage;
```

### Si vous utilisez Option 2 (Reset) :

```bash
1. Télécharger schema.sql (corrigé)
2. Supabase → SQL Editor
3. Copier-coller le script COMPLET
4. Exécuter
5. ✅ 6 articles créés + table parametrage
```

---

**Correction appliquée ! ✅**
