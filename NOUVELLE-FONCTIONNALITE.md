# ✨ NOUVELLE FONCTIONNALITÉ - Création de Commande Immédiate

## 🎯 Changement de Comportement

### Avant
1. Client saisit le nom
2. Client sélectionne les articles
3. **Commande créée seulement lors de "Vérifier disponibilité"**

### Maintenant ✅
1. Client saisit le nom
2. **Commande créée immédiatement en base avec statut "en_attente"**
3. Client sélectionne les articles
4. **Commande mise à jour en temps réel** (auto-save après 1 seconde)
5. Client vérifie disponibilité

## 🚀 Avantages

### Pour le Client
- ✅ **Pas de perte de panier** - La commande est sauvegardée automatiquement
- ✅ **Peut revenir plus tard** - Nom de commande déjà réservé
- ✅ **Auto-save** - Modifications enregistrées automatiquement

### Pour la Buvette
- ✅ **Suivi en temps réel** - Voir les commandes en cours de création
- ✅ **Moins d'erreurs** - Pas de duplication de noms
- ✅ **Traçabilité** - Toutes les commandes sont enregistrées

## 📝 Workflow Détaillé

### Étape 1: Création de la commande

**Page Client → Saisie du nom → Clic "Commencer ma commande"**

```javascript
// 1. Vérifie si le nom existe déjà
// 2. Si oui et en_attente → Propose de continuer
// 3. Si non → Crée en base avec items = []
// 4. Redirige vers sélection articles
```

**En base de données:**
```sql
INSERT INTO commandes (nom_commande, statut) 
VALUES ('Jean', 'en_attente');
-- ID: 1, montant_total: 0€
```

### Étape 2: Sélection des articles

**Page Client → Ajoute des articles au panier**

```javascript
// À chaque modification:
// 1. Met à jour le panier local
// 2. Attend 1 seconde (debounce)
// 3. Envoie la mise à jour au serveur
```

**Client ajoute 2 Box Salé:**
```sql
-- Auto-save après 1 seconde
DELETE FROM commande_items WHERE commande_id = 1;
INSERT INTO commande_items (commande_id, article_id, quantite, prix_unitaire)
VALUES (1, 1, 2, 5.00);
-- montant_total auto-calculé par trigger: 10€
```

**Client ajoute 1 Coca:**
```sql
-- Auto-save après 1 seconde
DELETE FROM commande_items WHERE commande_id = 1;
INSERT INTO commande_items (commande_id, article_id, quantite, prix_unitaire)
VALUES 
  (1, 1, 2, 5.00),
  (1, 6, 1, 1.00);
-- montant_total: 11€
```

### Étape 3: Vérification

**Page Client → Clic "Vérifier disponibilité"**

```javascript
// 1. Force la mise à jour finale
// 2. Vérifie le stock disponible
// 3. Affiche OK ou articles manquants
```

### Étape 4: Paiement (inchangé)

**Caisse → Recherche "Jean" → Encaisse**

Fonctionne exactement comme avant.

## 🔧 Modifications Techniques

### Frontend (client.js)

#### 1. Fonction `creerCommande()`
```javascript
// Avant: Juste stockage local
commandeEnCours = { nom_commande: nomCommande };

// Maintenant: Création en base
commandeEnCours = await apiPost('/commandes', {
    nom_commande: nomCommande,
    items: [] // Vide au départ
});
```

#### 2. Fonction `modifierQuantite()`
```javascript
// Ajout de l'auto-save
function modifierQuantite(articleId, delta) {
    // ... mise à jour du panier local
    
    // Nouveau: Auto-save en base
    mettreAJourCommandeEnBase(); // Debounce 1 seconde
}
```

#### 3. Nouvelle fonction `mettreAJourCommandeEnBase()`
```javascript
// Attend 1 seconde avant d'envoyer
// Évite trop de requêtes
async function mettreAJourCommandeEnBase() {
    clearTimeout(timeoutMiseAJour);
    timeoutMiseAJour = setTimeout(async () => {
        await apiPut(`/commandes/${commandeEnCours.id}/items`, { items });
    }, 1000);
}
```

#### 4. Fonction `verifierDisponibilite()` simplifiée
```javascript
// Avant: Créer ou mettre à jour la commande
// Maintenant: Juste vérifier (commande déjà en base)
async function verifierDisponibilite() {
    // Force la dernière mise à jour
    await mettreAJourCommandeEnBaseSynchrone();
    
    // Vérifie disponibilité
    const verification = await apiPost(`/commandes/${commandeEnCours.id}/verifier`);
}
```

### Backend (server.js)

#### 1. Endpoint POST `/api/commandes` modifié
```javascript
// Avant: items obligatoire
if (!nom_commande || !items || items.length === 0) {
    return res.status(400).json({ error: 'Nom de commande et articles requis' });
}

// Maintenant: items optionnel
if (!nom_commande) {
    return res.status(400).json({ error: 'Nom de commande requis' });
}

// Accepte items = [] ou items = undefined
if (items && items.length > 0) {
    // Ajouter les items
}
```

#### 2. Nouvel endpoint PUT `/api/commandes/:id/items`
```javascript
// Permet de mettre à jour les items d'une commande en_attente
app.put('/api/commandes/:id/items', async (req, res) => {
    // 1. Vérifie que statut = 'en_attente'
    // 2. Supprime les anciens items
    // 3. Insert les nouveaux items
    // 4. Recalcule le total (trigger auto)
});
```

## 💡 Cas d'Usage

### Cas 1: Commande normale
```
1. Jean crée "Jean"          → Commande ID:1 créée
2. Jean ajoute 2 Box Salé    → Auto-save après 1s
3. Jean ajoute 1 Coca        → Auto-save après 1s
4. Jean vérifie              → OK
5. Jean paie à la caisse     → Statut: payée
```

### Cas 2: Client interrompu
```
1. Marie crée "Marie"        → Commande ID:2 créée
2. Marie ajoute 1 Hot Dog    → Auto-save après 1s
3. Marie ferme l'application → Commande reste en_attente
4. Marie revient plus tard   → "Continuer la commande ?"
5. Marie ajoute 1 Coca       → Auto-save après 1s
6. Marie vérifie et paie     → OK
```

### Cas 3: Stock épuisé
```
1. Paul crée "Paul"          → Commande ID:3 créée
2. Paul ajoute 10 Box Salé   → Auto-save après 1s
3. Entre temps: 8 vendus     → Stock: 2 restants
4. Paul vérifie              → ⚠️ Disponible: 2
5. Paul modifie: 2 Box Salé  → Auto-save après 1s
6. Paul vérifie              → ✓ OK
7. Paul paie                 → Statut: payée
```

### Cas 4: Doublon
```
1. Sophie crée "Sophie"      → Commande ID:4 créée
2. Sophie va à la caisse     → Paie
3. Sophie revient            → "Sophie" déjà payée
4. Sophie doit choisir       → "Sophie2" par exemple
```

## 🔍 Détection des Commandes Abandonnées

Les commandes en `statut = 'en_attente'` sans paiement peuvent s'accumuler.

### Solution future possible:
```sql
-- Nettoyer les commandes abandonnées de plus de 24h
DELETE FROM commandes 
WHERE statut = 'en_attente' 
  AND created_at < NOW() - INTERVAL '24 hours';
```

Ou via l'interface Admin:
- Afficher les commandes "en_attente" depuis plus de X heures
- Bouton "Supprimer les commandes abandonnées"

## 🎨 Améliorations Possibles

### 1. Indicateur de sauvegarde
```javascript
// Afficher "Sauvegarde en cours..."
function mettreAJourCommandeEnBase() {
    showSaving(); // Nouveau
    // ... enregistrement
    showSaved();  // "✓ Sauvegardé"
}
```

### 2. Message de confirmation
```javascript
// Lors de la création
showSuccess(`Commande "${nomCommande}" créée et sauvegardée !`);
```

### 3. Timer d'inactivité
```javascript
// Avertir si panier non validé depuis 10 minutes
setTimeout(() => {
    alert("Pensez à valider votre commande !");
}, 10 * 60 * 1000);
```

## 📊 Impact sur la Base de Données

### Avant
- 1 INSERT lors du paiement
- Toutes les commandes sont payées ou livrées

### Maintenant
- 1 INSERT à la création (nom uniquement)
- N UPDATE lors de la sélection (items)
- Plus de commandes en `statut = 'en_attente'`

**Note**: Les commandes "en_attente" non payées restent en base.
Prévoir un nettoyage périodique si nécessaire.

## ✅ Tests Recommandés

1. **Création normale**
   - Créer "Test1" → Vérifier en base
   - Ajouter articles → Vérifier auto-save
   - Payer → Vérifier statut

2. **Interruption**
   - Créer "Test2" → Ajouter articles
   - Fermer navigateur
   - Rouvrir → Rechercher "Test2"
   - Vérifier que le panier est intact

3. **Doublon**
   - Créer "Test3" → Payer
   - Re-créer "Test3" → Erreur attendue

4. **Stock insuffisant**
   - Créer commande
   - Demander plus que le stock
   - Vérifier alerte

## 🚀 Déploiement

Les modifications sont compatibles avec l'existant.
Pas besoin de migration de base de données.

**Pour appliquer:**
1. Remplacer `frontend/js/client.js`
2. Remplacer `backend/server.js`
3. Redémarrer le backend
4. Actualiser le frontend

**Test rapide:**
```bash
# 1. Redémarrer le backend
docker-compose restart backend

# 2. Vider le cache navigateur
# Ctrl+Shift+R (Chrome/Firefox)

# 3. Créer une commande test
# Vérifier l'auto-save dans les logs backend
docker-compose logs -f backend
```

---

**Date**: 4 Décembre 2025
**Auteur**: EPMA Lyon
**Version**: 2.0 - Auto-save activé
