-- ============================================
-- CORRECTION VUE v_stats_articles
-- ============================================
-- Ajouter le champ actif et enlever le filtre WHERE actif = TRUE
-- pour permettre le filtrage côté JavaScript

DROP VIEW IF EXISTS v_stats_articles;

CREATE OR REPLACE VIEW v_stats_articles AS
SELECT 
    a.id,
    a.nom,
    a.prix,
    a.stock_disponible,
    a.actif,  -- AJOUT du champ actif
    COALESCE(SUM(ci.quantite), 0)::INTEGER as total_vendu,
    COALESCE(SUM(ci.quantite * ci.prix_unitaire), 0)::DECIMAL(10,2) as chiffre_affaires,
    COUNT(DISTINCT c.id)::INTEGER as nb_commandes
FROM articles a
LEFT JOIN commande_items ci ON a.id = ci.article_id
LEFT JOIN commandes c ON ci.commande_id = c.id AND c.statut IN ('payee', 'livree', 'livree_partiellement')
-- WHERE a.actif = TRUE  -- ENLEVÉ pour permettre affichage de tous les articles
GROUP BY a.id, a.nom, a.prix, a.stock_disponible, a.actif
ORDER BY total_vendu DESC;

-- Vérifier la vue
SELECT * FROM v_stats_articles LIMIT 5;
