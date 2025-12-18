import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, action } = await req.json();
    
    if (!conversationId) {
      throw new Error("conversationId is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch conversation messages
    const { data: messages, error: msgError } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(50);

    if (msgError) throw msgError;

    // Fetch conversation details
    const { data: conversation, error: convError } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (convError) throw convError;

    // Build conversation text for AI
    const conversationText = messages
      ?.map(m => `[${m.direction === 'inbound' ? 'Cliente' : 'Noi'}]: ${m.content}`)
      .join("\n") || "";

    // Fetch menu for context
    const { data: products } = await supabase
      .from("products")
      .select("name, price, category")
      .eq("available", true);

    const menuContext = products
      ?.map(p => `- ${p.name} (${p.category}): €${p.price}`)
      .join("\n") || "";

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "extract_order") {
      systemPrompt = `Sei un assistente che estrae ordini da conversazioni WhatsApp per un ristorante di pesce.
Il menu disponibile è:
${menuContext}

Devi estrarre i dati dell'ordine dalla conversazione e restituirli in formato JSON.`;

      userPrompt = `Analizza questa conversazione e estrai l'ordine:

${conversationText}

Rispondi SOLO con un JSON valido in questo formato:
{
  "customer": {
    "name": "nome del cliente se menzionato",
    "phone": "${conversation.phone_number}"
  },
  "items": [
    {"name": "nome prodotto dal menu", "quantity": numero}
  ],
  "delivery_date": "data in formato YYYY-MM-DD se menzionata",
  "delivery_time": "orario se menzionato",
  "delivery_type": "ritiro o consegna",
  "notes": "eventuali note o richieste speciali"
}`;
    } else if (action === "summarize") {
      systemPrompt = `Sei un assistente che riassume conversazioni WhatsApp per un ristorante.
Fai riassunti concisi e utili in italiano.`;

      userPrompt = `Riassumi questa conversazione WhatsApp in modo conciso:

${conversationText}

Includi:
- Chi è il cliente (se noto)
- Cosa ha richiesto
- Eventuali dettagli importanti (date, orari, preferenze)
- Lo stato della conversazione (in attesa di risposta, conclusa, ecc.)`;
    } else if (action === "suggest_reply") {
      systemPrompt = `Sei un assistente per un ristorante di pesce chiamato "Mare Mio".
Suggerisci risposte professionali ma cordiali in italiano.
Il menu disponibile è:
${menuContext}`;

      userPrompt = `Basandoti su questa conversazione, suggerisci una risposta appropriata:

${conversationText}

La risposta deve essere:
- Cordiale e professionale
- In italiano
- Breve (massimo 2-3 frasi)
- Pertinente all'ultima richiesta del cliente`;
    } else {
      throw new Error("Invalid action. Use: extract_order, summarize, or suggest_reply");
    }

    console.log("[ParseWhatsAppOrder] Calling Lovable AI for action:", action);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ParseWhatsAppOrder] AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    console.log("[ParseWhatsAppOrder] AI response:", content);

    let result: any = { raw: content };

    // Parse JSON for extract_order action
    if (action === "extract_order") {
      try {
        // Extract JSON from response (might be wrapped in markdown code blocks)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("[ParseWhatsAppOrder] Failed to parse JSON:", e);
        result = { error: "Could not parse order", raw: content };
      }
    } else {
      result = { text: content };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[ParseWhatsAppOrder] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
