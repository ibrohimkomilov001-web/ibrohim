-- Move "Televizor va video" (L0) under "Maishiy texnika" (L0)
-- This makes it a subcategory (L1) of Maishiy texnika

-- Step 1: Set parent_id and level for "Televizor va video"
UPDATE categories
SET parent_id = (
  SELECT id FROM categories
  WHERE slug = 'maishiy-texnika' AND level = 0
  LIMIT 1
),
level = 1
WHERE slug = 'televizor-va-video' AND level = 0;

-- Step 2: Update all children of "Televizor va video" to level 2
UPDATE categories
SET level = 2
WHERE parent_id = (
  SELECT id FROM categories
  WHERE slug = 'televizor-va-video' AND level = 1
  LIMIT 1
)
AND level = 1;

-- Verify the change
SELECT c.id, c.name_uz, c.level, p.name_uz AS parent_name
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
WHERE c.slug LIKE '%televizor%' OR c.name_uz LIKE '%Televizor%'
ORDER BY c.level;
