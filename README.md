# 🎵 Application de Gestion de Buvette - Concert Gospel

Application web complète pour gérer les commandes d'une buvette lors d'événements, avec système de paiement et préparation de commandes en temps réel.

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation Locale](#installation-locale)
- [Déploiement Gratuit](#déploiement-gratuit)
- [Utilisation](#utilisation)
- [API Documentation](#api-documentation)

## ✨ Fonctionnalités

### 👥 Pour les Clients
- ✅ Créer une commande avec un nom unique
- 🛒 Sélectionner des articles et quantités
- ✓ Vérifier la disponibilité en temps réel
- 💳 Suivre le statut du paiement
- 📱 Interface responsive (mobile et desktop)

### 💰 Pour la Caisse
- 🔍 Rechercher une commande par nom
- 📋 Liste des commandes en attente
- 💵 Encaisser avec calcul de monnaie
- ✓ Validation sécurisée des paiements

### 👨‍🍳 Pour le Préparateur
- 📦 Liste des commandes payées à préparer
- 🔄 Actualisation automatique toutes les 10s
- ✓ Marquer les commandes comme livrées
- 📜 Historique des livraisons

### ⚙️ Pour l'Administrateur
- 📊 Dashboard avec statistiques en temps réel
- 📦 Gestion du stock des articles
- 📈 Statistiques de vente par article
- 💰 Chiffre d'affaires total
- 🧾 Historique complet des ventes

## 🏗️ Architecture

### Technologies utilisées

**Backend:**
- Node.js avec Express
- PostgreSQL (base de données relationnelle)
- Architecture REST API

**Frontend:**
- HTML5 / CSS3 (design moderne et responsive)
- JavaScript Vanilla (pas de framework)
- Fetch API pour les requêtes

**Base de données:**
- PostgreSQL avec triggers et fonctions
- Relations avec clés étrangères
- Historique complet des transactions
- Gestion automatique du stock

### Structure de la base de données

```
articles (id, nom, prix, stock_disponible)
    ↓
commandes (id, nom_commande UNIQUE, statut, montant_total)
    ↓
commande_items (commande_id FK, article_id FK, quantite, prix_unitaire)
    ↓
historique_stock (traçabilité complète)
```

**Statuts de commande:** `en_attente` → `payee` → `livree`

## 💻 Installation Locale

### Prérequis

- Node.js 18+ ([télécharger](https://nodejs.org/))
- PostgreSQL 14+ ([télécharger](https://www.postgresql.org/download/))
- Git ([télécharger](https://git-scm.com/))

### Étape 1: Cloner le projet

```bash
git clone <votre-repo>
cd buvette-app
```

### Étape 2: Configurer la base de données

1. Créer une base de données PostgreSQL:

```sql
CREATE DATABASE buvette_db;
```

2. Exécuter le script de création:

```bash
psql -U postgres -d buvette_db -f database/schema.sql
```

### Étape 3: Installer les dépendances backend

```bash
cd backend
npm install
```

### Étape 4: Configurer les variables d'environnement

Créer un fichier `.env` dans le dossier `backend/`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/buvette_db
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5500
```

### Étape 5: Démarrer le backend

```bash
npm start
```

Le serveur démarrera sur `http://localhost:3000`

### Étape 6: Démarrer le frontend

Ouvrir les fichiers HTML avec un serveur local:

**Option A: Avec VSCode Live Server**
- Installer l'extension "Live Server"
- Clic droit sur `frontend/index.html` → "Open with Live Server"

**Option B: Avec Python**
```bash
cd frontend
python -m http.server 5500
```

**Option C: Avec Node.js http-server**
```bash
npx http-server frontend -p 5500
```

### ✅ Vérification

- Backend API: http://localhost:3000/api/health
- Frontend Client: http://localhost:5500/index.html
- Frontend Caisse: http://localhost:5500/caisse.html
- Frontend Préparateur: http://localhost:5500/preparateur.html
- Frontend Admin: http://localhost:5500/admin.html

## 🚀 Déploiement Gratuit

### Option 1: Supabase + Vercel (Recommandé)

#### Base de données sur Supabase (Gratuit)

1. Créer un compte sur [Supabase](https://supabase.com)
2. Créer un nouveau projet
3. Dans l'éditeur SQL, coller le contenu de `database/schema.sql`
4. Récupérer la connection string dans Settings → Database

#### Backend sur Railway (Gratuit)

1. Créer un compte sur [Railway](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Sélectionner votre repository
4. Configurer les variables d'environnement:
   ```
   DATABASE_URL=<votre_supabase_url>
   NODE_ENV=production
   FRONTEND_URL=<votre_vercel_url>
   ```
5. Railway détectera automatiquement Node.js et déploiera

#### Frontend sur Vercel (Gratuit)

1. Créer un compte sur [Vercel](https://vercel.com)
2. "New Project" → Importer votre repository
3. Configurer:
   - Root Directory: `frontend`
   - Framework Preset: Other
4. Variables d'environnement:
   ```
   VITE_API_URL=<votre_railway_url>/api
   ```
5. Déployer

### Option 2: Render (Tout-en-un, Gratuit)

1. Créer un compte sur [Render](https://render.com)
2. Créer une base PostgreSQL (gratuit)
3. Exécuter le schéma SQL via Render Dashboard
4. Créer un Web Service pour le backend:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
5. Créer un Static Site pour le frontend:
   - Build Command: (vide)
   - Publish Directory: `frontend`

### Option 3: Fly.io (Backend) + Netlify (Frontend)

Documentation complète disponible sur demande.

## 📱 Utilisation

### Workflow complet

1. **Client** crée une commande:
   - Choisit un nom unique
   - Sélectionne les articles
   - Vérifie la disponibilité
   - Se présente à la caisse

2. **Caissier** encaisse:
   - Recherche la commande
   - Vérifie le montant
   - Encaisse le paiement
   - Valide la transaction

3. **Préparateur** livre:
   - Voit la commande apparaître automatiquement
   - Prépare les articles
   - Marque comme livrée

4. **Client** récupère:
   - Voit "Commande payée" sur son écran
   - Se présente au préparateur
   - Récupère sa commande

### Points importants

- ⚠️ Le nom de commande doit être **unique**
- ✅ Le stock est vérifié avant le paiement
- 🔄 Le stock est décrémenté automatiquement au paiement
- 📊 Tout est tracé dans la base de données
- 🔒 Une commande ne peut pas être payée deux fois

## 📚 API Documentation

### Endpoints Principaux

#### Articles

```
GET /api/articles
GET /api/articles/:id
PUT /api/articles/:id/stock
```

#### Commandes

```
POST /api/commandes
GET /api/commandes/nom/:nom_commande
GET /api/commandes/statut/:statut
POST /api/commandes/:id/verifier
PUT /api/commandes/:id/payer
PUT /api/commandes/:id/livrer
GET /api/commandes/:id/detail
```

#### Statistiques

```
GET /api/stats/overview
GET /api/stats/articles
GET /api/historique/commandes
```

### Exemples de requêtes

**Créer une commande:**

```javascript
POST /api/commandes
{
  "nom_commande": "Jean",
  "items": [
    { "article_id": 1, "quantite": 2 },
    { "article_id": 5, "quantite": 1 }
  ]
}
```

**Payer une commande:**

```javascript
PUT /api/commandes/123/payer
{
  "montant_paye": 25.00
}
```

## 🛠️ Configuration CI/CD

Le projet inclut un workflow GitHub Actions pour:
- ✅ Tests automatiques
- 🚀 Déploiement automatique sur push
- 📦 Build et validation

## 🔒 Sécurité

- Validation des données côté serveur
- Prévention des injections SQL (prepared statements)
- Vérification du stock avant paiement
- Historique complet des transactions
- Headers de sécurité avec Helmet.js

## 📄 Licence

MIT License - Libre d'utilisation

## 👥 Auteurs

EPMA Lyon - Application pour concert gospel

## 🆘 Support

Pour toute question ou problème:
1. Vérifier la console du navigateur (F12)
2. Vérifier les logs du serveur
3. Consulter la documentation de l'API

## 🎯 Roadmap

- [ ] Authentification utilisateurs
- [ ] Export des statistiques en PDF/Excel
- [ ] Notifications push
- [ ] Paiement par carte
- [ ] Multi-événements
- [ ] Application mobile native

---

Fait avec ❤️ pour le concert gospel ANTSA PRAISE
