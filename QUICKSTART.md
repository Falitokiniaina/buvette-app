# 🚀 DÉMARRAGE RAPIDE

## Structure du Projet

```
buvette-app/
├── backend/              # API Node.js + Express
│   ├── server.js        # Serveur principal
│   ├── db.js            # Configuration PostgreSQL
│   ├── package.json     # Dépendances
│   ├── Dockerfile       # Pour Docker
│   └── .env.example     # Template variables d'environnement
│
├── frontend/            # Interface web
│   ├── index.html       # Page client (commande)
│   ├── caisse.html      # Page caisse (paiement)
│   ├── preparateur.html # Page préparateur (livraison)
│   ├── admin.html       # Page admin (stats)
│   ├── css/
│   │   └── style.css    # Styles responsive
│   └── js/
│       ├── config.js    # Configuration globale
│       ├── client.js    # Logique page client
│       ├── caisse.js    # Logique page caisse
│       ├── preparateur.js # Logique préparateur
│       └── admin.js     # Logique admin
│
├── database/
│   └── schema.sql       # Schéma PostgreSQL complet
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml    # GitHub Actions
│
├── docker-compose.yml   # Pour développement local
├── nginx.conf          # Configuration proxy
├── README.md           # Documentation complète
└── DEPLOYMENT.md       # Guide déploiement détaillé
```

## 📋 3 Façons de Démarrer

### 1️⃣ Développement Local Simple (le plus rapide)

**Prérequis**: Node.js + PostgreSQL installés

```bash
# 1. Créer la base de données
createdb buvette_db
psql -d buvette_db -f database/schema.sql

# 2. Configurer le backend
cd backend
cp .env.example .env
# Éditer .env avec vos paramètres
npm install
npm start

# 3. Démarrer le frontend (nouveau terminal)
cd frontend
python -m http.server 5500
# Ou utiliser VSCode Live Server
```

✅ Ouvrir http://localhost:5500

### 2️⃣ Avec Docker (recommandé)

**Prérequis**: Docker Desktop installé

```bash
# Tout en une commande!
docker-compose up -d
```

✅ Ouvrir http://localhost:5500

Tout est configuré automatiquement:
- PostgreSQL sur port 5432
- Backend sur port 3000
- Frontend sur port 5500

### 3️⃣ Déploiement en Production (gratuit)

Suivre le guide complet dans `DEPLOYMENT.md`

**TL;DR:**
1. Base de données → Supabase (gratuit)
2. Backend → Railway (gratuit)
3. Frontend → Vercel (gratuit)

Temps total: ~15 minutes

## 🎯 Accès aux Pages

Une fois lancé:

- **Clients** (commande): http://localhost:5500/index.html
- **Caisse** (paiement): http://localhost:5500/caisse.html
- **Préparateur** (livraison): http://localhost:5500/preparateur.html
- **Admin** (stats): http://localhost:5500/admin.html

## 🧪 Test Rapide

### Scénario complet:

1. **Page Client** → Créer commande "TestJean"
2. **Page Client** → Ajouter 2 Box Salé + 1 Coca
3. **Page Client** → Vérifier disponibilité → OK
4. **Page Caisse** → Rechercher "TestJean" → Encaisser
5. **Page Client** → Actualiser → "Commande payée !"
6. **Page Préparateur** → Voir "TestJean" → Livrer
7. **Page Admin** → Voir les stats

## 📊 Base de Données

### Articles pré-chargés:

- Box Salé (5€) - Stock: 50
- Box Sucré (5€) - Stock: 50
- Bagnat Catless (8€) - Stock: 30
- Hot Dog + Frites (8€) - Stock: 40
- Vary Anana (8€) - Stock: 35
- Coca Cola (1€) - Stock: 100
- Orangina (1€) - Stock: 100
- Ice Tea (1€) - Stock: 100
- Eau (1€) - Stock: 150

### Modifier les articles:

```sql
-- Se connecter à la base
psql -d buvette_db

-- Ajouter un article
INSERT INTO articles (nom, description, prix, stock_disponible) 
VALUES ('Pizza', 'Pizza margarita', 12.00, 20);

-- Modifier le stock
UPDATE articles SET stock_disponible = 100 WHERE nom = 'Coca Cola';

-- Modifier le prix
UPDATE articles SET prix = 1.50 WHERE nom = 'Coca Cola';
```

Ou via la **Page Admin** de l'application!

## 🔧 Configuration

### Variables d'environnement (backend/.env):

```env
# Base de données
DATABASE_URL=postgresql://postgres:password@localhost:5432/buvette_db

# Serveur
PORT=3000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5500
```

### API URL (frontend/js/config.js):

```javascript
const API_URL = 'http://localhost:3000/api';
```

## 🐛 Dépannage

### Erreur de connexion à la base de données:

```bash
# Vérifier que PostgreSQL est lancé
psql -U postgres

# Recréer la base
dropdb buvette_db
createdb buvette_db
psql -d buvette_db -f database/schema.sql
```

### Erreur CORS:

Dans `backend/server.js`, modifier:

```javascript
app.use(cors({
  origin: '*', // Accepter toutes les origines (dev only!)
  credentials: true
}));
```

### Port déjà utilisé:

```bash
# Changer le port dans backend/.env
PORT=3001

# Ou tuer le processus
lsof -ti:3000 | xargs kill -9
```

## 📱 Accès depuis mobile (même réseau WiFi)

1. Trouver votre IP:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

2. Remplacer `localhost` par votre IP:
   - Frontend: `http://192.168.1.10:5500`
   - Backend `.env`: `FRONTEND_URL=http://192.168.1.10:5500`

## 🔐 Sécurité

Pour la production:
- ✅ Utiliser HTTPS
- ✅ Changer les mots de passe
- ✅ Activer l'authentification
- ✅ Limiter CORS aux domaines autorisés
- ✅ Utiliser des variables d'environnement

## 📚 Ressources

- **Documentation complète**: `README.md`
- **Guide de déploiement**: `DEPLOYMENT.md`
- **Schéma de la base**: `database/schema.sql`
- **API Endpoints**: Section dans `README.md`

## 🎉 Prêt à l'Emploi!

L'application est conçue pour être utilisée immédiatement:
- ✅ Base de données pré-configurée
- ✅ Articles pré-chargés
- ✅ Interface complète
- ✅ Responsive mobile/desktop
- ✅ Actualisation en temps réel

**Besoin d'aide?** Consultez `README.md` et `DEPLOYMENT.md`

**Bon concert! 🎵**
