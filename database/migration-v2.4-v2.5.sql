-- ============================================
-- MIGRATION v2.4 → v2.5
-- Ajouter la table parametrage sans supprimer les données existantes
-- ============================================

-- Note: Ce script peut être exécuté même si la table parametrage existe déjà
-- Il ne modifiera pas les données existantes

-- ============================================
-- 1. Créer la table parametrage (si elle n'existe pas)
-- ============================================
CREATE TABLE IF NOT EXISTS parametrage (
    id SERIAL PRIMARY KEY,
    cle VARCHAR(100) UNIQUE NOT NULL,
    valeur_texte TEXT,
    valeur_nombre DECIMAL(10, 2),
    valeur_boolean BOOLEAN,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. Créer l'index (si il n'existe pas)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_parametrage_cle ON parametrage(cle);

-- ============================================
-- 3. Créer le trigger (supprimer l'ancien si existe)
-- ============================================
DROP TRIGGER IF EXISTS update_parametrage_timestamp ON parametrage;

CREATE TRIGGER update_parametrage_timestamp
    BEFORE UPDATE ON parametrage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Insérer le paramètre vente_ouverte (si n'existe pas)
-- ============================================
INSERT INTO parametrage (cle, valeur_boolean, description) VALUES
    ('vente_ouverte', TRUE, 'Indique si la vente est ouverte aux clients')
ON CONFLICT (cle) DO NOTHING;

-- ============================================
-- 5. Vérification
-- ============================================
-- Afficher le paramètre créé
SELECT * FROM parametrage WHERE cle = 'vente_ouverte';

-- ============================================
-- SUCCÈS ! 🎉
-- La table parametrage est maintenant prête
-- ============================================

-- Pour tester :
-- SELECT * FROM parametrage;
-- 
-- Pour modifier :
-- UPDATE parametrage SET valeur_boolean = FALSE WHERE cle = 'vente_ouverte';
