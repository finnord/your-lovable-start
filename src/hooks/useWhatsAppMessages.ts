import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WhatsAppConversation {
  id: string;
  phone_number: string;
  customer_name: string | null;
  customer_id: string | null;
  last_message_at: string;
  unread_count: number;
  status: 'active' | 'archived' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  wa_message_id: string | null;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
}

export function useWhatsAppConversations() {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('[useWhatsAppConversations] Error:', error);
      toast.error('Errore nel caricamento delle conversazioni');
    } else {
      setConversations(data as WhatsAppConversation[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConversations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('whatsapp-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_conversations',
        },
        (payload) => {
          console.log('[useWhatsAppConversations] Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setConversations(prev => [payload.new as WhatsAppConversation, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setConversations(prev => {
              const updated = prev.map(c => 
                c.id === payload.new.id ? payload.new as WhatsAppConversation : c
              );
              // Re-sort by last_message_at
              return updated.sort((a, b) => 
                new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
              );
            });
          } else if (payload.eventType === 'DELETE') {
            setConversations(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations]);

  const markAsRead = async (conversationId: string) => {
    const { error } = await supabase
      .from('whatsapp_conversations')
      .update({ unread_count: 0 })
      .eq('id', conversationId);

    if (error) {
      console.error('[useWhatsAppConversations] Error marking as read:', error);
    }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return { conversations, loading, totalUnread, markAsRead, refetch: fetchConversations };
}

export function useWhatsAppMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[useWhatsAppMessages] Error:', error);
      toast.error('Errore nel caricamento dei messaggi');
    } else {
      setMessages(data as WhatsAppMessage[]);
    }
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();

    if (!conversationId) return;

    // Subscribe to realtime updates for this conversation
    const channel = supabase
      .channel(`whatsapp-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('[useWhatsAppMessages] Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new as WhatsAppMessage]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => 
              prev.map(m => m.id === payload.new.id ? payload.new as WhatsAppMessage : m)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages]);

  return { messages, loading, refetch: fetchMessages };
}

export function useWhatsAppAI() {
  const [loading, setLoading] = useState(false);

  const parseOrder = async (conversationId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-whatsapp-order', {
        body: { conversationId, action: 'extract_order' },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('[useWhatsAppAI] parseOrder error:', error);
      toast.error(error.message || 'Errore nell\'estrazione dell\'ordine');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const summarize = async (conversationId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-whatsapp-order', {
        body: { conversationId, action: 'summarize' },
      });

      if (error) throw error;
      return data?.text || null;
    } catch (error: any) {
      console.error('[useWhatsAppAI] summarize error:', error);
      toast.error(error.message || 'Errore nel riassunto');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const suggestReply = async (conversationId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-whatsapp-order', {
        body: { conversationId, action: 'suggest_reply' },
      });

      if (error) throw error;
      return data?.text || null;
    } catch (error: any) {
      console.error('[useWhatsAppAI] suggestReply error:', error);
      toast.error(error.message || 'Errore nel suggerimento');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { parseOrder, summarize, suggestReply, loading };
}
