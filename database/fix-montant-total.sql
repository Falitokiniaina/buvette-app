-- ============================================
-- CORRECTION COMMANDES EXISTANTES
-- Recalcule le montant_total pour toutes les commandes
-- ============================================

-- Vérifier les commandes avec montant_total incorrect
SELECT 
  c.id,
  c.nom_commande,
  c.montant_total as montant_actuel,
  COALESCE(SUM(ci.quantite * ci.prix_unitaire), 0) as montant_calcule,
  c.statut
FROM commandes c
LEFT JOIN commande_items ci ON c.id = ci.commande_id
GROUP BY c.id, c.nom_commande, c.montant_total, c.statut
HAVING c.montant_total != COALESCE(SUM(ci.quantite * ci.prix_unitaire), 0)
ORDER BY c.created_at DESC;

-- Si des commandes sont incorrectes, exécuter:

-- Recalculer TOUS les montants pour commandes en attente
UPDATE commandes c
SET montant_total = (
  SELECT COALESCE(SUM(ci.quantite * ci.prix_unitaire), 0)
  FROM commande_items ci
  WHERE ci.commande_id = c.id
)
WHERE statut = 'en_attente';

-- Vérifier que tout est OK
SELECT 
  c.nom_commande,
  c.montant_total,
  COUNT(ci.id) as nb_items,
  c.statut
FROM commandes c
LEFT JOIN commande_items ci ON c.id = ci.commande_id
WHERE c.statut = 'en_attente'
GROUP BY c.id, c.nom_commande, c.montant_total, c.statut
ORDER BY c.created_at DESC;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================
-- Toutes les commandes en attente doivent avoir
-- montant_total = somme(quantite * prix_unitaire)
-- ============================================
