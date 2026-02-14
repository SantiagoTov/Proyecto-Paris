
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
        const CARTESIA_API_KEY = Deno.env.get('CARTESIA_API_KEY');

        if (!ELEVENLABS_API_KEY || !CARTESIA_API_KEY) {
            throw new Error("Missing API Keys for ElevenLabs or Cartesia");
        }

        // Fetch in parallel
        const [elevenResponse, cartesiaResponse] = await Promise.all([
            fetch('https://api.elevenlabs.io/v1/voices', {
                headers: { 'xi-api-key': ELEVENLABS_API_KEY }
            }),
            fetch('https://api.cartesia.ai/voices', {
                headers: {
                    'X-API-Key': CARTESIA_API_KEY,
                    'Cartesia-Version': '2024-06-10'
                }
            })
        ]);

        let elevenVoices: any[] = [];
        let cartesiaVoices: any[] = [];

        if (elevenResponse.ok) {
            const data = await elevenResponse.json();
            elevenVoices = data.voices || [];
        } else {
            console.error("ElevenLabs error:", await elevenResponse.text());
        }

        if (cartesiaResponse.ok) {
            // Cartesia returns array directly or inside data? Let's assume array or check structure.
            // Usually Cartesia returns simply a list or { data: [] }?
            // Documentation says GET /voices returns array of Voice objects.
            // Let's safe handle
            const data = await cartesiaResponse.json();
            cartesiaVoices = Array.isArray(data) ? data : (data.data || []);
        } else {
            console.error("Cartesia error:", await cartesiaResponse.text());
        }

        // Voces prioritarias solicitadas por usuario
        // Estas se añaden manualmente para asegurar que aparezcan
        // Nota: Si ya vienen de la API, podríamos tener duplicados, así que filtramos por ID luego si queremos ser estrictos
        const priorityVoices = [
            { id: 'b2htR0pMe28pYwCY9gnP', name: 'Voz ElevenLabs (Guido)', provider: 'elevenlabs', description: 'Voz personalizada', gender: 'Masculino', accent: 'Latino', tags: ['Premium'], previewUrl: null },
            { id: '86V9x9hrQds83qf7zaGn', name: 'Voz ElevenLabs (Santi)', provider: 'elevenlabs', description: 'Voz personalizada', gender: 'Masculino', accent: 'Latino', tags: ['Premium'], previewUrl: null }
        ];

        // Format voices to unified schema
        const formattedVoices = [
            ...priorityVoices,
            ...elevenVoices
                .filter((v: any) => !priorityVoices.some(p => p.id === v.voice_id)) // Evitar duplicados
                .map((v: any) => ({
                    id: v.voice_id,
                    name: v.name,
                    provider: 'elevenlabs',
                    description: v.description || v.labels?.description || 'ElevenLabs Voice',
                    previewUrl: v.preview_url,
                    gender: v.labels?.gender || 'Unknown',
                    accent: v.labels?.accent || 'Neutral',
                    tags: Object.values(v.labels || {}).filter(val => typeof val === 'string'),
                })),
            ...cartesiaVoices.map((v: any) => ({
                id: v.id,
                name: v.name,
                provider: 'cartesia',
                description: v.description || 'Cartesia Voice',
                previewUrl: null, // Cartesia doesn't provide static preview URL easily usually
                gender: 'Unknown', // Cartesia might not expose gender explicitly in listing without expanding
                accent: 'Unknown',
                tags: ['Fast', 'Low Latency'],
            }))
        ];

        return new Response(JSON.stringify(formattedVoices), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
