# ☁️ CONFIGURATION SUPABASE

## ✅ Configuration Appliquée

L'application est maintenant configurée pour utiliser **Supabase** comme base de données PostgreSQL !

**URL de connexion :**
```
postgresql://postgres:#prnCQiUr7fL*MN@db.frcrzayagaxnqrglyocg.supabase.co:5432/postgres?sslmode=require
```

## 🔧 Où est Configurée la Connexion ?

### 1. Fichier Principal : `backend/db.js`

```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    'postgresql://postgres:#prnCQiUr7fL*MN@db.frcrzayagaxnqrglyocg.supabase.co:5432/postgres?sslmode=require',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Fonctionnement :**
- Si `DATABASE_URL` existe (Railway/Render) → Utilise cette URL
- Sinon → Utilise l'URL Supabase par défaut ✅

**Avantage :** Fonctionne partout (local, Railway, Vercel, etc.)

### 2. Fichier Exemple : `.env.example`

Contient la configuration documentée pour référence.

## 📊 Articles Menu Mis à Jour

### Modifications Appliquées

**Avant (9 articles) :**
- Box Salé
- Box Sucré
- Bagnat Catless
- Hot Dog + Frites
- Vary Anana
- Coca Cola ❌
- Orangina ❌
- Ice Tea ❌
- Eau ❌

**Maintenant (6 articles) :**
- Box Salé
- Box Sucré
- Bagnat Catless
- Hot Dog + Frites
- Vary Anana (description corrigée) ✅
- **Boisson** (remplace les 4 boissons) ✅

### Détails des Changements

**1. Boissons Simplifiées**
```sql
-- Ancien (4 lignes)
('Coca Cola', 'Boisson gazeuse', 1.00, 100, TRUE, '...'),
('Orangina', 'Boisson gazeuse à l''orange', 1.00, 100, TRUE, '...'),
('Ice Tea', 'Thé glacé', 1.00, 100, TRUE, '...'),
('Eau', 'Eau minérale', 1.00, 150, TRUE, '...')

-- Nouveau (1 ligne)
('Boisson', 'Cannette ou bouteille', 1.00, 150, TRUE, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop')
```

**2. Vary Anana Corrigé**
```sql
-- Ancien
('Vary Anana', 'Riz sauté + saosisy gasy + boulettes maison', 8.00, 35, TRUE, '...')

-- Nouveau
('Vary Anana', 'Vary @anana + saosisy gasy + boulettes maison', 8.00, 35, TRUE, '...')
```

## 🎯 Nouvelles Fonctionnalités Frontend

### 1. Affichage Articles Disponibles Uniquement

**Backend modifié :**
```javascript
// Endpoint GET /api/articles
'SELECT * FROM articles WHERE actif = TRUE AND stock_disponible > 0 ORDER BY nom ASC'
```

**Filtres appliqués :**
- ✅ `actif = TRUE` - Seulement les articles activés
- ✅ `stock_disponible > 0` - Seulement ceux en stock

### 2. Message Si Aucun Article

**Avant :**
```
Aucun article disponible
```

**Maintenant :**
```
┌─────────────────────────────────┐
│           📦                    │
│                                 │
│ Aucun article en vente          │
│ actuellement                    │
│                                 │
│ Les articles seront bientôt     │
│ disponibles. Merci de votre     │
│ patience !                      │
└─────────────────────────────────┘
```

### 3. Limitation Quantité au Stock

**Code :**
```html
<input type="number" 
       id="qty-${article.id}" 
       value="0" 
       min="0" 
       max="${article.stock_disponible}"  ← Stock max
       readonly>
```

**Comportement :**
- Stock = 10 → Peut commander max 10
- Stock = 0 → Article n'apparaît pas ✅
- Tentative de commander plus → Message d'erreur

## 🚀 Déploiement

### Option 1 : Local (Supabase Direct)

```bash
cd buvette-app

# Pas besoin de .env, l'URL Supabase est déjà dans db.js
npm install
npm start

# Tester
curl http://localhost:3000/api/health
# → {"status": "OK", "database": "connected"}
```

### Option 2 : Railway (Peut Override)

**Variables Railway (optionnelles) :**
```bash
# Si vous voulez utiliser une autre base
DATABASE_URL=votre-autre-url

# Sinon, laissez vide → Utilisera Supabase automatiquement
```

### Option 3 : Vercel/Netlify

La connexion Supabase fonctionne automatiquement, pas de config nécessaire !

## 🗄️ Initialiser la Base Supabase

### Via Supabase Dashboard

1. **Aller sur https://supabase.com/dashboard**
2. **Ouvrir votre projet**
3. **SQL Editor** (barre latérale)
4. **"New Query"**
5. **Copier tout le contenu** de `database/schema.sql`
6. **Coller et "Run"**
7. ✅ **Base initialisée !**

### Via psql (Terminal)

```bash
# Se connecter
psql "postgresql://postgres:#prnCQiUr7fL*MN@db.frcrzayagaxnqrglyocg.supabase.co:5432/postgres?sslmode=require"

# Exécuter le schema
\i database/schema.sql

# Vérifier
SELECT * FROM articles;
# Devrait afficher 6 articles
```

## 🧪 Tests de Validation

### Test 1 : Connexion Base

```bash
# Depuis n'importe où
psql "postgresql://postgres:#prnCQiUr7fL*MN@db.frcrzayagaxnqrglyocg.supabase.co:5432/postgres?sslmode=require"

\dt  # Liste des tables
# Devrait afficher : articles, commandes, commande_items, historique_stock
```

### Test 2 : Articles Disponibles

```bash
curl http://localhost:3000/api/articles
# Devrait afficher 6 articles (si stock > 0)
```

### Test 3 : Filtrage Stock

```sql
-- Mettre le stock de "Boisson" à 0
UPDATE articles SET stock_disponible = 0 WHERE nom = 'Boisson';

-- Recharger la page client
-- → "Boisson" ne doit plus apparaître ✅
```

### Test 4 : Limitation Quantité

```
1. Page client → Créer commande
2. Article "Box Salé" (stock: 50)
3. Essayer d'ajouter 51
4. ✅ Message : "Stock maximum atteint (50)"
```

## 📋 Menu Final (6 articles)

| Article | Description | Prix | Stock Initial |
|---------|-------------|------|---------------|
| Box Salé | Snacks salés | 5€ | 50 |
| Box Sucré | Desserts | 5€ | 50 |
| Bagnat Catless | Sandwich niçois | 8€ | 30 |
| Hot Dog + Frites | Hot dog + frites | 8€ | 40 |
| Vary Anana | Vary @anana + saosisy + boulettes | 8€ | 35 |
| **Boisson** | **Cannette ou bouteille** | **1€** | **150** |

**Total stock initial :** 305 unités

## 🔐 Sécurité

### Mot de Passe Supabase

**Dans l'URL :**
```
postgres:#prnCQiUr7fL*MN@db.frcrzayagaxnqrglyocg.supabase.co
         ^^^^^^^^^^^^^^
         Mot de passe
```

**⚠️ Attention :**
- Ce mot de passe est visible dans le code
- Pour production, utiliser une variable d'environnement
- Ou créer un user avec moins de privilèges

### Recommandation Production

```javascript
// Ne jamais hardcoder le mot de passe
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,  // Depuis env
  ssl: { rejectUnauthorized: false }
});
```

**Variables d'environnement (Railway/Vercel) :**
```
DATABASE_URL=postgresql://postgres:PASSWORD@db.frcrzayagaxnqrglyocg.supabase.co:5432/postgres?sslmode=require
```

## 🆘 Dépannage

### Erreur : "Connection refused"

**Cause :** URL Supabase incorrecte ou service down

**Solution :**
1. Vérifier l'URL dans Supabase Dashboard
2. Settings → Database → Connection String
3. Copier l'URL complète avec mot de passe

### Erreur : "Password authentication failed"

**Cause :** Mot de passe changé ou caractères spéciaux

**Solution :**
```bash
# Encoder le mot de passe si caractères spéciaux
# Dans l'URL, remplacer # par %23, @ par %40, etc.
```

### Articles ne s'affichent pas

**Vérifier le stock :**
```sql
SELECT nom, stock_disponible, actif FROM articles;
```

**Si stock = 0 :**
```sql
UPDATE articles SET stock_disponible = 50 WHERE nom = 'Box Salé';
```

## 📊 Monitoring Supabase

### Dashboard Supabase

1. **Database** → Voir les tables
2. **API** → Tester les requêtes
3. **Logs** → Voir les connexions
4. **Reports** → Utilisation

### Requêtes Utiles

```sql
-- Voir les articles en vente
SELECT nom, stock_disponible FROM articles 
WHERE actif = TRUE AND stock_disponible > 0;

-- Voir les commandes du jour
SELECT * FROM commandes 
WHERE DATE(created_at) = CURRENT_DATE;

-- Réinitialiser le stock
UPDATE articles SET stock_disponible = 50 
WHERE nom IN ('Box Salé', 'Box Sucré');
```

## ✅ Checklist Configuration

- [x] URL Supabase dans `backend/db.js`
- [x] Fallback automatique vers Supabase
- [x] Schema.sql mis à jour (6 articles)
- [x] Filtrage backend (stock > 0 ET actif)
- [x] Message frontend si aucun article
- [x] Limitation quantité au stock
- [x] Description Vary Anana corrigée
- [x] Boissons simplifiées en 1 article

## 🎉 Résumé

**Changements appliqués :**
1. ✅ Connexion Supabase configurée
2. ✅ Menu simplifié (9 → 6 articles)
3. ✅ Affichage articles disponibles uniquement
4. ✅ Message si aucun article
5. ✅ Quantité limitée au stock

**L'application est maintenant prête avec Supabase ! ☁️**

---

**Base de données :** Supabase PostgreSQL  
**Articles :** 6 (au lieu de 9)  
**Filtres :** Stock > 0 ET actif  
**Configuration :** Automatique
