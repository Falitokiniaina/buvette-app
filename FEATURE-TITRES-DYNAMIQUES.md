# 🎨 TITRES DYNAMIQUES - Personnalisation

## 🎯 FONCTIONNALITÉ

**Ajout de 4 paramètres dans la table `parametrage` pour personnaliser les titres de chaque page.**

---

## ✅ PARAMÈTRES AJOUTÉS (4)

### 1. titre_page_client
- **Page :** index.html
- **Valeur par défaut :** "Buvette Concert Gospel"
- **Affichage :** 🎵 Buvette Concert Gospel

### 2. titre_page_caisse
- **Page :** caisse.html
- **Valeur par défaut :** "Caisse - Buvette Gospel"
- **Affichage :** 💳 Caisse - Buvette Gospel

### 3. titre_page_preparateur
- **Page :** preparateur.html
- **Valeur par défaut :** "Préparation des commandes"
- **Affichage :** 👨‍🍳 Préparation des commandes

### 4. titre_page_admin
- **Page :** admin.html
- **Valeur par défaut :** "Administration - Buvette Gospel"
- **Affichage :** ⚙️ Administration - Buvette Gospel

---

## 📝 FICHIERS MODIFIÉS (9)

### Base de données (1 fichier)

**parametres-titres-pages.sql** ⭐ NOUVEAU

Script SQL pour ajouter les 4 paramètres :
```sql
INSERT INTO parametrage (cle, valeur, description) VALUES
  ('titre_page_client', 'Buvette Concert Gospel', 'Titre page commande client'),
  ('titre_page_caisse', 'Caisse - Buvette Gospel', 'Titre page caisse'),
  ('titre_page_preparateur', 'Préparation des commandes', 'Titre page préparateur'),
  ('titre_page_admin', 'Administration - Buvette Gospel', 'Titre page admin');
```

### Frontend (8 fichiers)

**HTML (4 fichiers) :**
- frontend/index.html - Ajout `id="titrePage"` au `<h1>`
- frontend/caisse.html - Ajout `id="titrePage"` au `<h1>`
- frontend/preparateur.html - Ajout `id="titrePage"` au `<h1>`
- frontend/admin.html - Ajout `id="titrePage"` au `<h1>`

**JavaScript (4 fichiers) :**
- frontend/js/client.js - Fonction `chargerTitrePage()`
- frontend/js/caisse.js - Fonction `chargerTitrePage()`
- frontend/js/preparateur.js - Fonction `chargerTitrePage()`
- frontend/js/admin.js - Fonction `chargerTitrePage()`

---

## 🔧 DÉTAILS TECHNIQUES

### Modification HTML

**AVANT (statique) :**
```html
<h1>🎵 Buvette Concert Gospel</h1>
```

**APRÈS (dynamique) :**
```html
<h1 id="titrePage">🎵 Buvette Concert Gospel</h1>
```

### Fonction JavaScript ajoutée

**Toutes les pages (client.js, caisse.js, preparateur.js, admin.js) :**

```javascript
// Charger le titre de la page depuis les paramètres
async function chargerTitrePage() {
    try {
        const response = await apiGet('/parametrage/titre_page_XXX');
        if (response && response.valeur) {
            document.getElementById('titrePage').textContent = '🎵 ' + response.valeur;
        }
    } catch (error) {
        console.log('Utilisation du titre par défaut');
    }
}
```

**Appel au chargement :**
```javascript
document.addEventListener('DOMContentLoaded', async () => {
    // Charger le titre de la page
    await chargerTitrePage();
    
    // ... reste du code
});
```

---

## 🚀 DÉPLOIEMENT (3 MIN)

### 1. SQL (1 min)

**Supabase → Exécuter :**

```sql
INSERT INTO parametrage (cle, valeur, description) 
VALUES ('titre_page_client', 'Buvette Concert Gospel', 'Titre affiché sur la page de commande client')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur;

INSERT INTO parametrage (cle, valeur, description) 
VALUES ('titre_page_caisse', 'Caisse - Buvette Gospel', 'Titre affiché sur la page caisse')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur;

INSERT INTO parametrage (cle, valeur, description) 
VALUES ('titre_page_preparateur', 'Préparation des commandes', 'Titre affiché sur la page préparateur')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur;

INSERT INTO parametrage (cle, valeur, description) 
VALUES ('titre_page_admin', 'Administration - Buvette Gospel', 'Titre affiché sur la page administration')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur;
```

### 2. Git (2 min)

```bash
cd buvette-app
git add .
git commit -m "Feature: Titres dynamiques pour toutes les pages"
git push origin main
```

**Railway redéploie automatiquement ! ✅**

---

## 🧪 TESTS

### Test 1 : Titres par défaut ✅

**Après déploiement SQL + Frontend :**
```
1. Aller sur index.html
   ✅ Titre : "🎵 Buvette Concert Gospel"

2. Aller sur caisse.html
   ✅ Titre : "💳 Caisse - Buvette Gospel"

3. Aller sur preparateur.html
   ✅ Titre : "👨‍🍳 Préparation des commandes"

4. Aller sur admin.html
   ✅ Titre : "⚙️ Administration - Buvette Gospel"
```

### Test 2 : Modification des titres ✅

**Dans Supabase :**
```sql
UPDATE parametrage 
SET valeur = 'Buvette ANTSA PRAISE 2025' 
WHERE cle = 'titre_page_client';
```

**Résultat :**
```
1. Rafraîchir index.html
2. ✅ Nouveau titre : "🎵 Buvette ANTSA PRAISE 2025"
```

### Test 3 : Personnalisation complète ✅

**Scénario : Concert spécifique**
```sql
UPDATE parametrage SET valeur = 'Buvette ANTSA PRAISE 2025' WHERE cle = 'titre_page_client';
UPDATE parametrage SET valeur = 'Encaissement - ANTSA PRAISE' WHERE cle = 'titre_page_caisse';
UPDATE parametrage SET valeur = 'Cuisine - ANTSA PRAISE' WHERE cle = 'titre_page_preparateur';
UPDATE parametrage SET valeur = 'Gestion - ANTSA PRAISE' WHERE cle = 'titre_page_admin';
```

**Résultat :**
```
✅ Page client : "🎵 Buvette ANTSA PRAISE 2025"
✅ Page caisse : "💳 Encaissement - ANTSA PRAISE"
✅ Page préparation : "👨‍🍳 Cuisine - ANTSA PRAISE"
✅ Page admin : "⚙️ Gestion - ANTSA PRAISE"
```

---

## 💡 CAS D'USAGE

### Cas 1 : Événement récurrent

**Problème :** Plusieurs concerts dans l'année avec la même application

**Solution :**
```sql
-- Concert de Noël
UPDATE parametrage SET valeur = 'Buvette Concert Noël 2025' WHERE cle = 'titre_page_client';

-- Pâques 2026
UPDATE parametrage SET valeur = 'Buvette Concert Pâques 2026' WHERE cle = 'titre_page_client';
```

### Cas 2 : Multi-événements

**Problème :** Application utilisée pour différents types d'événements

**Solution :**
```sql
-- Concert Gospel
UPDATE parametrage SET valeur = 'Buvette Concert Gospel' WHERE cle = 'titre_page_client';

-- Kermesse
UPDATE parametrage SET valeur = 'Buvette Kermesse' WHERE cle = 'titre_page_client';

-- Fête paroissiale
UPDATE parametrage SET valeur = 'Buvette Fête Paroisse' WHERE cle = 'titre_page_client';
```

### Cas 3 : Branding personnalisé

**Problème :** Différents organisateurs avec leur propre identité

**Solution :**
```sql
-- EPMA Lyon
UPDATE parametrage SET valeur = 'Buvette EPMA Lyon' WHERE cle = 'titre_page_client';

-- Autre association
UPDATE parametrage SET valeur = 'Buvette Association XYZ' WHERE cle = 'titre_page_client';
```

---

## 🎨 PERSONNALISATION AVANCÉE

### Modifier aussi les icônes

**Si vous voulez changer l'icône :**

```javascript
// Dans chargerTitrePage() de chaque fichier JS

// Client
document.getElementById('titrePage').textContent = '🎵 ' + response.valeur;

// Pour changer l'icône, modifier :
document.getElementById('titrePage').textContent = '🍔 ' + response.valeur; // Buvette food
document.getElementById('titrePage').textContent = '🎤 ' + response.valeur; // Concert
document.getElementById('titrePage').textContent = '⛪ ' + response.valeur; // Église
```

### Ajouter un sous-titre dynamique

**Nouveau paramètre (optionnel) :**
```sql
INSERT INTO parametrage (cle, valeur, description) 
VALUES ('sous_titre_page_client', '6 Décembre 2025 - 18h30', 'Sous-titre page client');
```

**HTML :**
```html
<h1 id="titrePage">🎵 Buvette Concert Gospel</h1>
<p id="sousTitre" style="text-align: center;"></p>
```

**JavaScript :**
```javascript
const sousTitre = await apiGet('/parametrage/sous_titre_page_client');
if (sousTitre && sousTitre.valeur) {
    document.getElementById('sousTitre').textContent = sousTitre.valeur;
}
```

---

## 📊 AVANT / APRÈS

### AVANT (Titres statiques)

**Problème :**
```
❌ Titres codés en dur dans le HTML
❌ Impossible de changer sans redéployer
❌ Pas de personnalisation par événement
```

**Pour changer :**
```
1. Modifier le HTML
2. Git commit
3. Git push
4. Attendre déploiement (2-3 min)
```

### APRÈS (Titres dynamiques)

**Avantages :**
```
✅ Titres personnalisables en temps réel
✅ Changement via SQL (5 secondes)
✅ Pas de redéploiement nécessaire
✅ Multi-événements facile
```

**Pour changer :**
```
1. UPDATE parametrage SET valeur = '...' WHERE cle = '...';
2. Rafraîchir la page
3. ✅ Nouveau titre affiché !
```

---

## 🎯 RÉSUMÉ

```
┌────────────────────────────────────┐
│ FONCTIONNALITÉ TITRES DYNAMIQUES   │
├────────────────────────────────────┤
│ Paramètres ajoutés  : 4            │
│ Pages modifiées     : 4            │
│ Fichiers modifiés   : 9            │
│ Temps déploiement   : 3 min        │
│ Impact UX           : MOYEN        │
│ Impact flexibilité  : ÉLEVÉ ✅     │
├────────────────────────────────────┤
│ AVANTAGES                          │
├────────────────────────────────────┤
│ ✅ Personnalisation temps réel     │
│ ✅ Multi-événements facile         │
│ ✅ Pas de redéploiement            │
│ ✅ Branding dynamique              │
└────────────────────────────────────┘
```

---

**🎨 APPLICATION PERSONNALISABLE ! ✅**

**🔄 CHANGEMENT TITRES EN 5 SECONDES ! 🚀**

**🎵 PARFAIT POUR ÉVÉNEMENTS MULTIPLES ! 🎤**
