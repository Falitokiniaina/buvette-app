# 🔧 CORRECTION MESSAGE "undefined" STOCK INSUFFISANT

## 🎯 PROBLÈME

**Message d'erreur avec undefined :**
```
⚠️ STOCK INSUFFISANT

Articles non disponibles:

• undefined: demandé undefined, disponible undefined

❌ Encaissement impossible.
Le client doit modifier sa commande.
```

**Cause :** Mauvais noms de champs utilisés dans le frontend

---

## ✅ CORRECTION APPLIQUÉE

### Analyse du problème

**Fonction SQL `verifier_disponibilite_commande()` retourne :**
```sql
RETURNS TABLE (
    article_id INTEGER,
    article_nom VARCHAR,              ← Nom correct
    quantite_demandee INTEGER,        ← Quantité demandée correcte
    stock_disponible INTEGER,
    stock_reel_disponible INTEGER,    ← Stock disponible correct
    ok BOOLEAN
)
```

**Frontend utilisait (INCORRECT) :**
```javascript
// AVANT - Champs qui n'existent pas
detail.nom           ❌ → undefined
detail.quantite      ❌ → undefined  
detail.disponible    ❌ → undefined
detail.demande       ❌ → undefined (client.js)
```

**Frontend doit utiliser (CORRECT) :**
```javascript
// APRÈS - Champs qui existent
detail.article_nom           ✅
detail.quantite_demandee     ✅
detail.stock_reel_disponible ✅
```

---

## 📝 FICHIERS MODIFIÉS (2)

### Fichier 1 : frontend/js/caisse.js

**Ligne ~170 : Message encaissement**

```javascript
// AVANT (BUG)
message += `• ${detail.nom}: demandé ${detail.quantite}, disponible ${detail.disponible}\n`;

// APRÈS (CORRIGÉ)
message += `• ${detail.article_nom}: demandé ${detail.quantite_demandee}, disponible ${detail.stock_reel_disponible}\n`;
```

### Fichier 2 : frontend/js/client.js

**Ligne ~397 : Message aller à la caisse**

```javascript
// AVANT (BUG)
message += `• ${detail.nom}: demandé ${detail.demande}, disponible ${detail.disponible}\n`;

// APRÈS (CORRIGÉ)
message += `• ${detail.article_nom}: demandé ${detail.quantite_demandee}, disponible ${detail.stock_reel_disponible}\n`;
```

---

## 🧪 EXEMPLE RÉSULTAT

### AVANT (avec undefined)
```
⚠️ STOCK INSUFFISANT

Articles non disponibles:

• undefined: demandé undefined, disponible undefined

❌ Encaissement impossible.
```

### APRÈS (corrigé)
```
⚠️ STOCK INSUFFISANT

Articles non disponibles:

• Box Salé: demandé 10, disponible 5
• Hot Dog + Frites: demandé 8, disponible 3

❌ Encaissement impossible.
Le client doit modifier sa commande.
```

---

## 🔍 DÉTAILS TECHNIQUES

### Vérification granularité par article

La fonction SQL `verifier_disponibilite_commande()` vérifie **article par article** :

```sql
SELECT 
    ci.article_id,
    a.nom as article_nom,
    ci.quantite as quantite_demandee,
    a.stock_disponible,
    v.stock_reel_disponible,
    (v.stock_reel_disponible >= ci.quantite) as ok
FROM commande_items ci
JOIN articles a ON ci.article_id = a.id
JOIN v_stock_disponible v ON a.id = v.id
WHERE ci.commande_id = p_commande_id
```

**Pour chaque article de la commande, on vérifie :**
1. Quantité demandée (`ci.quantite`)
2. Stock réel disponible (`v.stock_reel_disponible`)
3. Si disponible >= demandé → `ok = true`

**Le message affiche uniquement les articles où `ok = false`**

---

## 🚀 DÉPLOIEMENT (2 MIN)

```bash
cd buvette-app

# Vérifier modifications
git diff frontend/js/caisse.js frontend/js/client.js

# Git
git add frontend/js/caisse.js frontend/js/client.js
git commit -m "Fix: Noms champs stock insuffisant (article_nom, quantite_demandee, stock_reel_disponible)"
git push origin main

# Railway déploie automatiquement
```

---

## 🧪 TESTS

### Test 1 : Stock insuffisant à l'encaissement
```
SCÉNARIO :
1. Stock Box Salé = 5
2. Commande avec 10 Box Salé
3. Caisse → "Encaisser"

RÉSULTAT ATTENDU :
⚠️ STOCK INSUFFISANT

Articles non disponibles:

• Box Salé: demandé 10, disponible 5

❌ Encaissement impossible.
Le client doit modifier sa commande.
```

### Test 2 : Stock insuffisant côté client
```
SCÉNARIO :
1. Stock Hot Dog = 3
2. Client ajoute 8 Hot Dog
3. "Aller à la caisse"

RÉSULTAT ATTENDU :
⚠️ Certains articles ne sont plus disponibles:

• Hot Dog + Frites: demandé 8, disponible 3

Veuillez modifier votre commande.
```

### Test 3 : Plusieurs articles insuffisants
```
SCÉNARIO :
1. Stock Box Salé = 5, Hot Dog = 3
2. Commande : 10 Box Salé + 8 Hot Dog
3. "Encaisser"

RÉSULTAT ATTENDU :
⚠️ STOCK INSUFFISANT

Articles non disponibles:

• Box Salé: demandé 10, disponible 5
• Hot Dog + Frites: demandé 8, disponible 3

❌ Encaissement impossible.
Le client doit modifier sa commande.
```

---

## 📊 WORKFLOW VÉRIFICATION STOCK

### Étapes de vérification

```
1. Backend: Fonction SQL verifier_disponibilite_commande(id)
   ↓
2. Pour chaque article de la commande:
   - Récupérer quantite_demandee
   - Récupérer stock_reel_disponible (avec réservations)
   - Comparer : stock >= demande ?
   ↓
3. Retourner détails par article:
   {
     article_id: 1,
     article_nom: "Box Salé",
     quantite_demandee: 10,
     stock_disponible: 50,
     stock_reel_disponible: 5,
     ok: false
   }
   ↓
4. Frontend: Afficher articles où ok = false
   avec article_nom, quantite_demandee, stock_reel_disponible
```

### Différence stock_disponible vs stock_reel_disponible

**stock_disponible :**
- Stock physique de l'article
- Exemple : 50 Box Salé en stock

**stock_reel_disponible :**
- Stock physique - réservations temporaires
- Exemple : 50 - 45 (réservées) = 5 disponibles

**C'est `stock_reel_disponible` qui compte pour la vérification !**

---

## 📋 MAPPING CHAMPS COMPLET

### Retour fonction SQL
```javascript
{
  article_id: INTEGER,
  article_nom: VARCHAR,           // Nom de l'article
  quantite_demandee: INTEGER,     // Quantité dans la commande
  stock_disponible: INTEGER,      // Stock physique total
  stock_reel_disponible: INTEGER, // Stock - réservations
  ok: BOOLEAN                     // true si stock >= demande
}
```

### Utilisation frontend
```javascript
verification.details.forEach(detail => {
    if (!detail.ok) {
        console.log(`Article: ${detail.article_nom}`);
        console.log(`Demandé: ${detail.quantite_demandee}`);
        console.log(`Disponible: ${detail.stock_reel_disponible}`);
    }
});
```

---

## ✅ CHECKLIST

- [x] Correction frontend/js/caisse.js
- [x] Correction frontend/js/client.js
- [ ] Git commit/push
- [ ] Railway déploiement
- [ ] Test stock insuffisant caisse
- [ ] Test stock insuffisant client
- [ ] Vérification messages corrects

---

## 🎉 RÉSULTAT

```
Problème      : Messages "undefined"
Cause         : Mauvais noms de champs
Solution      : Utilisation champs corrects SQL
Fichiers      : 2 (caisse.js, client.js)
Temps fix     : 5 minutes
Impact        : Messages clairs et précis ✅
Granularité   : Par article ✅
```

---

**🚀 GIT PUSH → TESTE → MESSAGES CLAIRS ! ✅**

**🎵 Application encore plus professionnelle ! 🎤**
