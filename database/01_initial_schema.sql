-- =====================================================
-- Restaurant Management System - Database Schema
-- Phase 1: Initial Setup
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE (Extend existing or create new)
-- =====================================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  website TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns for restaurant management
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employee' 
  CHECK (role IN ('admin', 'employer', 'employee'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS restaurant_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "View own or managed profiles" ON profiles;

-- Create new policies
CREATE POLICY "View own or managed profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id OR 
    employer_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- =====================================================
-- 2. MENU CATEGORIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers manage their menu categories"
  ON menu_categories FOR ALL
  USING (employer_id = auth.uid());

CREATE POLICY "Employees view employer menu categories"
  ON menu_categories FOR SELECT
  USING (
    employer_id IN (
      SELECT employer_id FROM profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- 3. MENU ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  is_available BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers manage their menu items"
  ON menu_items FOR ALL
  USING (
    category_id IN (
      SELECT id FROM menu_categories WHERE employer_id = auth.uid()
    )
  );

CREATE POLICY "Employees view employer menu items"
  ON menu_items FOR SELECT
  USING (
    category_id IN (
      SELECT mc.id FROM menu_categories mc
      JOIN profiles p ON p.employer_id = mc.employer_id
      WHERE p.id = auth.uid()
    )
  );

-- =====================================================
-- 4. RESTAURANT TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  table_number INTEGER NOT NULL,
  capacity INTEGER DEFAULT 4 CHECK (capacity > 0),
  assigned_employee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employer_id, table_number)
);

ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers manage their tables"
  ON restaurant_tables FOR ALL
  USING (employer_id = auth.uid());

CREATE POLICY "Employees view assigned tables"
  ON restaurant_tables FOR SELECT
  USING (
    assigned_employee_id = auth.uid() OR
    employer_id IN (SELECT employer_id FROM profiles WHERE id = auth.uid())
  );

-- =====================================================
-- 5. BILLS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES restaurant_tables(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  employer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  total_amount DECIMAL(10,2) DEFAULT 0 CHECK (total_amount >= 0),
  tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
  grand_total DECIMAL(10,2) DEFAULT 0 CHECK (grand_total >= 0),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'paid', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees manage their bills"
  ON bills FOR ALL
  USING (employee_id = auth.uid());

CREATE POLICY "Employers view all bills"
  ON bills FOR SELECT
  USING (employer_id = auth.uid());

-- =====================================================
-- 6. BILL ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE RESTRICT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bill items follow bill policies"
  ON bill_items FOR ALL
  USING (
    bill_id IN (
      SELECT id FROM bills WHERE employee_id = auth.uid()
    )
  );

CREATE POLICY "Employers view all bill items"
  ON bill_items FOR SELECT
  USING (
    bill_id IN (
      SELECT id FROM bills WHERE employer_id = auth.uid()
    )
  );

-- =====================================================
-- 7. MESSAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Receivers can update read status"
  ON messages FOR UPDATE
  USING (receiver_id = auth.uid());

-- =====================================================
-- 8. EMPLOYEE INVITATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE employee_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers manage invitations"
  ON employee_invitations FOR ALL
  USING (employer_id = auth.uid());

-- =====================================================
-- 9. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, website, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    '',
    '',
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update bill total
CREATE OR REPLACE FUNCTION update_bill_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bills
  SET 
    total_amount = (
      SELECT COALESCE(SUM(subtotal), 0)
      FROM bill_items
      WHERE bill_id = COALESCE(NEW.bill_id, OLD.bill_id)
    ),
    tax_amount = (
      SELECT COALESCE(SUM(subtotal), 0) * 0.05
      FROM bill_items
      WHERE bill_id = COALESCE(NEW.bill_id, OLD.bill_id)
    ),
    grand_total = (
      SELECT COALESCE(SUM(subtotal), 0) * 1.05
      FROM bill_items
      WHERE bill_id = COALESCE(NEW.bill_id, OLD.bill_id)
    )
  WHERE id = COALESCE(NEW.bill_id, OLD.bill_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update bill total when items change
DROP TRIGGER IF EXISTS update_bill_total_trigger ON bill_items;
CREATE TRIGGER update_bill_total_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bill_items
  FOR EACH ROW EXECUTE FUNCTION update_bill_total();

-- =====================================================
-- 10. SET CURRENT USER AS ADMIN (for testing)
-- =====================================================

-- Update the current user to admin role
-- Replace with actual user email
UPDATE profiles 
SET role = 'admin', restaurant_name = 'System Admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'sarojofficialsrj@gmail.com'
);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
