# ⚡ DÉPLOIEMENT - 3 CORRECTIONS CRITIQUES

## 🎯 CORRECTIONS

```
1. ✅ Fonction SQL vérif stock (propre réservation)
2. ✅ Message préparateur visible
3. ✅ Erreur historique_stock (mouvement_type → type_mouvement)
```

---

## 🚀 DÉPLOIEMENT (3 MIN)

### 1️⃣ SQL (1 min)

**Supabase → Exécuter :**

```sql
CREATE OR REPLACE FUNCTION verifier_disponibilite_commande(p_commande_id INTEGER)
RETURNS TABLE (
    article_id INTEGER,
    article_nom VARCHAR,
    quantite_demandee INTEGER,
    stock_disponible INTEGER,
    stock_reel_disponible INTEGER,
    ok BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.article_id,
        a.nom,
        ci.quantite,
        a.stock_disponible,
        (v.stock_reel_disponible + COALESCE(rt.quantite_reservee_commande, 0)) as stock_reel_disponible,
        ((v.stock_reel_disponible + COALESCE(rt.quantite_reservee_commande, 0)) >= ci.quantite) as ok
    FROM commande_items ci
    JOIN articles a ON ci.article_id = a.id
    JOIN v_stock_disponible v ON a.id = v.id
    LEFT JOIN (
        SELECT 
            rt.article_id,
            rt.quantite as quantite_reservee_commande
        FROM reservation_temporaire rt
        JOIN commandes c ON rt.nom_commande = c.nom_commande
        WHERE c.id = p_commande_id
    ) rt ON ci.article_id = rt.article_id
    WHERE ci.commande_id = p_commande_id;
END;
$$ LANGUAGE plpgsql;
```

---

### 2️⃣ Git (2 min)

```bash
cd buvette-app
git add .
git commit -m "Fix: Fonction vérif + Message préparateur + Historique"
git push origin main
```

---

### 3️⃣ Tests (1 min)

```
✅ Admin → Modifier stock → Pas d'erreur 500
✅ Caisse → Vérifier stock → Valeurs correctes
✅ Client → Commande payée → Message vert visible
```

---

## 📦 ARCHIVE

**[📥 Télécharger (217 KB)](computer:///mnt/user-data/outputs/buvette-app-v2.7-FINAL-COMPLET.tar.gz)**

MD5: `08d53f4ab0ac6ef3a2a273067524533d`

---

## 📖 GUIDE

**[FIX-3-CORRECTIONS-CRITIQUES.md](computer:///mnt/user-data/outputs/FIX-3-CORRECTIONS-CRITIQUES.md)** - Détails

---

## 🎯 RÉSUMÉ

```
Corrections : 3
Critiques   : 2
Fichiers    : 3
Temps       : 3 min
```

---

**🚀 SQL → GIT → TESTE ! ✅**
