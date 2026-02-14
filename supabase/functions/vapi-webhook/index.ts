import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
    // CORS
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }

    try {
        const payload = await req.json();
        console.log("Webhook recibido:", JSON.stringify(payload).substring(0, 500));

        const { message } = payload;

        // Solo procesar eventos de fin de llamada
        if (message?.type === "end-of-call-report") {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            const callId = message.call?.id;
            const phoneNumber = message.call?.customer?.number;
            const transcript = message.transcript;
            const summary = message.summary;
            const durationSeconds = message.durationSeconds;
            const agentId = message.call?.metadata?.agentId;

            console.log("Guardando transcripción para llamada:", callId);

            const { error } = await supabase.from("call_transcripts").insert({
                call_id: callId,
                agent_id: agentId || null,
                phone_number: phoneNumber,
                transcript: transcript,
                summary: summary,
                duration_seconds: durationSeconds,
                status: message.endedReason || "completed"
            });

            if (error) {
                console.error("Error guardando transcripción:", error);
            } else {
                console.log("Transcripción guardada exitosamente");
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });

    } catch (e) {
        console.error("Error:", e);
        return new Response(JSON.stringify({ error: "Error procesando webhook" }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }
});
