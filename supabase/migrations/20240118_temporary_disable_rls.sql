-- Temporarily disable RLS on user_profiles to allow profile setup
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Remove all policies that could cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Owners can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Owners can manage all profiles" ON user_profiles;