-- =====================================================
-- Professional Sample Menu Data (Idempotent Version)
-- Populates categories and items for the employer
-- =====================================================

DO $$
DECLARE
    v_employer_id UUID;
    v_cat_appetizers UUID;
    v_cat_main UUID;
    v_cat_desserts UUID;
    v_cat_beverages UUID;
BEGIN
    -- 1. Use the explicit employer ID provided
    v_employer_id := 'db6263fb-2874-4942-adaa-ecde48ef6ccf';

    IF v_employer_id IS NULL THEN
        RAISE NOTICE 'Employer ID not valid.';
        RETURN;
    END IF;

    -- 2. Create Categories (Using ON CONFLICT to avoid duplicates)
    INSERT INTO menu_categories (employer_id, name, description, display_order)
    VALUES 
        (v_employer_id, 'Appetizers', 'Start your meal with our delicious starters', 1),
        (v_employer_id, 'Main Course', 'Hearty and satisfying primary dishes', 2),
        (v_employer_id, 'Desserts', 'Sweet treats to end your perfect meal', 3),
        (v_employer_id, 'Beverages', 'Refreshing drinks and spirits', 4)
    ON CONFLICT (employer_id, name) DO UPDATE SET 
        description = EXCLUDED.description,
        display_order = EXCLUDED.display_order;

    -- 3. Get Category IDs
    SELECT id INTO v_cat_appetizers FROM menu_categories WHERE employer_id = v_employer_id AND name = 'Appetizers' LIMIT 1;
    SELECT id INTO v_cat_main FROM menu_categories WHERE employer_id = v_employer_id AND name = 'Main Course' LIMIT 1;
    SELECT id INTO v_cat_desserts FROM menu_categories WHERE employer_id = v_employer_id AND name = 'Desserts' LIMIT 1;
    SELECT id INTO v_cat_beverages FROM menu_categories WHERE employer_id = v_employer_id AND name = 'Beverages' LIMIT 1;

    -- 4. Insert Menu Items (Using name + category check to avoid duplicates)
    
    -- Appetizers
    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE category_id = v_cat_appetizers AND name = 'Crispy Spring Rolls') THEN
        INSERT INTO menu_items (category_id, name, description, price, ingredients, quantity, unit, image_url)
        VALUES (v_cat_appetizers, 'Crispy Spring Rolls', 'Vegetable filled crispy rolls served with sweet chili sauce', 12.50, 'Vegetables, Wheat, Soy', 4, 'pcs', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE category_id = v_cat_appetizers AND name = 'Honey Garlic Wings') THEN
        INSERT INTO menu_items (category_id, name, description, price, ingredients, quantity, unit, image_url)
        VALUES (v_cat_appetizers, 'Honey Garlic Wings', 'Tender wings glazed in a sticky honey garlic sauce', 15.00, 'Chicken, Honey, Garlic, Sesame', 8, 'pcs', 'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?auto=format&fit=crop&q=80&w=400');
    END IF;

    -- Main Course
    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE category_id = v_cat_main AND name = 'Grilled Ribeye Steak') THEN
        INSERT INTO menu_items (category_id, name, description, price, ingredients, quantity, unit, image_url)
        VALUES (v_cat_main, 'Grilled Ribeye Steak', 'Premium ribeye grilled to your liking with garlic butter', 34.00, 'Beef, Butter, Herbs', 300, 'g', 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=400');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE category_id = v_cat_main AND name = 'Wild Mushroom Risotto') THEN
        INSERT INTO menu_items (category_id, name, description, price, ingredients, quantity, unit, image_url)
        VALUES (v_cat_main, 'Wild Mushroom Risotto', 'Creamy Arborio rice with assorted wild mushrooms and truffle oil', 22.00, 'Arborio Rice, Mushrooms, Cream, Truffle Oil', 450, 'g', 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&q=80&w=400');
    END IF;

    -- Desserts
    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE category_id = v_cat_desserts AND name = 'Chocolate Lava Cake') THEN
        INSERT INTO menu_items (category_id, name, description, price, ingredients, quantity, unit, image_url)
        VALUES (v_cat_desserts, 'Chocolate Lava Cake', 'Warm chocolate cake with a gooey center served with vanilla ice cream', 9.50, 'Cocoa, Egg, Flour, Sugar, Vanilla', 1, 'serving', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=400');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE category_id = v_cat_desserts AND name = 'Classic New York Cheesecake') THEN
        INSERT INTO menu_items (category_id, name, description, price, ingredients, quantity, unit, image_url)
        VALUES (v_cat_desserts, 'Classic New York Cheesecake', 'Creamy cheesecake on a graham cracker crust with berry compote', 10.50, 'Cream Cheese, Graham Cracker, Berries', 200, 'g', 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=400');
    END IF;

    -- Beverages
    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE category_id = v_cat_beverages AND name = 'Classic Mojito') THEN
        INSERT INTO menu_items (category_id, name, description, price, ingredients, quantity, unit, image_url)
        VALUES (v_cat_beverages, 'Classic Mojito', 'Fresh lime, mint, and white rum topped with soda', 11.00, 'Mint, Lime, Rum, Soda', 350, 'ml', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE category_id = v_cat_beverages AND name = 'Mango Lassi') THEN
        INSERT INTO menu_items (category_id, name, description, price, ingredients, quantity, unit, image_url)
        VALUES (v_cat_beverages, 'Mango Lassi', 'Traditional Indian yogurt-based drink with mango', 6.00, 'Yogurt, Mango, Sugar', 400, 'ml', 'https://images.unsplash.com/photo-1571006682823-3f173b22e703?auto=format&fit=crop&q=80&w=400');
    END IF;

    RAISE NOTICE 'Sample menu data setup complete.';
END $$;
