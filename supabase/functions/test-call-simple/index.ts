
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const VAPI_API_KEY = "a8f95863-0885-4d3b-9060-de7af720b787";
const PHONE_NUMBER_ID = "657b8ef9-061c-4a64-b375-4711aef12aa3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { customerNumber, agentName } = await req.json();

        console.log("Iniciando llamada SIMPLE a:", customerNumber);

        const response = await fetch("https://api.vapi.ai/call", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${VAPI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                phoneNumberId: PHONE_NUMBER_ID,
                customer: { number: customerNumber },
                assistant: {
                    firstMessage: `Hola ${agentName || ""}, esta es una prueba de sistema de París Inteligencia Artificial.`,
                    model: {
                        provider: "openai",
                        model: "gpt-3.5-turbo",
                        messages: [{ role: "system", content: "Eres un asistente de prueba. Sé amable." }]
                    },
                    voice: {
                        provider: "cartesia",
                        voiceId: "248be419-c632-4f23-adf1-5324ed7dbf1d"
                    }
                }
            })
        });

        const data = await response.json();
        console.log("Vapi Status:", response.status);

        if (!response.ok) {
            throw new Error(`Vapi Error: ${JSON.stringify(data)}`);
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
