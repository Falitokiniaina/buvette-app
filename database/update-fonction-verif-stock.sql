-- ============================================
-- CORRECTION FONCTION verifier_disponibilite_commande
-- ============================================
-- Problème : La fonction comptait la propre réservation de la commande
--            comme indisponible, ce qui donnait "disponible 2" au lieu de 35
-- 
-- Solution : Exclure la réservation de la commande qu'on vérifie
--            en rajoutant sa quantité au stock_reel_disponible
-- ============================================

CREATE OR REPLACE FUNCTION verifier_disponibilite_commande(p_commande_id INTEGER)
RETURNS TABLE (
    article_id INTEGER,
    article_nom VARCHAR,
    quantite_demandee INTEGER,
    stock_disponible INTEGER,
    stock_reel_disponible INTEGER,
    ok BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.article_id,
        a.nom,
        ci.quantite,
        a.stock_disponible,
        -- Stock réel disponible + quantité déjà réservée par CETTE commande (si existe)
        (v.stock_reel_disponible + COALESCE(rt.quantite_reservee_commande, 0)) as stock_reel_disponible,
        ((v.stock_reel_disponible + COALESCE(rt.quantite_reservee_commande, 0)) >= ci.quantite) as ok
    FROM commande_items ci
    JOIN articles a ON ci.article_id = a.id
    JOIN v_stock_disponible v ON a.id = v.id
    -- Récupérer la quantité déjà réservée par CETTE commande (pour chaque article)
    LEFT JOIN (
        SELECT 
            rt.article_id,
            rt.quantite as quantite_reservee_commande
        FROM reservation_temporaire rt
        JOIN commandes c ON rt.nom_commande = c.nom_commande
        WHERE c.id = p_commande_id
    ) rt ON ci.article_id = rt.article_id
    WHERE ci.commande_id = p_commande_id;
END;
$$ LANGUAGE plpgsql;

-- Vérifier que la fonction a été mise à jour
SELECT 'Fonction verifier_disponibilite_commande mise à jour avec succès' as status;

-- ============================================
-- EXPLICATION
-- ============================================

/*
AVANT (BUG) :
1. Commande demande 32 Vary Anana (stock physique = 35)
2. Caisse clique "Encaisser" (ancienne version)
   → Réservation créée (35 - 32 = 3 disponibles)
   → Vérification stock → stock_reel_disponible = 3
   → Message : "disponible 3" ❌ INCORRECT
   
APRÈS (CORRIGÉ) :
1. Commande demande 32 Vary Anana (stock physique = 35)
2. Caisse clique "Encaisser" (nouvelle version)
   → Vérification stock AVANT réservation
   → stock_reel_disponible = 35 (pas encore réservé)
   → Si OK → Réservation créée ✅
   
   OU si réservation déjà existe (cas rare) :
   → Vérification stock
   → stock_reel_disponible = 3 + 32 (sa propre réservation) = 35 ✅
   → Message correct

RÉSULTAT :
La fonction ne compte plus la propre réservation de la commande 
comme indisponible, ce qui évite le bug "disponible 2" alors que 
le stock physique est 35.
*/
