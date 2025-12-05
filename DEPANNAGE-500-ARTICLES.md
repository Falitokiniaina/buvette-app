# 🔧 DÉPANNAGE ERREUR 500 - GET /api/articles

## 🎯 DIAGNOSTIC

### Étape 1 : Vérifier les Logs Railway

**IMPORTANT : Les logs montrent l'erreur exacte !**

```
1. Va sur Railway Dashboard
2. Clique sur ton projet
3. Onglet "Deployments"
4. Clique sur le déploiement actuel (en haut)
5. Onglet "Logs" ou "View Logs"
6. Cherche "Erreur GET articles" ou "❌"
```

**Copie-moi le message d'erreur complet que tu vois dans les logs !**

---

### Étape 2 : Vérifier la Base de Données

**Tu as quelles tables/vues dans Supabase ?**

```sql
-- Dans Supabase SQL Editor, exécute :

-- 1. Lister les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Lister les vues
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 3. Vérifier table articles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'articles';
```

**Envoie-moi les résultats !**

---

## 🚀 SOLUTION IMMÉDIATE

### Version v2.6.2 DEBUG

**Archive avec logs détaillés pour identifier l'erreur :**

**[📥 buvette-app-v2.6.2-DEBUG.tar.gz](computer:///mnt/user-data/outputs/buvette-app-v2.6.2-DEBUG.tar.gz)**

### Déploiement

```bash
# 1. Extraire
tar -xzf buvette-app-v2.6.2-DEBUG.tar.gz
cd buvette-app

# 2. Push
git add .
git commit -m "v2.6.2 DEBUG: Logs détaillés GET articles"
git push origin main

# 3. Attendre Railway (1-2 min)
```

### Voir les Logs

```
1. Railway → Logs
2. Rafraîchir page Client
3. Dans les logs Railway, tu verras:
   - "=== GET /api/articles appelé ==="
   - "Exécution requête SQL..."
   - Soit: "Articles trouvés: X"
   - Soit: "❌ Erreur GET articles: [MESSAGE]"
```

**COPIE-MOI CE MESSAGE !**

---

## 🔍 ERREURS POSSIBLES

### Erreur 1 : Colonne Manquante
```
ERROR: column "actif" does not exist
```

**Solution :**
```sql
ALTER TABLE articles ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT TRUE;
```

---

### Erreur 2 : Table Inexistante
```
ERROR: relation "articles" does not exist
```

**Solution :**
```sql
-- Vérifier que la table existe
SELECT * FROM articles LIMIT 1;
```

---

### Erreur 3 : Connexion DB
```
ERROR: connection to database failed
```

**Solution :**
- Vérifier variables d'environnement Railway
- Vérifier URL Supabase

---

### Erreur 4 : Encodage Image
```
ERROR: invalid byte sequence
```

**Solution :**
```sql
-- Nettoyer images problématiques
UPDATE articles SET image_data = NULL WHERE image_data IS NOT NULL;
```

---

## 🧪 TEST DIRECT DE LA REQUÊTE

### Dans Supabase SQL Editor

```sql
-- Teste exactement la même requête que le backend
SELECT 
  id, nom, description, prix, stock_disponible,
  image_data, image_type, actif, created_at, updated_at
FROM articles
WHERE actif = TRUE
ORDER BY nom ASC;
```

**Cette requête fonctionne ?**
- ✅ OUI → L'erreur vient d'ailleurs (connexion, encoding...)
- ❌ NON → Note l'erreur SQL exacte

---

## 📋 CHECKLIST DÉPANNAGE

- [ ] v2.6.2 DEBUG déployée sur Railway
- [ ] Logs Railway visibles
- [ ] Message d'erreur copié
- [ ] Requête SQL testée dans Supabase
- [ ] Colonnes table articles vérifiées

---

## 🆘 SI ÇA NE MARCHE TOUJOURS PAS

### Option 1 : Version Minimale

Je peux créer une version qui :
- Retourne des articles en dur (hardcodés)
- Juste pour que l'application fonctionne
- Le temps de debugger

### Option 2 : Connexion Directe

- Je peux me connecter à ta base
- Tester les requêtes
- Identifier le problème exact

---

## 🎯 PROCHAINE ÉTAPE

**FAIS CECI MAINTENANT :**

1. Déploie v2.6.2 DEBUG
2. Ouvre page Client
3. Va dans Railway Logs
4. Copie-moi TOUT ce que tu vois après "=== GET /api/articles appelé ==="

**Avec ces infos, je saurai exactement quel est le problème ! 🔍**
