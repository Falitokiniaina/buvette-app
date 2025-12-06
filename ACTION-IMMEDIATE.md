# ⚡ ACTION IMMÉDIATE - SCHEMA FINAL

## 🎯 CE QU'IL FAUT FAIRE (2 MIN)

### 1. Ouvre Supabase SQL Editor

### 2. Copie ce fichier :
```
database/schema-v2.7-COMPLET-FINAL.sql
```

### 3. Colle dans Supabase et clique "Run"

### 4. C'est fait ! ✅

---

## ✅ CE QUI SERA CRÉÉ

### Articles (6)
```
Box Salé           5€  (50 stock)
Box Sucré          5€  (50 stock)
Bagnat Catless     8€  (30 stock)
Hot Dog + Frites   8€  (40 stock)
Vary Anana         8€  (35 stock)
Boisson            1€  (150 stock)
```

### Images
```
✅ Depuis ton GitHub
✅ /Falitokiniaina/buvette-app/main/images/
```

### Vues SQL (3)
```
✅ v_stock_disponible       (stock temps réel)
✅ v_commandes_details      (historique admin)
✅ v_stats_articles         (stats admin)
```

### Paramètres (5)
```
✅ vente_ouverte = true
✅ mot_de_passe_admin = admin123
✅ mot_de_passe_caisse = caisse123
✅ mot_de_passe_preparation = prep123
```

---

## 🧪 VÉRIFICATION RAPIDE

```sql
-- Copie/colle dans Supabase après le schema:
SELECT nom, prix, stock_disponible FROM articles ORDER BY prix;
```

**Attendu :**
```
Boisson            1€  150
Box Salé           5€  50
Box Sucré          5€  50
Bagnat Catless     8€  30
Hot Dog + Frites   8€  40
Vary Anana         8€  35
```

---

## 🎉 RÉSULTAT

**Erreurs Railway :**
```
❌ AVANT: v_commandes_details manquante
❌ AVANT: v_stats_articles manquante
✅ APRÈS: Tout fonctionne !
```

**Articles :**
```
❌ AVANT: Articles génériques
✅ APRÈS: Tes 6 articles réels avec images GitHub
```

**Application :**
```
✅ Page Client - 6 articles
✅ Page Caisse - Réservations actives
✅ Page Admin - Stats fonctionnelles
✅ Page Préparation - OK
```

---

## 📦 FICHIERS

**Principal :**
```
database/schema-v2.7-COMPLET-FINAL.sql  ⭐ UTILISE CELUI-CI
```

**Documentation :**
```
ARTICLES-REELS-FINAL.md          Guide articles
APPLICATION-SCHEMA-V2.7-FINAL.md Guide complet
CORRECTION-RAPIDE-RAILWAY.md     Guide rapide
```

---

## 🚀 MAINTENANT

1. **Supabase SQL Editor**
2. **Copie/Colle schema-v2.7-COMPLET-FINAL.sql**
3. **Run**
4. **Teste ton app**
5. **✅ Prêt pour demain !**

---

**⏱️ 2 MINUTES → TOUT RÉGLÉ ! 🎵**
