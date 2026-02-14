# SOP: Telephony Provisioning

## 🎯 Objective
Zero-friction acquisition of phone numbers and binding to the AI agent.

## 🔄 Flow
1.  **Search:** User selects Country/Region in UI.
2.  **Query:** Backend queries Twilio API (`available_phone_numbers`).
3.  **Display:** Show list of numbers with capabilities (Voice required).
4.  **Purchase:** User confirms. Backend POSTs to Twilio `incoming_phone_numbers`.
5.  **Bind:**
    - Update the `voice_url` of the new number to point to the Vapi Inbound URL.
    - Store the `phone_sid` in Supabase `organizations` table.
6.  **Verify:** Make a test call (simulated) to ensure Vapi picks up.

## 🔗 Webhook Configuration
- **Inbound URL:** `https://api.vapi.ai/phone/twilio` (or via SIP trunking if configuring custom domain).
- **Status Callback:** Our backend endpoint to log call duration/status.
