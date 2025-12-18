const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES
// ============================================
// Configuration Helmet avec CSP assouplie pour permettre les onclick
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'", "'unsafe-hashes'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(morgan('dev')); // Logs
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================
// ROUTE: Health Check
// ============================================
app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ 
      status: 'OK', 
      timestamp: result.rows[0].now,
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// ============================================
// ROUTES: ARTICLES
// ============================================

// GET: Liste tous les articles actifs avec stock réel
app.get('/api/articles', async (req, res) => {
  try {
    // Nettoyer les réservations expirées d'abord
    await db.query('SELECT nettoyer_reservations_expirees()');
    
    // Utiliser la vue avec stock réel (stock - réservations)
    const result = await db.query(`
      SELECT 
        id, nom, description, prix,
        stock_initial as stock_disponible,
        stock_reel_disponible,
        image_url, actif, created_at, updated_at
      FROM v_stock_disponible
      WHERE actif = TRUE
      ORDER BY nom ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur GET articles:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des articles',
      detail: error.message 
    });
  }
});

// GET: Un article spécifique
app.get('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        id, nom, description, prix, stock_disponible,
        image_url, actif, created_at, updated_at
      FROM articles
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    // Ajouter stock_reel_disponible pour compatibilité
    const article = {
      ...result.rows[0],
      stock_reel_disponible: result.rows[0].stock_disponible
    };
    
    res.json(article);
  } catch (error) {
    console.error('Erreur GET article:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'article' });
  }
});

// PUT: Mettre à jour le stock d'un article (ADMIN)
app.put('/api/articles/:id/stock', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { stock_disponible, commentaire } = req.body;
    
    await client.query('BEGIN');
    
    // Récupérer le stock actuel
    const current = await client.query('SELECT stock_disponible FROM articles WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    const stock_avant = current.rows[0].stock_disponible;
    
    // Mettre à jour le stock
    const result = await client.query(
      'UPDATE articles SET stock_disponible = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [stock_disponible, id]
    );
    
    // Enregistrer dans l'historique
    await client.query(
      `INSERT INTO historique_stock 
       (article_id, type_mouvement, quantite_avant, quantite_apres, difference, commentaire) 
       VALUES ($1, 'correction', $2, $3, $4, $5)`,
      [id, stock_avant, stock_disponible, stock_disponible - stock_avant, commentaire || 'Correction manuelle']
    );
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur UPDATE stock:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du stock' });
  } finally {
    client.release();
  }
});

// ============================================
// ROUTES: RÉSERVATIONS TEMPORAIRES (v2.7)
// ============================================

// POST: Créer des réservations pour une commande (appelé lors de "Encaisser")
app.post('/api/reservations/commande/:nom', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { nom } = req.params;
    const { items } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'items requis' });
    }
    
    await client.query('BEGIN');
    
    // Nettoyer les réservations expirées
    await client.query('SELECT nettoyer_reservations_expirees()');
    
    // Supprimer les anciennes réservations de cette commande (si ré-encaissement)
    await client.query(
      'DELETE FROM reservation_temporaire WHERE nom_commande = $1',
      [nom]
    );
    
    // Vérifier et créer les nouvelles réservations
    const stocksInsuffisants = [];
    
    for (const item of items) {
      const { article_id, quantite } = item;
      
      // Vérifier le stock réel disponible via la vue
      const stockCheck = await client.query(`
        SELECT stock_reel_disponible
        FROM v_stock_disponible
        WHERE id = $1
      `, [article_id]);
      
      if (stockCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Article ${article_id} non trouvé` });
      }
      
      const stockReel = stockCheck.rows[0].stock_reel_disponible;
      
      if (stockReel < quantite) {
        stocksInsuffisants.push({
          article_id,
          stock_disponible: stockReel,
          quantite_demandee: quantite
        });
      }
    }
    
    // Si stock insuffisant, annuler
    if (stocksInsuffisants.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        error: 'Stock insuffisant pour certains articles',
        details: stocksInsuffisants
      });
    }
    
    // Créer les réservations
    for (const item of items) {
      const { article_id, quantite } = item;
      
      await client.query(
        'INSERT INTO reservation_temporaire (nom_commande, article_id, quantite) VALUES ($1, $2, $3)',
        [nom, article_id, quantite]
      );
    }
    
    await client.query('COMMIT');
    res.json({ 
      message: 'Réservations créées avec succès', 
      nom_commande: nom,
      nb_articles: items.length 
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur création réservations:', error);
    res.status(500).json({ error: 'Erreur lors de la création des réservations' });
  } finally {
    client.release();
  }
});

// DELETE: Supprimer les réservations d'une commande (appelé lors de "Annuler")
app.delete('/api/reservations/commande/:nom', async (req, res) => {
  try {
    const { nom } = req.params;
    
    const result = await db.query(
      'SELECT supprimer_reservations($1) as nb_supprimes',
      [nom]
    );
    
    res.json({ 
      message: 'Réservations supprimées',
      nb_supprimes: result.rows[0].nb_supprimes
    });
  } catch (error) {
    console.error('Erreur suppression réservations:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression des réservations' });
  }
});

// GET: Voir toutes les réservations (pour debug/admin)
app.get('/api/reservations', async (req, res) => {
  try {
    // Nettoyer les réservations expirées
    await db.query('SELECT nettoyer_reservations_expirees()');
    
    const result = await db.query(`
      SELECT 
        rt.*,
        a.nom as article_nom,
        a.stock_disponible,
        EXTRACT(EPOCH FROM (NOW() - rt.created_at))/60 as age_minutes
      FROM reservation_temporaire rt
      JOIN articles a ON rt.article_id = a.id
      ORDER BY rt.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur GET réservations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des réservations' });
  }
});

// GET: Voir les réservations d'une commande spécifique
app.get('/api/reservations/commande/:nom', async (req, res) => {
  try {
    const { nom } = req.params;
    
    const result = await db.query(`
      SELECT 
        rt.*,
        a.nom as article_nom,
        a.prix
      FROM reservation_temporaire rt
      JOIN articles a ON rt.article_id = a.id
      WHERE rt.nom_commande = $1
      ORDER BY a.nom
    `, [nom]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur GET réservations commande:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des réservations' });
  }
});

// ============================================
// ROUTES: COMMANDES
// ============================================

// POST: Créer une nouvelle commande
app.post('/api/commandes', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { nom_commande, items } = req.body;
    
    // Validation
    if (!nom_commande) {
      return res.status(400).json({ error: 'Nom de commande requis' });
    }
    
    await client.query('BEGIN');
    
    // Vérifier que le nom est unique (case insensitive)
    const existing = await client.query(
      'SELECT id FROM commandes WHERE LOWER(nom_commande) = LOWER($1)', 
      [nom_commande]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Ce nom de commande existe déjà. Choisissez un autre nom.' });
    }
    
    // Créer la commande
    const commandeResult = await client.query(
      'INSERT INTO commandes (nom_commande, statut) VALUES ($1, $2) RETURNING *',
      [nom_commande, 'en_attente']
    );
    const commande = commandeResult.rows[0];
    
    // Ajouter les items si fournis
    if (items && items.length > 0) {
      for (const item of items) {
        const { article_id, quantite } = item;
        
        // Récupérer le prix actuel de l'article
        const articleResult = await client.query('SELECT prix FROM articles WHERE id = $1', [article_id]);
        if (articleResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: `Article ${article_id} non trouvé` });
        }
        
        const prix_unitaire = articleResult.rows[0].prix;
        
        await client.query(
          'INSERT INTO commande_items (commande_id, article_id, quantite, prix_unitaire) VALUES ($1, $2, $3, $4)',
          [commande.id, article_id, quantite, prix_unitaire]
        );
      }
    }
    
    // Calculer et mettre à jour le montant total
    const montantResult = await client.query(`
      SELECT COALESCE(SUM(quantite * prix_unitaire), 0) as total
      FROM commande_items
      WHERE commande_id = $1
    `, [commande.id]);
    
    const montant_total = montantResult.rows[0].total;
    
    await client.query(
      'UPDATE commandes SET montant_total = $1 WHERE id = $2',
      [montant_total, commande.id]
    );
    
    // Récupérer la commande complète avec le total
    const finalResult = await client.query('SELECT * FROM commandes WHERE id = $1', [commande.id]);
    
    await client.query('COMMIT');
    res.status(201).json(finalResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur POST commande:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la commande' });
  } finally {
    client.release();
  }
});

// PUT: Mettre à jour les items d'une commande en attente
app.put('/api/commandes/:id/items', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { items } = req.body;
    
    await client.query('BEGIN');
    
    // Vérifier que la commande existe et est en attente
    const commandeCheck = await client.query('SELECT * FROM commandes WHERE id = $1', [id]);
    if (commandeCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    if (commandeCheck.rows[0].statut !== 'en_attente') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cette commande ne peut plus être modifiée' });
    }
    
    // Supprimer les anciens items
    await client.query('DELETE FROM commande_items WHERE commande_id = $1', [id]);
    
    // Ajouter les nouveaux items
    if (items && items.length > 0) {
      for (const item of items) {
        const { article_id, quantite } = item;
        
        // Récupérer le prix actuel de l'article
        const articleResult = await client.query('SELECT prix FROM articles WHERE id = $1', [article_id]);
        if (articleResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: `Article ${article_id} non trouvé` });
        }
        
        const prix_unitaire = articleResult.rows[0].prix;
        
        await client.query(
          'INSERT INTO commande_items (commande_id, article_id, quantite, prix_unitaire) VALUES ($1, $2, $3, $4)',
          [id, article_id, quantite, prix_unitaire]
        );
      }
    }
    
    // Calculer et mettre à jour le montant total
    const montantResult = await client.query(`
      SELECT COALESCE(SUM(quantite * prix_unitaire), 0) as total
      FROM commande_items
      WHERE commande_id = $1
    `, [id]);
    
    const montant_total = montantResult.rows[0].total;
    
    await client.query(
      'UPDATE commandes SET montant_total = $1 WHERE id = $2',
      [montant_total, id]
    );
    
    // Récupérer la commande mise à jour
    const finalResult = await client.query('SELECT * FROM commandes WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    res.json(finalResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur PUT items:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des items' });
  } finally {
    client.release();
  }
});

// GET: Récupérer une commande par son nom
app.get('/api/commandes/nom/:nom_commande', async (req, res) => {
  try {
    const { nom_commande } = req.params;
    // Recherche case insensitive
    const result = await db.query(
      'SELECT * FROM commandes WHERE LOWER(nom_commande) = LOWER($1)', 
      [nom_commande]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    // Récupérer les items de la commande
    const itemsResult = await db.query(`
      SELECT 
        ci.*,
        a.nom as article_nom,
        (ci.quantite * ci.prix_unitaire) as sous_total
      FROM commande_items ci
      JOIN articles a ON ci.article_id = a.id
      WHERE ci.commande_id = $1
      ORDER BY ci.id
    `, [result.rows[0].id]);
    
    res.json({
      ...result.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error('Erreur GET commande par nom:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la commande' });
  }
});

// GET: Liste des commandes par statut
app.get('/api/commandes/statut/:statut', async (req, res) => {
  try {
    const { statut } = req.params;
    
    // Si on demande 'payee', inclure aussi 'livree_partiellement'
    let whereClause;
    let params;
    if (statut === 'payee') {
      whereClause = "c.statut IN ($1, $2)";
      params = ['payee', 'livree_partiellement'];
    } else {
      whereClause = "c.statut = $1";
      params = [statut];
    }
    
    const result = await db.query(`
      SELECT c.*, 
             COUNT(ci.id) as nombre_items,
             SUM(ci.quantite) as quantite_totale
      FROM commandes c
      LEFT JOIN commande_items ci ON c.id = ci.commande_id
      WHERE ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur GET commandes par statut:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes' });
  }
});

// POST: Vérifier la disponibilité d'une commande
app.post('/api/commandes/:id/verifier', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM verifier_disponibilite_commande($1)', [id]);
    
    const disponibilite = result.rows;
    const toutDisponible = disponibilite.every(item => item.ok);
    
    res.json({
      disponible: toutDisponible,
      details: disponibilite
    });
  } catch (error) {
    console.error('Erreur vérification disponibilité:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification de disponibilité' });
  }
});

// PUT: Payer une commande (CAISSE)
app.put('/api/commandes/:id/payer', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { montant_paye, montant_cb = 0, montant_especes = 0, montant_cheque = 0 } = req.body;
    
    await client.query('BEGIN');
    
    // Vérifier que la commande existe et est en attente
    const check = await client.query('SELECT * FROM commandes WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    if (check.rows[0].statut !== 'en_attente') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cette commande a déjà été traitée' });
    }
    
    // Vérifier la disponibilité avant de payer
    const dispo = await client.query('SELECT * FROM verifier_disponibilite_commande($1)', [id]);
    const toutDisponible = dispo.rows.every(item => item.ok);
    
    if (!toutDisponible) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        error: 'Stock insuffisant pour certains articles',
        details: dispo.rows.filter(item => !item.ok)
      });
    }
    
    // Calculer la somme des paiements
    const sommePaiements = parseFloat(montant_cb) + parseFloat(montant_especes) + parseFloat(montant_cheque);
    const montantTotal = parseFloat(check.rows[0].montant_total);
    
    // Vérifier que la somme correspond au montant total
    if (Math.abs(sommePaiements - montantTotal) > 0.01) { // Tolérance de 1 centime pour les arrondis
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'La somme des paiements ne correspond pas au montant total',
        montant_total: montantTotal.toFixed(2),
        somme_paiements: sommePaiements.toFixed(2),
        difference: (montantTotal - sommePaiements).toFixed(2)
      });
    }
    
    // Mettre à jour le statut avec les modes de paiement (le trigger décrèmentera le stock automatiquement)
    const result = await client.query(
      `UPDATE commandes 
       SET statut = $1, 
           montant_paye = $2, 
           montant_cb = $3, 
           montant_especes = $4, 
           montant_cheque = $5,
           date_paiement = CURRENT_TIMESTAMP
       WHERE id = $6 
       RETURNING *`,
      ['payee', sommePaiements, montant_cb, montant_especes, montant_cheque, id]
    );
    
    // Supprimer les réservations temporaires (paiement confirmé)
    const nomCommande = check.rows[0].nom_commande;
    await client.query(
      'SELECT supprimer_reservations($1)',
      [nomCommande]
    );
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur paiement commande:', error);
    res.status(500).json({ error: 'Erreur lors du paiement de la commande' });
  } finally {
    client.release();
  }
});

// PUT: Livrer une commande (PREPARATEUR)
app.put('/api/commandes/:id/livrer', async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { article_ids = [] } = req.body; // IDs des articles à livrer
    
    // Vérifier que la commande existe
    const check = await client.query('SELECT * FROM commandes WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    const commande = check.rows[0];
    
    // Vérifier que la commande est payée ou partiellement livrée
    if (!['payee', 'livree_partiellement'].includes(commande.statut)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cette commande n\'est pas payée' });
    }
    
    // Récupérer tous les items de la commande
    const items = await client.query(
      'SELECT * FROM commande_items WHERE commande_id = $1',
      [id]
    );
    
    // Si aucun article spécifié, livrer tous les articles non livrés
    const idsALivrer = article_ids.length > 0 ? article_ids : items.rows.filter(i => !i.est_livre).map(i => i.id);
    
    // Marquer les articles comme livrés
    if (idsALivrer.length > 0) {
      await client.query(
        'UPDATE commande_items SET est_livre = TRUE WHERE id = ANY($1::int[])',
        [idsALivrer]
      );
    }
    
    // Vérifier le statut de la commande après livraison
    const itemsApres = await client.query(
      'SELECT * FROM commande_items WHERE commande_id = $1',
      [id]
    );
    
    const tousLivres = itemsApres.rows.every(item => item.est_livre);
    const auMoinsUnLivre = itemsApres.rows.some(item => item.est_livre);
    
    let nouveauStatut;
    let dateLivraison = null;
    
    if (tousLivres) {
      nouveauStatut = 'livree';
      dateLivraison = 'CURRENT_TIMESTAMP';
    } else if (auMoinsUnLivre) {
      nouveauStatut = 'livree_partiellement';
    } else {
      nouveauStatut = 'payee';
    }
    
    // Mettre à jour le statut de la commande
    const result = await client.query(
      `UPDATE commandes 
       SET statut = $1, 
           date_livraison = ${dateLivraison || 'date_livraison'}
       WHERE id = $2 
       RETURNING *`,
      [nouveauStatut, id]
    );
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur livraison commande:', error);
    res.status(500).json({ error: 'Erreur lors de la livraison de la commande' });
  } finally {
    client.release();
  }
});

// GET: Détail complet d'une commande
app.get('/api/commandes/:id/detail', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM get_commande_recap($1)', [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur détail commande:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du détail' });
  }
});

// ============================================
// ROUTES: STATISTIQUES (ADMIN)
// ============================================

// GET: Vue d'ensemble des statistiques
app.get('/api/stats/overview', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM commandes WHERE statut = 'en_attente') as commandes_attente,
        (SELECT COUNT(*) FROM commandes WHERE statut = 'payee') as commandes_payees,
        (SELECT COUNT(*) FROM commandes WHERE statut = 'livree_partiellement') as commandes_partielles,
        (SELECT COUNT(*) FROM commandes WHERE statut = 'livree') as commandes_livrees,
        (SELECT COALESCE(SUM(montant_total), 0) FROM commandes WHERE statut IN ('payee', 'livree_partiellement', 'livree')) as chiffre_affaires_total,
        (SELECT COALESCE(SUM(montant_total), 0) FROM commandes WHERE statut IN ('payee', 'livree_partiellement')) as en_cours_preparation,
        (SELECT COALESCE(SUM(montant_cb), 0) FROM commandes WHERE statut IN ('payee', 'livree_partiellement', 'livree')) as total_cb,
        (SELECT COALESCE(SUM(montant_especes), 0) FROM commandes WHERE statut IN ('payee', 'livree_partiellement', 'livree')) as total_especes,
        (SELECT COALESCE(SUM(montant_cheque), 0) FROM commandes WHERE statut IN ('payee', 'livree_partiellement', 'livree')) as total_cheque
    `);
    
    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Erreur stats overview:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// GET: Statistiques par article
app.get('/api/stats/articles', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM v_stats_articles ORDER BY total_vendu DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur stats articles:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// GET: Articles à préparer (pour page préparation)
app.get('/api/stats/articles-a-preparer', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        a.id,
        a.nom,
        COALESCE(SUM(ci.quantite), 0) as quantite_totale,
        COALESCE(SUM(CASE WHEN ci.est_livre THEN ci.quantite ELSE 0 END), 0) as quantite_livree,
        COALESCE(SUM(CASE WHEN NOT ci.est_livre THEN ci.quantite ELSE 0 END), 0) as quantite_restante
      FROM articles a
      LEFT JOIN commande_items ci ON a.id = ci.article_id
      LEFT JOIN commandes c ON ci.commande_id = c.id
      WHERE c.statut IN ('payee', 'livree_partiellement')
      GROUP BY a.id, a.nom
      HAVING SUM(CASE WHEN NOT ci.est_livre THEN ci.quantite ELSE 0 END) > 0
      ORDER BY a.nom
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur stats articles à préparer:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des articles à préparer' });
  }
});

// GET: Historique des commandes
app.get('/api/historique/commandes', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM v_commandes_details 
      WHERE statut IN ('payee', 'livree_partiellement', 'livree', 'annulee')
      ORDER BY 
        CASE 
          WHEN date_livraison IS NOT NULL THEN date_livraison
          WHEN date_paiement IS NOT NULL THEN date_paiement
          ELSE created_at
        END DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur historique commandes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
});

// ============================================
// ROUTES: PARAMETRAGE
// ============================================

// GET: Récupérer un paramètre par clé
app.get('/api/parametrage/:cle', async (req, res) => {
  try {
    const { cle } = req.params;
    const result = await db.query(
      'SELECT * FROM parametrage WHERE cle = $1',
      [cle]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paramètre non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur GET parametrage:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du paramètre' });
  }
});

// GET: Récupérer tous les paramètres
app.get('/api/parametrage', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM parametrage ORDER BY cle ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur GET parametrage:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres' });
  }
});

// PUT: Mettre à jour un paramètre
app.put('/api/parametrage/:cle', async (req, res) => {
  try {
    const { cle } = req.params;
    const { valeur } = req.body;
    
    // Vérifier que le paramètre existe
    const check = await db.query('SELECT * FROM parametrage WHERE cle = $1', [cle]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Paramètre non trouvé' });
    }
    
    // Mettre à jour
    const result = await db.query(
      `UPDATE parametrage 
       SET valeur = $2, updated_at = CURRENT_TIMESTAMP
       WHERE cle = $1
       RETURNING *`,
      [cle, valeur]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur PUT parametrage:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du paramètre' });
  }
});

// ============================================
// GESTION DES ERREURS
// ============================================
// 404 uniquement pour les routes API
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Route API non trouvée' });
});

app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================
app.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
