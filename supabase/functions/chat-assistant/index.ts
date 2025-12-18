import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, image, products, history } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build the system prompt
    const menuList = products?.map((p: { name: string; price: number; unit: string }) => 
      `- ${p.name}: €${p.price}/${p.unit}`
    ).join('\n') || 'Menu non disponibile';

    const systemPrompt = `Sei l'assistente virtuale del ristorante Mare Mio, specializzato in pesce fresco.
Aiuti i clienti a:
1. Scegliere i piatti dal menù natalizio
2. Dare consigli per gruppi (es. "siamo in 6, cosa ordiniamo?")
3. Rispondere a domande su ingredienti e allergeni
4. Analizzare foto del menù compilato per estrarre gli ordini

MENÙ DISPONIBILE:
${menuList}

REGOLE IMPORTANTI:
- Rispondi SEMPRE in italiano
- Sii cordiale e disponibile come un vero cameriere
- Se il cliente chiede consigli, suggerisci piatti vari e bilanciati
- Se ricevi una foto, cerca di identificare i piatti segnati e le quantità
- Quando identifichi piatti dalla foto, restituisci anche un JSON con i piatti trovati

Se identifichi piatti da una foto o richiesta, alla fine della risposta aggiungi:
[ITEMS_JSON]{"items":[{"name":"Nome Piatto","quantity":1}]}[/ITEMS_JSON]`;

    // Build messages for the AI
    const messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add history
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current message with optional image
    if (image) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: message || 'Analizza questa foto del menù' },
          { type: 'image_url', image_url: { url: image } },
        ],
      });
    } else {
      messages.push({ role: 'user', content: message });
    }

    console.log('[chat-assistant] Sending request to AI gateway...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[chat-assistant] AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Troppe richieste, riprova tra poco',
          response: 'Mi dispiace, sono un po\' occupato. Riprova tra qualche secondo!' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || 'Mi dispiace, non ho capito. Puoi riprovare?';

    console.log('[chat-assistant] AI response received');

    // Extract items JSON if present
    let items: Array<{ name: string; quantity: number }> = [];
    const itemsMatch = aiResponse.match(/\[ITEMS_JSON\](.*?)\[\/ITEMS_JSON\]/s);
    if (itemsMatch) {
      try {
        const parsed = JSON.parse(itemsMatch[1]);
        items = parsed.items || [];
        // Remove the JSON from the visible response
        aiResponse = aiResponse.replace(/\[ITEMS_JSON\].*?\[\/ITEMS_JSON\]/s, '').trim();
      } catch (e) {
        console.error('[chat-assistant] Failed to parse items JSON:', e);
      }
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      items,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[chat-assistant] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      response: 'Mi dispiace, c\'è stato un problema tecnico. Riprova tra poco.',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
