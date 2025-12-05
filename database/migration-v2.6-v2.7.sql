-- ============================================
-- MIGRATION v2.6 → v2.7
-- Système de réservation temporaire des stocks
-- ============================================

-- Supprimer l'ancienne table si elle existe avec une autre structure
DROP TABLE IF EXISTS reservation_temporaire CASCADE;

-- 1. Créer la table de réservation temporaire avec nom_commande
CREATE TABLE reservation_temporaire (
    id SERIAL PRIMARY KEY,
    nom_commande VARCHAR(100) NOT NULL,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_reservation UNIQUE(nom_commande, article_id)
);

-- Index pour améliorer les performances
CREATE INDEX idx_reservation_nom ON reservation_temporaire(nom_commande);
CREATE INDEX idx_reservation_article ON reservation_temporaire(article_id);
CREATE INDEX idx_reservation_created ON reservation_temporaire(created_at);

-- 2. Créer une vue pour le stock disponible réel
CREATE OR REPLACE VIEW v_stock_disponible AS
SELECT 
    a.id,
    a.nom,
    a.prix,
    a.stock_disponible as stock_initial,
    COALESCE(SUM(rt.quantite), 0)::INTEGER as quantite_reservee,
    (a.stock_disponible - COALESCE(SUM(rt.quantite), 0))::INTEGER as stock_reel_disponible,
    a.image_data,
    a.image_type
FROM articles a
LEFT JOIN reservation_temporaire rt ON a.id = rt.article_id
GROUP BY a.id, a.nom, a.prix, a.stock_disponible, a.image_data, a.image_type;

-- 3. Fonction pour nettoyer les réservations expirées (> 30 minutes)
CREATE OR REPLACE FUNCTION nettoyer_reservations_expirees()
RETURNS INTEGER AS $$
DECLARE
    nb_supprimes INTEGER;
BEGIN
    DELETE FROM reservation_temporaire 
    WHERE created_at < NOW() - INTERVAL '30 minutes';
    
    GET DIAGNOSTICS nb_supprimes = ROW_COUNT;
    RETURN nb_supprimes;
END;
$$ LANGUAGE plpgsql;

-- 4. Fonction pour créer des réservations
CREATE OR REPLACE FUNCTION creer_reservations(
    p_nom_commande VARCHAR,
    p_articles JSONB
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    stocks_insuffisants JSONB
) AS $$
DECLARE
    article JSONB;
    v_article_id INTEGER;
    v_quantite INTEGER;
    v_stock_reel INTEGER;
    problemes JSONB := '[]'::JSONB;
BEGIN
    -- Nettoyer d'abord les réservations expirées
    PERFORM nettoyer_reservations_expirees();
    
    -- Vérifier le stock disponible réel pour chaque article
    FOR article IN SELECT * FROM jsonb_array_elements(p_articles)
    LOOP
        v_article_id := (article->>'article_id')::INTEGER;
        v_quantite := (article->>'quantite')::INTEGER;
        
        -- Récupérer le stock réel disponible
        SELECT stock_reel_disponible INTO v_stock_reel
        FROM v_stock_disponible
        WHERE id = v_article_id;
        
        -- Vérifier si stock insuffisant
        IF v_stock_reel < v_quantite THEN
            problemes := problemes || jsonb_build_object(
                'article_id', v_article_id,
                'demande', v_quantite,
                'disponible', v_stock_reel
            );
        END IF;
    END LOOP;
    
    -- Si problèmes, retourner erreur
    IF jsonb_array_length(problemes) > 0 THEN
        RETURN QUERY SELECT FALSE, 'Stock insuffisant'::TEXT, problemes;
        RETURN;
    END IF;
    
    -- Tout est OK, créer les réservations
    FOR article IN SELECT * FROM jsonb_array_elements(p_articles)
    LOOP
        v_article_id := (article->>'article_id')::INTEGER;
        v_quantite := (article->>'quantite')::INTEGER;
        
        -- Insérer ou mettre à jour la réservation
        INSERT INTO reservation_temporaire (nom_commande, article_id, quantite)
        VALUES (p_nom_commande, v_article_id, v_quantite)
        ON CONFLICT (nom_commande, article_id) 
        DO UPDATE SET 
            quantite = EXCLUDED.quantite,
            created_at = NOW();
    END LOOP;
    
    RETURN QUERY SELECT TRUE, 'Réservations créées'::TEXT, '[]'::JSONB;
END;
$$ LANGUAGE plpgsql;

-- 5. Fonction pour supprimer les réservations d'une commande
CREATE OR REPLACE FUNCTION supprimer_reservations(p_nom_commande VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    nb_supprimes INTEGER;
BEGIN
    DELETE FROM reservation_temporaire 
    WHERE nom_commande = p_nom_commande;
    
    GET DIAGNOSTICS nb_supprimes = ROW_COUNT;
    RETURN nb_supprimes;
END;
$$ LANGUAGE plpgsql;

-- 6. Commentaires
COMMENT ON TABLE reservation_temporaire IS 'Réservations temporaires d''articles lors du processus de paiement';
COMMENT ON VIEW v_stock_disponible IS 'Stock disponible réel = stock initial - réservations temporaires';
COMMENT ON FUNCTION nettoyer_reservations_expirees() IS 'Supprime les réservations de plus de 30 minutes';
COMMENT ON FUNCTION creer_reservations(VARCHAR, JSONB) IS 'Crée des réservations temporaires pour une commande';
COMMENT ON FUNCTION supprimer_reservations(VARCHAR) IS 'Supprime toutes les réservations d''une commande';

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que la table existe
SELECT 'Table reservation_temporaire créée' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservation_temporaire');

-- Vérifier que la vue existe
SELECT 'Vue v_stock_disponible créée' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'v_stock_disponible');

-- Test de la vue
SELECT * FROM v_stock_disponible LIMIT 1;
