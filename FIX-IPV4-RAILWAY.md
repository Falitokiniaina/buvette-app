# 🔧 FIX IPv4 - DÉPLOIEMENT

## ✅ Correction Appliquée

**Problème :** Railway essayait de se connecter en IPv6  
**Solution :** Configuration PostgreSQL forcée en IPv4

---

## 📥 ÉTAPES DE DÉPLOIEMENT

### 1. Supprimer Variable Railway (IMPORTANT)

```
1. Railway Dashboard → Votre projet
2. Variables
3. Si DATABASE_URL existe → Supprimer
4. Confirmer
```

### 2. Mettre à Jour le Code

```bash
# Télécharger la nouvelle archive
# buvette-app-v2.5.1-ipv4-fix.tar.gz

# Extraire
tar -xzf buvette-app-v2.5.1-ipv4-fix.tar.gz
cd buvette-app

# Push sur GitHub
git add .
git commit -m "Fix: Force IPv4 pour connexion Supabase"
git push origin main
```

### 3. Attendre Redéploiement

```
Railway redéploie automatiquement
⏳ Attendre 1-2 minutes
```

### 4. Tester

```bash
curl https://web-production-d4660.up.railway.app/api/health
```

**Attendu :**
```json
{"status":"OK","database":"connected"}
```

---

## 📝 Modification Effectuée

**Fichier :** `backend/db.js`

**AVANT (connectionString) :**
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || '...',
  ssl: { ... }
});
```

**APRÈS (paramètres séparés pour forcer IPv4) :**
```javascript
const pool = new Pool({
  host: 'db.frcrzayagaxnqrglyocg.supabase.co',
  user: 'postgres',
  password: '#prnCQiUr7fL*MN',
  database: 'postgres',
  port: 5432,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Avantage :** Force la résolution DNS en IPv4

---

## ✅ CHECKLIST

- [ ] DATABASE_URL supprimée de Railway
- [ ] Nouvelle archive téléchargée
- [ ] Code poussé sur GitHub
- [ ] Redéploiement Railway terminé
- [ ] Test /api/health réussi

---

**Si ça ne marche TOUJOURS pas, partage les logs Railway ! 🔍**
