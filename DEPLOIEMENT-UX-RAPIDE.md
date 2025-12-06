# ⚡ DÉPLOIEMENT RAPIDE - UX CAISSE & CLIENT

## 🎯 3 AMÉLIORATIONS

```
1. ✅ Modal panier vide (plus visible)
2. ✅ Vérification stock à "Encaisser" (pas à "Confirmer")
3. ✅ Expiration réservations 15 min (au lieu de 30)
```

---

## 🚀 DÉPLOIEMENT (3 MIN)

### 1️⃣ SQL (30 sec)

**Supabase SQL Editor → Copie/colle :**

```sql
CREATE OR REPLACE FUNCTION nettoyer_reservations_expirees()
RETURNS INTEGER AS $$
DECLARE
    nb_supprimes INTEGER;
BEGIN
    DELETE FROM reservation_temporaire 
    WHERE created_at < NOW() - INTERVAL '15 minutes';
    
    GET DIAGNOSTICS nb_supprimes = ROW_COUNT;
    RETURN nb_supprimes;
END;
$$ LANGUAGE plpgsql;
```

**Clique "Run"**

---

### 2️⃣ Code (2 min)

```bash
cd buvette-app

git add .
git commit -m "Fix: UX caisse (vérif stock encaissement) + modal panier"
git push origin main
```

**Attendre Railway (2 min)**

---

### 3️⃣ Tests (1 min)

**Test modal panier vide :**
```
Client → Panier vide → "Aller à la caisse"
✅ Modal s'affiche (pas petit bandeau)
```

**Test vérif stock :**
```
Caisse → "Encaisser" commande sans stock
✅ Blocage immédiat (pas après saisie montants)
```

---

## 📦 ARCHIVE

**[📥 Télécharger (198 KB)](computer:///mnt/user-data/outputs/buvette-app-v2.7-FINAL-COMPLET.tar.gz)**

MD5: `d9c868daffe757abb02eb824a4f45b7b`

---

## 📖 GUIDE COMPLET

**[📄 FIX-UX-CAISSE-CLIENT.md](computer:///mnt/user-data/outputs/FIX-UX-CAISSE-CLIENT.md)** - Détails techniques

---

## ✅ RÉSULTAT

```
Workflow caisse : ⚡ Plus rapide
UX client       : ✅ Plus clair
Rotation stock  : 🔄 Optimisée
Déploiement     : 3 minutes
```

---

**🚀 SQL → GIT PUSH → TESTE ! ✅**
