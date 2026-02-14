-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    address TEXT,
    website TEXT,
    phone_number TEXT,
    category TEXT,
    status TEXT DEFAULT 'new', -- new, contacted, in_progress, qualified, lost, won
    email TEXT,
    rating FLOAT,
    reviews_count INTEGER,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own leads" 
    ON public.leads FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads" 
    ON public.leads FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" 
    ON public.leads FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" 
    ON public.leads FOR DELETE 
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
