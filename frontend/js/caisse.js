// ============================================
// PAGE CAISSE - GESTION DES PAIEMENTS
// ============================================

let commandeSelectionnee = null;

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    chargerCommandesAttente();
    
    // Recherche en temps réel
    document.getElementById('searchInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            rechercherCommande();
        }
    });
});

// ============================================
// CHARGER LA LISTE DES COMMANDES EN ATTENTE
// ============================================

async function chargerCommandesAttente() {
    try {
        const commandes = await apiGet('/commandes/statut/en_attente');
        afficherCommandesListe(commandes);
    } catch (error) {
        showError('Erreur lors du chargement des commandes');
    }
}

function afficherCommandesListe(commandes) {
    const container = document.getElementById('commandesListe');
    
    if (!commandes || commandes.length === 0) {
        container.innerHTML = '<p class="info">Aucune commande en attente</p>';
        return;
    }
    
    // Filtrer uniquement les commandes avec montant_total > 0
    const commandesValides = commandes.filter(c => c.montant_total > 0);
    
    if (commandesValides.length === 0) {
        container.innerHTML = '<p class="info">Aucune commande en attente de paiement</p>';
        return;
    }
    
    container.innerHTML = commandesValides.map(commande => `
        <div class="commande-card">
            <div class="commande-header">
                <div>
                    <span class="commande-nom-display">${commande.nom_commande}</span>
                    <p class="info">
                        ${commande.nombre_items} article(s) - 
                        ${commande.quantite_totale} unité(s)<br>
                        <small>Créée le ${formatDate(commande.created_at)}</small>
                    </p>
                </div>
                <span class="commande-total">${formatPrice(commande.montant_total)}</span>
            </div>
            <button onclick="ouvrirPaiement('${commande.nom_commande}')" class="btn btn-success">
                💰 Encaisser
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
    
    if (commande.statut !== 'en_attente') {
        container.innerHTML = `
            <div class="alert alert-warning">
                Cette commande est déjà <strong>${commande.statut}</strong>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="commande-card" style="border-color: var(--success);">
            <div class="commande-header">
                <div>
                    <span class="commande-nom-display">${commande.nom_commande}</span>
                    <p class="info">Créée le ${formatDate(commande.created_at)}</p>
                </div>
                <span class="commande-total">${formatPrice(commande.montant_total)}</span>
            </div>
            <div class="commande-items">
                ${commande.items.map(item => `
                    <div class="commande-item">
                        <span>${item.article_nom} x ${item.quantite}</span>
                        <span>${formatPrice(item.sous_total)}</span>
                    </div>
                `).join('')}
            </div>
            <button onclick="ouvrirPaiement('${commande.nom_commande}')" class="btn btn-success btn-large mt-1">
                💰 Encaisser ${formatPrice(commande.montant_total)}
            </button>
        </div>
    `;
}

// ============================================
// OUVRIR LE MODAL DE PAIEMENT
// ============================================

async function ouvrirPaiement(nomCommande) {
    try {
        const commande = await apiGet(`/commandes/nom/${encodeURIComponent(nomCommande)}`);
        
        if (commande.statut !== 'en_attente') {
            showError('Cette commande ne peut plus être payée');
            return;
        }
        
        commandeSelectionnee = commande;
        
        // 🔍 ÉTAPE 1 : VÉRIFIER STOCK AVANT DE RÉSERVER
        try {
            console.log('Vérification stock pour commande', commande.nom_commande);
            const verification = await apiPost(`/commandes/${commande.id}/verifier`);
            
            if (!verification.disponible) {
                // ❌ Stock insuffisant - BLOQUER sans créer de réservation
                commandeSelectionnee = null;
                
                let message = '⚠️ STOCK INSUFFISANT\n\nArticles non disponibles:\n\n';
                verification.details.forEach(detail => {
                    if (!detail.ok) {
                        message += `• ${detail.article_nom}: demandé ${detail.quantite_demandee}, disponible ${detail.stock_reel_disponible}\n`;
                    }
                });
                message += '\n❌ Encaissement impossible.\nLe client doit modifier sa commande.';
                
                alert(message);
                await chargerCommandesAttente(); // Rafraîchir la liste
                return;
            }
            
            // ✅ Stock OK → ÉTAPE 2 : CRÉER LA RÉSERVATION
            const items = commande.items.map(item => ({
                article_id: item.article_id,
                quantite: item.quantite
            }));
            
            await apiPost(`/reservations/commande/${encodeURIComponent(commande.nom_commande)}`, {
                items: items
            });
            
            console.log('✅ Réservation temporaire créée pour commande', commande.nom_commande);
            
        } catch (error) {
            // Si ANY erreur de vérification ou réservation → BLOQUER
            commandeSelectionnee = null;
            showError(error.message || '⚠️ Impossible de réserver cette commande. Stock insuffisant.');
            await chargerCommandesAttente(); // Rafraîchir la liste
            return;
        }
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="commande-info">
                <p><strong>Commande:</strong> ${commande.nom_commande}</p>
                <p><strong>Montant total:</strong> <span style="font-size: 1.5rem; color: var(--primary);">${formatPrice(commande.montant_total)}</span></p>
            </div>
            <div class="mt-2">
                <h4>Articles:</h4>
                ${commande.items.map(item => `
                    <div class="commande-item">
                        <span>${item.article_nom} x ${item.quantite}</span>
                        <span>${formatPrice(item.sous_total)}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="payment-methods mt-2">
                <h4 style="margin-bottom: var(--spacing-sm);">💳 Modes de paiement:</h4>
                
                <div class="form-group">
                    <label for="montantCB">Carte Bancaire (CB):</label>
                    <input type="number" id="montantCB" class="input-large payment-input" 
                           value="0" step="0.01" min="0">
                </div>
                
                <div class="form-group">
                    <label for="montantEspeces">Espèces:</label>
                    <input type="number" id="montantEspeces" class="input-large payment-input" 
                           value="0" step="0.01" min="0">
                </div>
                
                <div class="form-group">
                    <label for="montantCheque">Chèque:</label>
                    <input type="number" id="montantCheque" class="input-large payment-input" 
                           value="0" step="0.01" min="0">
                </div>
                
                <div id="validationPaiement" class="payment-validation" style="margin-top: var(--spacing-md);"></div>
            </div>
        `;
        
        // Calculer et valider la somme en temps réel
        const inputs = document.querySelectorAll('.payment-input');
        inputs.forEach(input => {
            input.addEventListener('input', validerSommePaiement);
        });
        
        // Initialiser la validation
        validerSommePaiement();
        
        openModal('modalPaiement');
    } catch (error) {
        showError('Erreur lors du chargement de la commande');
    }
}

// ============================================
// VALIDER LA SOMME DES PAIEMENTS
// ============================================

function validerSommePaiement() {
    const montantCB = parseFloat(document.getElementById('montantCB').value) || 0;
    const montantEspeces = parseFloat(document.getElementById('montantEspeces').value) || 0;
    const montantCheque = parseFloat(document.getElementById('montantCheque').value) || 0;
    const montantTotal = commandeSelectionnee.montant_total;
    
    const sommePaiements = montantCB + montantEspeces + montantCheque;
    const difference = montantTotal - sommePaiements;
    
    const validationDiv = document.getElementById('validationPaiement');
    
    // Afficher le résumé
    let html = `
        <div style="background: var(--gray-100); padding: var(--spacing-md); border-radius: var(--radius); border: 2px solid `;
    
    if (Math.abs(difference) < 0.01) {
        // Somme correcte
        html += `var(--success); color: var(--success);">
            <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: var(--spacing-xs);">
                ✅ Somme correcte
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: var(--spacing-sm);">
                <span>Total des paiements:</span>
                <strong>${formatPrice(sommePaiements)}</strong>
            </div>
        `;
    } else if (difference > 0) {
        // Manque de l'argent
        html += `var(--danger); color: var(--danger);">
            <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: var(--spacing-xs);">
                ❌ Montant insuffisant
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Total des paiements:</span>
                <strong>${formatPrice(sommePaiements)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Montant attendu:</span>
                <strong>${formatPrice(montantTotal)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: var(--spacing-sm); padding-top: var(--spacing-sm); border-top: 1px solid currentColor;">
                <span>Manque:</span>
                <strong>${formatPrice(difference)}</strong>
            </div>
        `;
    } else {
        // Trop d'argent
        html += `var(--warning); color: var(--warning);">
            <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: var(--spacing-xs);">
                ⚠️ Montant en trop
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Total des paiements:</span>
                <strong>${formatPrice(sommePaiements)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Montant attendu:</span>
                <strong>${formatPrice(montantTotal)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: var(--spacing-sm); padding-top: var(--spacing-sm); border-top: 1px solid currentColor;">
                <span>En trop:</span>
                <strong>${formatPrice(Math.abs(difference))}</strong>
            </div>
        `;
    }
    
    html += '</div>';
    validationDiv.innerHTML = html;
    
    // Désactiver le bouton de confirmation si la somme n'est pas exacte
    const btnConfirmer = document.querySelector('.modal-actions .btn-success');
    if (btnConfirmer) {
        if (Math.abs(difference) >= 0.01) {
            btnConfirmer.disabled = true;
            btnConfirmer.style.opacity = '0.5';
            btnConfirmer.style.cursor = 'not-allowed';
        } else {
            btnConfirmer.disabled = false;
            btnConfirmer.style.opacity = '1';
            btnConfirmer.style.cursor = 'pointer';
        }
    }
}

// ============================================
// CONFIRMER LE PAIEMENT
// ============================================

async function confirmerPaiement() {
    if (!commandeSelectionnee) return;
    
    // Récupérer les montants
    const montantCB = parseFloat(document.getElementById('montantCB').value) || 0;
    const montantEspeces = parseFloat(document.getElementById('montantEspeces').value) || 0;
    const montantCheque = parseFloat(document.getElementById('montantCheque').value) || 0;
    const sommePaiements = montantCB + montantEspeces + montantCheque;
    const montantTotal = commandeSelectionnee.montant_total;
    
    // Double vérification de la somme
    if (Math.abs(sommePaiements - montantTotal) >= 0.01) {
        showError('La somme des paiements ne correspond pas au montant total');
        return;
    }
    
    try {
        // ✅ Stock déjà vérifié dans ouvrirPaiement → Procéder au paiement
        const commande = await apiPut(`/commandes/${commandeSelectionnee.id}/payer`, {
            montant_paye: sommePaiements,
            montant_cb: montantCB,
            montant_especes: montantEspeces,
            montant_cheque: montantCheque
        });
        
        fermerModal();
        showSuccess(`Paiement enregistré pour "${commande.nom_commande}"`);
        
        // Recharger la liste
        setTimeout(() => {
            chargerCommandesAttente();
            document.getElementById('searchInput').value = '';
            document.getElementById('searchResult').innerHTML = '';
        }, 1000);
        
    } catch (error) {
        showError(error.message || 'Erreur lors du paiement');
    }
}

async function fermerModal() {
    // 🔓 SUPPRIMER LA RÉSERVATION TEMPORAIRE (annulation)
    if (commandeSelectionnee) {
        try {
            await apiDelete(`/reservations/commande/${encodeURIComponent(commandeSelectionnee.nom_commande)}`);
            console.log('✅ Réservation temporaire supprimée (annulation)');
        } catch (error) {
            console.warn('Erreur suppression réservation:', error);
        }
    }
    
    closeModal('modalPaiement');
    commandeSelectionnee = null;
}

// ============================================
// NETTOYAGE RÉSERVATION SI PAGE QUITTÉE
// ============================================

window.addEventListener('beforeunload', async () => {
    // Si une commande est sélectionnée, supprimer sa réservation
    if (commandeSelectionnee) {
        try {
            // Utiliser sendBeacon pour garantie d'envoi même si page ferme
            const url = `${API_URL}/reservations/commande/${encodeURIComponent(commandeSelectionnee.nom_commande)}`;
            navigator.sendBeacon(url, JSON.stringify({ _method: 'DELETE' }));
        } catch (error) {
            console.warn('Erreur nettoyage réservation:', error);
        }
    }
});

// ============================================
// ACTUALISATION AUTO (optionnel)
// ============================================

// Actualiser toutes les 15 secondes
setInterval(() => {
    chargerCommandesAttente();
}, 15000);
