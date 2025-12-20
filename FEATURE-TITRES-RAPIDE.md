# ⚡ TITRES DYNAMIQUES - RAPIDE

## 🎯 FONCTIONNALITÉ

**Personnaliser les titres de chaque page via la base de données.**

---

## ✅ PARAMÈTRES (4)

```
1. titre_page_client      → "Buvette Concert Gospel"
2. titre_page_caisse      → "Caisse - Buvette Gospel"
3. titre_page_preparateur → "Préparation des commandes"
4. titre_page_admin       → "Administration - Buvette Gospel"
```

---

## 📝 FICHIERS MODIFIÉS (9)

```
database/parametres-titres-pages.sql  → Script SQL
frontend/index.html                   → ID sur <h1>
frontend/js/client.js                 → chargerTitrePage()
frontend/caisse.html                  → ID sur <h1>
frontend/js/caisse.js                 → chargerTitrePage()
frontend/preparateur.html             → ID sur <h1>
frontend/js/preparateur.js            → chargerTitrePage()
frontend/admin.html                   → ID sur <h1>
frontend/js/admin.js                  → chargerTitrePage()
```

---

## 🚀 DÉPLOIEMENT (3 MIN)

### 1. SQL (1 min)

**Supabase → Exécuter :**

```sql
INSERT INTO parametrage (cle, valeur, description) VALUES
('titre_page_client', 'Buvette Concert Gospel', 'Titre page commande client'),
('titre_page_caisse', 'Caisse - Buvette Gospel', 'Titre page caisse'),
('titre_page_preparateur', 'Préparation des commandes', 'Titre page préparateur'),
('titre_page_admin', 'Administration - Buvette Gospel', 'Titre page admin')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur;
```

### 2. Git (2 min)

```bash
cd buvette-app
git add .
git commit -m "Feature: Titres dynamiques pour toutes les pages"
git push origin main
```

---

## 🧪 TEST

**Modifier un titre :**
```sql
UPDATE parametrage 
SET valeur = 'Buvette ANTSA PRAISE 2025' 
WHERE cle = 'titre_page_client';
```

**Résultat :**
```
✅ Rafraîchir index.html
✅ Nouveau titre : "🎵 Buvette ANTSA PRAISE 2025"
```

---

## 💡 UTILISATION

**Changement rapide (5 secondes) :**
```sql
UPDATE parametrage SET valeur = 'Nouveau titre' WHERE cle = 'titre_page_XXX';
```

**Pas de redéploiement nécessaire ! ✅**

---

## 📖 GUIDE DÉTAILLÉ

**[FEATURE-TITRES-DYNAMIQUES.md](computer:///mnt/user-data/outputs/FEATURE-TITRES-DYNAMIQUES.md)**

---

**🎨 PERSONNALISATION EN TEMPS RÉEL ! ✅**

**🔄 CHANGEMENT EN 5 SECONDES ! 🚀**
