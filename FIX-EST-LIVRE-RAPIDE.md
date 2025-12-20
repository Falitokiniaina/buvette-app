# ⚡ FIX DÉTAILS ARTICLES - RAPIDE

## 🎯 ERREUR

```
GET /api/stats/articles-a-preparer 500
column ci.quantite_livree does not exist
```

---

## ✅ CAUSE

**Table utilise `est_livre` (BOOLEAN) :**
```sql
CREATE TABLE commande_items (
  quantite INTEGER,
  est_livre BOOLEAN  -- ✅ Existe
  -- quantite_livree  ❌ N'existe PAS
);
```

---

## ✅ SOLUTION

**Requête corrigée :**

```sql
-- AVANT (ERREUR)
SUM(ci.quantite_livree)  -- ❌

-- APRÈS (CORRIGÉ)
SUM(CASE WHEN ci.est_livre THEN ci.quantite ELSE 0 END)  -- ✅
SUM(CASE WHEN NOT ci.est_livre THEN ci.quantite ELSE 0 END)  -- ✅
```

**Fichier : backend/server.js**

---

## 🚀 DÉPLOIEMENT (1 MIN)

```bash
cd buvette-app
git add backend/server.js
git commit -m "Fix: est_livre au lieu de quantite_livree"
git push origin main
```

---

## 🧪 TEST

```
Préparation → "📊 Détails par article"
✅ 200 OK (pas 500)
✅ Popup affiche totaux
```

---

## 📦 ARCHIVE

**[📥 Télécharger (233 KB)](computer:///mnt/user-data/outputs/buvette-app-v2.7-FINAL-COMPLET.tar.gz)**

MD5: `89127031b29b0ce76ed714e9f2a5ba5f`

---

## 📖 GUIDE DÉTAILLÉ

**[FIX-EST-LIVRE-QUANTITE.md](computer:///mnt/user-data/outputs/FIX-EST-LIVRE-QUANTITE.md)**

---

**🚀 PUSH → FEATURE OK ! ✅**
