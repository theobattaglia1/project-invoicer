-- Add performance indexes for Supabase tables

-- Indexes for budgets table
CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budgets_created_at ON budgets(created_at DESC);

-- Indexes for budget_items table
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_created_at ON budget_items(created_at);

-- Indexes for user_artist_permissions table
CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON user_artist_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_artist_id ON user_artist_permissions(artist_id);
CREATE INDEX IF NOT EXISTS idx_permissions_composite ON user_artist_permissions(user_id, artist_id);

-- Indexes for user_profiles table
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_artist_id ON user_profiles(artist_id);

-- Indexes for pending_invites table
CREATE INDEX IF NOT EXISTS idx_pending_invites_email ON pending_invites(email);
CREATE INDEX IF NOT EXISTS idx_pending_invites_token ON pending_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_pending_invites_expires ON pending_invites(expires_at);

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_budgets_project_created ON budgets(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_created ON budget_items(budget_id, created_at);