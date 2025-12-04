-- ============================================
-- SCHEMA BASE DE DONNÉES BUVETTE GOSPEL
-- Application de gestion de commandes
-- ============================================

-- Supprimer les tables si elles existent (pour réinitialisation)
DROP TABLE IF EXISTS commande_items CASCADE;
DROP TABLE IF EXISTS commandes CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS historique_stock CASCADE;

-- Extension pour UUID (optionnel mais recommandé)
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

-- ============================================
-- TABLE: commandes
-- Stocke les commandes des clients
-- ============================================
CREATE TABLE commandes (
    id SERIAL PRIMARY KEY,
    nom_commande VARCHAR(50) NOT NULL UNIQUE,
    statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' 
        CHECK (statut IN ('en_attente', 'payee', 'livree', 'annulee')),
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

-- Index pour recherche rapide par statut
CREATE INDEX idx_commandes_statut ON commandes(statut);
CREATE INDEX idx_commandes_nom ON commandes(nom_commande);
CREATE INDEX idx_commandes_created ON commandes(created_at DESC);

-- ============================================
-- TABLE: commande_items
-- Détail des articles dans chaque commande
-- ============================================
CREATE TABLE commande_items (
    id SERIAL PRIMARY KEY,
    commande_id INTEGER NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE RESTRICT,
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    prix_unitaire DECIMAL(10, 2) NOT NULL CHECK (prix_unitaire >= 0),
    sous_total DECIMAL(10, 2) GENERATED ALWAYS AS (quantite * prix_unitaire) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(commande_id, article_id)
);

-- Index pour jointures rapides
CREATE INDEX idx_commande_items_commande ON commande_items(commande_id);
CREATE INDEX idx_commande_items_article ON commande_items(article_id);

-- ============================================
-- TABLE: historique_stock
-- Traçabilité des mouvements de stock
-- ============================================
CREATE TABLE historique_stock (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    commande_id INTEGER REFERENCES commandes(id) ON DELETE SET NULL,
    mouvement_type VARCHAR(20) NOT NULL CHECK (mouvement_type IN ('ajout', 'vente', 'correction', 'annulation')),
    quantite_avant INTEGER NOT NULL,
    quantite_apres INTEGER NOT NULL,
    quantite_mouvement INTEGER NOT NULL,
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_historique_article ON historique_stock(article_id);
CREATE INDEX idx_historique_commande ON historique_stock(commande_id);

-- ============================================
-- TRIGGER: Mise à jour automatique updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commandes_updated_at BEFORE UPDATE ON commandes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER: Calculer montant_total de la commande
-- ============================================
CREATE OR REPLACE FUNCTION update_commande_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE commandes
    SET montant_total = (
        SELECT COALESCE(SUM(sous_total), 0)
        FROM commande_items
        WHERE commande_id = NEW.commande_id
    )
    WHERE id = NEW.commande_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_commande_total 
    AFTER INSERT OR UPDATE OR DELETE ON commande_items
    FOR EACH ROW EXECUTE FUNCTION update_commande_total();

-- ============================================
-- TRIGGER: Décrémenter stock lors du paiement
-- ============================================
CREATE OR REPLACE FUNCTION decrementer_stock_paiement()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statut = 'payee' AND OLD.statut = 'en_attente' THEN
        -- Décrémenter le stock pour chaque article de la commande
        UPDATE articles a
        SET stock_disponible = stock_disponible - ci.quantite
        FROM commande_items ci
        WHERE ci.commande_id = NEW.id 
          AND ci.article_id = a.id;
        
        -- Enregistrer dans l'historique
        INSERT INTO historique_stock (article_id, commande_id, mouvement_type, quantite_avant, quantite_apres, quantite_mouvement, commentaire)
        SELECT 
            ci.article_id,
            NEW.id,
            'vente',
            a.stock_disponible + ci.quantite,
            a.stock_disponible,
            -ci.quantite,
            'Vente - Commande: ' || NEW.nom_commande
        FROM commande_items ci
        JOIN articles a ON a.id = ci.article_id
        WHERE ci.commande_id = NEW.id;
        
        -- Mettre à jour la date de paiement
        NEW.date_paiement = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_decrementer_stock 
    BEFORE UPDATE ON commandes
    FOR EACH ROW EXECUTE FUNCTION decrementer_stock_paiement();

-- ============================================
-- DONNÉES INITIALES: Articles du menu
-- ============================================
INSERT INTO articles (nom, description, prix, stock_disponible, actif, image_url) VALUES
    ('Box Salé', 'Assortiment savoureux de snacks salés', 5.00, 50, TRUE, 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=300&fit=crop'),
    ('Box Sucré', 'Délices sucrés et gourmands', 5.00, 50, TRUE, 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400&h=300&fit=crop'),
    ('Bagnat Catless', 'Sandwich niçois revisité', 8.00, 30, TRUE, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop'),
    ('Hot Dog + Frites', 'Hot dog gourmand avec frites croustillantes', 8.00, 40, TRUE, 'https://images.unsplash.com/photo-1612392062798-2907b67694fd?w=400&h=300&fit=crop'),
    ('Vary Anana', 'Riz sauté + saosisy gasy + boulettes maison', 8.00, 35, TRUE, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop'),
    ('Coca Cola', 'Boisson gazeuse', 1.00, 100, TRUE, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop'),
    ('Orangina', 'Boisson gazeuse à l''orange', 1.00, 100, TRUE, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop'),
    ('Ice Tea', 'Thé glacé', 1.00, 100, TRUE, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop'),
    ('Eau', 'Eau minérale', 1.00, 150, TRUE, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop');

-- ============================================
-- VUES UTILES POUR LES RAPPORTS
-- ============================================

-- Vue: Commandes avec détails
CREATE VIEW v_commandes_details AS
SELECT 
    c.id,
    c.nom_commande,
    c.statut,
    c.montant_total,
    c.montant_paye,
    c.created_at,
    c.date_paiement,
    c.date_livraison,
    COUNT(ci.id) as nombre_articles,
    SUM(ci.quantite) as quantite_totale
FROM commandes c
LEFT JOIN commande_items ci ON c.id = ci.commande_id
GROUP BY c.id;

-- Vue: Statistiques articles
CREATE VIEW v_stats_articles AS
SELECT 
    a.id,
    a.nom,
    a.prix,
    a.stock_disponible,
    COALESCE(SUM(ci.quantite), 0) as total_vendu,
    COALESCE(SUM(ci.sous_total), 0) as chiffre_affaires
FROM articles a
LEFT JOIN commande_items ci ON a.id = ci.article_id
LEFT JOIN commandes c ON ci.commande_id = c.id AND c.statut IN ('payee', 'livree')
GROUP BY a.id, a.nom, a.prix, a.stock_disponible;

-- ============================================
-- FONCTIONS UTILES
-- ============================================

-- Fonction: Vérifier disponibilité d'une commande
CREATE OR REPLACE FUNCTION verifier_disponibilite_commande(p_commande_id INTEGER)
RETURNS TABLE(article_id INTEGER, nom VARCHAR, demande INTEGER, disponible INTEGER, ok BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.nom,
        ci.quantite,
        a.stock_disponible,
        (a.stock_disponible >= ci.quantite) as ok
    FROM commande_items ci
    JOIN articles a ON ci.article_id = a.id
    WHERE ci.commande_id = p_commande_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Obtenir le récapitulatif d'une commande
CREATE OR REPLACE FUNCTION get_commande_recap(p_commande_id INTEGER)
RETURNS TABLE(
    article_nom VARCHAR, 
    quantite INTEGER, 
    prix_unitaire DECIMAL, 
    sous_total DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.nom,
        ci.quantite,
        ci.prix_unitaire,
        ci.sous_total
    FROM commande_items ci
    JOIN articles a ON ci.article_id = a.id
    WHERE ci.commande_id = p_commande_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANTS (Permissions)
-- À adapter selon vos besoins de sécurité
-- ============================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO buvette_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO buvette_app;

COMMENT ON TABLE articles IS 'Table des articles disponibles à la vente';
COMMENT ON TABLE commandes IS 'Table des commandes clients';
COMMENT ON TABLE commande_items IS 'Détail des articles par commande';
COMMENT ON TABLE historique_stock IS 'Historique des mouvements de stock';
