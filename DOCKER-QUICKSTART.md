# 🐳 Démarrage Rapide avec Docker - CORRIGÉ

## ✅ Problème Résolu

L'erreur `npm ci --only=production` a été corrigée !

## 🚀 Méthode Simplifiée (Recommandée)

### Prérequis
- Docker Desktop installé et lancé
- Les fichiers du projet buvette-app

### Étapes (3 commandes)

```bash
# 1. Aller dans le dossier du projet
cd buvette-app

# 2. Lancer Docker Compose
docker-compose up -d

# 3. Suivre les logs (optionnel)
docker-compose logs -f
```

### ⏱️ Temps d'attente
- **1ère fois** : 2-3 minutes (téléchargement des images + installation npm)
- **Après** : 10-20 secondes

### ✅ Vérification

**1. Vérifier que tout tourne:**
```bash
docker-compose ps
```

Vous devriez voir:
```
NAME                 STATUS
buvette_backend      Up
buvette_db           Up (healthy)
buvette_frontend     Up
```

**2. Tester l'API:**
```bash
curl http://localhost:3000/api/health
```

**3. Ouvrir le navigateur:**
- Frontend: http://localhost:5500
- Page client: http://localhost:5500/index.html
- Page caisse: http://localhost:5500/caisse.html
- Page préparateur: http://localhost:5500/preparateur.html
- Page admin: http://localhost:5500/admin.html

## 🛠️ Commandes Essentielles

### Arrêter
```bash
docker-compose down
```

### Redémarrer
```bash
docker-compose restart
```

### Voir les logs
```bash
# Tous les services
docker-compose logs -f

# Un seul service
docker-compose logs -f backend
```

### Réinitialiser complètement
```bash
docker-compose down -v
docker-compose up -d
```

## ❌ Si ça ne marche TOUJOURS pas

### Solution 1: Nettoyer et recommencer
```bash
# Tout nettoyer
docker-compose down -v
docker system prune -a

# Recommencer
cd buvette-app
docker-compose up -d
```

### Solution 2: Installation locale (sans Docker)

Plus simple et plus rapide si Docker pose problème:

```bash
# 1. Installer PostgreSQL
# Mac: brew install postgresql
# Windows: https://www.postgresql.org/download/windows/

# 2. Démarrer PostgreSQL
# Mac: brew services start postgresql
# Windows: Démarrer via pgAdmin

# 3. Créer la base
createdb buvette_db
psql -d buvette_db -f database/schema.sql

# 4. Configurer le backend
cd backend
cp .env.example .env
# Éditer .env: DATABASE_URL=postgresql://postgres:password@localhost:5432/buvette_db

# 5. Installer et lancer le backend
npm install
npm start

# 6. Lancer le frontend (nouveau terminal)
cd ../frontend
python -m http.server 5500
# Ou avec Node: npx http-server -p 5500
# Ou avec VSCode: Live Server
```

## 🎯 Architecture Simple

```
Docker Compose lance:
├── PostgreSQL (port 5432) - Base de données
├── Backend (port 3000) - API Node.js
└── Frontend (port 5500) - Interface web
```

## 📊 Vérifier la Base de Données

```bash
# Se connecter à PostgreSQL
docker-compose exec postgres psql -U postgres -d buvette_db

# Lister les articles
SELECT * FROM articles;

# Quitter
\q
```

## 🔧 Paramètres Modifiables

Éditer `docker-compose.yml` pour changer:

**Ports:**
```yaml
ports:
  - "5433:5432"  # PostgreSQL sur 5433
  - "3001:3000"  # Backend sur 3001
  - "8080:80"    # Frontend sur 8080
```

**Mot de passe:**
```yaml
environment:
  POSTGRES_PASSWORD: mon_super_mot_de_passe
```

Puis redémarrer: `docker-compose down && docker-compose up -d`

## 💡 Conseils

- ✅ **Toujours vérifier** que Docker Desktop est lancé
- ✅ **Attendre 2-3 minutes** au premier démarrage
- ✅ **Consulter les logs** en cas de problème: `docker-compose logs -f`
- ✅ **Réinitialiser** si ça ne marche pas: `docker-compose down -v && docker-compose up -d`

## 📖 Documentation Complète

Pour plus de détails:
- **DOCKER-TROUBLESHOOTING.md** - Guide de dépannage complet
- **QUICKSTART.md** - Autres méthodes de démarrage
- **README.md** - Documentation technique

## 🎉 C'est Parti !

Une fois que vous voyez:
```
✔ Container buvette_db Started
✔ Container buvette_backend Started  
✔ Container buvette_frontend Started
```

Ouvrez http://localhost:5500 et commencez à commander ! 🍔🥤

---

**Note**: Cette version corrigée évite tous les problèmes de build npm. Ça devrait fonctionner du premier coup ! 🚀
