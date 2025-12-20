// ============================================
// PAGE PRÉPARATEUR - GESTION DES LIVRAISONS
// ============================================

let commandeSelectionnee = null;
let countdownInterval = null;
let countdown = 10;

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Charger le titre de la page
    await chargerTitrePage();
    
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

// Charger le titre de la page depuis les paramètres
async function chargerTitrePage() {
    try {
        const response = await apiGet('/parametrage/titre_page_preparateur');
        if (response && response.valeur) {
            document.getElementById('titrePage').textContent = '👨‍🍳 ' + response.valeur;
        }
    } catch (error) {
        console.log('Utilisation du titre par défaut');
    }
}

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
    
    // Accepter payee ET livree_partiellement
    if (!['payee', 'livree_partiellement'].includes(commande.statut)) {
        let message = '';
        if (commande.statut === 'en_attente') {
            message = 'Cette commande n\'a pas encore été payée';
        } else if (commande.statut === 'livree') {
            message = 'Cette commande a déjà été entièrement livrée';
        } else if (commande.statut === 'annulee') {
            message = 'Cette commande a été annulée';
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
                    <span class="badge ${getBadgeClass(commande.statut)}">${afficherStatut(commande.statut)}</span>
                    <p class="info">Payée le ${formatDate(commande.date_paiement)}</p>
                </div>
                <span class="commande-total">${formatPrice(commande.montant_total)}</span>
            </div>
            <div class="commande-items">
                ${commande.items.map(item => `
                    <div class="commande-item">
                        <span><strong>${item.article_nom}</strong> x ${item.quantite}</span>
                        ${item.est_livre ? '<span style="color: #10b981; margin-left: 1rem;">✓ Livré</span>' : ''}
                    </div>
                `).join('')}
            </div>
            <button onclick="ouvrirLivraison('${commande.nom_commande}')" class="btn btn-success btn-large mt-1">
                📋 Voir le détail - Marquer comme livrée
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
        const container = document.getElementById('detailsCommande');
        
        container.style.display = 'block';
        container.innerHTML = `
            <div class="card" style="background: var(--info-light); border-left: 4px solid var(--info);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-md);">
                    <h3 style="color: var(--info); margin: 0;">📋 Détail de la commande: ${commande.nom_commande}</h3>
                    <button onclick="fermerDetail()" class="btn btn-sm" style="background: transparent; color: var(--gray-600); font-size: 1.5rem; padding: 0; width: 30px; height: 30px;">×</button>
                </div>
                <div style="background: white; padding: var(--spacing-md); border-radius: var(--radius); margin-bottom: var(--spacing-md);">
                    <p style="color: var(--gray-600); margin-bottom: var(--spacing-md);">
                        <strong>Statut:</strong> ${commande.statut === 'payee' ? '✅ Payée' : commande.statut}<br>
                        <strong>Payée le:</strong> ${formatDate(commande.date_paiement)}
                    </p>
                    <hr style="margin: var(--spacing-md) 0; border: none; border-top: 1px solid var(--gray-300);">
                    <h4 style="margin-bottom: var(--spacing-sm);">Articles commandés:</h4>
                    ${commande.items.map(item => `
                        <div style="padding: var(--spacing-sm); border-bottom: 1px solid var(--gray-200); display: flex; justify-content: space-between;">
                            <div>
                                <strong style="color: var(--primary);">${item.article_nom}</strong><br>
                                <span style="color: var(--gray-600); font-size: 0.9rem;">
                                    ${item.quantite} × ${formatPrice(item.prix_unitaire)}
                                </span>
                            </div>
                            <div style="text-align: right;">
                                <strong>${formatPrice(item.sous_total)}</strong>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="text-align: right; font-size: 1.3rem; padding: var(--spacing-md); background: white; border-radius: var(--radius);">
                    <strong>Total: ${formatPrice(commande.montant_total)}</strong>
                </div>
            </div>
        `;
        
        // Scroll vers les détails
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        showError('Erreur lors du chargement du détail');
    }
}

function fermerDetail() {
    const container = document.getElementById('detailsCommande');
    container.style.display = 'none';
    container.innerHTML = '';
}

// ============================================
// OUVRIR LE MODAL DE LIVRAISON
// ============================================

async function ouvrirLivraison(nomCommande) {
    try {
        const commande = await apiGet(`/commandes/nom/${encodeURIComponent(nomCommande)}`);
        
        // Accepter payee ET livree_partiellement
        if (!['payee', 'livree_partiellement'].includes(commande.statut)) {
            showError('Cette commande ne peut pas être livrée');
            return;
        }
        
        commandeSelectionnee = commande;
        
        const modalBody = document.getElementById('modalBody');
        
        // Vérifier s'il reste des articles non livrés
        const articlesNonLivres = commande.items.filter(item => !item.est_livre);
        const tousLivres = articlesNonLivres.length === 0;
        
        modalBody.innerHTML = `
            <div class="commande-info">
                <p><strong>Commande:</strong> ${commande.nom_commande}</p>
                <p><strong>Statut:</strong> <span class="badge ${getBadgeClass(commande.statut)}">${afficherStatut(commande.statut)}</span></p>
                <p><strong>Payée le:</strong> ${formatDate(commande.date_paiement)}</p>
            </div>
            
            ${tousLivres ? `
                <div class="alert alert-success mt-2">
                    ✅ Tous les articles ont déjà été livrés
                </div>
            ` : `
                <div class="mt-2">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h4>Articles à préparer:</h4>
                        <label style="cursor: pointer; font-weight: normal;">
                            <input type="checkbox" id="toggleAll" onchange="toggleTousArticles()" ${articlesNonLivres.length > 0 ? 'checked' : ''}>
                            <span style="margin-left: 0.5rem;">Tout cocher / Tout décocher</span>
                        </label>
                    </div>
                    
                    ${commande.items.map(item => `
                        <div class="commande-item" style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: var(--gray-50); margin: 0.5rem 0; border-radius: var(--radius); ${item.est_livre ? 'opacity: 0.6;' : ''}">
                            <input 
                                type="checkbox" 
                                class="checkbox-article" 
                                data-item-id="${item.id}"
                                ${item.est_livre ? 'checked disabled style="cursor: not-allowed;"' : 'checked'}
                                onchange="verifierStatutCochage()"
                            >
                            <div style="flex: 1;">
                                <strong style="font-size: 1.2rem;">${item.article_nom}</strong><br>
                                <span style="font-size: 1.1rem; color: var(--primary);">Quantité: ${item.quantite}</span>
                                ${item.est_livre ? '<span style="color: #10b981; margin-left: 1rem; font-weight: 600;">✓ Déjà livré</span>' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div id="messageValidation" class="alert alert-warning mt-2">
                    ⚠️ Confirmez que tous les articles ont été préparés et remis au client
                </div>
            `}
        `;
        
        // Vérifier le statut initial
        if (!tousLivres) {
            verifierStatutCochage();
        }
        
        openModal('modalLivraison');
    } catch (error) {
        showError('Erreur lors du chargement de la commande');
    }
}

// Toggle tous les articles non livrés
function toggleTousArticles() {
    const toggleAll = document.getElementById('toggleAll');
    const checkboxes = document.querySelectorAll('.checkbox-article:not([disabled])');
    
    checkboxes.forEach(cb => {
        cb.checked = toggleAll.checked;
    });
    
    verifierStatutCochage();
}

// Vérifier statut cochage et afficher/masquer message
function verifierStatutCochage() {
    const checkboxes = document.querySelectorAll('.checkbox-article');
    const toutCoche = Array.from(checkboxes).every(cb => cb.checked);
    
    const message = document.getElementById('messageValidation');
    const toggleAll = document.getElementById('toggleAll');
    
    if (message) {
        if (toutCoche) {
            message.style.display = 'block';
            message.className = 'alert alert-warning mt-2';
            message.textContent = '⚠️ Confirmez que tous les articles ont été préparés et remis au client';
        } else {
            message.style.display = 'block';
            message.className = 'alert alert-info mt-2';
            message.textContent = 'ℹ️ Livraison partielle : seuls les articles cochés seront marqués comme livrés';
        }
    }
    
    // Mettre à jour la case "Tout cocher"
    if (toggleAll) {
        const checkboxesNonDisabled = document.querySelectorAll('.checkbox-article:not([disabled])');
        const toutCocheNonDisabled = Array.from(checkboxesNonDisabled).every(cb => cb.checked);
        toggleAll.checked = toutCocheNonDisabled;
    }
}

// Fonction helper pour afficher statut
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

// Fonction helper pour classe badge
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

// ============================================
// CONFIRMER LA LIVRAISON
// ============================================

async function confirmerLivraison() {
    if (!commandeSelectionnee) return;
    
    try {
        // Récupérer les IDs des articles cochés NON DÉJÀ LIVRÉS
        const checkboxes = document.querySelectorAll('.checkbox-article:checked:not([disabled])');
        const articleIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.itemId));
        
        // Si aucun article coché, erreur
        if (articleIds.length === 0) {
            showError('Veuillez cocher au moins un article à livrer');
            return;
        }
        
        // Appel API avec les IDs
        const commande = await apiPut(
            `/commandes/${commandeSelectionnee.id}/livrer`,
            { article_ids: articleIds }
        );
        
        fermerModal();
        
        // Message adapté selon le statut final
        if (commande.statut === 'livree') {
            showSuccess(`✅ Commande "${commande.nom_commande}" entièrement livrée`);
        } else if (commande.statut === 'livree_partiellement') {
            showSuccess(`📦 Commande "${commande.nom_commande}" partiellement livrée (${articleIds.length} article(s))`);
        } else {
            showSuccess(`Commande "${commande.nom_commande}" mise à jour`);
        }
        
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

// ============================================
// MODAL DÉTAILS PAR ARTICLE
// ============================================

async function afficherDetailsArticles() {
    try {
        const articles = await apiGet('/stats/articles-a-preparer');
        
        const modal = document.getElementById('modalDetailsArticles');
        const body = document.getElementById('modalDetailsArticlesBody');
        
        if (articles.length === 0) {
            body.innerHTML = `
                <div class="alert alert-info">
                    ℹ️ Aucun article à préparer pour le moment
                </div>
            `;
        } else {
            body.innerHTML = `
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Article</th>
                                <th style="text-align: center;">Total</th>
                                <th style="text-align: center;">Livrées</th>
                                <th style="text-align: center;">À préparer</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${articles.map(article => `
                                <tr>
                                    <td><strong>${article.nom}</strong></td>
                                    <td style="text-align: center;">${article.quantite_totale}</td>
                                    <td style="text-align: center; color: #10b981;">${article.quantite_livree || 0}</td>
                                    <td style="text-align: center;">
                                        <strong style="color: var(--primary); font-size: 1.1rem;">
                                            ${article.quantite_restante}
                                        </strong>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="font-weight: bold; background-color: var(--gray-50);">
                                <td>TOTAL</td>
                                <td style="text-align: center;">${articles.reduce((sum, a) => sum + parseInt(a.quantite_totale), 0)}</td>
                                <td style="text-align: center; color: #10b981;">${articles.reduce((sum, a) => sum + parseInt(a.quantite_livree || 0), 0)}</td>
                                <td style="text-align: center;">
                                    <strong style="color: var(--primary); font-size: 1.1rem;">
                                        ${articles.reduce((sum, a) => sum + parseInt(a.quantite_restante), 0)}
                                    </strong>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div class="alert alert-info mt-2" style="font-size: 0.9rem;">
                    💡 <strong>Astuce :</strong> Ces totaux correspondent à l'ensemble des commandes payées non encore livrées.
                </div>
            `;
        }
        
        modal.style.display = 'flex';
    } catch (error) {
        showError('Erreur lors du chargement des détails par article');
        console.error('Erreur détails articles:', error);
    }
}

function fermerModalDetailsArticles() {
    document.getElementById('modalDetailsArticles').style.display = 'none';
}
