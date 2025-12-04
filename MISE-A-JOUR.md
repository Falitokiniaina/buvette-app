# 🔄 GUIDE DE MISE À JOUR - Auto-Save Commande

## 📋 Résumé des Changements

**Nouvelle fonctionnalité**: La commande est maintenant créée et sauvegardée dès le clic sur "Commencer ma commande", puis mise à jour automatiquement à chaque modification du panier.

## 🎯 Avant de Commencer

**Vous avez besoin de cette mise à jour si:**
- ✅ Vous voulez que les commandes soient sauvegardées en temps réel
- ✅ Vous voulez éviter la perte de panier si le client ferme la page
- ✅ Vous voulez pouvoir reprendre une commande en cours

**Vous pouvez ignorer si:**
- ❌ Vous n'avez pas encore déployé l'application
- ❌ Vous préférez l'ancien comportement (création au moment du paiement)

## 🚀 Méthode 1: Avec Docker (Recommandé)

### Étape 1: Arrêter l'application
```bash
cd buvette-app
docker-compose down
```

### Étape 2: Sauvegarder (optionnel mais recommandé)
```bash
# Sauvegarder la base de données
docker-compose exec postgres pg_dump -U postgres buvette_db > backup_avant_maj.sql

# Ou copier tout le dossier
cp -r buvette-app buvette-app-backup
```

### Étape 3: Remplacer les fichiers
```bash
# Remplacer le fichier JavaScript client
cp frontend/js/client.js.nouveau frontend/js/client.js

# Remplacer le serveur backend
cp backend/server.js.nouveau backend/server.js
```

**Ou télécharger la nouvelle archive et extraire:**
```bash
# Extraire la nouvelle version
tar -xzf buvette-app-v2.tar.gz

# Les fichiers sont déjà à jour
```

### Étape 4: Redémarrer
```bash
docker-compose up -d
```

### Étape 5: Vérifier
```bash
# Voir les logs
docker-compose logs -f backend

# Tester
# Ouvrir http://localhost:5500
# Créer une commande
# Ajouter des articles
# Vérifier dans les logs: "PUT /api/commandes/:id/items"
```

## 🖥️ Méthode 2: Installation Locale (Sans Docker)

### Étape 1: Arrêter le serveur
```bash
# Dans le terminal backend
Ctrl+C
```

### Étape 2: Sauvegarder (optionnel)
```bash
# Sauvegarder la base
pg_dump -U postgres buvette_db > backup_avant_maj.sql

# Copier les fichiers
cp backend/server.js backend/server.js.backup
cp frontend/js/client.js frontend/js/client.js.backup
```

### Étape 3: Remplacer les fichiers
```bash
# Télécharger la nouvelle version ou copier manuellement
# Les fichiers à remplacer:
# - backend/server.js
# - frontend/js/client.js
```

### Étape 4: Redémarrer
```bash
# Backend
cd backend
npm start

# Frontend (nouveau terminal)
cd frontend
python -m http.server 5500
```

### Étape 5: Vérifier
Ouvrir http://localhost:5500 et tester.

## 🧪 Test de la Mise à Jour

### Test 1: Création immédiate
1. Aller sur la page client
2. Saisir "TestMAJ"
3. Cliquer "Commencer ma commande"
4. **Vérifier**: Dans les logs backend, vous devez voir:
   ```
   POST /api/commandes 201
   ```

### Test 2: Auto-save
1. Ajouter 2 articles au panier
2. **Attendre 1 seconde**
3. **Vérifier**: Dans les logs backend, vous devez voir:
   ```
   PUT /api/commandes/1/items 200
   ```

### Test 3: Reprise de commande
1. Créer "TestReprise"
2. Ajouter des articles
3. Fermer l'onglet
4. Rouvrir la page
5. Saisir "TestReprise"
6. **Vérifier**: Message "Cette commande existe déjà. Voulez-vous la continuer ?"
7. Cliquer "OK"
8. **Vérifier**: Le panier est restauré

### Test 4: Workflow complet
1. Créer "TestComplet"
2. Ajouter 3 articles
3. Vérifier disponibilité
4. Aller à la caisse
5. Payer
6. **Vérifier**: Tout fonctionne comme avant

## 🗄️ Vérification Base de Données

### Vérifier les commandes en attente
```sql
-- Se connecter
psql -U postgres -d buvette_db

-- Voir les commandes en attente
SELECT * FROM commandes WHERE statut = 'en_attente';

-- Voir les items d'une commande
SELECT c.nom_commande, ci.*, a.nom as article_nom
FROM commandes c
JOIN commande_items ci ON c.id = ci.commande_id
JOIN articles a ON ci.article_id = a.id
WHERE c.nom_commande = 'TestMAJ';
```

## 🔄 Retour en Arrière (Rollback)

Si vous voulez revenir à l'ancienne version:

### Avec Docker
```bash
# Arrêter
docker-compose down

# Restaurer les anciens fichiers
cp backend/server.js.backup backend/server.js
cp frontend/js/client.js.backup frontend/js/client.js

# Redémarrer
docker-compose up -d
```

### Avec Sauvegarde Complète
```bash
# Supprimer la nouvelle version
rm -rf buvette-app

# Restaurer la sauvegarde
cp -r buvette-app-backup buvette-app

# Redémarrer
cd buvette-app
docker-compose up -d
```

### Restaurer la Base de Données
```bash
# Si problème avec la base
docker-compose down -v
docker-compose up -d postgres

# Attendre que PostgreSQL soit prêt
sleep 10

# Restaurer
docker-compose exec -T postgres psql -U postgres -d buvette_db < backup_avant_maj.sql

# Redémarrer tout
docker-compose up -d
```

## 🧹 Nettoyage des Commandes Abandonnées

Avec la nouvelle fonctionnalité, des commandes "en_attente" peuvent s'accumuler.

### Option 1: Nettoyage Manuel (SQL)
```sql
-- Supprimer les commandes de plus de 24h
DELETE FROM commandes 
WHERE statut = 'en_attente' 
  AND created_at < NOW() - INTERVAL '24 hours';
```

### Option 2: Via l'Interface Admin (à venir)
Une future mise à jour ajoutera un bouton dans la page Admin.

### Option 3: Script Automatique
```bash
# Créer un script de nettoyage
cat > cleanup-abandoned.sh << 'EOF'
#!/bin/bash
docker-compose exec -T postgres psql -U postgres -d buvette_db << SQL
DELETE FROM commandes 
WHERE statut = 'en_attente' 
  AND created_at < NOW() - INTERVAL '24 hours';
SQL
EOF

chmod +x cleanup-abandoned.sh

# Lancer manuellement
./cleanup-abandoned.sh

# Ou via cron (tous les jours à 3h du matin)
crontab -e
# Ajouter: 0 3 * * * /path/to/cleanup-abandoned.sh
```

## 📊 Comparaison Avant/Après

### Workflow Avant
```
1. Nom → 2. Articles → 3. Vérifier → [CRÉATION EN BASE] → 4. Payer
```

### Workflow Maintenant
```
1. Nom → [CRÉATION EN BASE] → 2. Articles → [AUTO-SAVE] → 3. Vérifier → 4. Payer
```

## ⚠️ Points d'Attention

### 1. Commandes en Attente
- Les commandes non payées restent en base
- Prévoir un nettoyage périodique
- Surveiller l'espace disque

### 2. Performances
- Plus de requêtes à la base de données
- Debounce de 1 seconde pour limiter
- Impact minimal en pratique

### 3. Concurrence
- Si deux clients utilisent le même nom simultanément
- Le premier réserve le nom
- Le second reçoit une erreur

## 💡 Recommandations

### Pour la Production
1. ✅ Tester en local d'abord
2. ✅ Faire une sauvegarde complète
3. ✅ Planifier la mise à jour en dehors d'un événement
4. ✅ Prévoir un rollback si problème
5. ✅ Informer l'équipe du nouveau comportement

### Monitoring Post-Mise à Jour
```bash
# Surveiller les logs pendant 30 minutes
docker-compose logs -f backend

# Vérifier les erreurs
docker-compose logs backend | grep ERROR

# Compter les commandes en attente
docker-compose exec postgres psql -U postgres -d buvette_db \
  -c "SELECT COUNT(*) FROM commandes WHERE statut = 'en_attente';"
```

## 🆘 Problèmes Courants

### Problème 1: Erreur "items required"
**Cause**: Ancienne version du backend
**Solution**: Vérifier que `server.js` est bien à jour

### Problème 2: Auto-save ne fonctionne pas
**Cause**: Cache navigateur
**Solution**: Vider le cache (Ctrl+Shift+R)

### Problème 3: Trop de commandes en attente
**Cause**: Normal avec la nouvelle fonctionnalité
**Solution**: Nettoyer périodiquement (voir section Nettoyage)

## 📞 Support

Si vous rencontrez des problèmes:
1. Consulter les logs: `docker-compose logs -f`
2. Vérifier les fichiers mis à jour
3. Tester avec une nouvelle commande
4. Faire un rollback si nécessaire

## ✅ Checklist de Mise à Jour

- [ ] Sauvegarde de la base de données
- [ ] Sauvegarde des fichiers
- [ ] Arrêt de l'application
- [ ] Remplacement des fichiers
- [ ] Redémarrage
- [ ] Test création de commande
- [ ] Test auto-save
- [ ] Test workflow complet
- [ ] Vérification des logs
- [ ] Documentation équipe

## 🎉 Fin de la Mise à Jour

Votre application est maintenant à jour avec la fonctionnalité d'auto-save !

**Documentation complète**: `NOUVELLE-FONCTIONNALITE.md`

---

**Version**: 2.0
**Date**: 4 Décembre 2025
