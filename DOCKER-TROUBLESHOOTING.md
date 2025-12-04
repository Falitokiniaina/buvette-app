# 🔧 Guide de Dépannage Docker

## Problème Résolu : Erreur "npm ci" 

✅ **Solution appliquée** : Le docker-compose a été simplifié pour éviter les problèmes de build.

## 🚀 Démarrage Docker (Méthode Corrigée)

### 1. Nettoyer l'ancien environnement

```bash
# Arrêter tous les conteneurs
docker-compose down

# Supprimer les volumes (ATTENTION: efface la base de données)
docker-compose down -v

# Nettoyer les images (optionnel)
docker system prune -a
```

### 2. Lancer l'application

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs en temps réel
docker-compose logs -f

# Vérifier que tout fonctionne
docker-compose ps
```

### 3. Vérifier que ça fonctionne

**Backend (API):**
```bash
curl http://localhost:3000/api/health
```

Devrait retourner:
```json
{
  "status": "OK",
  "timestamp": "...",
  "database": "connected"
}
```

**Frontend:**
- Ouvrir http://localhost:5500 dans votre navigateur

## 🐛 Problèmes Courants et Solutions

### 1. Port déjà utilisé

**Erreur:** `Bind for 0.0.0.0:5432 failed: port is already allocated`

**Solution:**
```bash
# Trouver quel processus utilise le port
lsof -i :5432  # ou :3000 ou :5500

# Tuer le processus
kill -9 <PID>

# Ou changer le port dans docker-compose.yml
ports:
  - "5433:5432"  # PostgreSQL
  - "3001:3000"  # Backend
  - "5501:80"    # Frontend
```

### 2. Base de données ne démarre pas

**Erreur:** `database system is not ready yet`

**Solution:**
```bash
# Attendre un peu plus (healthcheck)
docker-compose logs postgres

# Réinitialiser complètement
docker-compose down -v
docker volume rm buvette_postgres_data
docker-compose up -d
```

### 3. Backend ne se connecte pas à la base

**Erreur:** `Error: connect ECONNREFUSED`

**Solution:**
```bash
# Vérifier que PostgreSQL est prêt
docker-compose exec postgres pg_isready -U postgres

# Recréer le réseau Docker
docker-compose down
docker network prune
docker-compose up -d
```

### 4. npm install échoue dans le conteneur

**Erreur:** `npm ERR! code EACCES`

**Solution:**
```bash
# Supprimer node_modules local
rm -rf backend/node_modules

# Redémarrer
docker-compose down
docker-compose up -d --build
```

### 5. Frontend ne trouve pas l'API

**Erreur:** `Failed to fetch` dans la console navigateur

**Solution:**

Vérifier que nginx.conf est correct:
```bash
# Vérifier la config nginx
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Redémarrer nginx
docker-compose restart frontend
```

### 6. Problème de permissions

**Erreur:** `Permission denied`

**Solution:**
```bash
# Linux/Mac: Donner les droits
sudo chown -R $USER:$USER .

# Ou lancer Docker en root (non recommandé)
sudo docker-compose up -d
```

## 🔄 Commandes Utiles

### Voir les logs
```bash
# Tous les services
docker-compose logs -f

# Un service spécifique
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f frontend
```

### Entrer dans un conteneur
```bash
# Backend
docker-compose exec backend sh

# PostgreSQL
docker-compose exec postgres psql -U postgres -d buvette_db

# Frontend (nginx)
docker-compose exec frontend sh
```

### Redémarrer un service
```bash
# Tout
docker-compose restart

# Un service
docker-compose restart backend
```

### Voir l'état des conteneurs
```bash
docker-compose ps
```

### Reconstruire les images
```bash
docker-compose up -d --build
```

## 🗄️ Gérer la Base de Données

### Accéder à PostgreSQL
```bash
docker-compose exec postgres psql -U postgres -d buvette_db
```

### Réinitialiser la base
```bash
# Méthode 1: Supprimer le volume
docker-compose down -v
docker-compose up -d

# Méthode 2: Depuis psql
docker-compose exec postgres psql -U postgres -d buvette_db -f /docker-entrypoint-initdb.d/schema.sql
```

### Exporter les données
```bash
docker-compose exec postgres pg_dump -U postgres buvette_db > backup.sql
```

### Importer des données
```bash
docker-compose exec -T postgres psql -U postgres -d buvette_db < backup.sql
```

## 🧹 Nettoyage Complet

Si tout est cassé, recommencer de zéro:

```bash
# 1. Tout arrêter
docker-compose down -v

# 2. Supprimer les images
docker rmi $(docker images -q buvette*)

# 3. Nettoyer Docker
docker system prune -a --volumes

# 4. Supprimer node_modules local
rm -rf backend/node_modules

# 5. Redémarrer
docker-compose up -d

# 6. Suivre les logs
docker-compose logs -f
```

## 🎯 Checklist de Vérification

Après le démarrage, vérifier:

- [ ] PostgreSQL est prêt: `docker-compose exec postgres pg_isready`
- [ ] Backend répond: `curl http://localhost:3000/api/health`
- [ ] Frontend accessible: ouvrir http://localhost:5500
- [ ] API accessible depuis frontend: ouvrir console navigateur (F12)
- [ ] Base contient les données: `docker-compose exec postgres psql -U postgres -d buvette_db -c "SELECT * FROM articles;"`

## 📱 Accès depuis d'autres appareils (même réseau)

```bash
# 1. Trouver votre IP
# Mac/Linux
ifconfig | grep "inet "
# Windows
ipconfig

# 2. Modifier docker-compose.yml
# Changer FRONTEND_URL avec votre IP:
FRONTEND_URL: http://192.168.1.10:5500

# 3. Redémarrer
docker-compose restart backend

# 4. Accéder depuis mobile/tablette
# Frontend: http://192.168.1.10:5500
```

## 🆘 Toujours des problèmes ?

### Vérifier Docker
```bash
# Version Docker
docker --version
docker-compose --version

# Docker fonctionne ?
docker run hello-world
```

### Logs détaillés
```bash
# Tout arrêter
docker-compose down

# Démarrer avec logs verbeux
docker-compose up --verbose
```

### Alternative : Sans Docker

Si Docker pose trop de problèmes, utilisez l'installation locale:

```bash
# 1. Installer PostgreSQL localement
# 2. Créer la base
createdb buvette_db
psql -d buvette_db -f database/schema.sql

# 3. Lancer le backend
cd backend
npm install
npm start

# 4. Lancer le frontend
cd frontend
python -m http.server 5500
```

## 💡 Conseils

- **Toujours vérifier les logs** avec `docker-compose logs -f`
- **Attendre que PostgreSQL soit prêt** avant que le backend démarre
- **Nettoyer régulièrement** avec `docker system prune`
- **Utiliser des ports différents** si nécessaire
- **Sauvegarder vos données** avant un nettoyage complet

## 📞 Support

Si rien ne fonctionne:
1. Vérifier que Docker Desktop est lancé
2. Redémarrer Docker Desktop
3. Essayer l'installation locale (sans Docker)
4. Consulter les logs Docker Desktop

---

**Note**: Ces solutions résolvent 99% des problèmes Docker. Si vous avez toujours des erreurs, partagez les logs complets.
