# 🔧 CORRECTION MONTANT 0€ - URGENT

## 🎯 PROBLÈME

```
❌ Page client: Total affiché 13€
❌ Après "Aller à la caisse": Montant total 0€
❌ Page caisse: Montant 0€, détails NaN €
```

**Cause :** Le backend n'a JAMAIS calculé le `montant_total` !

---

## ✅ CORRECTIONS APPLIQUÉES

### Fichier : backend/server.js

**3 corrections effectuées :**

### 1. Création commande (POST /commandes)
```javascript
// AJOUTÉ : Calcul montant_total après ajout items
const montantResult = await client.query(`
  SELECT COALESCE(SUM(quantite * prix_unitaire), 0) as total
  FROM commande_items
  WHERE commande_id = $1
`, [commande.id]);

const montant_total = montantResult.rows[0].total;

await client.query(
  'UPDATE commandes SET montant_total = $1 WHERE id = $2',
  [montant_total, commande.id]
);
```

### 2. Mise à jour items (PUT /commandes/:id/items)
```javascript
// AJOUTÉ : Même calcul après modification items
```

### 3. Récupération items (GET /commandes/nom/:nom)
```javascript
// AJOUTÉ : Calcul sous_total pour chaque item
SELECT 
  ci.*,
  a.nom as article_nom,
  (ci.quantite * ci.prix_unitaire) as sous_total  ← NOUVEAU
FROM commande_items ci
...
```

---

## 🚀 DÉPLOIEMENT (2 MIN)

```bash
cd buvette-app

# Vérifier modification
grep -A 5 "Calculer et mettre à jour le montant total" backend/server.js

# Git
git add backend/server.js
git commit -m "Fix: Calcul montant_total et sous_total"
git push origin main

# Railway déploie automatiquement (2 min)
```

---

## 🧪 TESTS APRÈS DÉPLOIEMENT

### Test 1 : Nouvelle commande
```
1. Page client
2. Ajouter Box Salé (5€) x2
3. Ajouter Boisson (1€) x1
4. Total affiché: 11€ ✅
5. Cliquer "Aller à la caisse"
6. Vérifier: "Montant total: 11,00 €" ✅
```

### Test 2 : Page caisse
```
1. Ouvrir caisse.html
2. Chercher la commande
3. Vérifier:
   - Montant total: 11,00 € ✅
   - Détails items: Box Salé: 10,00 € ✅
   - Boisson: 1,00 € ✅
```

### Test 3 : Modification commande
```
1. Page client
2. Modifier quantité
3. Total mis à jour ✅
4. Backend calcule nouveau montant ✅
```

---

## 📊 CE QUI A CHANGÉ

### AVANT (BUG)
```
1. Client ajoute items → Panier local calcule (13€)
2. Items envoyés → Backend insère items
3. Backend NE CALCULE PAS montant_total
4. montant_total reste à 0,00
5. Caisse affiche 0,00 € ❌
6. sous_total pas calculé → NaN € ❌
```

### APRÈS (CORRIGÉ)
```
1. Client ajoute items → Panier local calcule (13€)
2. Items envoyés → Backend insère items
3. Backend CALCULE montant_total ✅
4. Backend UPDATE montant_total = 13,00
5. Caisse affiche 13,00 € ✅
6. sous_total calculé → 5,00 €, 8,00 € ✅
```

---

## 🔍 VÉRIFICATION SQL

```sql
-- Tester sur une commande existante
SELECT 
  c.nom_commande,
  c.montant_total,
  (SELECT SUM(quantite * prix_unitaire) FROM commande_items WHERE commande_id = c.id) as calcule
FROM commandes c
WHERE statut = 'en_attente'
LIMIT 5;

-- Si montant_total ≠ calcule → Bug confirmé
-- Après déploiement, montant_total = calcule ✅
```

---

## 🛠️ FIX COMMANDES EXISTANTES (Optionnel)

Si tu as déjà des commandes avec montant_total = 0 :

```sql
-- Recalculer TOUS les montants
UPDATE commandes c
SET montant_total = (
  SELECT COALESCE(SUM(ci.quantite * ci.prix_unitaire), 0)
  FROM commande_items ci
  WHERE ci.commande_id = c.id
)
WHERE statut = 'en_attente';
```

---

## ✅ CHECKLIST

- [ ] backend/server.js modifié
- [ ] Git commit/push
- [ ] Railway déploiement terminé
- [ ] Test nouvelle commande → Montant OK
- [ ] Test page caisse → Montant et détails OK
- [ ] (Optionnel) Anciennes commandes recalculées

---

## 📖 FICHIERS MODIFIÉS

```
backend/server.js :
  - Ligne ~371  : Calcul montant_total (POST /commandes)
  - Ligne ~445  : Calcul montant_total (PUT items)
  - Ligne ~492  : Calcul sous_total (GET commande)
```

---

## 🎉 RÉSULTAT

```
Avant : Montant 0€, NaN €
Après : Montant correct, détails corrects
Temps : 2 minutes déploiement
Impact : ✅ Critique résolu
```

---

**🚀 GIT PUSH → TESTE → C'EST RÉGLÉ ! ✅**

**🎵 Concert demain → Paiements fonctionnels ! 🎤**
