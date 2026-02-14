-- Create table for User CRM Integrations
CREATE TABLE IF NOT EXISTS public.user_crm_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    crm_type TEXT NOT NULL, -- 'twenty', 'hubspot', 'salesforce', etc.
    api_key TEXT NOT NULL,
    api_url TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, crm_type)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_crm_integrations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own integrations
CREATE POLICY "Users can manage their own crm integrations"
ON public.user_crm_integrations
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add index for user searching
CREATE INDEX IF NOT EXISTS idx_user_crm_integrations_user_id ON public.user_crm_integrations (user_id);
