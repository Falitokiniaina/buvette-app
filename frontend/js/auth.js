// 🔐 Protection Admin - Mot de passe
const ADMIN_PASSWORD = 'FPMA123456';

function verifierAccesAdmin() {
    // Vérifier si déjà authentifié dans cette session
    if (sessionStorage.getItem('admin_auth') === 'ok') {
        window.location.href = 'admin.html';
        return true;
    }
    
    // Demander le mot de passe
    const password = prompt('🔐 Mot de passe administrateur requis:');
    
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('admin_auth', 'ok');
        window.location.href = 'admin.html';
        return true;
    } else if (password !== null) {
        alert('❌ Mot de passe incorrect');
    }
    
    return false;
}

function deconnecterAdmin() {
    sessionStorage.removeItem('admin_auth');
    alert('✅ Déconnexion réussie');
    window.location.href = 'index.html';
}
