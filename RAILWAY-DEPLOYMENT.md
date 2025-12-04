# 🚂 DÉPLOIEMENT SUR RAILWAY - Guide Complet

## ✅ Problème Résolu

L'erreur "Script start.sh not found" est maintenant corrigée !

**Fichiers ajoutés :**
- ✅ `package.json` (racine)
- ✅ `railway.json`
- ✅ `Procfile`
- ✅ `nixpacks.toml`
- ✅ `.node-version`
- ✅ `.env.example`

## 🚀 Déploiement Rapide

### Étape 1: Créer un Projet Railway

1. Aller sur https://railway.app
2. Se connecter avec GitHub
3. Cliquer "New Project"
4. Sélectionner "Deploy from GitHub repo"
5. Choisir votre repository `buvette-gospel`

### Étape 2: Ajouter PostgreSQL

1. Dans votre projet Railway, cliquer "+ New"
2. Choisir "Database" → "PostgreSQL"
3. Railway crée automatiquement une base de données
4. La variable `DATABASE_URL` est automatiquement configurée

### Étape 3: Initialiser la Base de Données

**Option A: Via Railway CLI**

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Se connecter
railway login

# Se connecter au projet
railway link

# Se connecter à PostgreSQL
railway connect postgres

# Copier le contenu de database/schema.sql
# Puis coller dans le terminal psql
\i database/schema.sql

# Ou directement :
railway run psql $DATABASE_URL < database/schema.sql
```

**Option B: Via Dashboard Railway**

1. Cliquer sur votre service PostgreSQL
2. Onglet "Data"
3. Ouvrir "Query"
4. Copier le contenu de `database/schema.sql`
5. Coller et exécuter

**Option C: Via TablePlus / pgAdmin**

1. Dans Railway, service PostgreSQL → "Connect"
2. Copier les credentials (Host, Port, User, Password, Database)
3. Ouvrir TablePlus ou pgAdmin
4. Se connecter avec les credentials
5. Exécuter le fichier `database/schema.sql`

### Étape 4: Configurer les Variables (Optionnel)

Dans Railway Dashboard → Service → Variables :

```bash
NODE_ENV=production
PORT=3000  # Déjà configuré automatiquement
FRONTEND_URL=https://votre-frontend.vercel.app  # Si différent
```

**Note:** `DATABASE_URL` est déjà configuré automatiquement par Railway !

### Étape 5: Déployer

```bash
# Railway détecte automatiquement les changements sur GitHub
# Ou forcer un déploiement :
git push origin main

# Ou via CLI :
railway up
```

### Étape 6: Vérifier

1. Railway affiche l'URL de déploiement
2. Tester : `https://votre-app.railway.app/api/health`
3. Résultat attendu :
```json
{
  "status": "OK",
  "timestamp": "2025-12-04T...",
  "database": "connected"
}
```

## 📋 Checklist Déploiement

- [ ] Projet Railway créé
- [ ] Repository GitHub connecté
- [ ] Service PostgreSQL ajouté
- [ ] Base de données initialisée (schema.sql)
- [ ] Variables d'environnement configurées (si besoin)
- [ ] Déploiement réussi (vert)
- [ ] Endpoint `/api/health` fonctionne
- [ ] Articles disponibles (`/api/articles`)

## 🔧 Configuration Automatique

### Fichiers Railway

**1. package.json (racine)**
```json
{
  "name": "buvette-gospel",
  "version": "2.4.0",
  "main": "backend/server.js",
  "scripts": {
    "start": "node backend/server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**2. railway.json**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node backend/server.js",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**3. Procfile**
```
web: node backend/server.js
```

**4. nixpacks.toml**
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm"]

[phases.install]
cmds = ["npm install --production"]

[start]
cmd = "node backend/server.js"
```

**5. .node-version**
```
20
```

## 🌐 Variables d'Environnement

### Variables Automatiques (Railway)

```bash
DATABASE_URL=postgresql://...  # Fourni par Railway PostgreSQL
PORT=3000                      # Fourni par Railway
NODE_ENV=production            # Automatique
```

### Variables Manuelles (Si Besoin)

```bash
FRONTEND_URL=https://votre-frontend.vercel.app
```

Pour ajouter :
1. Railway Dashboard → Service → "Variables"
2. Cliquer "+ New Variable"
3. Entrer `FRONTEND_URL` = votre URL Vercel

## 📊 Architecture Déploiement

```
┌─────────────────────────────────────────┐
│           RAILWAY PROJECT               │
│                                         │
│  ┌────────────────┐  ┌──────────────┐ │
│  │   Backend      │  │  PostgreSQL  │ │
│  │   (Node.js)    │←→│   Database   │ │
│  │                │  │              │ │
│  │ server.js      │  │ schema.sql   │ │
│  └────────────────┘  └──────────────┘ │
│         ↓                               │
│    PUBLIC URL                           │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│            VERCEL (Frontend)            │
│                                         │
│  HTML / CSS / JavaScript                │
│  Appelle l'API Railway                  │
└─────────────────────────────────────────┘
```

## 🧪 Tests Post-Déploiement

### Test 1: Health Check

```bash
curl https://votre-app.railway.app/api/health
```

**Résultat attendu :**
```json
{
  "status": "OK",
  "timestamp": "2025-12-04T10:30:00.000Z",
  "database": "connected"
}
```

### Test 2: Articles

```bash
curl https://votre-app.railway.app/api/articles
```

**Résultat attendu :**
```json
[
  {
    "id": 1,
    "nom": "Box Salé",
    "prix": "5.00",
    "stock_disponible": 50,
    ...
  },
  ...
]
```

### Test 3: Créer Commande

```bash
curl -X POST https://votre-app.railway.app/api/commandes \
  -H "Content-Type: application/json" \
  -d '{"nom_commande": "Test"}'
```

**Résultat attendu :**
```json
{
  "id": 1,
  "nom_commande": "Test",
  "statut": "en_attente",
  ...
}
```

## 🔗 Connecter le Frontend

### Dans Vercel (Frontend)

Configurer la variable d'environnement :

1. Vercel Dashboard → Project → "Settings" → "Environment Variables"
2. Ajouter :
```
VITE_API_URL=https://votre-app.railway.app/api
```
ou
```
NEXT_PUBLIC_API_URL=https://votre-app.railway.app/api
```

### Dans le Code Frontend

**Fichier : `frontend/js/config.js`**

```javascript
const API_BASE_URL = 'https://votre-app.railway.app/api';

// Ou avec variable d'environnement :
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

## 🚨 Dépannage

### Erreur: "Application failed to respond"

**Cause :** Le backend ne démarre pas

**Solution :**
1. Vérifier les logs : Railway Dashboard → Service → "Deployments" → Logs
2. Vérifier `DATABASE_URL` est défini
3. Vérifier le schema.sql a été exécuté

### Erreur: "Connection refused"

**Cause :** PostgreSQL pas accessible

**Solution :**
1. Vérifier que PostgreSQL est démarré (Dashboard → PostgreSQL → Status)
2. Vérifier `DATABASE_URL` dans les variables
3. Redémarrer le service backend

### Erreur: "relations does not exist"

**Cause :** Tables pas créées

**Solution :**
1. Se connecter à PostgreSQL via Railway CLI
2. Exécuter `database/schema.sql`
```bash
railway connect postgres
\i database/schema.sql
```

### Erreur: "Port already in use"

**Cause :** Railway essaie d'utiliser un port fixe

**Solution :**
Le `PORT` est automatiquement défini par Railway, pas besoin de le changer.
Le code utilise déjà `process.env.PORT || 3000`.

### Logs vides ou erreur build

**Solution :**
1. Vérifier que `package.json` est à la racine
2. Vérifier que `backend/server.js` existe
3. Redéployer : Git push ou "Redeploy" dans Railway

## 📊 Monitoring

### Logs en Temps Réel

```bash
# Via CLI
railway logs

# Ou Dashboard → Service → "Deployments" → Logs
```

### Métriques

Railway Dashboard → Service → "Metrics"
- CPU Usage
- Memory Usage
- Network Traffic
- Request Count

## 💰 Coûts Railway

### Plan Gratuit
- $5 de crédit gratuit / mois
- Suffisant pour tests et petits événements
- 500h d'exécution

### Plan Hobby ($5/mois)
- $5 + $0.000231/GB-hour (RAM)
- $0.000463/vCPU-hour (CPU)
- Recommandé pour production

**Estimation pour concert (1 jour) :**
- Backend : ~$0.50
- PostgreSQL : ~$0.30
- **Total : ~$0.80**

Largement dans le plan gratuit !

## 🔐 Sécurité

### Variables Sensibles

**✅ FAIRE :**
- Utiliser les variables d'environnement Railway
- Ne jamais commit les credentials
- Utiliser SSL en production (automatique)

**❌ NE PAS FAIRE :**
- Hardcoder les mots de passe
- Commit le fichier `.env`
- Exposer `DATABASE_URL`

### SSL / HTTPS

✅ Automatique sur Railway !
Toutes les URLs Railway utilisent HTTPS.

## 🎯 Checklist Finale

Avant le concert :

**Backend (Railway)**
- [ ] Service déployé (vert)
- [ ] PostgreSQL connecté
- [ ] Schema.sql exécuté
- [ ] `/api/health` retourne OK
- [ ] `/api/articles` retourne les 9 articles
- [ ] Logs sans erreur

**Frontend (Vercel)**
- [ ] Variable `API_URL` configurée
- [ ] Appels API fonctionnent
- [ ] Images chargent
- [ ] Création commande OK
- [ ] Encaissement fonctionne

**Tests E2E**
- [ ] Créer commande "Test"
- [ ] Ajouter articles
- [ ] Encaisser avec CB/Espèces/Chèque
- [ ] Vérifier en base via Railway

## 📖 Ressources

**Documentation :**
- Railway Docs : https://docs.railway.app
- Railway CLI : https://docs.railway.app/develop/cli
- Nixpacks : https://nixpacks.com

**Support :**
- Discord Railway : https://discord.gg/railway
- GitHub Issues : https://github.com/railwayapp/nixpacks

## 🎊 C'est Prêt !

Votre backend est maintenant déployable sur Railway en un clic ! 🚂

**Prochaines étapes :**
1. Push ces changements sur GitHub
2. Connecter Railway à votre repo
3. Ajouter PostgreSQL
4. Initialiser la base
5. Tester l'API

**L'application sera en ligne en 5 minutes ! ⚡**

---

**Version:** 2.4 Railway-Ready  
**Date:** 4 Décembre 2025  
**Status:** ✅ Prêt à Déployer  
**Coût:** ~$0.80 pour le concert
