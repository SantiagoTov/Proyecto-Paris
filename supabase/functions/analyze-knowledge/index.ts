
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // 1. Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. Parse Body
        const { text } = await req.json()

        // 3. Get API Key
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        if (!GEMINI_API_KEY) {
            throw new Error('Missing GEMINI_API_KEY');
        }

        // 4. Call Gemini
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        You are an AI Sales Expert.
        Analyze the following company description text and extract a list of MAIN PRODUCTS or SERVICES.
        
        TEXT TO ANALYZE:
        "${text}"

        INSTRUCTIONS:
        - Return ONLY a valid JSON object.
        - NO Markdown formatting (do not use \`\`\`json).
        - Structure: { "products": [{ "id": "1", "name": "Exact Name", "description": "Short sales description" }] }
        - If the text mentions specific products like "Radar", "Agents", or "CRM", extract them explicitly.
        `;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();

        // 5. Clean & Parse JSON
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(responseText);

        // 6. Return Success
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        // 7. Handle Errors Gracefully
        console.error("Error:", error);
        return new Response(JSON.stringify({
            error: error.message,
            products: [
                { id: "err1", name: "Error de Análisis", description: "Verifica la consola o intenta de nuevo." }
            ]
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
