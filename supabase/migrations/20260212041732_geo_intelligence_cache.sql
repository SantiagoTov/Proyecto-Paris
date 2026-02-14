-- Create table for Geo-Intelligence Cache
CREATE TABLE IF NOT EXISTS public.geo_intelligence_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    keyword TEXT NOT NULL,
    radius INTEGER NOT NULL,
    results JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for faster geospatial queries
CREATE INDEX IF NOT EXISTS idx_geo_intelligence_cache_keyword ON public.geo_intelligence_cache (keyword);
CREATE INDEX IF NOT EXISTS idx_geo_intelligence_cache_lat_lng ON public.geo_intelligence_cache (lat, lng);

-- Enable Row Level Security (RLS)
ALTER TABLE public.geo_intelligence_cache ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read/write (since it's a backend cache mostly, but frontend might check it)
CREATE POLICY "Allow authenticated full access to geo_intelligence_cache"
ON public.geo_intelligence_cache
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow anon read access (optional, if public search allowed)
CREATE POLICY "Allow anon select on geo_intelligence_cache"
ON public.geo_intelligence_cache
FOR SELECT
TO anon
USING (true);
