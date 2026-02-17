-- =====================================================
-- CLEANUP SCRIPT - Run this FIRST to reset database
-- =====================================================

-- Drop all tables in reverse order (to handle foreign key dependencies)
-- Using CASCADE to force drop even with dependencies
DROP TABLE IF EXISTS employee_invitations CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS bill_items CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS restaurant_tables CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;

-- Drop triggers (these might fail if tables don't exist, that's OK)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_bill_total_trigger ON bill_items;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_bill_total() CASCADE;

-- Drop all policies on profiles table
DROP POLICY IF EXISTS "View own or managed profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Note: We're NOT dropping the profiles table to preserve user data
-- If you want a complete reset including profiles, uncomment the line below:
-- DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- CLEANUP COMPLETE - Now run 01_initial_schema.sql
-- =====================================================
