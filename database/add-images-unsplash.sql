-- ============================================
-- AJOUTER IMAGES UNSPLASH AUX ARTICLES
-- ============================================
-- À exécuter dans Supabase SQL Editor
-- Ajoute des images de qualité à tes articles

-- 1. Vérifier les articles existants
SELECT id, nom, image_url FROM articles ORDER BY nom;

-- 2. Ajouter images selon le type d'article

-- ASSIETTES / PLATS
UPDATE articles 
SET image_url = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'
WHERE LOWER(nom) LIKE '%assiette%' AND image_url IS NULL;

UPDATE articles 
SET image_url = 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80'
WHERE LOWER(nom) LIKE '%nems%' OR LOWER(nom) LIKE '%nem%' AND image_url IS NULL;

UPDATE articles 
SET image_url = 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80'
WHERE LOWER(nom) LIKE '%sambos%' OR LOWER(nom) LIKE '%samoussa%' AND image_url IS NULL;

UPDATE articles 
SET image_url = 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&q=80'
WHERE LOWER(nom) LIKE '%boulettes%' OR LOWER(nom) LIKE '%boulette%' AND image_url IS NULL;

UPDATE articles 
SET image_url = 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=400&q=80'
WHERE LOWER(nom) LIKE '%mofo%' AND image_url IS NULL;

UPDATE articles 
SET image_url = 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&q=80'
WHERE LOWER(nom) LIKE '%lasary%' OR LOWER(nom) LIKE '%salade%' AND image_url IS NULL;

-- SANDWICHES
UPDATE articles 
SET image_url = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'
WHERE LOWER(nom) LIKE '%sandwich%' AND image_url IS NULL;

-- SAUCISSES / HOT DOGS
UPDATE articles 
SET image_url = 'https://images.unsplash.com/photo-1612392166886-ee4c0e0a836c?w=400&q=80'
WHERE LOWER(nom) LIKE '%saucisse%' OR LOWER(nom) LIKE '%hot%dog%' AND image_url IS NULL;

-- FRITES
UPDATE articles 
SET image_url = 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80'
WHERE LOWER(nom) LIKE '%frites%' OR LOWER(nom) LIKE '%frite%' AND image_url IS NULL;

-- BOISSONS
UPDATE articles 
SET image_url = 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80'
WHERE LOWER(nom) LIKE '%coca%' OR LOWER(nom) LIKE '%cola%' AND image_url IS NULL;

UPDATE articles 
SET image_url = 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80'
WHERE LOWER(nom) LIKE '%orangina%' OR LOWER(nom) LIKE '%orange%' AND image_url IS NULL;

UPDATE articles 
SET image_url = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80'
WHERE LOWER(nom) LIKE '%ice tea%' OR LOWER(nom) LIKE '%thé%' AND image_url IS NULL;

UPDATE articles 
SET image_url = 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80'
WHERE LOWER(nom) LIKE '%eau%' OR LOWER(nom) LIKE '%water%' AND image_url IS NULL;

-- VIN
UPDATE articles 
SET image_url = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80'
WHERE LOWER(nom) LIKE '%vin%' OR LOWER(nom) LIKE '%wine%' AND image_url IS NULL;

-- IMAGE PAR DÉFAUT pour articles sans catégorie
UPDATE articles 
SET image_url = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80'
WHERE image_url IS NULL;

-- 3. Vérifier le résultat
SELECT 
    id, 
    nom, 
    CASE 
        WHEN image_url IS NOT NULL THEN '✅ Image OK'
        ELSE '❌ Pas d''image'
    END as statut,
    LEFT(image_url, 50) || '...' as url_preview
FROM articles
ORDER BY nom;

-- 4. Compter les articles avec/sans images
SELECT 
    COUNT(*) FILTER (WHERE image_url IS NOT NULL) as avec_image,
    COUNT(*) FILTER (WHERE image_url IS NULL) as sans_image,
    COUNT(*) as total
FROM articles;

-- ============================================
-- NOTES
-- ============================================
-- Ces images viennent d'Unsplash (gratuites et libres de droits)
-- ?w=400&q=80 = largeur 400px, qualité 80% (optimisé)
-- 
-- Pour personnaliser:
-- 1. Va sur https://unsplash.com
-- 2. Cherche ton image
-- 3. Copie l'URL
-- 4. UPDATE articles SET image_url = 'URL' WHERE nom = 'Article';
