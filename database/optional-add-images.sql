-- ============================================
-- SCRIPT OPTIONNEL : AJOUTER COLONNES IMAGES
-- ============================================
-- À exécuter dans Supabase SQL Editor si tu veux ajouter les images articles

-- 1. Ajouter les colonnes
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS image_data TEXT,
ADD COLUMN IF NOT EXISTS image_type VARCHAR(50);

-- 2. Vérifier que les colonnes existent
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'articles'
ORDER BY ordinal_position;

-- 3. (Optionnel) Ajouter des images par défaut pour certains articles
-- Remplace les URLs par tes vraies images si tu en as

-- Exemple:
-- UPDATE articles 
-- SET image_data = 'https://images.unsplash.com/photo-1...',
--     image_type = 'url'
-- WHERE nom = 'Sandwich';

-- 4. Vérifier le résultat
SELECT id, nom, 
       CASE 
           WHEN image_data IS NOT NULL THEN 'Image présente'
           ELSE 'Pas d''image'
       END as statut_image
FROM articles;

-- ============================================
-- NOTE
-- ============================================
-- Après avoir exécuté ce script, tu peux:
-- 1. Soit uploader des images via l'interface admin (si implémenté)
-- 2. Soit utiliser des URLs Unsplash comme avant
-- 3. Soit laisser NULL (articles sans images)
