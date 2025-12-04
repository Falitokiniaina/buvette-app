# 🔧 FIX DÉFINITIF IPv4 - v2.5.2

## ✅ Solution Complète

J'ai modifié **3 fichiers** pour forcer Node.js à utiliser IPv4 :

1. `package.json` - Script start
2. `Procfile` - Commande Railway
3. `railway.json` - StartCommand Railway

**Ajout partout :** `--dns-result-order=ipv4first`

---

## 📥 DÉPLOIEMENT EN 3 MINUTES

### ÉTAPE 1 : Télécharger & Extraire

```bash
# Télécharger : buvette-app-v2.5.2-force-ipv4.tar.gz
tar -xzf buvette-app-v2.5.2-force-ipv4.tar.gz
cd buvette-app
```

---

### ÉTAPE 2 : Push sur GitHub

```bash
git add .
git commit -m "Fix: Force IPv4 DNS resolution pour Supabase"
git push origin main
```

---

### ÉTAPE 3 : Vérifier Railway

```
1. Railway Dashboard
2. Voir le redéploiement automatique
3. ⏳ Attendre 1-2 minutes
4. Vérifier que "Success" (vert)
```

---

### ÉTAPE 4 : Tester

```bash
curl https://web-production-d4660.up.railway.app/api/health
```

**DOIT RETOURNER :**
```json
{"status":"OK","database":"connected","timestamp":"..."}
```

✅ **SI OUI : C'EST RÉPARÉ ! 🎉**

---

## 🔍 Qu'est-ce Qui a Changé ?

### Fichier 1 : `package.json`
```json
"start": "node --dns-result-order=ipv4first backend/server.js"
```

### Fichier 2 : `Procfile`
```
web: node --dns-result-order=ipv4first backend/server.js
```

### Fichier 3 : `railway.json`
```json
"startCommand": "node --dns-result-order=ipv4first backend/server.js"
```

**Option `--dns-result-order=ipv4first` :**
Force Node.js à préférer les adresses IPv4 lors de la résolution DNS.

---

## 🆘 SI ÇA NE MARCHE TOUJOURS PAS

### Vérifier que le Push a Fonctionné

```bash
# Sur GitHub, vérifier que ces fichiers sont à jour
# package.json ligne 7
# Procfile ligne 1
# railway.json ligne 7
```

### Vérifier les Logs Railway

```
Railway → Deployments → View Logs

Chercher :
"🚀 Serveur démarré sur le port..."
"✅ Base de données connectée:..."
```

Si tu vois "✅ Base de données connectée" dans les logs = **C'EST BON !**

---

## 📊 Versions

| Version | Fix |
|---------|-----|
| v2.5.2 | **Force IPv4 (3 fichiers)** |
| v2.5.1 | UI préparateur |
| v2.5 | Paramétrage + détails |

---

**Fais le push et teste ! 🚀**
