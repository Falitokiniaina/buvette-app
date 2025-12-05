// ============================================
// ENDPOINTS RÉSERVATION TEMPORAIRE v2.7
// À ajouter dans server.js après la ligne 150
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
      
      // Vérifier le stock réel disponible
      const stockCheck = await client.query(`
        SELECT 
          a.stock_disponible - COALESCE(SUM(rt.quantite), 0) as stock_reel
        FROM articles a
        LEFT JOIN reservation_temporaire rt ON a.id = rt.article_id
        WHERE a.id = $1
        GROUP BY a.id, a.stock_disponible
      `, [article_id]);
      
      if (stockCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Article ${article_id} non trouvé` });
      }
      
      const stockReel = stockCheck.rows[0].stock_reel;
      
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
      'DELETE FROM reservation_temporaire WHERE nom_commande = $1 RETURNING *',
      [nom]
    );
    
    res.json({ 
      message: 'Réservations supprimées',
      nb_supprimes: result.rows.length
    });
  } catch (error) {
    console.error('Erreur suppression réservations:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression des réservations' });
  }
});

// GET: Voir toutes les réservations (pour debug/admin)
app.get('/api/reservations', async (req, res) => {
  try {
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
// MODIFIER L'ENDPOINT PUT /api/commandes/:id/payer
// Remplacer les lignes 542-546 par:
// ============================================

// Récupérer le nom de la commande pour supprimer ses réservations
const nomCommande = check.rows[0].nom_commande;

// Supprimer les réservations temporaires (paiement confirmé)
await client.query(
  'DELETE FROM reservation_temporaire WHERE nom_commande = $1',
  [nomCommande]
);
