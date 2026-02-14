import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const VAPI_API_KEY = "a8f95863-0885-4d3b-9060-de7af720b787";
const VAPI_PHONE_NUMBER_ID = "657b8ef9-061c-4a64-b375-4711aef12aa3";
const WEBHOOK_URL = "https://njtsffqvpzuzgvvowmum.supabase.co/functions/v1/vapi-webhook";

// CONFIGURACIÓN DE VOCES
// Mapeamos los IDs del frontend a los IDs reales de ElevenLabs
const VOICE_CONFIG: { [key: string]: { voiceId: string, name: string } } = {
    // MUJERES
    // Nueva voz solicitada por usuario
    '86V9x9hrQds83qf7zaGn': { voiceId: '86V9x9hrQds83qf7zaGn', name: 'Carolina' },

    // Mantengo compatibilidad por si alguna llamada vieja usa el ID anterior, lo redirijo a la nueva voz o a Rachel
    '21m00Tcm4TlvDq8ikWAM': { voiceId: '86V9x9hrQds83qf7zaGn', name: 'Carolina' },

    'EXAVITQu4vr4xnSDxMaL': { voiceId: 'AZnzlk1XvdvUeBnXmlld', name: 'Valentina' }, // Domi

    // HOMBRES
    'TxGEqnHWrfWFTfGW9XjX': { voiceId: 'TxGEqnHWrfWFTfGW9XjX', name: 'Andres' }, // Josh
    'pNInz6obpgDQGcFmaJgB': { voiceId: 'ErXwobaYiN019PkySvjV', name: 'Santiago' }, // Antoni
};

// Configurar la nueva voz como default
const DEFAULT_VOICE = { voiceId: '86V9x9hrQds83qf7zaGn', name: 'Carolina' };

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }

    try {
        const {
            customerNumber,
            agentName,
            agentRole,
            agentInstructions,
            keyword,
            voiceId,
            gender,
            agentId
        } = await req.json();

        if (!customerNumber) {
            return new Response(
                JSON.stringify({ error: "Se requiere numero de destino" }),
                { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
            );
        }

        // Lógica robusta para selección de voz
        let voiceConfig = VOICE_CONFIG[voiceId];

        // Si no está en el mapa, y parece un ID válido de ElevenLabs, úsalo directo
        if (!voiceConfig) {
            if (voiceId && voiceId.length > 5) {
                voiceConfig = { voiceId: voiceId, name: agentName || "Agente" };
            } else {
                voiceConfig = DEFAULT_VOICE;
            }
        }

        const genderText = gender === 'Masculino' ? 'hombre' : 'mujer';

        // Prompt "CORPORATIVO BOGOTÁ"
        const systemPrompt = `Eres ${voiceConfig.name}, un asistente ejecutivo de alto nivel.

IDIOMA Y ACENTO:
- Hablas español latinoamericano neutro y profesional (estilo Bogotá/Internacional).
- Tu tono es educado, formal pero cercano.
- NUNCA uses jerga o modismos excesivos.
- Pronunciación clara y pausada.

ROL: ${agentRole || "ejecutivo de cuenta"}

OBJETIVO:
${agentInstructions || "Presenta tu propuesta de valor. Escucha al cliente. Si no hay interés, despídete amablemente y cuelga."}

REGLAS DE ORO:
1. NÚMEROS: Di los números dígito por dígito ("tres, uno, cero...").
2. PRECIOS: Di la moneda claramente ("pesos", "dólares").
3. ESCUCHA ACTIVA: Si el cliente habla, CÁLLATE inmediatamente (Vapi lo hará, pero mantén respuestas breves).
4. CIERRE: Si el cliente dice "no gracias", "no me interesa", "adiós" -> RESPONDE: "Entiendo, muchas gracias por su tiempo. Hasta luego." y CUELGA.
5. BUZÓN: Si detectas contestadora, CUELGA INMEDIATAMENTE.`.trim();

        console.log("Iniciando llamada a:", customerNumber);
        console.log("Voz:", voiceConfig.name, "ID:", voiceConfig.voiceId);

        const vapiRes = await fetch("https://api.vapi.ai/call", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${VAPI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                phoneNumberId: VAPI_PHONE_NUMBER_ID,
                customer: { number: customerNumber },
                // metadata: { agentId: agentId }, // Simplificamos metadata por si acaso
                assistant: {
                    name: agentName || "Agente París",
                    transcriber: {
                        provider: "deepgram",
                        model: "nova-2",
                        language: "es"
                    },
                    model: {
                        provider: "openai",
                        model: "gpt-3.5-turbo", // El modelo más barato y rápido
                        temperature: 0.7,
                        messages: [
                            { role: "system", content: systemPrompt }
                        ]
                    },
                    // Usamos Cartesia (Sonic) que es ultra rápido y estable
                    voice: {
                        provider: "cartesia",
                        voiceId: "248be419-c632-4f23-adf1-5324ed7dbf1d", // Voz femenina estándar en español
                    },
                    firstMessage: `Hola, habla ${agentName || "el asistente"}, de París Inteligencia Artificial, ¿con quién tengo el gusto?`,
                    stopSpeakingPlan: {
                        numWords: 0,
                        voiceSeconds: 0.2,
                        backoffSeconds: 1
                    },
                    voicemailDetection: {
                        provider: "twilio",
                        enabled: true
                    }
                },
            }),
        });

        const data = await vapiRes.json();
        console.log("Respuesta Vapi:", JSON.stringify(data));

        if (!vapiRes.ok) {
            console.error("Vapi error:", JSON.stringify(data));
            return new Response(
                JSON.stringify({ error: "Error al iniciar llamada", details: data }),
                { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, callId: data.id, status: data.status }),
            { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );

    } catch (e) {
        console.error("Error:", e);
        return new Response(
            JSON.stringify({ error: "Error interno del servidor" }),
            { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
    }
});
