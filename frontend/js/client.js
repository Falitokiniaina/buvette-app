// ============================================
// PAGE CLIENT - GESTION DES COMMANDES
// ============================================

let commandeEnCours = null;
let panier = [];
let articles = [];
let intervalPaiement = null;

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    await chargerArticles();
});

// ============================================
// ÉTAPE 1: CRÉER UNE COMMANDE
// ============================================

async function creerCommande() {
    const nomCommande = document.getElementById('nomCommande').value.trim();
    
    if (!nomCommande) {
        showError('Veuillez entrer un nom de commande');
        return;
    }
    
    // Validation du nom
    if (nomCommande.length < 2) {
        showError('Le nom doit contenir au moins 2 caractères');
        return;
    }
    
    if (nomCommande.length > 50) {
        showError('Le nom ne peut pas dépasser 50 caractères');
        return;
    }
    
    // Désactiver le bouton pendant le traitement
    const btnElement = document.querySelector('button[onclick="creerCommande()"]');
    if (btnElement) {
        btnElement.textContent = 'Vérification...';
        btnElement.disabled = true;
    }
    
    try {
        // Vérifier si la commande existe déjà
        console.log('Vérification de la commande:', nomCommande);
        const existingCommande = await apiGet(`/commandes/nom/${encodeURIComponent(nomCommande)}`);
        
        console.log('Commande trouvée:', existingCommande);
        
        // Si on arrive ici, la commande existe
        if (existingCommande.statut === 'en_attente') {
            const confirmer = confirm('Cette commande existe déjà et est en attente. Voulez-vous la continuer ?');
            if (confirmer) {
                commandeEnCours = existingCommande;
                // Charger le panier existant
                panier = existingCommande.items.map(item => ({
                    article_id: item.article_id,
                    nom: item.article_nom,
                    prix: parseFloat(item.prix_unitaire),
                    quantite: item.quantite
                }));
                passerEtape2();
            } else {
                // Réactiver le bouton si l'utilisateur refuse
                if (btnElement) {
                    btnElement.textContent = 'Commencer ma commande';
                    btnElement.disabled = false;
                }
            }
            return;
        } else if (existingCommande.statut === 'payee') {
            showError('Cette commande a déjà été payée. Choisissez un autre nom.');
            if (btnElement) {
                btnElement.textContent = 'Commencer ma commande';
                btnElement.disabled = false;
            }
            return;
        } else if (existingCommande.statut === 'livree') {
            showError('Cette commande a déjà été livrée. Choisissez un autre nom.');
            if (btnElement) {
                btnElement.textContent = 'Commencer ma commande';
                btnElement.disabled = false;
            }
            return;
        }
    } catch (error) {
        console.log('Erreur lors de la vérification:', error);
        
        // Si c'est une erreur 404, c'est normal, la commande n'existe pas
        // On va la créer
        if (error.status === 404 || error.statusCode === 404 || 
            error.message.includes('404') || error.message.includes('non trouvée')) {
            console.log('Commande non trouvée, création en cours...');
            // On continue pour créer la commande (ne pas return ici)
        } else {
            // Autre erreur, on affiche et on arrête
            console.error('Erreur inattendue:', error);
            showError('Erreur lors de la vérification: ' + error.message);
            if (btnElement) {
                btnElement.textContent = 'Commencer ma commande';
                btnElement.disabled = false;
            }
            return;
        }
    }
    
    // Créer la nouvelle commande en base de données (vide pour l'instant)
    try {
        if (btnElement) {
            btnElement.textContent = 'Création en cours...';
        }
        
        console.log('Création de la commande:', nomCommande);
        
        commandeEnCours = await apiPost('/commandes', {
            nom_commande: nomCommande,
            items: [] // Commande vide au départ
        });
        
        console.log('Commande créée avec succès:', commandeEnCours);
        showSuccess(`Commande "${nomCommande}" créée !`);
        passerEtape2();
        
    } catch (error) {
        console.error('Erreur création commande:', error);
        showError(error.message || 'Erreur lors de la création de la commande');
        
        // Réactiver le bouton
        if (btnElement) {
            btnElement.textContent = 'Commencer ma commande';
            btnElement.disabled = false;
        }
    }
}

function passerEtape2() {
    document.getElementById('displayNom').textContent = commandeEnCours.nom_commande;
    afficherArticles();
    afficherPanier();
    showStep('step2');
}

// ============================================
// ÉTAPE 2: CHARGER ET AFFICHER LES ARTICLES
// ============================================

async function chargerArticles() {
    try {
        articles = await apiGet('/articles');
    } catch (error) {
        showError('Erreur lors du chargement des articles');
    }
}

function afficherArticles() {
    const container = document.getElementById('articlesList');
    
    if (!articles.length) {
        container.innerHTML = '<p class="info">Aucun article disponible</p>';
        return;
    }
    
    container.innerHTML = articles.map(article => `
        <div class="article-card" id="article-${article.id}">
            ${article.image_url ? `
                <div class="article-image">
                    <img src="${article.image_url}" alt="${article.nom}" onerror="this.style.display='none'">
                </div>
            ` : ''}
            <div class="article-content">
                <h3>${article.nom}</h3>
                <p class="article-description">${article.description || ''}</p>
                <p class="article-prix">${formatPrice(article.prix)}</p>
                <p class="article-stock">Stock: ${article.stock_disponible} disponible(s)</p>
                <div class="quantite-selector">
                    <button onclick="modifierQuantite(${article.id}, -1)">-</button>
                    <input type="number" id="qty-${article.id}" value="0" min="0" max="${article.stock_disponible}" readonly>
                    <button onclick="modifierQuantite(${article.id}, 1)">+</button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Restaurer les quantités du panier
    panier.forEach(item => {
        const input = document.getElementById(`qty-${item.article_id}`);
        if (input) input.value = item.quantite;
    });
}

function modifierQuantite(articleId, delta) {
    const input = document.getElementById(`qty-${articleId}`);
    const article = articles.find(a => a.id === articleId);
    
    if (!article) return;
    
    let nouvelleQte = parseInt(input.value) + delta;
    
    // Limites
    if (nouvelleQte < 0) nouvelleQte = 0;
    if (nouvelleQte > article.stock_disponible) {
        showError(`Stock maximum atteint (${article.stock_disponible})`);
        return;
    }
    
    input.value = nouvelleQte;
    
    // Mettre à jour le panier
    const indexPanier = panier.findIndex(item => item.article_id === articleId);
    
    if (nouvelleQte === 0) {
        // Retirer du panier
        if (indexPanier !== -1) {
            panier.splice(indexPanier, 1);
        }
    } else {
        // Ajouter ou mettre à jour
        if (indexPanier !== -1) {
            panier[indexPanier].quantite = nouvelleQte;
        } else {
            panier.push({
                article_id: articleId,
                nom: article.nom,
                prix: parseFloat(article.prix),
                quantite: nouvelleQte
            });
        }
    }
    
    afficherPanier();
    
    // Mettre à jour la commande en base de données en temps réel
    mettreAJourCommandeEnBase();
}

// Fonction pour mettre à jour la commande en base (débounce pour éviter trop de requêtes)
let timeoutMiseAJour = null;
async function mettreAJourCommandeEnBase() {
    // Annuler le timeout précédent
    if (timeoutMiseAJour) {
        clearTimeout(timeoutMiseAJour);
    }
    
    // Attendre 1 seconde avant d'envoyer la mise à jour
    timeoutMiseAJour = setTimeout(async () => {
        if (!commandeEnCours || !commandeEnCours.id) return;
        
        try {
            // Envoyer les items mis à jour
            const items = panier.map(item => ({
                article_id: item.article_id,
                quantite: item.quantite
            }));
            
            await apiPut(`/commandes/${commandeEnCours.id}/items`, { items });
            
            // Rafraîchir les données de la commande
            const commandeMaj = await apiGet(`/commandes/nom/${encodeURIComponent(commandeEnCours.nom_commande)}`);
            commandeEnCours = commandeMaj;
            
        } catch (error) {
            console.error('Erreur mise à jour commande:', error);
            // Ne pas afficher d'erreur à l'utilisateur pour ne pas perturber l'expérience
        }
    }, 1000); // 1 seconde de délai
}

function afficherPanier() {
    const container = document.getElementById('panier');
    const totalElement = document.getElementById('totalPrix');
    
    if (!panier.length) {
        container.innerHTML = '<p class="info">Votre panier est vide</p>';
        totalElement.textContent = formatPrice(0);
        return;
    }
    
    let total = 0;
    
    container.innerHTML = panier.map(item => {
        const sousTotal = item.prix * item.quantite;
        total += sousTotal;
        
        return `
            <div class="panier-item">
                <span class="panier-item-nom">${item.nom}</span>
                <div class="panier-item-details">
                    <span>${item.quantite} x ${formatPrice(item.prix)}</span>
                    <strong>${formatPrice(sousTotal)}</strong>
                </div>
            </div>
        `;
    }).join('');
    
    totalElement.textContent = formatPrice(total);
}

// ============================================
// ÉTAPE 3: ALLER À LA CAISSE (avec vérification)
// ============================================

async function allerALaCaisse() {
    if (!panier.length) {
        showError('Votre panier est vide');
        return;
    }
    
    if (!commandeEnCours || !commandeEnCours.id) {
        showError('Erreur: commande introuvable. Veuillez recommencer.');
        retourEtape1();
        return;
    }
    
    try {
        // S'assurer que la commande est à jour en base
        if (timeoutMiseAJour) {
            clearTimeout(timeoutMiseAJour);
            await mettreAJourCommandeEnBaseSynchrone();
        }
        
        // Vérifier disponibilité
        const verification = await apiPost(`/commandes/${commandeEnCours.id}/verifier`);
        
        if (verification.disponible) {
            // ✅ Tout est disponible → Aller à la caisse
            attendrePaiement();
        } else {
            // ❌ Stock insuffisant → Afficher les articles problématiques
            let message = '⚠️ Certains articles ne sont plus disponibles:\n\n';
            verification.details.forEach(detail => {
                if (!detail.ok) {
                    message += `• ${detail.nom}: demandé ${detail.demande}, disponible ${detail.disponible}\n`;
                }
            });
            message += '\nVeuillez modifier votre commande.';
            
            alert(message);
        }
        
    } catch (error) {
        showError(error.message || 'Erreur lors de la vérification');
    }
}

// Version synchrone pour forcer la mise à jour avant vérification
async function mettreAJourCommandeEnBaseSynchrone() {
    if (!commandeEnCours || !commandeEnCours.id) return;
    
    try {
        const items = panier.map(item => ({
            article_id: item.article_id,
            quantite: item.quantite
        }));
        
        await apiPut(`/commandes/${commandeEnCours.id}/items`, { items });
        
        // Rafraîchir les données
        const commandeMaj = await apiGet(`/commandes/nom/${encodeURIComponent(commandeEnCours.nom_commande)}`);
        commandeEnCours = commandeMaj;
        
    } catch (error) {
        console.error('Erreur mise à jour:', error);
        throw error;
    }
}

function retourEtape1() {
    commandeEnCours = null;
    panier = [];
    document.getElementById('nomCommande').value = '';
    showStep('step1');
}

// ============================================
// ÉTAPE 3: ATTENDRE LE PAIEMENT
// ============================================

function attendrePaiement() {
    document.getElementById('displayNom3').textContent = commandeEnCours.nom_commande;
    showStep('step3');
    
    // Vérifier le statut toutes les 3 secondes
    intervalPaiement = setInterval(verifierStatutPaiement, 3000);
    verifierStatutPaiement(); // Première vérification immédiate
}

async function verifierStatutPaiement() {
    try {
        const commande = await apiGet(`/commandes/nom/${encodeURIComponent(commandeEnCours.nom_commande)}`);
        
        const statusDiv = document.getElementById('statutPaiement');
        
        if (commande.statut === 'payee') {
            clearInterval(intervalPaiement);
            commandePayee();
        } else {
            statusDiv.innerHTML = `
                <div class="alert alert-warning">
                    <p>⏳ En attente de paiement...</p>
                    <p class="info">Montant total: <strong>${formatPrice(commande.montant_total)}</strong></p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erreur vérification statut:', error);
    }
}

// ============================================
// ÉTAPE 4: COMMANDE PAYÉE
// ============================================

function commandePayee() {
    document.getElementById('displayNom4').textContent = commandeEnCours.nom_commande;
    showStep('step4');
    showSuccess('Commande payée avec succès !');
}

function nouvelleCommande() {
    // Réinitialiser
    commandeEnCours = null;
    panier = [];
    document.getElementById('nomCommande').value = '';
    
    if (intervalPaiement) {
        clearInterval(intervalPaiement);
    }
    
    showStep('step1');
}

// Nettoyer l'intervalle si on quitte la page
window.addEventListener('beforeunload', () => {
    if (intervalPaiement) {
        clearInterval(intervalPaiement);
    }
});
