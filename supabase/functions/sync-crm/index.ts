import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Get the user from the authorization header
        const authHeader = req.headers.get('Authorization')!;
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !user) throw new Error("No autorizado");

        const { lead } = await req.json();

        // Fetch user's CRM integration
        const { data: integration, error: intError } = await supabase
            .from('user_crm_integrations')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

        if (intError || !integration) {
            throw new Error("No se encontró una configuración de CRM activa. Ve a Integraciones.");
        }

        console.log(`Sincronizando lead ${lead.title} para el usuario ${user.id} usando ${integration.crm_type}`);

        // Determine headers based on CRM type
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (integration.crm_type === 'hubspot' || integration.crm_type === 'twenty' || integration.crm_type === 'salesforce') {
            headers['Authorization'] = `Bearer ${integration.api_key}`;
        } else {
            // Default for custom/webhook
            headers['X-API-KEY'] = integration.api_key;
        }

        console.log(`Enviando a ${integration.api_url} con auth tipo ${integration.crm_type}`);

        // Harmonize lead data
        const title = lead.title || lead.name || 'Sin nombre';
        const phone = lead.phone_number || lead.phoneNumber || '';
        const website = lead.website || '';
        const address = lead.address || '';
        const category = lead.category || '';

        // Determine content mapping based on CRM type
        let bodyObj: any = lead;

        if (integration.crm_type === 'hubspot') {
            bodyObj = {
                properties: {
                    firstname: title.split(' ')[0],
                    lastname: title.split(' ').slice(1).join(' ') || 'Empresa',
                    website: website,
                    phone: phone,
                    address: address,
                    company: title
                }
            };
        } else if (integration.crm_type === 'twenty') {
            // Twenty CRM Company mapping
            bodyObj = {
                name: title,
                domainName: website.replace(/^https?:\/\//, '').split('/')[0],
                address: address,
                description: category
            };
        }

        const body = JSON.stringify(bodyObj);

        const response = await fetch(integration.api_url, {
            method: 'POST',
            headers,
            body
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error del CRM: ${errorText}`);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
