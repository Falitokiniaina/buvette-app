# 🎯 FIX FINAL CSP - v2.5.6

## ✅ Correction Définitive

Ajout de `scriptSrcAttr` avec `'unsafe-hashes'` pour les event handlers `onclick`.

---

## 🚀 DÉPLOIEMENT IMMÉDIAT

### Push GitHub (30 secondes)

```bash
cd buvette-app
git add backend/server.js
git commit -m "Fix: CSP scriptSrcAttr unsafe-hashes pour onclick"
git push origin main
```

---

## 🔧 Modification

**Fichier :** `backend/server.js`

**AJOUT CLEF :**
```javascript
scriptSrcAttr: ["'unsafe-inline'", "'unsafe-hashes'"],
```

**Configuration complète :**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'", "'unsafe-hashes'"],  // ← NOUVEAU !
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
    },
  },
}));
```

**scriptSrcAttr** contrôle spécifiquement les event handlers inline comme `onclick=""`.

---

## 🧪 TEST

Après le push (attendre 1-2 min) :

```
https://web-production-d4660.up.railway.app/index.html
```

**Vérifier console (F12) :**
- ✅ Plus d'erreur CSP
- ✅ Boutons cliquables
- ✅ Articles chargés

---

**Fais le push maintenant ! C'est le dernier ! 🚀**
