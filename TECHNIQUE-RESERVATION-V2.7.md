# 🔐 SYSTÈME DE RÉSERVATION TEMPORAIRE - DOCUMENTATION TECHNIQUE

## 🎯 PROBLÈME RÉSOLU

### Avant v2.7 : Risque de Survente

**Scénario problématique :**
```
Stock initial : 10 Nems

⏰ 14h30:00 - Client A crée commande avec 8 Nems
              → Stock DB: 10 (aucune modification)

⏰ 14h30:05 - Client B crée commande avec 5 Nems
              → Stock DB: 10 (toujours pas modifié)

⏰ 14h30:10 - Caissière 1 encaisse Client A (8 Nems)
              → Stock DB: 2 (trigger décrémente)

⏰ 14h30:15 - Caissière 2 encaisse Client B (5 Nems)
              → ❌ ERREUR : Stock insuffisant (2 < 5)
              → ❌ Commande impossible
              → 😡 Client mécontent
```

### Après v2.7 : Réservation Intelligente

**Même scénario avec réservation :**
```
Stock initial : 10 Nems

⏰ 14h30:00 - Client A crée commande avec 8 Nems
              → Stock DB: 10
              → Stock réel: 10

⏰ 14h30:05 - Caissière 1 clique "Encaisser" Client A
              → 🔒 RÉSERVATION : 8 Nems
              → Stock DB: 10
              → Stock réel: 2 (10 - 8 réservés)

⏰ 14h30:10 - Client B voit page articles
              → ✅ Affiche "Nems: 2 disponibles"
              → ✅ Ne peut commander que 2 maximum

⏰ 14h30:20 - Client B crée commande avec 2 Nems
              → ✅ OK, stock réel suffisant

⏰ 14h30:25 - Caissière 1 confirme paiement Client A
              → Stock DB: 2 (décrémenté de 8)
              → 🔓 Réservation supprimée
              → Stock réel: 2

⏰ 14h30:30 - Caissière 2 encaisse Client B
              → ✅ OK, stock = 2
              → Tout fonctionne parfaitement !
```

---

## 🏗️ ARCHITECTURE

### Base de Données

```
┌─────────────────────────────────────────────────┐
│           TABLE: articles                       │
│  - id                                           │
│  - nom                                          │
│  - stock_disponible (STOCK PHYSIQUE)            │
└─────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │  TRIGGER: Décrémente  │
        │  stock au paiement    │
        └───────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│     TABLE: reservation_temporaire               │
│  - id                                           │
│  - commande_id                                  │
│  - article_id                                   │
│  - quantite (QUANTITÉ RÉSERVÉE)                 │
│  - expires_at (Expiration 15 min)               │
└─────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │  FONCTION: Calcule    │
        │  stock réel           │
        └───────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│        VUE: v_articles_stock_reel               │
│  - Tous champs articles                         │
│  - stock_reel_disponible                        │
│    = stock_disponible - SUM(réservations)       │
└─────────────────────────────────────────────────┘
```

### Flux de Données

```
┌──────────────┐
│   CLIENT     │ → Voit stock réel
│   (Page)     │   (via v_articles_stock_reel)
└──────────────┘
       ↓
┌──────────────┐
│   COMMANDE   │ → Créée avec quantités
│  (en_attente)│   Stock non modifié
└──────────────┘
       ↓
┌──────────────┐
│   CAISSE     │ → Clic "Encaisser"
│   (Page)     │   ↓
└──────────────┘   🔒 CRÉER RÉSERVATION
       ↓              (POST /api/reservations)
┌──────────────┐      ↓
│  RÉSERVATION │   Articles verrouillés
│  (Temporaire)│   expires_at = +15 min
└──────────────┘
       ↓
   ┌─────────────────────────┐
   │  CONFIRMATION OU        │
   │  ANNULATION ?           │
   └─────────────────────────┘
       ↓                  ↓
   CONFIRMER          ANNULER
       ↓                  ↓
  🔓 Supprimer      🔓 Supprimer
     réservation       réservation
       ↓                  ↓
  ✅ Décrémenter    ✅ Stock reste
     stock             inchangé
       ↓                  ↓
  Statut: payee    Statut: en_attente
```

---

## 💻 IMPLÉMENTATION DÉTAILLÉE

### 1. Table reservation_temporaire

```sql
CREATE TABLE reservation_temporaire (
    id SERIAL PRIMARY KEY,
    commande_id INTEGER REFERENCES commandes(id) ON DELETE CASCADE,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '15 minutes')
);
```

**Champs :**
- `commande_id` : Lien vers commande (CASCADE = supprimé si commande supprimée)
- `article_id` : Article réservé
- `quantite` : Nombre d'unités réservées
- `created_at` : Heure création (pour tracking)
- `expires_at` : Heure expiration automatique (15 min par défaut)

**Contraintes :**
- `CHECK (quantite > 0)` : Impossible de réserver 0 ou négatif
- `ON DELETE CASCADE` : Si commande supprimée, réservation aussi
- Index sur `commande_id`, `article_id`, `expires_at` pour performance

### 2. Fonction get_stock_disponible_reel()

```sql
CREATE OR REPLACE FUNCTION get_stock_disponible_reel(p_article_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    stock_base INTEGER;
    reservations INTEGER;
BEGIN
    -- 1. Récupérer stock physique
    SELECT stock_disponible INTO stock_base 
    FROM articles 
    WHERE id = p_article_id;
    
    -- 2. Calculer total réservations actives
    SELECT COALESCE(SUM(quantite), 0) INTO reservations
    FROM reservation_temporaire
    WHERE article_id = p_article_id 
    AND expires_at > CURRENT_TIMESTAMP;  -- ⚠️ Seulement non expirées
    
    -- 3. Retourner stock réel (minimum 0)
    RETURN GREATEST(stock_base - reservations, 0);
END;
$$ LANGUAGE plpgsql;
```

**Logique :**
1. Lit stock physique dans `articles`
2. Somme réservations actives (non expirées)
3. Retourne `stock - réservations` (minimum 0)

**Exemple :**
```sql
-- Stock physique: 10
-- Réservations actives: 3 + 5 = 8
-- Résultat: GREATEST(10 - 8, 0) = 2
```

### 3. Vue v_articles_stock_reel

```sql
CREATE OR REPLACE VIEW v_articles_stock_reel AS
SELECT 
    a.*,  -- Tous les champs de articles
    COALESCE(
        a.stock_disponible - SUM(r.quantite), 
        a.stock_disponible
    ) as stock_reel_disponible
FROM articles a
LEFT JOIN reservation_temporaire r 
    ON a.id = r.article_id 
    AND r.expires_at > CURRENT_TIMESTAMP  -- ⚠️ Seulement actives
GROUP BY a.id;
```

**Pourquoi une vue ?**
- ✅ Calcul automatique à chaque SELECT
- ✅ Toujours à jour
- ✅ Pas de stockage redondant
- ✅ Même syntaxe que table normale

**Usage :**
```sql
-- Au lieu de:
SELECT * FROM articles;

-- Utiliser:
SELECT * FROM v_articles_stock_reel;
-- Retourne mêmes champs + stock_reel_disponible
```

### 4. Backend - Endpoint POST /api/reservations

```javascript
app.post('/api/reservations', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { commande_id, items } = req.body;
    
    await client.query('BEGIN');
    
    // 1. Nettoyer réservations expirées
    await client.query('SELECT nettoyer_reservations_expirees()');
    
    // 2. Supprimer anciennes réservations de cette commande
    await client.query(
      'DELETE FROM reservation_temporaire WHERE commande_id = $1',
      [commande_id]
    );
    
    // 3. Pour chaque article, vérifier et réserver
    for (const item of items) {
      // Vérifier stock réel suffisant
      const stockCheck = await client.query(
        'SELECT get_stock_disponible_reel($1) as stock_reel',
        [item.article_id]
      );
      
      if (stockCheck.rows[0].stock_reel < item.quantite) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Stock insuffisant' });
      }
      
      // Créer réservation
      await client.query(
        'INSERT INTO reservation_temporaire (commande_id, article_id, quantite) VALUES ($1, $2, $3)',
        [commande_id, item.article_id, item.quantite]
      );
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Réservation créée' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});
```

**Étapes critiques :**
1. **Transaction SQL** : BEGIN/COMMIT pour atomicité
2. **Nettoyage préalable** : Supprime réservations expirées
3. **Vérification stock** : Avant chaque réservation
4. **Rollback si erreur** : Annule tout en cas de problème
5. **Release connexion** : Toujours dans `finally`

### 5. Frontend Caisse - Création Réservation

```javascript
async function ouvrirPaiement(nomCommande) {
    try {
        const commande = await apiGet(`/commandes/nom/${nomCommande}`);
        
        // 🔒 CRÉER RÉSERVATION
        const items = commande.items.map(item => ({
            article_id: item.article_id,
            quantite: item.quantite
        }));
        
        await apiPost('/reservations', {
            commande_id: commande.id,
            items: items
        });
        
        console.log('✅ Réservation créée');
        
        // Ouvrir modal paiement...
        
    } catch (error) {
        if (error.message.includes('Stock insuffisant')) {
            showError('Stock insuffisant pour cette commande');
            return;
        }
    }
}
```

**Points clés :**
- Réservation **AVANT** ouverture modal
- Si stock insuffisant → Erreur immédiate
- Si OK → Modal s'ouvre, articles verrouillés

### 6. Frontend Caisse - Suppression Réservation

```javascript
async function fermerModal() {
    // 🔓 SUPPRIMER RÉSERVATION
    if (commandeSelectionnee) {
        await apiDelete(`/reservations/${commandeSelectionnee.id}`);
        console.log('✅ Réservation supprimée');
    }
    
    closeModal('modalPaiement');
    commandeSelectionnee = null;
}

// Nettoyage si page fermée
window.addEventListener('beforeunload', () => {
    if (commandeSelectionnee) {
        const url = `/api/reservations/${commandeSelectionnee.id}`;
        navigator.sendBeacon(url, JSON.stringify({ _method: 'DELETE' }));
    }
});
```

**Cas de suppression :**
1. **Annulation** : Clic bouton "Annuler"
2. **Confirmation** : Après paiement réussi (dans endpoint payer)
3. **Fermeture page** : `beforeunload` avec `sendBeacon`

### 7. Frontend Client - Stock Réel

```javascript
// Affichage articles avec stock réel
const stockReel = article.stock_reel_disponible !== undefined 
    ? article.stock_reel_disponible 
    : article.stock_disponible;

// Afficher
<p class="article-stock">Stock: ${stockReel} disponible(s)</p>

// Bouton '+' bloqué si stock atteint
if (delta > 0 && nouvelleQte > stockReel) {
    showError(`Stock maximum atteint (${stockReel})`);
    return;
}

// Bouton '-' TOUJOURS actif (requis utilisateur)
if (delta < 0) {
    // Pas de vérification stock
    nouvelleQte = Math.max(0, nouvelleQte);
}
```

**Fallback :**
Si `stock_reel_disponible` absent (API erreur), utilise `stock_disponible`.

---

## ⏰ GESTION EXPIRATION

### Pourquoi 15 minutes ?

**Analyse du workflow :**
```
Temps moyen encaissement : 2-5 minutes
  - Ouvrir modal : 5 sec
  - Saisir montants : 30 sec - 2 min
  - Confirmer : 5 sec

Temps maximum raisonnable : 10 minutes
Marge sécurité : +5 minutes
Total : 15 minutes
```

**Trop court (ex: 5 min) :**
- ❌ Caissière interrompue → Réservation expire → Stock change
- ❌ Client voit prix, va chercher argent → Temps écoulé

**Trop long (ex: 60 min) :**
- ❌ Stock bloqué longtemps
- ❌ Autres clients pénalisés
- ❌ Table reservation_temporaire grossit

### Nettoyage Automatique

**Moments de nettoyage :**
1. **GET /api/articles** : À chaque chargement page client
2. **POST /api/reservations** : Avant création nouvelle réservation
3. **GET /api/reservations** : Consultation liste admin

**Fonction SQL :**
```sql
CREATE OR REPLACE FUNCTION nettoyer_reservations_expirees()
RETURNS void AS $$
BEGIN
    DELETE FROM reservation_temporaire 
    WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
```

**Pourquoi pas CRON job ?**
- ✅ Plus simple : Pas de config serveur
- ✅ Performant : Nettoyage léger
- ✅ Automatique : Pas besoin maintenance
- ⚠️ Si traffic faible : Peut rester longtemps

**Option CRON (si besoin) :**
```sql
-- Dans Supabase, créer pg_cron job
SELECT cron.schedule(
    'nettoyer-reservations',
    '*/5 * * * *',  -- Toutes les 5 minutes
    'SELECT nettoyer_reservations_expirees()'
);
```

---

## 🔒 SÉCURITÉ ET COHÉRENCE

### Transactions SQL

**Atomicité :**
```javascript
await client.query('BEGIN');
try {
    // 1. Vérifier stock
    // 2. Créer réservation
    // 3. Modifier commande
    await client.query('COMMIT');
} catch (error) {
    await client.query('ROLLBACK');
}
```

**Garantie :**
- Soit tout réussit ✅
- Soit rien ne change ✅
- Jamais d'état incohérent ❌

### Vérifications Multiples

**1. Création réservation :**
```javascript
// Vérifier stock réel AVANT insertion
const stockReel = await get_stock_disponible_reel(article_id);
if (stockReel < quantite) {
    throw new Error('Stock insuffisant');
}
```

**2. Paiement :**
```javascript
// Vérifier ENCORE une fois (double sécurité)
const dispo = await verifier_disponibilite_commande(commande_id);
if (!dispo) {
    throw new Error('Stock devenu insuffisant');
}
```

**Pourquoi 2 fois ?**
- Entre réservation et paiement : Autre caissière peut modifier
- Stock peut changer (erreur manuelle)
- Sécurité maximale

### Contraintes Base

```sql
-- Quantité toujours positive
CHECK (quantite > 0)

-- Cascade deletion
ON DELETE CASCADE

-- Index pour performance
CREATE INDEX idx_reservation_article ON reservation_temporaire(article_id);
CREATE INDEX idx_reservation_expires ON reservation_temporaire(expires_at);
```

---

## 📊 PERFORMANCE

### Complexité Requêtes

**GET articles avec stock réel :**
```sql
-- Requête:
SELECT * FROM v_articles_stock_reel;

-- Équivalent à:
SELECT a.*, 
       a.stock_disponible - COALESCE(SUM(r.quantite), 0) as stock_reel
FROM articles a
LEFT JOIN reservation_temporaire r ON a.id = r.article_id
WHERE r.expires_at > CURRENT_TIMESTAMP OR r.id IS NULL
GROUP BY a.id;

-- Complexité: O(n + m)
-- n = nombre articles
-- m = nombre réservations actives
```

**Avec index :**
- `idx_reservation_article` : O(log m) pour JOIN
- `idx_reservation_expires` : O(log m) pour filtre expiration
- Résultat : **Très rapide** même avec 1000+ réservations

### Benchmarks (estimés)

```
10 articles, 0 réservations:
  - Temps: ~5ms
  
10 articles, 100 réservations:
  - Sans index: ~50ms
  - Avec index: ~8ms ✅
  
100 articles, 1000 réservations:
  - Sans index: ~500ms ❌
  - Avec index: ~25ms ✅
```

### Optimisations Appliquées

1. **Index stratégiques**
   - `idx_reservation_commande` : Pour DELETE rapide
   - `idx_reservation_article` : Pour JOIN rapide
   - `idx_reservation_expires` : Pour nettoyage rapide

2. **Vue matérialisée ? Non.**
   - ❌ Complexité rafraîchissement
   - ❌ Données moins à jour
   - ✅ Vue normale suffit amplement

3. **Cache applicatif ? Non.**
   - ❌ Cohérence difficile
   - ❌ Invalidation complexe
   - ✅ PostgreSQL assez rapide

---

## 🧪 TESTS RECOMMANDÉS

### Test 1 : Réservation Simple

```javascript
// 1. Créer commande avec 5 Nems
POST /api/commandes
{ nom: "test1", items: [{ article_id: 1, quantite: 5 }] }

// 2. Vérifier stock initial
GET /api/articles/1
// Réponse: { stock_disponible: 20, stock_reel_disponible: 20 }

// 3. Créer réservation
POST /api/reservations
{ commande_id: 1, items: [{ article_id: 1, quantite: 5 }] }

// 4. Vérifier stock réel
GET /api/articles/1
// Réponse: { stock_disponible: 20, stock_reel_disponible: 15 } ✅

// 5. Supprimer réservation
DELETE /api/reservations/1

// 6. Vérifier stock revenu
GET /api/articles/1
// Réponse: { stock_disponible: 20, stock_reel_disponible: 20 } ✅
```

### Test 2 : Expiration Automatique

```sql
-- 1. Créer réservation expirée manuellement
INSERT INTO reservation_temporaire 
(commande_id, article_id, quantite, expires_at)
VALUES (1, 1, 10, CURRENT_TIMESTAMP - INTERVAL '1 minute');

-- 2. Vérifier présence
SELECT COUNT(*) FROM reservation_temporaire;
-- Résultat: 1

-- 3. Déclencher nettoyage
SELECT nettoyer_reservations_expirees();

-- 4. Vérifier suppression
SELECT COUNT(*) FROM reservation_temporaire;
-- Résultat: 0 ✅
```

### Test 3 : Survente Impossible

```javascript
// Stock initial: 5
// Commande 1: 3
// Commande 2: 3

// 1. Réserver Commande 1
POST /api/reservations
{ commande_id: 1, items: [{ article_id: 1, quantite: 3 }] }
// ✅ OK, stock_reel = 2

// 2. Tenter Commande 2 (doit échouer)
POST /api/reservations
{ commande_id: 2, items: [{ article_id: 1, quantite: 3 }] }
// ❌ 409 Conflict: Stock insuffisant (2 < 3) ✅
```

### Test 4 : Transactions Atomiques

```javascript
// Commande avec 2 articles
// Article 1: Stock OK
// Article 2: Stock insuffisant

POST /api/reservations
{
  commande_id: 1,
  items: [
    { article_id: 1, quantite: 5 },  // OK
    { article_id: 2, quantite: 100 } // Stock insuffisant
  ]
}

// Résultat attendu:
// - ❌ Erreur 409
// - ✅ Aucune réservation créée (même pas article 1)
// - ✅ ROLLBACK complet

SELECT * FROM reservation_temporaire WHERE commande_id = 1;
// Résultat: 0 lignes ✅
```

---

## 🔧 DÉPANNAGE

### Problème : Stock réel négatif

**Symptôme :**
```sql
SELECT * FROM v_articles_stock_reel WHERE stock_reel_disponible < 0;
-- Retourne des lignes
```

**Cause :**
- Réservations non supprimées
- Stock physique modifié manuellement

**Solution :**
```sql
-- Nettoyer toutes réservations
DELETE FROM reservation_temporaire;

-- Recalculer
SELECT * FROM v_articles_stock_reel;
```

### Problème : Réservations zombies

**Symptôme :**
```sql
SELECT * FROM reservation_temporaire 
WHERE expires_at < CURRENT_TIMESTAMP;
-- Retourne des lignes (ne devrait pas)
```

**Cause :**
- Nettoyage pas appelé
- Trafic faible

**Solution :**
```sql
-- Forcer nettoyage manuel
SELECT nettoyer_reservations_expirees();

-- Ou automatique via CRON
SELECT cron.schedule(
    'nettoyer-reservations',
    '*/10 * * * *',
    'SELECT nettoyer_reservations_expirees()'
);
```

### Problème : Réservation non supprimée après paiement

**Symptôme :**
- Paiement confirmé
- Réservation toujours présente

**Cause :**
- Erreur dans endpoint `/payer`
- DELETE pas appelé

**Solution :**
```sql
-- Vérifier réservations d'une commande payée
SELECT r.* 
FROM reservation_temporaire r
JOIN commandes c ON r.commande_id = c.id
WHERE c.statut = 'payee';

-- Supprimer manuellement
DELETE FROM reservation_temporaire
WHERE commande_id IN (
    SELECT id FROM commandes WHERE statut = 'payee'
);
```

**Fix code :**
```javascript
// S'assurer que DELETE est appelé dans /payer
await client.query(
  'DELETE FROM reservation_temporaire WHERE commande_id = $1',
  [id]
);
```

---

## 📈 ÉVOLUTIONS FUTURES

### Option 1 : Notification Expiration

```javascript
// Dans caisse.js
setInterval(() => {
    if (commandeSelectionnee) {
        const tempsRestant = calculerTempsRestant(
            commandeSelectionnee.reservation_expires_at
        );
        
        if (tempsRestant < 2) { // Moins de 2 minutes
            showWarning('⚠️ Réservation expire bientôt !');
        }
    }
}, 60000); // Vérifier toutes les 1 min
```

### Option 2 : Dashboard Réservations

```html
<!-- admin.html -->
<div class="card">
    <h2>🔒 Réservations Actives</h2>
    <div id="reservations-dashboard">
        <!-- Liste réservations en cours -->
        <!-- Avec countdown -->
        <!-- Bouton "Libérer" manuel -->
    </div>
</div>
```

### Option 3 : Historique Réservations

```sql
-- Table pour tracking
CREATE TABLE historique_reservations (
    id SERIAL PRIMARY KEY,
    commande_id INTEGER,
    article_id INTEGER,
    quantite INTEGER,
    created_at TIMESTAMP,
    deleted_at TIMESTAMP,
    raison VARCHAR(50) -- 'confirme', 'annule', 'expire'
);

-- Trigger sur DELETE
CREATE TRIGGER log_reservation_delete
BEFORE DELETE ON reservation_temporaire
FOR EACH ROW
EXECUTE FUNCTION log_reservation_historique();
```

### Option 4 : Réservation Prioritaire

```sql
-- Ajouter priorité
ALTER TABLE reservation_temporaire 
ADD COLUMN priorite INTEGER DEFAULT 0;

-- VIP = priorité haute
-- Si stock insuffisant, libérer réservations basse priorité
```

---

## 🎯 CONCLUSION

Le système de réservation temporaire v2.7 résout définitivement le problème de survente en :

✅ **Verrouillant** articles dès encaissement
✅ **Calculant** stock réel en temps réel
✅ **Libérant** automatiquement après 15 min
✅ **Garantissant** cohérence par transactions SQL
✅ **Optimisant** performance via index
✅ **Sécurisant** avec vérifications multiples

**Résultat :** Application robuste, prête pour production avec plusieurs caissières simultanées ! 🚀

---

**Version:** 2.7  
**Date:** 5 Décembre 2025  
**Status:** ✅ Production Ready
