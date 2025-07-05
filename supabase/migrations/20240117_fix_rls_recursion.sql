-- Fix the infinite recursion in user_profiles policies
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Owners can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Owners can manage all profiles" ON user_profiles;

-- Recreate without the recursive check
-- This policy allows owners to view all profiles without checking their own profile
CREATE POLICY "Owners can view all profiles" ON user_profiles
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM user_profiles WHERE role = 'owner'
        )
    );

-- This policy allows owners to manage all profiles
CREATE POLICY "Owners can manage all profiles" ON user_profiles
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM user_profiles WHERE role = 'owner' LIMIT 1
        )
    );

-- Also fix the other policies that might have similar issues
DROP POLICY IF EXISTS "Owners can manage all permissions" ON user_artist_permissions;
CREATE POLICY "Owners can manage all permissions" ON user_artist_permissions
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM user_profiles WHERE role = 'owner' LIMIT 1
        )
    );

DROP POLICY IF EXISTS "Owners can view all invites" ON pending_invites;
CREATE POLICY "Owners can view all invites" ON pending_invites
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM user_profiles WHERE role = 'owner' LIMIT 1
        )
    );

DROP POLICY IF EXISTS "Owners can manage all invites" ON pending_invites;
CREATE POLICY "Owners can manage all invites" ON pending_invites
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM user_profiles WHERE role = 'owner' LIMIT 1
        )
    );