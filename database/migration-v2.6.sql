-- ============================================
-- MIGRATION v2.5.x → v2.6
-- Ajout livraison partielle + mots de passe
-- ============================================

-- 1. Ajouter le nouveau statut 'livree_partiellement' à la contrainte CHECK
-- Note: PostgreSQL ne permet pas de modifier directement une contrainte CHECK
-- Il faut la supprimer et la recréer

ALTER TABLE commandes DROP CONSTRAINT IF EXISTS commandes_statut_check;

ALTER TABLE commandes ADD CONSTRAINT commandes_statut_check 
    CHECK (statut IN ('en_attente', 'payee', 'livree', 'livree_partiellement', 'annulee'));

-- 2. Ajouter le champ est_livre dans commande_items
ALTER TABLE commande_items ADD COLUMN IF NOT EXISTS est_livre BOOLEAN DEFAULT FALSE;

-- 3. Ajouter les mots de passe dans parametrage
INSERT INTO parametrage (cle, valeur_texte, description) VALUES
    ('mot_de_passe_admin', 'FPMA123456', 'Mot de passe pour accéder à la page admin'),
    ('mot_de_passe_caisse', 'FPMA123', 'Mot de passe pour accéder à la page caisse'),
    ('mot_de_passe_preparateur', 'FPMA1234', 'Mot de passe pour accéder à la page préparateur')
ON CONFLICT (cle) DO NOTHING;

-- 4. Vérification
SELECT 'Migration terminée !' as message;
SELECT * FROM parametrage WHERE cle LIKE 'mot_de_passe%';
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'commande_items' AND column_name = 'est_livre';
