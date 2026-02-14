# gemini.md - Project Map & Source of Truth

**Status:** 🟢 Protocol 0: Initialization
**Last Updated:** 2026-02-08

## 📌 Project Overview
**North Star:** Create an agentic ecosystem "Geo-Insight AI" that transforms geographical prospecting into real conversions (Sales/Appointments) and builds the largest purchase intention database on the market.
**Integrations:** 
- **AI/Logic:** Gemini 1.5 Flash (Identity/Scraping), Claude 3.5 Sonnet (Analysis/Logic).
- **Inference Engine (Voice):** Groq + Llama 3.1 (Low Latency <600ms).
- **Voice Orchestration:** Vapi.ai (WebSockets, VAD, Barge-in).
- **TTS:** Cartesia / ElevenLabs Turbo v2.5 (Streaming).
- **Telephony:** Twilio (Native Provisioning & Binding).
- **Data/Maps:** Serper.dev / Outscraper (Google Maps Grid Search), Firecrawl (Web Enrichment).
- **Database:** Supabase (PostgreSQL + JSONB + Storage for Recordings).
- **Delivery:** WhatsApp (Payment Links), ReportLab/Docupilot (PDF Quotes).
**Source of Truth:** 
- **Leads:** Google Maps (Location + Radius) enriched via Web Scraping.
- **Business Identity:** User-defined "DNA" (Value Prop, Pains, Services) analyzed by Gemini.
**Delivery Payload:** 
- **Immediate:** Payment Link (WhatsApp) or Dynamic Quote (PDF).
- **Long-term:** Structured "Intent Database" in Supabase (Lead Status, Purchase Patterns, Secondary Needs).
**Behavioral Rules:** 
- **Voice Persona:** Senior Sales Executive (Non-robotic, specific accent/tone).
- **Strategy:** "Pivot" capability (If Product A fails, detect need for Product B).
- **UX-First:** Intuitive "Command Center" feel for the user.

## 🛠️ Data Schema (JSON)

### Raw Input (Campaign Configuration)
```json
{
  "user_identity": {
    "business_name": "string",
    "value_proposition": "string",
    "pains_solved": ["string"],
    "services_gate": [
      { "id": "string", "name": "string", "description": "string" }
    ],
    "voice_settings": {
      "provider": "vapi | cartesia",
      "accent": "colombiano | mexicano | neutro",
      "tone": "formal | cercano | autoritario",
      "speed": 1.0
    }
  },
  "prospecting_target": {
    "center_coordinates": { "lat": number, "lng": number },
    "radius_km": number,
    "grid_resolution": "high | medium | low"
  }
}
```

### Processed Output (Lead Interaction Payload)
```json
{
  "lead_id": "uuid",
  "business_data": {
    "name": "string",
    "phone": "string",
    "email": "string",
    "website": "string",
    "decision_maker": "string | null",
    "buying_signals": ["string"]
  },
  "interaction_result": {
    "status": "converted | interested | meeting_booked | pivot_opportunity | rejected",
    "conversion_details": {
      "product_sold": "service_id | null",
      "payment_link_sent": boolean,
      "quote_pdf_generated": boolean
    },
    "pivot_data": {
      "original_pitch_rejected": boolean,
      "secondary_need_identified": "string | null"
    },
    "recording_url": "string",
    "cost_breakdown": {
      "cpa": number
    }
  }
}
```

## 📋 Maintenance Log
- **2026-02-08**: Initialized gemini.md
