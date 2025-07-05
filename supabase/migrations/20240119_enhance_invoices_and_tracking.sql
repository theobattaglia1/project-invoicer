-- Add invoice title and description for better organization
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS description TEXT;

-- Enhanced payment tracking
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS partial_payment_amount DECIMAL(10,2) DEFAULT 0;

-- Time tracking fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_hours DECIMAL(8,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS billable_hours DECIMAL(8,2) DEFAULT 0;

-- Create time_entries table for detailed time tracking
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    hours DECIMAL(6,2) NOT NULL,
    hourly_rate DECIMAL(10,2),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    billable BOOLEAN DEFAULT true,
    invoiced BOOLEAN DEFAULT false,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table for expense tracking
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    category TEXT, -- 'studio_rental', 'equipment', 'travel', 'materials', 'other'
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    billable BOOLEAN DEFAULT true,
    reimbursed BOOLEAN DEFAULT false,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create estimates table for quotes workflow
CREATE TABLE IF NOT EXISTS estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL, -- Will reference artists table
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    estimate_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'approved', 'rejected', 'expired'
    valid_until DATE,
    items JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    converted_to_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recurring_invoices table for automated billing
CREATE TABLE IF NOT EXISTS recurring_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL, -- Will reference artists table
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    frequency TEXT NOT NULL, -- 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
    start_date DATE NOT NULL,
    end_date DATE,
    next_invoice_date DATE NOT NULL,
    last_invoice_date DATE,
    items JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_billable ON time_entries(billable);
CREATE INDEX IF NOT EXISTS idx_time_entries_invoiced ON time_entries(invoiced);

CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_billable ON expenses(billable);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

CREATE INDEX IF NOT EXISTS idx_estimates_artist_id ON estimates(artist_id);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimates_created_at ON estimates(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recurring_invoices_artist_id ON recurring_invoices(artist_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_next_date ON recurring_invoices(next_invoice_date);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_active ON recurring_invoices(active);

-- Enable RLS on new tables
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for time_entries
CREATE POLICY "Users can view time entries for accessible projects" ON time_entries
    FOR SELECT USING (
        -- Users can see their own entries
        user_id = auth.uid() OR
        -- Owners can see all
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner') OR
        -- Team members with project access
        EXISTS (
            SELECT 1 FROM user_artist_permissions uap
            JOIN projects p ON p.artist_id::text = uap.artist_id
            WHERE uap.user_id = auth.uid() AND p.id = time_entries.project_id
        )
    );

CREATE POLICY "Users can manage their own time entries" ON time_entries
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Owners can manage all time entries" ON time_entries
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner')
    );

-- Add RLS policies for expenses (similar pattern)
CREATE POLICY "Users can view expenses for accessible projects" ON expenses
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner') OR
        EXISTS (
            SELECT 1 FROM user_artist_permissions uap
            JOIN projects p ON p.artist_id::text = uap.artist_id
            WHERE uap.user_id = auth.uid() AND p.id = expenses.project_id
        )
    );

CREATE POLICY "Users can manage their own expenses" ON expenses
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Owners can manage all expenses" ON expenses
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner')
    );

-- Add RLS policies for estimates
CREATE POLICY "Users can view estimates for accessible artists" ON estimates
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner') OR
        EXISTS (
            SELECT 1 FROM user_artist_permissions uap
            WHERE uap.user_id = auth.uid() AND uap.artist_id = estimates.artist_id::text
        )
    );

CREATE POLICY "Team can manage estimates" ON estimates
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('owner', 'editor', 'invoicer'))
    );

-- Add RLS policies for recurring invoices (similar to estimates)
CREATE POLICY "Users can view recurring invoices for accessible artists" ON recurring_invoices
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'owner') OR
        EXISTS (
            SELECT 1 FROM user_artist_permissions uap
            WHERE uap.user_id = auth.uid() AND uap.artist_id = recurring_invoices.artist_id::text
        )
    );

CREATE POLICY "Team can manage recurring invoices" ON recurring_invoices
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('owner', 'editor', 'invoicer'))
    );