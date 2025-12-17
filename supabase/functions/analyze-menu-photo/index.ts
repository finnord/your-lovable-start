import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, products } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Immagine richiesta' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('[analyze-menu-photo] LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key non configurata' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build product list for prompt
    const productList = products?.length > 0 
      ? products.map((p: { name: string; unit: string }) => `- ${p.name} (${p.unit})`).join('\n')
      : 'Nessun prodotto disponibile';

    console.log('[analyze-menu-photo] Analyzing image with', products?.length || 0, 'products');

    const prompt = `Sei un assistente specializzato nell'analisi di foto di menù natalizi compilati a mano.

PRODOTTI DISPONIBILI:
${productList}

ISTRUZIONI:
1. Analizza questa foto di un menù/ordine compilato a mano
2. Cerca segni di selezione: crocette (X), segni di spunta (✓), numeri scritti accanto ai prodotti, cerchi, sottolineature
3. Per ogni prodotto selezionato, identifica la quantità (se non specificata, usa 1)
4. Abbina i prodotti trovati ai nomi esatti nella lista sopra (usa fuzzy matching per errori di scrittura)

FORMATO RISPOSTA (SOLO JSON, nessun altro testo):
{
  "items": [
    { "product": "Nome Prodotto Esatto", "quantity": 1, "confidence": "high" },
    { "product": "Altro Prodotto", "quantity": 2, "confidence": "medium" }
  ],
  "notes": "Eventuali note o elementi non riconosciuti"
}

Confidence levels: "high" (chiaramente leggibile), "medium" (parzialmente leggibile), "low" (incerto)

Se non riesci a identificare prodotti, rispondi: { "items": [], "notes": "Nessun prodotto identificato" }`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: image }
              }
            ]
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[analyze-menu-photo] AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Troppo richieste, riprova tra poco' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crediti esauriti' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Errore analisi immagine' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('[analyze-menu-photo] Raw response:', content);

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Nessuna risposta dal modello' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      // Remove potential markdown code block
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      parsed = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('[analyze-menu-photo] JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          items: [], 
          notes: 'Errore parsing risposta: ' + content.substring(0, 200),
          raw: content
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[analyze-menu-photo] Parsed result:', parsed);

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[analyze-menu-photo] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Errore sconosciuto' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
