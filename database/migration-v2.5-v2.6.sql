-- ============================================
-- MIGRATION v2.5 → v2.6
-- Livraison Partielle + Mots de Passe
-- ============================================

-- 1. Ajouter statut 'livree_partiellement' si pas déjà fait
ALTER TABLE commandes 
DROP CONSTRAINT IF EXISTS commandes_statut_check;

ALTER TABLE commandes 
ADD CONSTRAINT commandes_statut_check 
CHECK (statut IN ('en_attente', 'payee', 'livree', 'livree_partiellement', 'annulee'));

-- 2. Ajouter colonne est_livre aux commande_items si pas déjà fait
ALTER TABLE commande_items 
ADD COLUMN IF NOT EXISTS est_livre BOOLEAN DEFAULT FALSE;

-- 3. Ajouter les mots de passe dans parametrage
INSERT INTO parametrage (cle, valeur_texte, description) VALUES
    ('mot_de_passe_admin', 'FPMA123456', 'Mot de passe pour accéder à la page admin'),
    ('mot_de_passe_caisse', 'FPMA123', 'Mot de passe pour accéder à la page caisse'),
    ('mot_de_passe_preparateur', 'FPMA1234', 'Mot de passe pour accéder à la page préparateur')
ON CONFLICT (cle) DO NOTHING;

-- 4. Vérification
SELECT * FROM parametrage WHERE cle LIKE 'mot_de_passe%';

-- ✅ Migration terminée !
