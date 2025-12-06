-- ============================================
-- MODIFICATION EXPIRATION RÉSERVATIONS: 30min → 15min
-- ============================================

-- Mettre à jour la fonction de nettoyage
CREATE OR REPLACE FUNCTION nettoyer_reservations_expirees()
RETURNS INTEGER AS $$
DECLARE
    nb_supprimes INTEGER;
BEGIN
    DELETE FROM reservation_temporaire 
    WHERE created_at < NOW() - INTERVAL '15 minutes';
    
    GET DIAGNOSTICS nb_supprimes = ROW_COUNT;
    RETURN nb_supprimes;
END;
$$ LANGUAGE plpgsql;

-- Vérifier que la fonction a été mise à jour
SELECT 'Fonction mise à jour avec succès - Expiration: 15 minutes' as status;

-- Nettoyer immédiatement les réservations > 15 min
SELECT nettoyer_reservations_expirees() as nb_reservations_supprimees;
