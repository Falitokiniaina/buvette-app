-- ============================================
-- SCHEMA BASE DE DONNÉES BUVETTE GOSPEL v2.7
-- Application de gestion de commandes avec réservations temporaires
-- Date: 5 Décembre 2025
-- ============================================

-- ============================================
-- NETTOYAGE
-- ============================================
DROP TABLE IF EXISTS reservation_temporaire CASCADE;
DROP TABLE IF EXISTS commande_items CASCADE;
DROP TABLE IF EXISTS commandes CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS historique_stock CASCADE;
DROP TABLE IF EXISTS parametrage CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;

-- Supprimer les vues
DROP VIEW IF EXISTS v_stock_disponible CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS nettoyer_reservations_expirees() CASCADE;
DROP FUNCTION IF EXISTS supprimer_reservations(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS verifier_disponibilite_commande(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS decrementer_stock_commande() CASCADE;

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: articles
-- Stocke les produits disponibles à la vente
-- ============================================
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    prix DECIMAL(10, 2) NOT NULL CHECK (prix >= 0),
    stock_disponible INTEGER NOT NULL DEFAULT 0 CHECK (stock_disponible >= 0),
    actif BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour recherche rapide
CREATE INDEX idx_articles_actif ON articles(actif);
CREATE INDEX idx_articles_nom ON articles(nom);

COMMENT ON TABLE articles IS 'Articles disponibles à la vente avec stock et images';
COMMENT ON COLUMN articles.image_url IS 'URL de l''image (Unsplash ou autre hébergement externe)';

-- ============================================
-- TABLE: reservation_temporaire
-- Réservations temporaires lors du processus de paiement
-- Nouveau en v2.7 - Protection contre survente
-- ============================================
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

COMMENT ON TABLE reservation_temporaire IS 'Réservations temporaires d''articles lors du processus de paiement (v2.7)';
COMMENT ON COLUMN reservation_temporaire.nom_commande IS 'Nom de la commande pour laquelle les articles sont réservés';

-- ============================================
-- VUE: v_stock_disponible
-- Stock disponible réel = stock initial - réservations temporaires
-- Nouveau en v2.7
-- ============================================
CREATE OR REPLACE VIEW v_stock_disponible AS
SELECT 
    a.id,
    a.nom,
    a.description,
    a.prix,
    a.stock_disponible as stock_initial,
    COALESCE(SUM(rt.quantite), 0)::INTEGER as quantite_reservee,
    (a.stock_disponible - COALESCE(SUM(rt.quantite), 0))::INTEGER as stock_reel_disponible,
    a.image_url,
    a.actif,
    a.created_at,
    a.updated_at
FROM articles a
LEFT JOIN reservation_temporaire rt ON a.id = rt.article_id
GROUP BY a.id, a.nom, a.description, a.prix, a.stock_disponible, a.image_url, a.actif, a.created_at, a.updated_at;

COMMENT ON VIEW v_stock_disponible IS 'Vue du stock réel disponible (stock - réservations temporaires)';

-- ============================================
-- TABLE: commandes
-- Stocke les commandes des clients
-- ============================================
CREATE TABLE commandes (
    id SERIAL PRIMARY KEY,
    nom_commande VARCHAR(50) NOT NULL UNIQUE,
    statut VARCHAR(25) NOT NULL DEFAULT 'en_attente' 
        CHECK (statut IN ('en_attente', 'payee', 'livree', 'livree_partiellement', 'annulee')),
    montant_total DECIMAL(10, 2) DEFAULT 0 CHECK (montant_total >= 0),
    montant_paye DECIMAL(10, 2) DEFAULT 0 CHECK (montant_paye >= 0),
    montant_cb DECIMAL(10, 2) DEFAULT 0 CHECK (montant_cb >= 0),
    montant_especes DECIMAL(10, 2) DEFAULT 0 CHECK (montant_especes >= 0),
    montant_cheque DECIMAL(10, 2) DEFAULT 0 CHECK (montant_cheque >= 0),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_paiement TIMESTAMP,
    date_livraison TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour recherche rapide
CREATE INDEX idx_commandes_statut ON commandes(statut);
CREATE INDEX idx_commandes_nom ON commandes(LOWER(nom_commande));
CREATE INDEX idx_commandes_created ON commandes(created_at DESC);

COMMENT ON TABLE commandes IS 'Commandes des clients avec modes de paiement multiples';

-- ============================================
-- TABLE: commande_items
-- Articles d'une commande avec statut de livraison
-- ============================================
CREATE TABLE commande_items (
    id SERIAL PRIMARY KEY,
    commande_id INTEGER NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE RESTRICT,
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    prix_unitaire DECIMAL(10, 2) NOT NULL CHECK (prix_unitaire >= 0),
    est_livre BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_commande_article UNIQUE(commande_id, article_id)
);

-- Index pour recherche rapide
CREATE INDEX idx_items_commande ON commande_items(commande_id);
CREATE INDEX idx_items_article ON commande_items(article_id);
CREATE INDEX idx_items_livraison ON commande_items(est_livre);

COMMENT ON TABLE commande_items IS 'Articles d''une commande avec statut de livraison partielle';

-- ============================================
-- TABLE: historique_stock
-- Historique des mouvements de stock
-- ============================================
CREATE TABLE historique_stock (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    quantite_avant INTEGER NOT NULL,
    quantite_apres INTEGER NOT NULL,
    difference INTEGER NOT NULL,
    type_mouvement VARCHAR(50) NOT NULL,
    commande_id INTEGER REFERENCES commandes(id) ON DELETE SET NULL,
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour recherche rapide
CREATE INDEX idx_historique_article ON historique_stock(article_id);
CREATE INDEX idx_historique_date ON historique_stock(created_at DESC);
CREATE INDEX idx_historique_type ON historique_stock(type_mouvement);

COMMENT ON TABLE historique_stock IS 'Historique de tous les mouvements de stock';

-- ============================================
-- TABLE: parametrage
-- Paramètres de l'application
-- ============================================
CREATE TABLE parametrage (
    id SERIAL PRIMARY KEY,
    cle VARCHAR(100) NOT NULL UNIQUE,
    valeur TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Valeurs par défaut
INSERT INTO parametrage (cle, valeur, description) VALUES
('vente_ouverte', 'true', 'Autoriser la création de nouvelles commandes'),
('message_fermeture', 'Les ventes sont actuellement fermées.', 'Message affiché quand les ventes sont fermées');

COMMENT ON TABLE parametrage IS 'Paramètres de configuration de l''application';

-- ============================================
-- TABLE: utilisateurs
-- Comptes utilisateurs pour l'admin
-- ============================================
CREATE TABLE utilisateurs (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mot de passe par défaut: admin123
INSERT INTO utilisateurs (username, password_hash, role) VALUES
('admin', '$2b$10$YourHashHere', 'admin');

COMMENT ON TABLE utilisateurs IS 'Comptes utilisateurs pour accès admin';

-- ============================================
-- FONCTIONS SQL
-- ============================================

-- Fonction 1: Nettoyer les réservations expirées (> 30 minutes)
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

COMMENT ON FUNCTION nettoyer_reservations_expirees() IS 'Supprime les réservations de plus de 30 minutes';

-- Fonction 2: Supprimer les réservations d'une commande
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

COMMENT ON FUNCTION supprimer_reservations(VARCHAR) IS 'Supprime toutes les réservations d''une commande';

-- Fonction 3: Vérifier la disponibilité des articles d'une commande
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
        v.stock_reel_disponible,
        (v.stock_reel_disponible >= ci.quantite) as ok
    FROM commande_items ci
    JOIN articles a ON ci.article_id = a.id
    JOIN v_stock_disponible v ON a.id = v.id
    WHERE ci.commande_id = p_commande_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verifier_disponibilite_commande(INTEGER) IS 'Vérifie la disponibilité réelle des articles d''une commande';

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger 1: Décrémenter le stock automatiquement lors du paiement
CREATE OR REPLACE FUNCTION decrementer_stock_commande()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- Seulement si passage de "en_attente" à "payee"
    IF OLD.statut = 'en_attente' AND NEW.statut = 'payee' THEN
        FOR item IN 
            SELECT ci.article_id, ci.quantite, a.stock_disponible, a.nom
            FROM commande_items ci
            JOIN articles a ON ci.article_id = a.id
            WHERE ci.commande_id = NEW.id
        LOOP
            -- Vérifier stock suffisant
            IF item.stock_disponible < item.quantite THEN
                RAISE EXCEPTION 'Stock insuffisant pour %: disponible=%, demandé=%', 
                    item.nom, item.stock_disponible, item.quantite;
            END IF;
            
            -- Décrémenter le stock
            UPDATE articles 
            SET stock_disponible = stock_disponible - item.quantite
            WHERE id = item.article_id;
            
            -- Enregistrer dans l'historique
            INSERT INTO historique_stock (
                article_id, 
                quantite_avant, 
                quantite_apres, 
                difference,
                type_mouvement, 
                commande_id
            ) VALUES (
                item.article_id,
                item.stock_disponible,
                item.stock_disponible - item.quantite,
                -item.quantite,
                'vente',
                NEW.id
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrement_stock
    AFTER UPDATE ON commandes
    FOR EACH ROW
    WHEN (OLD.statut = 'en_attente' AND NEW.statut = 'payee')
    EXECUTE FUNCTION decrementer_stock_commande();

COMMENT ON FUNCTION decrementer_stock_commande() IS 'Décrémente automatiquement le stock lors du paiement d''une commande';

-- Trigger 2: Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commandes_updated_at BEFORE UPDATE ON commandes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parametrage_updated_at BEFORE UPDATE ON parametrage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONNÉES DE TEST (OPTIONNEL)
-- ============================================

-- Décommenter pour insérer des articles de test
/*
INSERT INTO articles (nom, description, prix, stock_disponible, image_url) VALUES
('Sandwich Jambon', 'Sandwich au jambon avec salade', 5.00, 50, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400'),
('Coca Cola', 'Canette 33cl', 2.00, 100, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400'),
('Eau Minérale', 'Bouteille 50cl', 1.50, 80, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400'),
('Assiette Nems', '6 nems avec salade', 8.00, 30, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400'),
('Saucisse Frites', 'Saucisse avec frites', 6.50, 40, 'https://images.unsplash.com/photo-1612392166886-ee4c0e0a836c?w=400');
*/

-- ============================================
-- VÉRIFICATIONS
-- ============================================

-- Vérifier que toutes les tables sont créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Vérifier que la vue existe
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';

-- Vérifier que les fonctions existent
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Test de la vue v_stock_disponible
SELECT * FROM v_stock_disponible LIMIT 1;

-- ============================================
-- PERMISSIONS (OPTIONNEL)
-- ============================================

-- Pour Supabase, les permissions sont gérées automatiquement
-- Si vous utilisez PostgreSQL standard, décommentez:
/*
GRANT ALL ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_user;
*/

-- ============================================
-- FIN DU SCHEMA v2.7
-- ============================================
-- Prochaines étapes:
-- 1. Exécuter ce script dans Supabase SQL Editor
-- 2. Vérifier que toutes les tables/vues/fonctions sont créées
-- 3. (Optionnel) Insérer vos articles existants
-- 4. Déployer le backend v2.7
-- 5. Tester le workflow complet
-- ============================================
