-- ============================================
-- CORRECTION RAPIDE - Vue v_stats_articles
-- Corrige l'erreur: column "total_vendu" does not exist
-- ============================================

-- Supprimer ancienne vue
DROP VIEW IF EXISTS v_stats_articles CASCADE;

-- Recréer avec la bonne colonne "total_vendu"
CREATE OR REPLACE VIEW v_stats_articles AS
SELECT 
    a.id,
    a.nom,
    a.prix,
    a.stock_disponible,
    COALESCE(SUM(ci.quantite), 0)::INTEGER as total_vendu,
    COALESCE(SUM(ci.quantite * ci.prix_unitaire), 0)::DECIMAL(10,2) as chiffre_affaires,
    COUNT(DISTINCT c.id)::INTEGER as nb_commandes
FROM articles a
LEFT JOIN commande_items ci ON a.id = ci.article_id
LEFT JOIN commandes c ON ci.commande_id = c.id AND c.statut IN ('payee', 'livree', 'livree_partiellement')
WHERE a.actif = TRUE
GROUP BY a.id, a.nom, a.prix, a.stock_disponible
ORDER BY total_vendu DESC;

-- Vérifier que ça fonctionne
SELECT 'Vue v_stats_articles créée avec succès' as info;
SELECT * FROM v_stats_articles LIMIT 3;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================
-- Colonnes:
--   id, nom, prix, stock_disponible,
--   total_vendu, chiffre_affaires, nb_commandes
--
-- Erreur Railway résolue:
--   ✅ GET /api/stats/articles 200 OK
-- ============================================
