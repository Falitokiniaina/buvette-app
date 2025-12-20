-- ============================================
-- AJOUT PARAMÈTRES TITRES DES PAGES
-- ============================================
-- Ajouter les titres personnalisables pour chaque page

-- Titre page client (index.html)
INSERT INTO parametrage (cle, valeur, description) 
VALUES ('titre_page_client', 'Buvette Concert Gospel', 'Titre affiché sur la page de commande client')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, description = EXCLUDED.description;

-- Titre page caisse (caisse.html)
INSERT INTO parametrage (cle, valeur, description) 
VALUES ('titre_page_caisse', 'Caisse - Buvette Gospel', 'Titre affiché sur la page caisse')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, description = EXCLUDED.description;

-- Titre page préparateur (preparateur.html)
INSERT INTO parametrage (cle, valeur, description) 
VALUES ('titre_page_preparateur', 'Préparation des commandes', 'Titre affiché sur la page préparateur')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, description = EXCLUDED.description;

-- Titre page admin (admin.html)
INSERT INTO parametrage (cle, valeur, description) 
VALUES ('titre_page_admin', 'Administration - Buvette Gospel', 'Titre affiché sur la page administration')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, description = EXCLUDED.description;

-- Vérifier les paramètres ajoutés
SELECT cle, valeur, description FROM parametrage 
WHERE cle IN ('titre_page_client', 'titre_page_caisse', 'titre_page_preparateur', 'titre_page_admin')
ORDER BY cle;
