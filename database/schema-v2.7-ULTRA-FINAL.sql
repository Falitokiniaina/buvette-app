-- ============================================
-- SCHEMA BASE DE DONNÉES BUVETTE GOSPEL v2.7 ULTRA-FINAL
-- Avec compatibilité mot_de_passe_preparation ET mot_de_passe_preparateur
-- Date: 6 Décembre 2025
-- ============================================

-- ============================================
-- NETTOYAGE COMPLET
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
DROP VIEW IF EXISTS v_commandes_details CASCADE;
DROP VIEW IF EXISTS v_stats_articles CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS nettoyer_reservations_expirees() CASCADE;
DROP FUNCTION IF EXISTS supprimer_reservations(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS verifier_disponibilite_commande(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS decrementer_stock_commande() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: articles
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

CREATE INDEX idx_articles_actif ON articles(actif);
CREATE INDEX idx_articles_nom ON articles(nom);

-- ============================================
-- TABLE: reservation_temporaire
-- ============================================
CREATE TABLE reservation_temporaire (
    id SERIAL PRIMARY KEY,
    nom_commande VARCHAR(100) NOT NULL,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_reservation UNIQUE(nom_commande, article_id)
);

CREATE INDEX idx_reservation_nom ON reservation_temporaire(nom_commande);
CREATE INDEX idx_reservation_article ON reservation_temporaire(article_id);
CREATE INDEX idx_reservation_created ON reservation_temporaire(created_at);

-- ============================================
-- VUE: v_stock_disponible
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

-- ============================================
-- TABLE: commandes
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

CREATE INDEX idx_commandes_statut ON commandes(statut);
CREATE INDEX idx_commandes_nom ON commandes(LOWER(nom_commande));
CREATE INDEX idx_commandes_created ON commandes(created_at DESC);

-- ============================================
-- TABLE: commande_items
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

CREATE INDEX idx_items_commande ON commande_items(commande_id);
CREATE INDEX idx_items_article ON commande_items(article_id);
CREATE INDEX idx_items_livraison ON commande_items(est_livre);

-- ============================================
-- VUE: v_commandes_details
-- ============================================
CREATE OR REPLACE VIEW v_commandes_details AS
SELECT 
    c.id,
    c.nom_commande,
    c.statut,
    c.montant_total,
    c.montant_paye,
    c.montant_cb,
    c.montant_especes,
    c.montant_cheque,
    c.created_at,
    c.date_paiement,
    c.date_livraison,
    COUNT(ci.id) as nb_articles,
    STRING_AGG(a.nom || ' x' || ci.quantite, ', ' ORDER BY a.nom) as articles_liste
FROM commandes c
LEFT JOIN commande_items ci ON c.id = ci.commande_id
LEFT JOIN articles a ON ci.article_id = a.id
GROUP BY c.id, c.nom_commande, c.statut, c.montant_total, c.montant_paye, 
         c.montant_cb, c.montant_especes, c.montant_cheque, 
         c.created_at, c.date_paiement, c.date_livraison
ORDER BY c.created_at DESC;

-- ============================================
-- VUE: v_stats_articles
-- ============================================
CREATE OR REPLACE VIEW v_stats_articles AS
SELECT 
    a.id,
    a.nom,
    a.prix,
    a.stock_disponible,
    a.actif,
    COALESCE(SUM(ci.quantite), 0)::INTEGER as total_vendu,
    COALESCE(SUM(ci.quantite * ci.prix_unitaire), 0)::DECIMAL(10,2) as chiffre_affaires,
    COUNT(DISTINCT c.id)::INTEGER as nb_commandes
FROM articles a
LEFT JOIN commande_items ci ON a.id = ci.article_id
LEFT JOIN commandes c ON ci.commande_id = c.id AND c.statut IN ('payee', 'livree', 'livree_partiellement')
GROUP BY a.id, a.nom, a.prix, a.stock_disponible, a.actif
ORDER BY total_vendu DESC;

-- ============================================
-- TABLE: historique_stock
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

CREATE INDEX idx_historique_article ON historique_stock(article_id);
CREATE INDEX idx_historique_date ON historique_stock(created_at DESC);
CREATE INDEX idx_historique_type ON historique_stock(type_mouvement);

-- ============================================
-- TABLE: parametrage
-- ============================================
CREATE TABLE parametrage (
    id SERIAL PRIMARY KEY,
    cle VARCHAR(100) NOT NULL UNIQUE,
    valeur TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ⭐ VALEURS PAR DÉFAUT AVEC DOUBLE COMPATIBILITÉ
INSERT INTO parametrage (cle, valeur, description) VALUES
('vente_ouverte', 'true', 'Autoriser la création de nouvelles commandes'),
('message_fermeture', 'Les ventes sont actuellement fermées.', 'Message affiché quand les ventes sont fermées'),
('mot_de_passe_admin', 'admin123', 'Mot de passe pour accéder à la page admin'),
('mot_de_passe_preparation', 'prep123', 'Mot de passe pour accéder à la page préparation'),
('mot_de_passe_preparateur', 'prep123', 'Mot de passe pour accéder à la page préparation (alias)'),
('mot_de_passe_caisse', 'caisse123', 'Mot de passe pour accéder à la page caisse');

-- ============================================
-- TABLE: utilisateurs
-- ============================================
CREATE TABLE utilisateurs (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO utilisateurs (username, password_hash, role) VALUES
('admin', '$2b$10$YourHashHere', 'admin');

-- ============================================
-- FONCTIONS SQL
-- ============================================

-- Fonction 1: Nettoyer les réservations expirées (15 minutes)
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

-- Fonction 3: Vérifier la disponibilité des articles
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

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Décrémenter le stock lors du paiement
CREATE OR REPLACE FUNCTION decrementer_stock_commande()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    IF OLD.statut = 'en_attente' AND NEW.statut = 'payee' THEN
        FOR item IN 
            SELECT ci.article_id, ci.quantite, a.stock_disponible, a.nom
            FROM commande_items ci
            JOIN articles a ON ci.article_id = a.id
            WHERE ci.commande_id = NEW.id
        LOOP
            IF item.stock_disponible < item.quantite THEN
                RAISE EXCEPTION 'Stock insuffisant pour %: disponible=%, demandé=%', 
                    item.nom, item.stock_disponible, item.quantite;
            END IF;
            
            UPDATE articles 
            SET stock_disponible = stock_disponible - item.quantite
            WHERE id = item.article_id;
            
            INSERT INTO historique_stock (
                article_id, quantite_avant, quantite_apres, difference,
                type_mouvement, commande_id
            ) VALUES (
                item.article_id, item.stock_disponible,
                item.stock_disponible - item.quantite, -item.quantite,
                'vente', NEW.id
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

-- Trigger: Mise à jour updated_at
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
-- DONNÉES: ARTICLES RÉELS
-- ============================================

INSERT INTO articles (nom, description, prix, stock_disponible, image_url, actif) VALUES
('Box Salé', 'Assortiment savoureux de snacks salés', 5.00, 50, 'https://raw.githubusercontent.com/Falitokiniaina/buvette-app/main/images/box_sale.jpg?w=400&h=300&fit=crop', TRUE),
('Box Sucré', 'Délices sucrés et gourmands', 5.00, 50, 'https://raw.githubusercontent.com/Falitokiniaina/buvette-app/main/images/box_sucre.jpg?w=400&h=300&fit=crop', TRUE),
('Bagnat Catless', 'Sandwich niçois revisité', 8.00, 30, 'https://raw.githubusercontent.com/Falitokiniaina/buvette-app/main/images/bagnat.jpg?w=400&h=300&fit=crop', TRUE),
('Hot Dog + Frites', 'Hot dog gourmand avec frites croustillantes', 8.00, 40, 'https://raw.githubusercontent.com/Falitokiniaina/buvette-app/main/images/hot_dog.jpg?w=400&h=300&fit=crop', TRUE),
('Vary Anana', 'Vary @anana + saosisy gasy + boulettes maison', 8.00, 35, 'https://raw.githubusercontent.com/Falitokiniaina/buvette-app/main/images/vary_anana.jpg?w=400&h=300&fit=crop', TRUE),
('Boisson', 'Cannette ou bouteille', 1.00, 150, 'https://raw.githubusercontent.com/Falitokiniaina/buvette-app/main/images/boisson.jpg?w=400&h=300&fit=crop', TRUE);

-- ============================================
-- VÉRIFICATIONS
-- ============================================

SELECT 'Tables créées:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT 'Vues créées:' as info;
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT 'Paramètres créés:' as info;
SELECT cle, valeur FROM parametrage ORDER BY cle;

SELECT 'Articles créés:' as info;
SELECT id, nom, prix, stock_disponible FROM articles ORDER BY prix, nom;

-- ============================================
-- FIN DU SCHEMA v2.7 ULTRA-FINAL
-- ============================================

-- RÉSUMÉ:
-- ✅ 7 tables créées
-- ✅ 3 vues créées (v_stock_disponible, v_commandes_details, v_stats_articles)
-- ✅ 3 fonctions créées
-- ✅ 3 triggers créés
-- ✅ 6 articles insérés (Box Salé, Box Sucré, Bagnat, Hot Dog, Vary Anana, Boisson)
-- ✅ 6 paramètres configurés (AVEC DOUBLE COMPATIBILITÉ preparateur/preparation)
-- ⭐ COMPATIBLE avec ancien ET nouveau code
-- ============================================
