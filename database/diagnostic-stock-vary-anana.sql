-- ============================================
-- DIAGNOSTIC STOCK DISPONIBLE "Vary Anana"
-- ============================================

-- 1. Vérifier le stock physique en base
SELECT 
    id,
    nom,
    stock_disponible,
    actif
FROM articles 
WHERE nom LIKE '%Vary%Anana%';

-- Résultat attendu : stock_disponible = 35 (ou 34)

-- ============================================

-- 2. Vérifier les réservations temporaires
SELECT 
    rt.nom_commande,
    rt.quantite as quantite_reservee,
    rt.created_at,
    EXTRACT(EPOCH FROM (NOW() - rt.created_at))/60 as age_minutes
FROM reservation_temporaire rt
JOIN articles a ON rt.article_id = a.id
WHERE a.nom LIKE '%Vary%Anana%'
ORDER BY rt.created_at DESC;

-- Si vous voyez des réservations ici, c'est la cause !

-- ============================================

-- 3. Vérifier le stock réel disponible (vue)
SELECT 
    id,
    nom,
    stock_initial,
    quantite_reservee,
    stock_reel_disponible
FROM v_stock_disponible
WHERE nom LIKE '%Vary%Anana%';

-- Calcul : stock_reel_disponible = stock_initial - quantite_reservee
-- Exemple : 35 - 33 = 2

-- ============================================

-- 4. Total des réservations par article
SELECT 
    a.nom,
    a.stock_disponible as stock_physique,
    COALESCE(SUM(rt.quantite), 0) as total_reserve,
    a.stock_disponible - COALESCE(SUM(rt.quantite), 0) as stock_reel_disponible,
    COUNT(DISTINCT rt.nom_commande) as nb_commandes_en_cours
FROM articles a
LEFT JOIN reservation_temporaire rt ON a.id = rt.article_id
WHERE a.nom LIKE '%Vary%Anana%'
GROUP BY a.id, a.nom, a.stock_disponible;

-- ============================================

-- 5. Détails de TOUTES les commandes en attente avec Vary Anana
SELECT 
    c.id,
    c.nom_commande,
    c.statut,
    ci.quantite as quantite_demandee,
    c.created_at
FROM commandes c
JOIN commande_items ci ON c.id = ci.commande_id
JOIN articles a ON ci.article_id = a.id
WHERE a.nom LIKE '%Vary%Anana%'
  AND c.statut = 'en_attente'
ORDER BY c.created_at;

-- ============================================

-- 6. SOLUTION : Nettoyer les réservations expirées (> 15 min)
SELECT nettoyer_reservations_expirees() as nb_reservations_supprimees;

-- Ensuite, refaire la requête #3 pour voir si stock_reel_disponible augmente

-- ============================================

-- 7. SOLUTION URGENTE : Supprimer TOUTES les réservations temporaires
-- ⚠️ ATTENTION : À utiliser uniquement si besoin urgent
-- Cela annulera tous les encaissements en cours !

-- DELETE FROM reservation_temporaire;

-- Puis vérifier :
-- SELECT * FROM v_stock_disponible WHERE nom LIKE '%Vary%Anana%';

-- ============================================
-- EXPLICATION
-- ============================================

/*
Le stock_reel_disponible prend en compte les réservations temporaires.

EXEMPLE :
- Stock physique (stock_disponible) = 35 Vary Anana
- 3 commandes en cours d'encaissement qui ont réservé :
  * Commande A : 10 Vary Anana (réservé)
  * Commande B : 12 Vary Anana (réservé)
  * Commande C : 11 Vary Anana (réservé)
- Total réservé : 10 + 12 + 11 = 33

Stock réel disponible = 35 - 33 = 2 ✅

C'EST NORMAL ! Le système protège contre la survente.

QUAND AFFICHER 34 OU 35 ?
Quand les commandes en cours seront :
- Soit PAYÉES (stock décrémenté, réservation supprimée)
- Soit ANNULÉES (réservation supprimée)
- Soit EXPIRÉES > 15 min (réservation supprimée auto)
*/
