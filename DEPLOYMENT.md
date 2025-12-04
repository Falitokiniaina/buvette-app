# 🚀 Guide de Déploiement Complet

Ce guide vous accompagne pas à pas pour déployer l'application de gestion de buvette sur des plateformes gratuites.

## 📋 Prérequis

- Compte GitHub
- Compte sur les plateformes de déploiement (gratuit)
- Le code source de l'application

## 🎯 Option Recommandée: Supabase + Railway + Vercel

Cette combinaison offre:
- ✅ 100% gratuit
- ✅ Facile à configurer
- ✅ Scalable
- ✅ Support PostgreSQL natif

---

## ÉTAPE 1: Base de Données sur Supabase

### 1.1 Créer un projet

1. Aller sur [https://supabase.com](https://supabase.com)
2. Cliquer sur "Start your project"
3. Se connecter avec GitHub
4. Cliquer sur "New Project"
5. Remplir:
   - **Name**: buvette-gospel-db
   - **Database Password**: (générer un mot de passe fort)
   - **Region**: choisir le plus proche (ex: Frankfurt)
6. Cliquer sur "Create new project" (prend 2 minutes)

### 1.2 Initialiser la base de données

1. Dans le dashboard Supabase, aller sur "SQL Editor"
2. Cliquer sur "New query"
3. Copier tout le contenu du fichier `database/schema.sql`
4. Coller dans l'éditeur
5. Cliquer sur "Run" (ou Ctrl+Enter)
6. Vérifier les messages: doit afficher "Success"

### 1.3 Récupérer la connection string

1. Aller dans "Project Settings" (icône engrenage en bas à gauche)
2. Cliquer sur "Database"
3. Scroller jusqu'à "Connection string"
4. Sélectionner "URI"
5. Copier la connection string (format: `postgresql://postgres:[YOUR-PASSWORD]@...`)
6. **IMPORTANT**: Remplacer `[YOUR-PASSWORD]` par votre mot de passe
7. **Ajouter** `?sslmode=require` à la fin de l'URL

**Exemple final:**
```
postgresql://postgres:votre_password@db.xxxxx.supabase.co:5432/postgres?sslmode=require
```

**⚠️ GARDEZ CETTE URL SECRÈTE!**

---

## ÉTAPE 2: Backend sur Railway

### 2.1 Créer un compte

1. Aller sur [https://railway.app](https://railway.app)
2. Cliquer sur "Start a New Project"
3. Se connecter avec GitHub
4. Autoriser Railway à accéder à vos repos

### 2.2 Déployer le backend

1. Cliquer sur "New Project"
2. Sélectionner "Deploy from GitHub repo"
3. Choisir votre repository `buvette-app`
4. Railway détecte automatiquement Node.js

### 2.3 Configurer les variables d'environnement

1. Dans le dashboard Railway, cliquer sur votre projet
2. Onglet "Variables"
3. Cliquer sur "New Variable"
4. Ajouter ces variables:

```
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://votre-app.vercel.app
```

**Note**: Pour `FRONTEND_URL`, mettez temporairement `*`, on changera après.

### 2.4 Configurer le déploiement

1. Onglet "Settings"
2. Section "Build & Deploy"
3. **Root Directory**: `backend`
4. **Build Command**: `npm install`
5. **Start Command**: `node server.js`
6. Sauvegarder

### 2.5 Récupérer l'URL du backend

1. Railway génère une URL automatiquement
2. Aller dans "Settings" → "Networking"
3. Cliquer sur "Generate Domain"
4. Copier l'URL (ex: `https://buvette-backend-production.up.railway.app`)

### 2.6 Tester le backend

Ouvrir dans le navigateur:
```
https://votre-backend.railway.app/api/health
```

Vous devriez voir:
```json
{
  "status": "OK",
  "timestamp": "2025-12-03T...",
  "database": "connected"
}
```

✅ **Backend déployé avec succès!**

---

## ÉTAPE 3: Frontend sur Vercel

### 3.1 Créer un compte

1. Aller sur [https://vercel.com](https://vercel.com)
2. Cliquer sur "Sign Up"
3. Se connecter avec GitHub
4. Autoriser Vercel

### 3.2 Importer le projet

1. Cliquer sur "Add New..." → "Project"
2. Importer votre repository `buvette-app`
3. Cliquer sur "Import"

### 3.3 Configurer le projet

**Framework Preset**: Other

**Root Directory**: Cliquer sur "Edit" et sélectionner `frontend`

**Build Settings**:
- Build Command: (laisser vide)
- Output Directory: (laisser vide)
- Install Command: (laisser vide)

### 3.4 Variables d'environnement

Cliquer sur "Environment Variables" et ajouter:

```
API_URL=https://votre-backend.railway.app/api
```

### 3.5 Déployer

1. Cliquer sur "Deploy"
2. Attendre 30-60 secondes
3. Vercel affichera "Congratulations!"

### 3.6 Récupérer l'URL

1. Copier l'URL Vercel (ex: `https://buvette-gospel.vercel.app`)

### 3.7 Mettre à jour le backend

1. Retourner sur Railway
2. Variables d'environnement
3. Modifier `FRONTEND_URL` avec votre URL Vercel
4. Redéployer (automatique)

✅ **Frontend déployé avec succès!**

---

## ÉTAPE 4: Configurer le fichier config.js

### 4.1 Mise à jour automatique

Vercel détecte automatiquement l'URL du backend via les variables d'environnement.

Si ça ne fonctionne pas, modifiez `frontend/js/config.js`:

```javascript
const API_URL = 'https://votre-backend.railway.app/api';
```

Puis:
```bash
git add .
git commit -m "Update API URL"
git push
```

Vercel redéploiera automatiquement.

---

## ÉTAPE 5: Tester l'application complète

### 5.1 Tester chaque page

Ouvrir dans le navigateur:

1. **Page Client**: `https://votre-app.vercel.app/index.html`
2. **Page Caisse**: `https://votre-app.vercel.app/caisse.html`
3. **Page Préparateur**: `https://votre-app.vercel.app/preparateur.html`
4. **Page Admin**: `https://votre-app.vercel.app/admin.html`

### 5.2 Workflow de test complet

1. **Sur la page Client**:
   - Créer une commande avec votre prénom
   - Ajouter 2-3 articles
   - Cliquer sur "Vérifier disponibilité"
   - Cliquer sur "Aller à la caisse"

2. **Sur la page Caisse**:
   - Rechercher votre commande
   - Cliquer sur "Encaisser"
   - Confirmer le paiement

3. **Sur la page Client** (actualiser):
   - Voir "Commande payée !"

4. **Sur la page Préparateur**:
   - Voir votre commande apparaître
   - Cliquer sur "Marquer comme livrée"

5. **Sur la page Admin**:
   - Voir les statistiques
   - Vérifier le stock
   - Voir l'historique

✅ **Application fonctionnelle!**

---

## 🔧 Configuration CI/CD GitHub Actions

### 5.1 Activer GitHub Actions

Le fichier `.github/workflows/ci-cd.yml` est déjà configuré.

### 5.2 Ajouter les secrets GitHub

1. Aller sur votre repo GitHub
2. Settings → Secrets and variables → Actions
3. Cliquer sur "New repository secret"
4. Ajouter:

```
VERCEL_TOKEN=<votre_token_vercel>
VERCEL_ORG_ID=<votre_org_id>
VERCEL_PROJECT_ID=<votre_project_id>
```

**Pour obtenir ces valeurs:**

1. Installer Vercel CLI: `npm i -g vercel`
2. Se connecter: `vercel login`
3. Dans le dossier du projet: `vercel link`
4. Les IDs sont dans `.vercel/project.json`
5. Token: Vercel Dashboard → Settings → Tokens

### 5.3 Tester le CI/CD

```bash
git add .
git commit -m "Test CI/CD"
git push
```

GitHub Actions s'exécutera automatiquement et déploiera.

---

## 📱 Partager l'application

### URLs à partager:

- **Clients**: `https://votre-app.vercel.app`
- **Caisse**: `https://votre-app.vercel.app/caisse.html`
- **Préparateur**: `https://votre-app.vercel.app/preparateur.html`
- **Admin**: `https://votre-app.vercel.app/admin.html`

### QR Codes (optionnel)

Générer des QR codes pour chaque URL:
- [QR Code Generator](https://www.qr-code-generator.com/)

---

## 🐛 Dépannage

### Erreur "Cannot connect to database"

1. Vérifier la `DATABASE_URL` sur Railway
2. Vérifier que Supabase est actif
3. Tester la connexion: `psql <DATABASE_URL>`

### Erreur "CORS"

1. Vérifier `FRONTEND_URL` sur Railway
2. Ajouter `*` temporairement pour tester
3. Puis spécifier l'URL exacte de Vercel

### Erreur 404 sur l'API

1. Vérifier que Railway a bien déployé
2. Tester: `curl https://votre-backend.railway.app/api/health`
3. Vérifier les logs Railway

### Frontend ne charge pas

1. Vérifier l'URL API dans `config.js`
2. Ouvrir la console navigateur (F12)
3. Vérifier les erreurs réseau

---

## 💡 Conseils

- **Logs**: Toujours vérifier les logs en cas d'erreur
- **Railway**: Logs dans Dashboard → Deployments
- **Vercel**: Logs dans Dashboard → Deployments
- **Base de données**: Requêtes SQL dans Supabase → SQL Editor

---

## 🎉 Félicitations!

Votre application est maintenant déployée et accessible sur internet!

**Prochaines étapes:**
1. Personnaliser les couleurs et le logo
2. Ajouter plus d'articles dans la base de données
3. Tester en conditions réelles
4. Collecter les retours utilisateurs

---

## 📞 Support

En cas de problème:
1. Vérifier ce guide
2. Consulter les logs
3. Vérifier la documentation officielle:
   - [Supabase Docs](https://supabase.com/docs)
   - [Railway Docs](https://docs.railway.app)
   - [Vercel Docs](https://vercel.com/docs)

Bon déploiement! 🚀
