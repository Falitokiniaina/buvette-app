# 🔧 FIX CSP - v2.5.5 FINAL

## ❌ Problème

Helmet bloquait les événements inline (`onclick=""`) utilisés dans le frontend.

**Erreur :**
```
Content Security Policy directive 'script-src-attr 'none''
```

---

## ✅ Solution Appliquée

Configuration Helmet assouplie pour permettre les `onclick`.

---

## 📥 DÉPLOIEMENT (1 MINUTE)

### 1. Extraire

```bash
tar -xzf buvette-app-v2.5.5-csp-fix.tar.gz
cd buvette-app
```

### 2. Push GitHub

```bash
git add backend/server.js
git commit -m "Fix: Assouplir CSP Helmet pour onclick"
git push origin main
```

### 3. Attendre & Tester

```
⏳ Attendre 1-2 minutes
🌐 Ouvrir : https://web-production-d4660.up.railway.app/index.html
```

✅ **Les boutons doivent fonctionner !**

---

## 🔧 Modification

**Fichier :** `backend/server.js`

**AVANT :**
```javascript
app.use(helmet()); // Bloquait les onclick
```

**APRÈS :**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      // ...
    },
  },
}));
```

**Autorise :**
- ✅ `onclick="function()"`
- ✅ Scripts inline
- ✅ Images externes (Unsplash)

---

## ✅ TEST FINAL

```
https://web-production-d4660.up.railway.app/index.html
```

**Vérifier :**
- [ ] Page s'affiche
- [ ] Articles visibles
- [ ] Boutons cliquables
- [ ] Aucune erreur console

---

**Fais le push ! 🚀**

**C'EST LA DERNIÈRE CORRECTION ! 🎉**
