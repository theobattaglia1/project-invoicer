-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_artist_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Owners can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Owners can manage all profiles" ON user_profiles;

DROP POLICY IF EXISTS "Users can view own permissions" ON user_artist_permissions;
DROP POLICY IF EXISTS "Owners can manage all permissions" ON user_artist_permissions;

DROP POLICY IF EXISTS "Owners can view all invites" ON pending_invites;
DROP POLICY IF EXISTS "Owners can manage all invites" ON pending_invites;

DROP POLICY IF EXISTS "Users can view budgets for accessible projects" ON budgets;
DROP POLICY IF EXISTS "Team members can manage budgets" ON budgets;

DROP POLICY IF EXISTS "Users can view budget items for accessible budgets" ON budget_items;
DROP POLICY IF EXISTS "Team members can manage budget items" ON budget_items;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Owners can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Owners can manage all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- User Artist Permissions Policies
CREATE POLICY "Users can view own permissions" ON user_artist_permissions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Owners can manage all permissions" ON user_artist_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- Pending Invites Policies (Owner only)
CREATE POLICY "Owners can view all invites" ON pending_invites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Owners can manage all invites" ON pending_invites
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- Budgets Policies (with proper type casting)
CREATE POLICY "Users can view budgets for accessible projects" ON budgets
    FOR SELECT USING (
        -- Owners can see all
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'owner'
        )
        OR
        -- Team members with permissions
        EXISTS (
            SELECT 1 FROM user_artist_permissions uap
            JOIN projects p ON p.artist_id::text = uap.artist_id
            WHERE uap.user_id = auth.uid() 
            AND p.id = budgets.project_id
        )
        OR
        -- Artists can see their own project budgets
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN projects p ON p.artist_id::text = up.artist_id
            WHERE up.id = auth.uid() 
            AND up.role = 'artist'
            AND p.id = budgets.project_id
        )
    );

CREATE POLICY "Team members can manage budgets" ON budgets
    FOR ALL USING (
        -- Owners can manage all
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'owner'
        )
        OR
        -- Editors with permission
        EXISTS (
            SELECT 1 FROM user_artist_permissions uap
            JOIN projects p ON p.artist_id::text = uap.artist_id
            JOIN user_profiles up ON up.id = auth.uid()
            WHERE uap.user_id = auth.uid() 
            AND p.id = budgets.project_id
            AND uap.permission = 'edit'
            AND up.role IN ('editor', 'invoicer')
        )
    );

-- Budget Items Policies
CREATE POLICY "Users can view budget items for accessible budgets" ON budget_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM budgets b
            WHERE b.id = budget_items.budget_id
            AND (
                -- Check if user can view the budget
                EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE id = auth.uid() AND role = 'owner'
                )
                OR
                EXISTS (
                    SELECT 1 FROM user_artist_permissions uap
                    JOIN projects p ON p.artist_id::text = uap.artist_id
                    WHERE uap.user_id = auth.uid() 
                    AND p.id = b.project_id
                )
                OR
                EXISTS (
                    SELECT 1 FROM user_profiles up
                    JOIN projects p ON p.artist_id::text = up.artist_id
                    WHERE up.id = auth.uid() 
                    AND up.role = 'artist'
                    AND p.id = b.project_id
                )
            )
        )
    );

CREATE POLICY "Team members can manage budget items" ON budget_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM budgets b
            WHERE b.id = budget_items.budget_id
            AND (
                -- Owners can manage all
                EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE id = auth.uid() AND role = 'owner'
                )
                OR
                -- Editors with permission
                EXISTS (
                    SELECT 1 FROM user_artist_permissions uap
                    JOIN projects p ON p.artist_id::text = uap.artist_id
                    JOIN user_profiles up ON up.id = auth.uid()
                    WHERE uap.user_id = auth.uid() 
                    AND p.id = b.project_id
                    AND uap.permission = 'edit'
                    AND up.role IN ('editor', 'invoicer')
                )
            )
        )
    );

-- Create function to check user permissions for an artist
CREATE OR REPLACE FUNCTION user_can_access_artist(artist_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND (
            role = 'owner' OR
            (role = 'artist' AND artist_id = artist_uuid::text)
        )
    ) OR EXISTS (
        SELECT 1 FROM user_artist_permissions
        WHERE user_id = auth.uid() AND artist_id = artist_uuid::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can edit artist
CREATE OR REPLACE FUNCTION user_can_edit_artist(artist_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'owner'
    ) OR EXISTS (
        SELECT 1 FROM user_artist_permissions
        WHERE user_id = auth.uid() 
        AND artist_id = artist_uuid::text
        AND permission = 'edit'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;