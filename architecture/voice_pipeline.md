# SOP: Voice Pipeline (Real-Time)

## 🎯 Objective
Establish a low-latency (<600ms) full-duplex voice conversation with the user using Vapi.ai as the orchestrator.

## 🏗️ Architecture Stack
- **Orchestrator:** Vapi.ai (Handles VAD, Interruption/Barge-in, Telephony connection).
- **LLM (Brain):** Groq + Llama 3.1 (70b or 8b for speed).
- **TTS (Mouth):** Cartesia (Sonic) or ElevenLabs Turbo v2.5.
- **Transport:** WebSockets (VSIP/SIP).

## 🔄 Data Flow
1.  **Inbound/Outbound Call** initiates via Twilio.
2.  Twilio handshakes with **Vapi.ai**.
3.  Vapi send user audio to **STT** (Deepgram via Vapi default).
4.  Vapi sends text transcript to **Groq** (LLM).
5.  Groq streams text response back to Vapi.
6.  Vapi forwards text to **Cartesia** (TTS).
7.  Cartesia streams audio back to Vapi -> Twilio -> User.

## 🛑 Latency Guarantees
- **No HTTP Polling:** All connections must use persistent WebSockets where possible.
- **Region:** US-East (Virginia) for all servers to minimize speed of light headers.
- **Model:** Llama 3.1 on Groq is mandatory for TTFT (Time To First Token) < 200ms.

## ⚠️ Edge Cases
- **Silence:** If user is silent > 5s, Agent should "check in" ("¿Sigues ahí?").
- **Interruption:** Vapi "Barge-in" is enabled. If user speaks, TTS audio track MUST be cleared immediately.
