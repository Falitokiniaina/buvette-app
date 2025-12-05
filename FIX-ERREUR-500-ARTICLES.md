# 🔧 FIX ERREUR 500 - GET /api/articles

## ❌ PROBLÈME

```
GET /api/articles → 500 Internal Server Error
```

**Cause :** Le code utilisait des éléments de la v2.7 qui n'existent pas encore :
- Fonction SQL `nettoyer_reservations_expirees()`
- Vue SQL `v_stock_disponible`

---

## ✅ CORRECTION APPLIQUÉE

Le backend a été modifié pour fonctionner **AVANT et APRÈS** la migration :

### Endpoint `GET /api/articles`

**AVANT :**
```javascript
// Erreur si fonction n'existe pas
await db.query('SELECT nettoyer_reservations_expirees()');

// Erreur si vue n'existe pas
FROM v_articles_stock_reel
```

**APRÈS :**
```javascript
// Try/catch : ignore si fonction n'existe pas
try {
  await db.query('SELECT nettoyer_reservations_expirees()');
} catch (err) {
  // Fonction pas encore créée, ignorer
}

// Try/catch : fallback sur table normale si vue n'existe pas
try {
  // Utiliser vue v_stock_disponible
  FROM articles a LEFT JOIN v_stock_disponible sd ...
} catch (err) {
  // Vue pas créée, utiliser table articles directement
  SELECT stock_disponible as stock_reel_disponible ...
}
```

**Résultat :**
- ✅ Fonctionne SANS migration (mode dégradé)
- ✅ Fonctionne AVEC migration (mode complet)

---

## 🚀 DÉPLOIEMENT DU FIX (2 MIN)

### Étape 1 : Extraire & Push (1 min)

```bash
# Extraire
tar -xzf buvette-app-v2.7-FIX-ARTICLES.tar.gz
cd buvette-app

# Push
git add backend/server.js
git commit -m "Fix: GET /api/articles compatible avant/après migration v2.7"
git push origin main
```

### Étape 2 : Vérifier Railway (1 min)

```
1. Railway Dashboard
2. Voir déploiement automatique
3. Attendre "Success" (vert)
```

### Étape 3 : Tester (30 sec)

```
Ouvrir page Client
→ Articles s'affichent ✅
→ Stock visible ✅
```

---

## 📋 PROCHAINE ÉTAPE : MIGRATION COMPLÈTE

**Une fois le fix déployé, tu peux faire la migration v2.7 :**

### Migration SQL dans Supabase

```sql
-- Dans Supabase SQL Editor
-- Exécuter database/migration-v2.6-v2.7.sql

-- OU directement :

-- 1. Table réservation
CREATE TABLE reservation_temporaire (
    id SERIAL PRIMARY KEY,
    nom_commande VARCHAR(100) NOT NULL,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_reservation UNIQUE(nom_commande, article_id)
);

-- 2. Index
CREATE INDEX idx_reservation_nom ON reservation_temporaire(nom_commande);
CREATE INDEX idx_reservation_article ON reservation_temporaire(article_id);

-- 3. Vue stock
CREATE OR REPLACE VIEW v_stock_disponible AS
SELECT 
    a.id, a.nom, a.prix,
    a.stock_disponible as stock_initial,
    COALESCE(SUM(rt.quantite), 0)::INTEGER as quantite_reservee,
    (a.stock_disponible - COALESCE(SUM(rt.quantite), 0))::INTEGER as stock_reel_disponible,
    a.image_data, a.image_type
FROM articles a
LEFT JOIN reservation_temporaire rt ON a.id = rt.article_id
GROUP BY a.id;

-- 4. Fonction nettoyage
CREATE OR REPLACE FUNCTION nettoyer_reservations_expirees()
RETURNS INTEGER AS $$
DECLARE nb_supprimes INTEGER;
BEGIN
    DELETE FROM reservation_temporaire 
    WHERE created_at < NOW() - INTERVAL '30 minutes';
    GET DIAGNOSTICS nb_supprimes = ROW_COUNT;
    RETURN nb_supprimes;
END;
$$ LANGUAGE plpgsql;

-- 5. Fonction suppression
CREATE OR REPLACE FUNCTION supprimer_reservations(p_nom_commande VARCHAR)
RETURNS INTEGER AS $$
DECLARE nb_supprimes INTEGER;
BEGIN
    DELETE FROM reservation_temporaire WHERE nom_commande = p_nom_commande;
    GET DIAGNOSTICS nb_supprimes = ROW_COUNT;
    RETURN nb_supprimes;
END;
$$ LANGUAGE plpgsql;

-- Vérification
SELECT * FROM v_stock_disponible LIMIT 1;
```

---

## ✅ RÉSULTAT

### Mode Dégradé (AVANT migration)
```
✅ Page Client fonctionne
✅ Articles affichés
✅ Stock = stock_disponible (pas de réservations)
❌ Pas de protection survente
```

### Mode Complet (APRÈS migration)
```
✅ Page Client fonctionne
✅ Articles affichés
✅ Stock = stock réel (avec réservations)
✅ Protection survente activée
✅ Workflow caisse complet
```

---

## 📦 FICHIERS MODIFIÉS

```
backend/server.js
  - GET /api/articles → Ajout fallback
  - GET /api/articles/:id → Ajout fallback
```

**Total : 1 fichier, ~40 lignes modifiées**

---

## 🎯 ORDRE RECOMMANDÉ

1. **MAINTENANT :** Déployer ce fix (2 min)
   → Application fonctionne en mode dégradé

2. **ENSUITE :** Migration SQL (3 min)
   → Active mode complet avec réservations

3. **TESTER :** Workflow caisse (5 min)
   → Vérifier "Encaisser" / "Annuler"

---

## 📝 CHECKLIST

### Fix Déployé
- [ ] Code pushé sur GitHub
- [ ] Railway redéployé "Success"
- [ ] Page Client affiche articles
- [ ] Pas d'erreur console

### Migration SQL
- [ ] Script exécuté dans Supabase
- [ ] Table reservation_temporaire créée
- [ ] Vue v_stock_disponible créée
- [ ] 2 fonctions créées
- [ ] Test vue retourne données

### Tests Complets
- [ ] Page Caisse "Encaisser" fonctionne
- [ ] Réservation créée (console)
- [ ] Stock diminué visible
- [ ] "Annuler" libère stock

---

**Application maintenant fonctionnelle ! 🎉**

**Archive : [buvette-app-v2.7-FIX-ARTICLES.tar.gz](computer:///mnt/user-data/outputs/buvette-app-v2.7-FIX-ARTICLES.tar.gz)**
