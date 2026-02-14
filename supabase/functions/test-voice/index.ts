import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ELEVENLABS_API_KEY = "sk_5460c7383b927c70dd848d183addaf4d88962258d781b51b";

serve(async (req) => {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { text, voice_id } = await req.json();

        if (!text) {
            return new Response(JSON.stringify({ error: "Falta el texto" }), { status: 400, headers: corsHeaders });
        }

        const voiceId = voice_id || "21m00Tcm4TlvDq8ikWAM"; // Default Rachel

        console.log(`Generating audio for text: "${text.substring(0, 50)}..." with voice: ${voiceId}`);

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                method: "POST",
                headers: {
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: text,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: { stability: 0.5, similarity_boost: 0.75 },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("ElevenLabs Error:", errorData);

            // Si es error de cuota o auth, intentar fallback a Rachel (si no era Rachel)
            if ((response.status === 401 || response.status === 402) && voiceId !== "21m00Tcm4TlvDq8ikWAM") {
                console.log("Retrying with fallback voice (Rachel)...");
                const fallbackResp = await fetch(
                    `https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`,
                    {
                        method: "POST",
                        headers: {
                            "xi-api-key": ELEVENLABS_API_KEY,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            text: text,
                            model_id: "eleven_multilingual_v2",
                            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
                        }),
                    }
                );

                if (fallbackResp.ok) {
                    const audioBuffer = await fallbackResp.arrayBuffer();
                    return new Response(audioBuffer, {
                        headers: { ...corsHeaders, "Content-Type": "audio/mpeg" }
                    });
                }
            }

            return new Response(JSON.stringify(errorData), {
                status: response.status,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const audioBuffer = await response.arrayBuffer();

        return new Response(audioBuffer, {
            headers: {
                ...corsHeaders,
                "Content-Type": "audio/mpeg",
                "Content-Length": audioBuffer.byteLength.toString()
            }
        });

    } catch (err) {
        console.error("Internal Error:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
