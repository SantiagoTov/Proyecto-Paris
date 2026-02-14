import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

// Helper to calculate grid points
function generateGrid(lat: number, lng: number, radiusKm: number): { lat: number; lng: number }[] {
  // Simple implementation: Just return the center for now to test flow. 
  // TODO: Implement actual grid subdivision logic (PostGIS or manual calc).
  // For a start, we can just do 1 point (center), effectively disabling grid but allowing the flow.
  // The user asked for grid, so let's add at least a 2x2 grid offset if radius is large.

  if (radiusKm < 1) return [{ lat, lng }];

  const offset = radiusKm * 0.009; // Approx degrees
  // Return center + 4 corners
  return [
    { lat, lng },
    { lat: lat + offset, lng: lng + offset },
    { lat: lat - offset, lng: lng - offset },
    { lat: lat + offset, lng: lng - offset },
    { lat: lat - offset, lng: lng + offset },
  ];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { keyword, lat, lng, radius } = await req.json();

    if (!keyword || !lat || !lng) {
      throw new Error("Missing parameters: keyword, lat, lng");
    }

    if (!SERPER_API_KEY) {
      throw new Error("Missing SERPER_API_KEY");
    }

    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    const gridPoints = generateGrid(lat, lng, radius || 2);
    console.log(`Searching grid with ${gridPoints.length} points for '${keyword}'...`);

    let allResults: any[] = [];

    // Parallel execution for grid (limit concurrency if needed)
    const promises = gridPoints.map(async (point, index) => {
      // 1. Check Cache
      // Simple cache check: rough lat/lng match + keyword. 
      // For POC, we skip complex geospatial cache lookup and just query Serper.
      // But we DO insert into cache later.

      const payload = {
        q: keyword,
        ll: `@${point.lat},${point.lng},${15 + index}`, // Slight zoom var? No, ll string format.
        num: 100, // The "Hack"
        hl: 'es',
        gl: 'co' // Assuming Colombia based on user interaction, should be dynamic ideally or parameter.
      };

      const response = await fetch('https://google.serper.dev/places', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      const places = data.places || [];

      // Cache this raw result
      await supabase.from('geo_intelligence_cache').insert({
        lat: point.lat,
        lng: point.lng,
        keyword,
        radius: radius || 1, // approximate
        results: places
      });

      return places;
    });

    const resultsArray = await Promise.all(promises);
    resultsArray.forEach(places => {
      allResults = [...allResults, ...places];
    });

    // Haversine formula to calculate distance in KM
    function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
      const R = 6371; // Radius of the earth in km
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    function deg2rad(deg: number) {
      return deg * (Math.PI / 180);
    }

    // Deduplicate and Filter by Distance
    const uniqueResultsMap = new Map();

    allResults.forEach(place => {
      const key = place.title + place.address;
      if (!uniqueResultsMap.has(key)) {
        // Calculate real distance from center center
        const distance = getDistance(lat, lng, place.latitude || lat, place.longitude || lng);

        // Stricter filtering: only keep if within radius + 10% buffer
        if (distance <= (radius || 5) * 1.1) {
          uniqueResultsMap.set(key, { ...place, distance_km: Math.round(distance * 10) / 10 });
        }
      }
    });

    const uniqueResults = Array.from(uniqueResultsMap.values());

    // Sort by distance
    uniqueResults.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

    // Status mapping
    const finalLeads = uniqueResults.map(place => {
      let status = 'cold';
      if (place.website) status = 'qualified';

      return {
        ...place,
        paris_status: status
      };
    });

    return new Response(JSON.stringify({
      success: true,
      total_found: finalLeads.length,
      leads: finalLeads
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
