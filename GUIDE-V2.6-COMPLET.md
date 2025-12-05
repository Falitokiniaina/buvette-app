# 🚀 VERSION 2.6 - LIVRAISON PARTIELLE

## ✅ MODIFICATIONS BACKEND DÉJÀ FAITES

### 1. Base de Données
- ✅ Statut 'livree_partiellement' ajouté
- ✅ Colonne est_livre dans commande_items
- ✅ Mots de passe dans parametrage
- ✅ Max connexions: 500

### 2. API Backend
- ✅ Endpoint /api/commandes/:id/livrer modifié pour livraison partielle
- ✅ Endpoint /api/commandes/statut/:statut inclut partiellement livrées
- ✅ Endpoint /api/commandes/nom/:nom case insensitive
- ✅ POST /api/commandes vérification case insensitive

---

## 📥 DÉPLOIEMENT BACKEND

### Étape 1 : Migration SQL

```sql
-- Dans Supabase SQL Editor
-- Copier-coller database/migration-v2.5-v2.6.sql
```

### Étape 2 : Push Backend

```bash
tar -xzf buvette-app-v2.6-backend-ready.tar.gz
cd buvette-app
git add backend/
git add database/
git commit -m "v2.6: Backend livraison partielle"
git push origin main
```

---

## 🔧 MODIFICATIONS FRONTEND À FAIRE

### MODIFICATION 1 : auth.js - Mots de passe depuis Base

**Fichier :** `frontend/js/auth.js`

**Remplacer TOUTE la fonction verifierAccesAdmin :**

```javascript
async function verifierAccesAdmin() {
    if (sessionStorage.getItem('admin_auth') === 'ok') {
        return true;
    }
    
    // Récupérer le mot de passe depuis la base
    let MOT_DE_PASSE;
    try {
        const response = await fetch('/api/parametrage/mot_de_passe_admin');
        const data = await response.json();
        MOT_DE_PASSE = data.valeur_texte;
    } catch (error) {
        MOT_DE_PASSE = 'FPMA123456'; // Fallback
    }
    
    const password = prompt('🔐 Mot de passe administrateur requis:');
    
    if (password === MOT_DE_PASSE) {
        sessionStorage.setItem('admin_auth', 'ok');
        return true;
    } else if (password !== null) {
        alert('❌ Mot de passe incorrect');
    }
    
    window.location.href = 'index.html';
    return false;
}
```

**Ajouter fonction vérification caisse :**

```javascript
async function verifierAccesCaisse() {
    if (sessionStorage.getItem('caisse_auth') === 'ok') {
        return true;
    }
    
    let MOT_DE_PASSE;
    try {
        const response = await fetch('/api/parametrage/mot_de_passe_caisse');
        const data = await response.json();
        MOT_DE_PASSE = data.valeur_texte;
    } catch (error) {
        MOT_DE_PASSE = 'FPMA123';
    }
    
    const password = prompt('🔐 Mot de passe caisse requis:');
    
    if (password === MOT_DE_PASSE) {
        sessionStorage.setItem('caisse_auth', 'ok');
        return true;
    } else if (password !== null) {
        alert('❌ Mot de passe incorrect');
    }
    
    window.location.href = 'index.html';
    return false;
}

async function verifierAccesPreparateur() {
    if (sessionStorage.getItem('preparateur_auth') === 'ok') {
        return true;
    }
    
    let MOT_DE_PASSE;
    try {
        const response = await fetch('/api/parametrage/mot_de_passe_preparateur');
        const data = await response.json();
        MOT_DE_PASSE = data.valeur_texte;
    } catch (error) {
        MOT_DE_PASSE = 'FPMA1234';
    }
    
    const password = prompt('🔐 Mot de passe préparateur requis:');
    
    if (password === MOT_DE_PASSE) {
        sessionStorage.setItem('preparateur_auth', 'ok');
        return true;
    } else if (password !== null) {
        alert('❌ Mot de passe incorrect');
    }
    
    window.location.href = 'index.html';
    return false;
}
```

---

### MODIFICATION 2 : caisse.html - Ajouter Protection

**Fichier :** `frontend/caisse.html`

**Après `<script src="js/auth.js"></script>` (ligne ~8), ajouter :**

```html
<script>
window.addEventListener('DOMContentLoaded', async () => {
    const acces = await verifierAccesCaisse();
    if (!acces) {
        document.body.innerHTML = '<div style="text-align:center;padding:50px;"><h1>Accès refusé</h1></div>';
    }
});
</script>
```

---

### MODIFICATION 3 : preparateur.html - Ajouter Protection

**Fichier :** `frontend/preparateur.html`

**Après `<script src="js/auth.js"></script>` (ligne ~8), ajouter :**

```html
<script>
window.addEventListener('DOMContentLoaded', async () => {
    const acces = await verifierAccesPreparateur();
    if (!acces) {
        document.body.innerHTML = '<div style="text-align:center;padding:50px;"><h1>Accès refusé</h1></div>';
    }
});
</script>
```

---

### MODIFICATION 4 : client.js - Bouton "Commencer ma commande"

**Fichier :** `frontend/js/client.js`

**Chercher la fonction `nouvelleCommande()` et remplacer par :**

```javascript
function nouvelleCommande() {
    // Réinitialiser l'état
    commandeEnCours = null;
    panier = [];
    
    // Réafficher l'étape 1
    afficherEtape1();
    
    // Reset le formulaire
    document.getElementById('nomCommande').value = '';
    
    // Scroll en haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function afficherEtape1() {
    document.getElementById('etape1').style.display = 'block';
    document.getElementById('etape2').style.display = 'none';
    document.getElementById('etape3').style.display = 'none';
    
    // Afficher le bon bouton
    const container = document.getElementById('etape1');
    const button = container.querySelector('button');
    if (button) {
        button.textContent = 'Commencer ma commande';
        button.onclick = () => creerCommande();
        button.disabled = false;
    }
}
```

---

### MODIFICATION 5 : preparateur.js - Cases à Cocher (COMPLEXE)

**Fichier :** `frontend/js/preparateur.js`

**La modification de la fonction `ouvrirLivraison` est TRÈS longue.**

**Logique à implémenter :**

1. Afficher une case à cocher devant chaque article
2. Case "Tout cocher / Tout décocher" en haut
3. Articles déjà livrés : case cochée et disabled (grisée)
4. Message conditionnel :
   - Si tout coché : "Confirmez que tous les articles..."
   - Sinon : Pas de message ou message adapté
5. À la validation, envoyer `article_ids` des items cochés à l'API

**Structure du popup :**

```javascript
modalBody.innerHTML = `
    <div class="commande-info">
        <p><strong>Commande:</strong> ${commande.nom_commande}</p>
        <p><strong>Statut:</strong> ${afficherStatut(commande.statut)}</p>
    </div>
    
    <div class="mt-2">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h4>Articles à préparer:</h4>
            <label style="cursor: pointer;">
                <input type="checkbox" id="toggleAll" onchange="toggleTousArticles()" checked>
                <span style="margin-left: 0.5rem;">Tout cocher / Tout décocher</span>
            </label>
        </div>
        
        ${commande.items.map(item => `
            <div class="commande-item" style="display: flex; align-items: center; gap: 1rem;">
                <input 
                    type="checkbox" 
                    class="checkbox-article" 
                    data-item-id="${item.id}"
                    ${item.est_livre ? 'checked disabled' : 'checked'}
                    onchange="verifierStatutCochage()"
                >
                <div>
                    <strong>${item.article_nom}</strong><br>
                    <span>Quantité: ${item.quantite}</span>
                    ${item.est_livre ? '<span style="color: green; margin-left: 1rem;">✓ Déjà livré</span>' : ''}
                </div>
            </div>
        `).join('')}
    </div>
    
    <div id="messageValidation" class="alert alert-warning mt-2" style="display: block;">
        ⚠️ Confirmez que tous les articles ont été préparés et remis au client
    </div>
`;
```

**Fonctions à ajouter :**

```javascript
function toggleTousArticles() {
    const toggleAll = document.getElementById('toggleAll');
    const checkboxes = document.querySelectorAll('.checkbox-article:not([disabled])');
    
    checkboxes.forEach(cb => {
        cb.checked = toggleAll.checked;
    });
    
    verifierStatutCochage();
}

function verifierStatutCochage() {
    const checkboxes = document.querySelectorAll('.checkbox-article');
    const toutCoche = Array.from(checkboxes).every(cb => cb.checked);
    
    const message = document.getElementById('messageValidation');
    if (toutCoche) {
        message.style.display = 'block';
        message.textContent = '⚠️ Confirmez que tous les articles ont été préparés et remis au client';
    } else {
        message.style.display = 'none';
    }
}
```

**Dans `confirmerLivraison()`, modifier l'appel API :**

```javascript
async function confirmerLivraison() {
    if (!commandeSelectionnee) return;
    
    try {
        // Récupérer les IDs des articles cochés
        const checkboxes = document.querySelectorAll('.checkbox-article:checked:not([disabled])');
        const articleIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.itemId));
        
        // Appel API avec les IDs
        const commande = await apiPut(
            `/commandes/${commandeSelectionnee.id}/livrer`,
            { article_ids: articleIds }
        );
        
        fermerModal();
        showSuccess(`Commande "${commande.nom_commande}" mise à jour`);
        
        setTimeout(() => {
            chargerCommandesPayees();
            chargerStatistiques();
        }, 1000);
        
    } catch (error) {
        showError(error.message || 'Erreur lors de la livraison');
    }
}
```

---

### MODIFICATION 6 : preparateur.js - Afficher Statuts

**Dans la fonction `afficherCommandesListe`, modifier :**

```javascript
container.innerHTML = commandes.map(commande => `
    <div class="commande-card">
        <div class="commande-header">
            <div>
                <span class="commande-nom-display">${commande.nom_commande}</span>
                <span class="badge ${getBadgeClass(commande.statut)}">${afficherStatut(commande.statut)}</span>
                <p class="info">
                    ${commande.nombre_items} article(s) - 
                    ${commande.quantite_totale} unité(s)<br>
                    <small>Payée le ${formatDate(commande.date_paiement)}</small>
                </p>
            </div>
            <span class="commande-total">${formatPrice(commande.montant_total)}</span>
        </div>
        <button onclick="ouvrirLivraison('${commande.nom_commande}')" class="btn btn-success mt-1">
            📋 Voir le détail - Marquer comme livrée
        </button>
    </div>
`).join('');
```

**Ajouter fonctions helper :**

```javascript
function afficherStatut(statut) {
    const statuts = {
        'en_attente': 'En attente',
        'payee': 'Payée',
        'livree_partiellement': 'Livrée partiellement',
        'livree': 'Livrée',
        'annulee': 'Annulée'
    };
    return statuts[statut] || statut;
}

function getBadgeClass(statut) {
    const classes = {
        'en_attente': 'badge-warning',
        'payee': 'badge-success',
        'livree_partiellement': 'badge-info',
        'livree': 'badge-success',
        'annulee': 'badge-danger'
    };
    return classes[statut] || '';
}
```

**Ajouter CSS dans style.css :**

```css
.badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: var(--radius);
    margin-left: 0.5rem;
}

.badge-success {
    background: #10b981;
    color: white;
}

.badge-info {
    background: #3b82f6;
    color: white;
}

.badge-warning {
    background: #f59e0b;
    color: white;
}

.badge-danger {
    background: #ef4444;
    color: white;
}
```

---

## 📋 CHECKLIST COMPLÈTE

### Backend
- [ ] Migration SQL exécutée dans Supabase
- [ ] Code backend pushé sur GitHub
- [ ] Railway redéployé
- [ ] Tests API

### Frontend - Auth
- [ ] auth.js modifié (3 fonctions)
- [ ] caisse.html protection ajoutée
- [ ] preparateur.html protection ajoutée

### Frontend - Client
- [ ] client.js fonction nouvelleCommande modifiée
- [ ] client.js fonction afficherEtape1 ajoutée

### Frontend - Préparateur
- [ ] preparateur.js cases à cocher ajoutées
- [ ] preparateur.js fonctions toggle ajoutées
- [ ] preparateur.js affichage statuts ajouté
- [ ] style.css badges ajoutés

### Tests
- [ ] Admin : mot de passe FPMA123456
- [ ] Caisse : mot de passe FPMA123
- [ ] Préparateur : mot de passe FPMA1234
- [ ] Client : bouton "Commencer ma commande"
- [ ] Préparateur : cases à cocher fonctionnelles
- [ ] Livraison partielle : statuts corrects

---

## 🎯 RÉSUMÉ

**Backend :** ✅ Prêt (dans l'archive)  
**Frontend :** ⚠️ À modifier manuellement  
**Complexité :** Moyenne (auth) à Élevée (cases à cocher)  
**Temps estimé :** 2-3 heures

---

**Note :** Les modifications frontend sont volumineuses. Prends ton temps et teste au fur et à mesure ! 🚀
