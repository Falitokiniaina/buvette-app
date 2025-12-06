# 🔍 STOCK BLOQUÉ - EXPLICATION & SOLUTION

## 🎯 TON CAS

**Message :**
```
Vary Anana: demandé 32, disponible 2
```

**Tu penses :**
- "Il y a 34 ou 35 en stock !"
- "Pourquoi seulement 2 disponibles ?"

---

## ✅ RÉPONSE

**C'EST NORMAL ! Le système fonctionne correctement.**

### Le calcul

```
Stock affiché = Stock physique - Réservations temporaires

Exemple :
35 (stock physique) - 33 (réservé par d'autres) = 2 ✅
```

### Pourquoi ?

**D'autres commandes sont en cours d'encaissement** et ont **réservé temporairement** 33 Vary Anana.

**C'est la protection contre la survente !** Sans ça, plusieurs caissiers pourraient vendre le même stock en même temps.

---

## 🚀 SOLUTION (30 SEC)

### Supabase SQL Editor :

**1. Nettoyer réservations expirées**

```sql
SELECT nettoyer_reservations_expirees();
```

**2. Vérifier le stock maintenant**

```sql
SELECT stock_reel_disponible 
FROM v_stock_disponible 
WHERE nom = 'Vary Anana';
```

**Si toujours 2 :**

**3. Voir qui a réservé**

```sql
SELECT 
    nom_commande,
    quantite,
    ROUND(EXTRACT(EPOCH FROM (NOW() - created_at))/60) as minutes
FROM reservation_temporaire rt
JOIN articles a ON rt.article_id = a.id
WHERE a.nom = 'Vary Anana';
```

**4. Supprimer commandes abandonnées**

```sql
-- Si tu vois "CommandeX" abandonnée depuis 10 min
SELECT supprimer_reservations('CommandeX');
```

---

## ⚠️ SOLUTION URGENTE

**Si tu dois débloquer IMMÉDIATEMENT :**

```sql
-- ⚠️ Ceci annule TOUS les encaissements en cours
DELETE FROM reservation_temporaire;
```

**Puis vérifier :**
```sql
SELECT stock_reel_disponible 
FROM v_stock_disponible 
WHERE nom = 'Vary Anana';
-- Résultat : 35 ✅
```

---

## 📊 CE QUI SE PASSE

### Workflow normal

```
1. Caissier A clique "Encaisser" commande avec 10 Vary Anana
   → Réservation créée (10 réservés)
   → Stock réel = 35 - 10 = 25

2. Caissier B clique "Encaisser" commande avec 12 Vary Anana
   → Réservation créée (12 réservés)
   → Stock réel = 35 - 10 - 12 = 13

3. Caissier C essaie 15 Vary Anana
   → ❌ BLOQUÉ : "demandé 15, disponible 13"

4. Caissier A confirme paiement
   → Stock physique décrémenté (35 → 25)
   → Réservation supprimée
   → Stock réel = 25 - 12 = 13

5. Maintenant Caissier C peut encaisser 13 maximum ✅
```

### Cas abandon

```
1. Caissier clique "Encaisser"
   → Réservation créée

2. SCÉNARIO A : Caissier annule (ferme modal)
   → Réservation supprimée immédiatement ✅

3. SCÉNARIO B : Caissier oublie et part
   → Réservation expire après 15 min ✅
   → Nettoyage automatique
```

---

## 🧪 VÉRIFICATIONS

### Stock physique
```sql
SELECT nom, stock_disponible 
FROM articles 
WHERE nom = 'Vary Anana';
-- Résultat : 35
```

### Réservations en cours
```sql
SELECT 
    rt.nom_commande,
    rt.quantite,
    rt.created_at
FROM reservation_temporaire rt
JOIN articles a ON rt.article_id = a.id
WHERE a.nom = 'Vary Anana';
-- Résultat : Liste des commandes qui réservent
```

### Stock réel calculé
```sql
SELECT 
    nom,
    stock_initial,
    quantite_reservee,
    stock_reel_disponible
FROM v_stock_disponible 
WHERE nom = 'Vary Anana';
-- Résultat : 35 - X = Y
```

---

## 📖 GUIDES COMPLETS

**[⚡ SOLUTION-STOCK-BLOQUE.md](computer:///mnt/user-data/outputs/SOLUTION-STOCK-BLOQUE.md)** - Solution rapide

**[📄 EXPLICATION-STOCK-DISPONIBLE-2.md](computer:///mnt/user-data/outputs/EXPLICATION-STOCK-DISPONIBLE-2.md)** - Explication détaillée

**[📄 diagnostic-stock-vary-anana.sql](computer:///mnt/user-data/outputs/diagnostic-stock-vary-anana.sql)** - Script diagnostic complet

---

## 🎯 RÉSUMÉ

```
┌────────────────────────────────────┐
│ Stock affiché : 2                  │
│ Stock physique : 35                │
│ Différence : 33 (réservés)         │
│                                    │
│ RAISON :                           │
│ Protection contre survente ✅      │
│                                    │
│ SOLUTION :                         │
│ Nettoyer réservations expirées    │
│ OU supprimer commandes abandonnées│
│ OU attendre 15 minutes             │
└────────────────────────────────────┘
```

---

**✅ LE SYSTÈME FONCTIONNE BIEN !**

**🛡️ Il protège contre la survente !**

**⚡ Nettoie les réservations et c'est réglé ! 🚀**
