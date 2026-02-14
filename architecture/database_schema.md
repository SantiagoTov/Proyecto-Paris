# SOP: Database Schema (Supabase)

## 🎯 Objective
Store persistent state for leads, campaigns, and call outcomes to build the "Intent Database".

## 🗄️ Tables

### `organizations`
- `id` (uuid)
- `name` (text)
- `twilio_sid` (text)
- `voice_settings` (jsonb)

### `campaigns`
- `id` (uuid)
- `org_id` (fk)
- `name` (text)
- `target_area` (jsonb: lat, lng, radius)
- `status` (active/paused/completed)

### `leads`
- `id` (uuid)
- `campaign_id` (fk)
- `business_name` (text)
- `phone` (text)
- `email` (text)
- `website` (text)
- `location` (geography)
- `enrichment_data` (jsonb: scraped info, owner name)
- `status` (new/contacted/converted/rejected)

### `interactions`
- `id` (uuid)
- `lead_id` (fk)
- `recording_url` (text)
- `transcription` (text)
- `summary` (text)
- `outcome` (jsonb: product_sold, pivot_data)
- `duration` (int)
- `cost` (float)

## 🔒 Security
- RLS (Row Level Security) enabled.
- Only Service Role can write to `interactions` logs mostly.
