// ============================================
// PAGE PRÉPARATEUR - GESTION DES LIVRAISONS
// ============================================

let commandeSelectionnee = null;
let countdownInterval = null;
let countdown = 10;

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    chargerCommandesPayees();
    chargerStatistiques();
    demarrerActualisationAuto();
    
    // Recherche en temps réel
    document.getElementById('searchInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            rechercherCommande();
        }
    });
});

// ============================================
// ACTUALISATION AUTOMATIQUE
// ============================================

function demarrerActualisationAuto() {
    countdown = 10;
    
    // Actualiser toutes les 10 secondes
    countdownInterval = setInterval(() => {
        countdown--;
        document.getElementById('countdown').textContent = countdown;
        
        if (countdown <= 0) {
            chargerCommandesPayees();
            chargerStatistiques();
            countdown = 10;
        }
    }, 1000);
}

// Nettoyer l'intervalle si on quitte la page
window.addEventListener('beforeunload', () => {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
});

// ============================================
// CHARGER LES STATISTIQUES
// ============================================

async function chargerStatistiques() {
    try {
        const stats = await apiGet('/stats/overview');
        document.getElementById('statsPayees').textContent = stats.commandes_payees || 0;
        document.getElementById('statsLivrees').textContent = stats.commandes_livrees || 0;
    } catch (error) {
        console.error('Erreur stats:', error);
    }
}

// ============================================
// CHARGER LA LISTE DES COMMANDES PAYÉES
// ============================================

async function chargerCommandesPayees() {
    try {
        const commandes = await apiGet('/commandes/statut/payee');
        afficherCommandesListe(commandes);
    } catch (error) {
        showError('Erreur lors du chargement des commandes');
    }
}

function afficherCommandesListe(commandes) {
    const container = document.getElementById('commandesListe');
    
    if (!commandes || commandes.length === 0) {
        container.innerHTML = '<p class="info">Aucune commande à préparer</p>';
        return;
    }
    
    // Trier par date de paiement (plus récentes en premier)
    commandes.sort((a, b) => new Date(b.date_paiement) - new Date(a.date_paiement));
    
    container.innerHTML = commandes.map(commande => `
        <div class="commande-card">
            <div class="commande-header">
                <div>
                    <span class="commande-nom-display">${commande.nom_commande}</span>
                    <p class="info">
                        ${commande.nombre_items} article(s) - 
                        ${commande.quantite_totale} unité(s)<br>
                        <small>Payée le ${formatDate(commande.date_paiement)}</small>
                    </p>
                </div>
                <span class="commande-total">${formatPrice(commande.montant_total)}</span>
            </div>
            <button onclick="afficherDetail('${commande.nom_commande}')" class="btn btn-secondary btn-sm mt-1">
                📋 Voir le détail
            </button>
            <button onclick="ouvrirLivraison('${commande.nom_commande}')" class="btn btn-success mt-1">
                ✓ Marquer comme livrée
            </button>
        </div>
    `).join('');
}

// ============================================
// RECHERCHER UNE COMMANDE
// ============================================

async function rechercherCommande() {
    const searchInput = document.getElementById('searchInput');
    const nomCommande = searchInput.value.trim();
    
    if (!nomCommande) {
        showError('Veuillez entrer un nom de commande');
        return;
    }
    
    try {
        const commande = await apiGet(`/commandes/nom/${encodeURIComponent(nomCommande)}`);
        afficherResultatRecherche(commande);
    } catch (error) {
        document.getElementById('searchResult').innerHTML = `
            <div class="alert alert-danger">
                Commande non trouvée: "${nomCommande}"
            </div>
        `;
    }
}

function afficherResultatRecherche(commande) {
    const container = document.getElementById('searchResult');
    
    if (commande.statut !== 'payee') {
        let message = '';
        if (commande.statut === 'en_attente') {
            message = 'Cette commande n\'a pas encore été payée';
        } else if (commande.statut === 'livree') {
            message = 'Cette commande a déjà été livrée';
        }
        
        container.innerHTML = `
            <div class="alert alert-warning">
                ${message}
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="commande-card" style="border-color: var(--success);">
            <div class="commande-header">
                <div>
                    <span class="commande-nom-display">${commande.nom_commande}</span>
                    <p class="info">Payée le ${formatDate(commande.date_paiement)}</p>
                </div>
                <span class="commande-total">${formatPrice(commande.montant_total)}</span>
            </div>
            <div class="commande-items">
                ${commande.items.map(item => `
                    <div class="commande-item">
                        <span><strong>${item.article_nom}</strong> x ${item.quantite}</span>
                    </div>
                `).join('')}
            </div>
            <button onclick="ouvrirLivraison('${commande.nom_commande}')" class="btn btn-success btn-large mt-1">
                ✓ Marquer comme livrée
            </button>
        </div>
    `;
}

// ============================================
// AFFICHER LE DÉTAIL D'UNE COMMANDE
// ============================================

async function afficherDetail(nomCommande) {
    try {
        const commande = await apiGet(`/commandes/nom/${encodeURIComponent(nomCommande)}`);
        
        const detail = `
            <div class="alert alert-info">
                <h4>Détail de la commande: ${commande.nom_commande}</h4>
                <div class="mt-1">
                    ${commande.items.map(item => `
                        <div style="padding: 0.5rem 0; border-bottom: 1px solid var(--gray-300);">
                            <strong>${item.article_nom}</strong><br>
                            Quantité: ${item.quantite} x ${formatPrice(item.prix_unitaire)} = ${formatPrice(item.sous_total)}
                        </div>
                    `).join('')}
                </div>
                <p class="mt-1" style="font-size: 1.2rem;"><strong>Total: ${formatPrice(commande.montant_total)}</strong></p>
            </div>
        `;
        
        showAlert(detail, 'info');
    } catch (error) {
        showError('Erreur lors du chargement du détail');
    }
}

// ============================================
// OUVRIR LE MODAL DE LIVRAISON
// ============================================

async function ouvrirLivraison(nomCommande) {
    try {
        const commande = await apiGet(`/commandes/nom/${encodeURIComponent(nomCommande)}`);
        
        if (commande.statut !== 'payee') {
            showError('Cette commande ne peut pas être livrée');
            return;
        }
        
        commandeSelectionnee = commande;
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="commande-info">
                <p><strong>Commande:</strong> ${commande.nom_commande}</p>
                <p><strong>Payée le:</strong> ${formatDate(commande.date_paiement)}</p>
            </div>
            <div class="mt-2">
                <h4>Articles à préparer:</h4>
                ${commande.items.map(item => `
                    <div class="commande-item" style="padding: 0.75rem; background: var(--gray-50); margin: 0.5rem 0; border-radius: var(--radius);">
                        <strong style="font-size: 1.2rem;">${item.article_nom}</strong><br>
                        <span style="font-size: 1.5rem; color: var(--primary);">Quantité: ${item.quantite}</span>
                    </div>
                `).join('')}
            </div>
            <div class="alert alert-warning mt-2">
                ⚠️ Confirmez que tous les articles ont été préparés et remis au client
            </div>
        `;
        
        openModal('modalLivraison');
    } catch (error) {
        showError('Erreur lors du chargement de la commande');
    }
}

// ============================================
// CONFIRMER LA LIVRAISON
// ============================================

async function confirmerLivraison() {
    if (!commandeSelectionnee) return;
    
    try {
        const commande = await apiPut(`/commandes/${commandeSelectionnee.id}/livrer`);
        
        fermerModal();
        showSuccess(`Commande "${commande.nom_commande}" marquée comme livrée`);
        
        // Recharger la liste
        setTimeout(() => {
            chargerCommandesPayees();
            chargerStatistiques();
            document.getElementById('searchInput').value = '';
            document.getElementById('searchResult').innerHTML = '';
        }, 1000);
        
    } catch (error) {
        showError(error.message || 'Erreur lors de la livraison');
    }
}

function fermerModal() {
    closeModal('modalLivraison');
    commandeSelectionnee = null;
}

// ============================================
// HISTORIQUE DES LIVRAISONS
// ============================================

function toggleHistorique() {
    const historique = document.getElementById('historique');
    const isVisible = historique.style.display !== 'none';
    
    if (isVisible) {
        historique.style.display = 'none';
    } else {
        historique.style.display = 'block';
        chargerHistorique();
    }
}

async function chargerHistorique() {
    try {
        const commandes = await apiGet('/historique/commandes');
        afficherHistorique(commandes);
    } catch (error) {
        showError('Erreur lors du chargement de l\'historique');
    }
}

function afficherHistorique(commandes) {
    const container = document.getElementById('historiqueListe');
    
    if (!commandes || commandes.length === 0) {
        container.innerHTML = '<p class="info">Aucune livraison dans l\'historique</p>';
        return;
    }
    
    container.innerHTML = commandes.map(commande => `
        <div class="commande-card" style="background: var(--gray-100);">
            <div class="commande-header">
                <div>
                    <span class="commande-nom-display">${commande.nom_commande}</span>
                    <p class="info">
                        ${commande.nombre_articles} article(s) - 
                        ${commande.quantite_totale} unité(s)<br>
                        <small>Livrée le ${formatDate(commande.date_livraison)}</small>
                    </p>
                </div>
                <span class="commande-total">${formatPrice(commande.montant_total)}</span>
            </div>
        </div>
    `).join('');
}

async function rechercherHistorique() {
    const searchInput = document.getElementById('searchHistorique');
    const nomCommande = searchInput.value.trim().toLowerCase();
    
    if (!nomCommande) {
        chargerHistorique();
        return;
    }
    
    try {
        const commandes = await apiGet('/historique/commandes');
        const filtrees = commandes.filter(c => 
            c.nom_commande.toLowerCase().includes(nomCommande)
        );
        
        afficherHistorique(filtrees);
    } catch (error) {
        showError('Erreur lors de la recherche');
    }
}
