import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  
  // Webhook verification (GET request from Meta)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
    
    console.log("[WhatsApp Webhook] Verification request:", { mode, token, challenge });
    
    if (mode === "subscribe" && token === verifyToken) {
      console.log("[WhatsApp Webhook] Verification successful");
      return new Response(challenge, { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" }
      });
    } else {
      console.error("[WhatsApp Webhook] Verification failed");
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }
  }

  // Handle incoming messages (POST request)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("[WhatsApp Webhook] Incoming webhook:", JSON.stringify(body, null, 2));

      // Validate webhook signature (optional but recommended)
      // const signature = req.headers.get("x-hub-signature-256");
      // TODO: Implement signature verification with WHATSAPP_APP_SECRET

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Process WhatsApp messages
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (value?.messages) {
        for (const message of value.messages) {
          const phoneNumber = message.from;
          const waMessageId = message.id;
          const timestamp = new Date(parseInt(message.timestamp) * 1000).toISOString();
          
          // Get or create conversation
          let { data: conversation, error: convError } = await supabase
            .from("whatsapp_conversations")
            .select("*")
            .eq("phone_number", phoneNumber)
            .single();

          if (convError && convError.code === "PGRST116") {
            // Conversation doesn't exist, create it
            const contactName = value.contacts?.[0]?.profile?.name || null;
            
            const { data: newConv, error: createError } = await supabase
              .from("whatsapp_conversations")
              .insert({
                phone_number: phoneNumber,
                customer_name: contactName,
                unread_count: 1,
                last_message_at: timestamp,
              })
              .select()
              .single();

            if (createError) {
              console.error("[WhatsApp Webhook] Error creating conversation:", createError);
              throw createError;
            }
            conversation = newConv;
            console.log("[WhatsApp Webhook] Created new conversation:", conversation.id);
          } else if (conversation) {
            // Update existing conversation
            await supabase
              .from("whatsapp_conversations")
              .update({
                unread_count: (conversation.unread_count || 0) + 1,
                last_message_at: timestamp,
              })
              .eq("id", conversation.id);
          }

          // Extract message content
          let content = "";
          let mediaUrl = null;
          let mediaType = null;

          if (message.type === "text") {
            content = message.text?.body || "";
          } else if (message.type === "image") {
            mediaType = "image";
            content = message.image?.caption || "[Immagine]";
            // Note: To get the actual media URL, you need to call the Media API
            // mediaUrl = await getMediaUrl(message.image.id);
          } else if (message.type === "audio") {
            mediaType = "audio";
            content = "[Audio]";
          } else if (message.type === "document") {
            mediaType = "document";
            content = message.document?.filename || "[Documento]";
          } else if (message.type === "location") {
            content = `[Posizione: ${message.location?.latitude}, ${message.location?.longitude}]`;
          }

          // Save message
          const { error: msgError } = await supabase
            .from("whatsapp_messages")
            .insert({
              conversation_id: conversation.id,
              direction: "inbound",
              content,
              media_url: mediaUrl,
              media_type: mediaType,
              wa_message_id: waMessageId,
              created_at: timestamp,
            });

          if (msgError) {
            console.error("[WhatsApp Webhook] Error saving message:", msgError);
            throw msgError;
          }

          console.log("[WhatsApp Webhook] Saved message from:", phoneNumber);
        }
      }

      // Handle status updates
      if (value?.statuses) {
        for (const status of value.statuses) {
          const waMessageId = status.id;
          const newStatus = status.status; // sent, delivered, read, failed

          await supabase
            .from("whatsapp_messages")
            .update({ status: newStatus })
            .eq("wa_message_id", waMessageId);

          console.log("[WhatsApp Webhook] Updated message status:", waMessageId, newStatus);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("[WhatsApp Webhook] Error processing webhook:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
