// ============================================
// PAGE ADMIN - GESTION ET STATISTIQUES
// ============================================

let articleSelectionne = null;

// ============================================
// FONCTIONS HELPER - STATUTS ET BADGES
// ============================================

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

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    chargerStatutVente();
    chargerStatistiques();
    chargerStock();
    chargerStatsArticles();
    chargerHistorique();
});

// ============================================
// GESTION DE LA VENTE (OUVERTURE/FERMETURE)
// ============================================

async function chargerStatutVente() {
    try {
        const response = await apiGet('/parametrage/vente_ouverte');
        const venteOuverte = response.valeur === 'true';  // Correction: convertir string en boolean
        
        // Mettre à jour l'affichage
        const statusElement = document.getElementById('venteStatus');
        const btnElement = document.getElementById('btnToggleVente');
        
        if (venteOuverte) {
            statusElement.textContent = '✅ La vente est actuellement ouverte';
            btnElement.textContent = '🔒 Fermer la vente';
            btnElement.style.background = '#ef4444';
            btnElement.style.color = 'white';
        } else {
            statusElement.textContent = '🔒 La vente est actuellement fermée';
            btnElement.textContent = '✅ Ouvrir la vente';
            btnElement.style.background = '#10b981';
            btnElement.style.color = 'white';
        }
    } catch (error) {
        console.error('Erreur chargement statut vente:', error);
        showError('Erreur lors du chargement du statut de vente');
    }
}

async function toggleVente() {
    const btnElement = document.getElementById('btnToggleVente');
    const originalText = btnElement.textContent;
    
    try {
        // Désactiver le bouton
        btnElement.disabled = true;
        btnElement.textContent = '⏳ Traitement...';
        
        // Récupérer l'état actuel
        const response = await apiGet('/parametrage/vente_ouverte');
        const venteOuverte = response.valeur === 'true';  // Correction: convertir string en boolean
        
        // Inverser l'état
        const nouvelEtat = !venteOuverte;
        
        // Demander confirmation
        const action = nouvelEtat ? 'ouvrir' : 'fermer';
        const message = `Êtes-vous sûr de vouloir ${action} la vente ?\n\n${
            nouvelEtat 
                ? '✅ Les clients pourront passer des commandes.' 
                : '🔒 Les clients ne pourront plus passer de commandes.'
        }`;
        
        if (!confirm(message)) {
            btnElement.textContent = originalText;
            btnElement.disabled = false;
            return;
        }
        
        // Mettre à jour
        await apiPut('/parametrage/vente_ouverte', {
            valeur: nouvelEtat ? 'true' : 'false'  // Correction: envoyer string au lieu de valeur_boolean
        });
        
        // Recharger l'affichage
        await chargerStatutVente();
        
        // Message de confirmation
        showSuccess(`Vente ${nouvelEtat ? 'ouverte' : 'fermée'} avec succès !`);
        
    } catch (error) {
        console.error('Erreur toggle vente:', error);
        showError('Erreur lors de la modification du statut de vente');
        btnElement.textContent = originalText;
    } finally {
        btnElement.disabled = false;
    }
}

// ============================================
// CHARGER LES STATISTIQUES GLOBALES
// ============================================

async function chargerStatistiques() {
    try {
        const stats = await apiGet('/stats/overview');
        
        document.getElementById('statsAttente').textContent = stats.commandes_attente || 0;
        document.getElementById('statsPayees').textContent = stats.commandes_payees || 0;
        document.getElementById('statsPartielles').textContent = stats.commandes_partielles || 0;
        document.getElementById('statsLivrees').textContent = stats.commandes_livrees || 0;
        document.getElementById('statsCA').textContent = formatPrice(stats.chiffre_affaires_total || 0);
    } catch (error) {
        showError('Erreur lors du chargement des statistiques');
    }
}

// ============================================
// GESTION DU STOCK
// ============================================

async function chargerStock() {
    try {
        const articles = await apiGet('/articles');
        const statsArticles = await apiGet('/stats/articles');
        
        // Fusionner les données
        const articlesComplets = articles.map(article => {
            const stats = statsArticles.find(s => s.id === article.id);
            return {
                ...article,
                total_vendu: stats?.total_vendu || 0,
                chiffre_affaires: stats?.chiffre_affaires || 0
            };
        });
        
        afficherTableStock(articlesComplets);
    } catch (error) {
        showError('Erreur lors du chargement du stock');
    }
}

function afficherTableStock(articles) {
    const tbody = document.getElementById('stockTable');
    
    if (!articles || articles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Aucun article</td></tr>';
        return;
    }
    
    tbody.innerHTML = articles.map(article => {
        const stockClass = article.stock_disponible < 10 ? 'style="color: var(--danger); font-weight: bold;"' : '';
        
        return `
            <tr>
                <td><strong>${article.nom}</strong></td>
                <td>${formatPrice(article.prix)}</td>
                <td ${stockClass}>${article.stock_disponible}</td>
                <td>${article.total_vendu}</td>
                <td>${formatPrice(article.chiffre_affaires)}</td>
                <td>
                    <button onclick="ouvrirModifStock(${article.id})" class="btn btn-primary btn-sm">
                        ✏️ Modifier
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// MODIFIER LE STOCK
// ============================================

async function ouvrirModifStock(articleId) {
    try {
        const article = await apiGet(`/articles/${articleId}`);
        articleSelectionne = article;
        
        document.getElementById('articleNom').textContent = article.nom;
        document.getElementById('stockActuel').textContent = article.stock_disponible;
        document.getElementById('nouveauStock').value = article.stock_disponible;
        document.getElementById('commentaire').value = '';
        
        openModal('modalStock');
    } catch (error) {
        showError('Erreur lors du chargement de l\'article');
    }
}

async function confirmerModifStock() {
    if (!articleSelectionne) return;
    
    const nouveauStock = parseInt(document.getElementById('nouveauStock').value);
    const commentaire = document.getElementById('commentaire').value.trim();
    
    if (isNaN(nouveauStock) || nouveauStock < 0) {
        showError('Veuillez entrer un stock valide (≥ 0)');
        return;
    }
    
    try {
        await apiPut(`/articles/${articleSelectionne.id}/stock`, {
            stock_disponible: nouveauStock,
            commentaire: commentaire || 'Modification manuelle'
        });
        
        fermerModal();
        showSuccess(`Stock de "${articleSelectionne.nom}" mis à jour`);
        
        // Recharger le stock
        setTimeout(() => {
            chargerStock();
            chargerStatsArticles();
        }, 500);
        
    } catch (error) {
        showError(error.message || 'Erreur lors de la mise à jour du stock');
    }
}

function fermerModal() {
    closeModal('modalStock');
    articleSelectionne = null;
}

// ============================================
// STATISTIQUES PAR ARTICLE
// ============================================

async function chargerStatsArticles() {
    try {
        const stats = await apiGet('/stats/articles');
        afficherStatsArticles(stats);
    } catch (error) {
        console.error('Erreur stats articles:', error);
    }
}

function afficherStatsArticles(stats) {
    const container = document.getElementById('statsArticles');
    
    if (!stats || stats.length === 0) {
        container.innerHTML = '<p class="info">Aucune donnée</p>';
        return;
    }
    
    // Trier par quantité vendue (décroissant)
    stats.sort((a, b) => b.total_vendu - a.total_vendu);
    
    // Calculer le total
    const totalVendu = stats.reduce((sum, s) => sum + parseInt(s.total_vendu), 0);
    const caTotal = stats.reduce((sum, s) => sum + parseFloat(s.chiffre_affaires), 0);
    
    container.innerHTML = `
        <div class="stats-grid">
            ${stats.map(article => {
                const pourcentage = totalVendu > 0 ? (article.total_vendu / totalVendu * 100).toFixed(1) : 0;
                
                return `
                    <div class="stat-card">
                        <h4>${article.nom}</h4>
                        <div class="stat-value">${article.total_vendu}</div>
                        <div class="stat-label">unités vendues (${pourcentage}%)</div>
                        <p class="mt-1"><strong>CA: ${formatPrice(article.chiffre_affaires)}</strong></p>
                        <p class="info">Stock restant: ${article.stock_disponible}</p>
                    </div>
                `;
            }).join('')}
        </div>
        <div class="alert alert-info mt-2">
            <strong>Total général:</strong> ${totalVendu} unités vendues pour un chiffre d'affaires de ${formatPrice(caTotal)}
        </div>
    `;
}

// ============================================
// HISTORIQUE DES VENTES
// ============================================

async function chargerHistorique() {
    try {
        const commandes = await apiGet('/historique/commandes');
        afficherHistorique(commandes);
    } catch (error) {
        console.error('Erreur historique:', error);
    }
}

function afficherHistorique(commandes) {
    const tbody = document.getElementById('historiqueTable');
    
    if (!commandes || commandes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Aucune vente</td></tr>';
        return;
    }
    
    // Limiter à 50 dernières commandes
    const commandesLimitees = commandes.slice(0, 50);
    
    tbody.innerHTML = commandesLimitees.map(commande => `
        <tr>
            <td><strong>${commande.nom_commande}</strong></td>
            <td><span class="badge ${getBadgeClass(commande.statut)}">${afficherStatut(commande.statut)}</span></td>
            <td>${commande.nombre_articles || '-'}</td>
            <td>${commande.quantite_totale || '-'}</td>
            <td>${formatPrice(commande.montant_total)}</td>
            <td>${formatDate(commande.date_paiement)}</td>
            <td>${commande.date_livraison ? formatDate(commande.date_livraison) : '-'}</td>
        </tr>
    `).join('');
}

// ============================================
// ACTUALISATION PÉRIODIQUE
// ============================================

// Actualiser les stats toutes les 30 secondes
setInterval(() => {
    chargerStatistiques();
    chargerStatsArticles();
}, 30000);
