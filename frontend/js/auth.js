// 🔐 Protection des pages - Mot de passe depuis la base

// Vérifier l'accès Admin
async function verifierAccesAdmin() {
    return await verifierAccesPage('admin', 'admin_auth', 'mot_de_passe_admin', '🔐 Mot de passe administrateur requis:');
}

// Vérifier l'accès Caisse
async function verifierAccesCaisse() {
    return await verifierAccesPage('caisse', 'caisse_auth', 'mot_de_passe_caisse', '🔐 Mot de passe caisse requis:');
}

// Vérifier l'accès Préparateur
async function verifierAccesPreparateur() {
    return await verifierAccesPage('preparateur', 'preparateur_auth', 'mot_de_passe_preparateur', '🔐 Mot de passe préparateur requis:');
}

// Fonction générique de vérification
async function verifierAccesPage(page, sessionKey, paramKey, message) {
    // Vérifier si déjà authentifié dans cette session
    if (sessionStorage.getItem(sessionKey) === 'ok') {
        return true;
    }
    
    try {
        // Récupérer le mot de passe depuis l'API
        const response = await apiGet(`/parametrage/${paramKey}`);
        const motDePasseCorrect = response.valeur;  // Correction: valeur au lieu de valeur_texte
        
        // Demander le mot de passe
        const password = prompt(message);
        
        if (password === motDePasseCorrect) {
            sessionStorage.setItem(sessionKey, 'ok');
            return true;
        } else if (password !== null) {
            alert('❌ Mot de passe incorrect');
            window.location.href = 'index.html';
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Erreur vérification mot de passe:', error);
        alert('❌ Erreur lors de la vérification du mot de passe');
        window.location.href = 'index.html';
    }
    
    return false;
}

// Déconnexion Admin
function deconnecterAdmin() {
    sessionStorage.removeItem('admin_auth');
    alert('✅ Déconnexion réussie');
    window.location.href = 'index.html';
}

// Déconnexion Caisse
function deconnecterCaisse() {
    sessionStorage.removeItem('caisse_auth');
    alert('✅ Déconnexion réussie');
    window.location.href = 'index.html';
}

// Déconnexion Préparateur
function deconnecterPreparateur() {
    sessionStorage.removeItem('preparateur_auth');
    alert('✅ Déconnexion réussie');
    window.location.href = 'index.html';
}

