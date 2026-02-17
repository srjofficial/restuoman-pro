-- =====================================================
-- Menu Enhancements Migration
-- Adds ingredients, quantity, and unit columns
-- =====================================================

-- Add columns to menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS ingredients TEXT;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS quantity DECIMAL(10,2);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS unit TEXT; -- e.g., 'kg', 'g', 'ml', 'pcs'

-- Comment on columns for clarity
COMMENT ON COLUMN menu_items.ingredients IS 'List of key ingredients or allergens';
COMMENT ON COLUMN menu_items.quantity IS 'Serving size quantity';
COMMENT ON COLUMN menu_items.unit IS 'Unit of measurement for the quantity (kg, g, ml, etc.)';

-- Add unique constraint to menu_categories to allow ON CONFLICT in scripts
ALTER TABLE menu_categories ADD CONSTRAINT menu_categories_employer_id_name_key UNIQUE (employer_id, name);
