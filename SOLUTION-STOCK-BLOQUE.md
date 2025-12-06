# ⚡ SOLUTION RAPIDE - STOCK BLOQUÉ

## 🎯 PROBLÈME

```
Vary Anana: demandé 32, disponible 2
```

**Mais en base il y a 34 ou 35 !**

---

## ✅ EXPLICATION RAPIDE

**C'est normal ! Le système fonctionne bien.**

```
Stock affiché (2) = Stock physique (35) - Réservations temporaires (33)
```

**D'autres commandes sont en cours d'encaissement et ont réservé 33 Vary Anana.**

---

## 🚀 SOLUTION IMMÉDIATE (30 SEC)

### Supabase SQL Editor → Exécuter :

**Option 1 : Nettoyer réservations expirées (> 15 min)**

```sql
SELECT nettoyer_reservations_expirees() as nb_supprimees;
```

**Puis vérifier :**
```sql
SELECT stock_reel_disponible 
FROM v_stock_disponible 
WHERE nom = 'Vary Anana';
```

---

**Option 2 : Voir qui a réservé**

```sql
SELECT 
    rt.nom_commande,
    rt.quantite,
    ROUND(EXTRACT(EPOCH FROM (NOW() - rt.created_at))/60) as age_min
FROM reservation_temporaire rt
JOIN articles a ON rt.article_id = a.id
WHERE a.nom = 'Vary Anana';
```

**Si tu vois des commandes abandonnées, les supprimer :**
```sql
SELECT supprimer_reservations('NomCommandeAbandonné');
```

---

**Option 3 : URGENCE - Tout réinitialiser**

**⚠️ Ceci annule TOUS les encaissements en cours !**

```sql
DELETE FROM reservation_temporaire;
```

---

## 🧪 VÉRIFICATION

```sql
-- Stock doit être libéré maintenant
SELECT 
    nom,
    stock_initial,
    quantite_reservee,
    stock_reel_disponible
FROM v_stock_disponible 
WHERE nom = 'Vary Anana';
```

**Résultat attendu :**
```
nom         | stock_initial | quantite_reservee | stock_reel_disponible
Vary Anana  | 35            | 0                 | 35 ✅
```

---

## 📖 EXPLICATION COMPLÈTE

**[EXPLICATION-STOCK-DISPONIBLE-2.md](computer:///mnt/user-data/outputs/EXPLICATION-STOCK-DISPONIBLE-2.md)**

---

**⚡ NETTOIE → VÉRIFIE → C'EST RÉGLÉ ! ✅**
