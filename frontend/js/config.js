// ============================================
// CONFIGURATION GLOBALE
// ============================================

// URL de l'API backend (à modifier selon votre environnement)
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : '/api'; // En production, l'API sera sur le même domaine

// Configuration générale
const CONFIG = {
    API_URL,
    REFRESH_INTERVAL: 10000, // 10 secondes pour l'actualisation auto
    REQUEST_TIMEOUT: 10000, // 10 secondes timeout pour les requêtes
};

// ============================================
// FONCTIONS UTILITAIRES API
// ============================================

async function apiRequest(endpoint, options = {}) {
    try {
        const url = `${API_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            const error = new Error(data.error || `Erreur HTTP: ${response.status}`);
            error.status = response.status;
            error.statusCode = response.status;
            throw error;
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
}

// GET request
async function apiGet(endpoint) {
    return apiRequest(endpoint, { method: 'GET' });
}

// POST request
async function apiPost(endpoint, data) {
    return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// PUT request
async function apiPut(endpoint, data) {
    return apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

// DELETE request
async function apiDelete(endpoint) {
    return apiRequest(endpoint, { method: 'DELETE' });
}

// ============================================
// FONCTIONS UTILITAIRES UI
// ============================================

function showStep(stepId) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(stepId)?.classList.add('active');
}

function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(price);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(new Date(dateString));
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function showError(message) {
    showAlert(message, 'danger');
}

function showSuccess(message) {
    showAlert(message, 'success');
}

function showLoading(element) {
    element.innerHTML = '<div class="loading-spinner"></div>';
}

function openModal(modalId) {
    document.getElementById(modalId)?.classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
}

// Afficher un message dans une modal avec bouton OK
function showModalMessage(message, type = 'error') {
    // Créer la modal si elle n'existe pas
    let modal = document.getElementById('messageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'messageModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-body">
                    <p id="modalMessageText" style="font-size: 1.1rem; margin: 20px 0;"></p>
                </div>
                <div class="modal-footer" style="text-align: center;">
                    <button onclick="closeModal('messageModal')" class="btn btn-primary" style="min-width: 100px;">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Afficher le message
    document.getElementById('modalMessageText').innerHTML = message;
    openModal('messageModal');
}

// ============================================
// GESTIONNAIRE D'ERREURS GLOBAL
// ============================================

window.addEventListener('unhandledrejection', (event) => {
    console.error('Erreur non gérée:', event.reason);
    showError('Une erreur est survenue. Veuillez réessayer.');
});

// ============================================
// VÉRIFICATION DE LA CONNEXION API
// ============================================

async function checkApiHealth() {
    try {
        const health = await apiGet('/health');
        console.log('✅ API connectée:', health);
        return true;
    } catch (error) {
        console.error('❌ API non disponible:', error);
        showError('Impossible de se connecter au serveur. Veuillez vérifier votre connexion.');
        return false;
    }
}

// Vérifier la connexion au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    checkApiHealth();
});

// Export des fonctions pour utilisation globale
window.CONFIG = CONFIG;
window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPut = apiPut;
window.apiDelete = apiDelete;
window.showStep = showStep;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.showAlert = showAlert;
window.showError = showError;
window.showSuccess = showSuccess;
window.showLoading = showLoading;
window.openModal = openModal;
window.closeModal = closeModal;
