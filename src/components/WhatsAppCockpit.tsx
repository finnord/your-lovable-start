import { useState } from 'react';
import { 
  MessageCircle, 
  X, 
  Search, 
  Send, 
  FileText, 
  Sparkles, 
  Reply,
  ChevronLeft,
  User,
  Clock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useWhatsAppConversations, 
  useWhatsAppMessages, 
  useWhatsAppAI,
  WhatsAppConversation 
} from '@/hooks/useWhatsAppMessages';
import { useOrderDraft } from '@/hooks/useOrderDraft';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateOrderDialog } from '@/components/order-draft';
import { toast } from 'sonner';

// Conversation list item
function ConversationItem({ 
  conversation, 
  isSelected, 
  onClick 
}: { 
  conversation: WhatsAppConversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 text-left transition-all duration-200 hover:bg-muted/50 border-b border-border/30",
        isSelected && "bg-primary/10 hover:bg-primary/15"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium truncate">
              {conversation.customer_name || conversation.phone_number}
            </span>
            {conversation.unread_count > 0 && (
              <Badge variant="default" className="text-xs px-1.5 py-0">
                {conversation.unread_count}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground truncate">
              {conversation.phone_number}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatDistanceToNow(new Date(conversation.last_message_at), { 
                addSuffix: true, 
                locale: it 
              })}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// Chat view with order draft integration
function ChatView({ 
  conversation, 
  onBack,
  orderDraft,
}: { 
  conversation: WhatsAppConversation;
  onBack: () => void;
  orderDraft: ReturnType<typeof useOrderDraft>;
}) {
  const { messages, loading: messagesLoading } = useWhatsAppMessages(conversation.id);
  const { parseOrder, summarize, suggestReply, loading: aiLoading } = useWhatsAppAI();
  const [inputValue, setInputValue] = useState('');
  const [summaryResult, setSummaryResult] = useState<string | null>(null);

  const handleParseOrder = async () => {
    const result = await parseOrder(conversation.id);
    if (result && !result.error) {
      // Use the centralized order draft system
      await orderDraft.importFromWhatsApp(
        {
          customer_name: result.customer?.name,
          customer_phone: result.customer?.phone || conversation.phone_number,
          items: result.items,
          delivery_date: result.delivery_date,
          delivery_time: result.delivery_time,
          delivery_type: result.delivery_type,
          notes: result.notes,
        },
        conversation.id,
        conversation.phone_number
      );
      toast.success('Ordine estratto! Verifica e conferma i dettagli.');
    } else if (result?.error) {
      toast.error(result.error);
    }
  };

  const handleSummarize = async () => {
    const result = await summarize(conversation.id);
    if (result) {
      setSummaryResult(result);
    }
  };

  const handleSuggestReply = async () => {
    const result = await suggestReply(conversation.id);
    if (result) {
      setInputValue(result);
      toast.success('Suggerimento aggiunto');
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    // TODO: Implement actual WhatsApp sending via API
    toast.info('Invio messaggi richiede configurazione WhatsApp Business API');
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border/50 flex items-center gap-3 bg-card/50">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">
            {conversation.customer_name || conversation.phone_number}
          </div>
          <div className="text-xs text-muted-foreground">
            {conversation.phone_number}
          </div>
        </div>
      </div>

      {/* AI Actions */}
      <div className="p-2 border-b border-border/30 flex gap-2 bg-muted/30">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs h-7 gap-1.5"
          onClick={handleParseOrder}
          disabled={aiLoading}
        >
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
          Estrai Ordine
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs h-7 gap-1.5"
          onClick={handleSummarize}
          disabled={aiLoading}
        >
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Riassumi
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs h-7 gap-1.5"
          onClick={handleSuggestReply}
          disabled={aiLoading}
        >
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Reply className="w-3 h-3" />}
          Suggerisci
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        {messagesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Nessun messaggio
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    msg.direction === 'outbound'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className={cn(
                    "text-xs mt-1 flex items-center gap-1",
                    msg.direction === 'outbound' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}>
                    <Clock className="w-3 h-3" />
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border/50 bg-card/50">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Scrivi un messaggio..."
            className="text-sm h-9"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button size="sm" className="h-9 px-3" onClick={handleSend}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Dialog */}
      <Dialog open={!!summaryResult} onOpenChange={() => setSummaryResult(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>📝 Riassunto Conversazione</DialogTitle>
          </DialogHeader>
          <p className="text-sm whitespace-pre-wrap">{summaryResult}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Main cockpit component
export function WhatsAppCockpit() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { conversations, loading, totalUnread, markAsRead } = useWhatsAppConversations();
  
  // Centralized order draft system
  const orderDraft = useOrderDraft();

  const filteredConversations = conversations.filter(c => 
    c.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone_number.includes(searchQuery)
  );

  const handleSelectConversation = (conv: WhatsAppConversation) => {
    setSelectedConversation(conv);
    if (conv.unread_count > 0) {
      markAsRead(conv.id);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full shadow-lg",
          "bg-[#25D366] hover:bg-[#20BD5A] transition-all duration-300",
          "flex items-center justify-center group hover:scale-105",
          "animate-scale-in"
        )}
      >
        <MessageCircle className="w-6 h-6 text-white" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse-subtle">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div 
          className={cn(
            "fixed bottom-24 right-6 z-50 w-[380px] h-[560px] rounded-xl shadow-2xl overflow-hidden",
            "bg-background border border-border/50",
            "animate-scale-in-bounce"
          )}
        >
          {/* Header */}
          <div className="bg-[#25D366] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">WhatsApp</h3>
                <p className="text-xs text-white/80">
                  {conversations.length} conversazioni
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          {selectedConversation ? (
            <ChatView 
              conversation={selectedConversation} 
              onBack={() => setSelectedConversation(null)}
              orderDraft={orderDraft}
            />
          ) : (
            <div className="flex flex-col h-[calc(100%-72px)]">
              {/* Search */}
              <div className="p-3 border-b border-border/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cerca conversazione..."
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Conversation list */}
              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-12">
                    {searchQuery ? 'Nessun risultato' : 'Nessuna conversazione'}
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isSelected={false}
                      onClick={() => handleSelectConversation(conv)}
                    />
                  ))
                )}
              </ScrollArea>

              {/* Info */}
              <div className="p-3 border-t border-border/30 bg-muted/30">
                <p className="text-xs text-muted-foreground text-center">
                  Configura WhatsApp Business API per inviare messaggi
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Order Dialog - Centralized */}
      <CreateOrderDialog
        open={orderDraft.isDialogOpen}
        draft={orderDraft.draft}
        products={orderDraft.products}
        isCreating={orderDraft.isCreating}
        onClose={orderDraft.clearDraft}
        onConfirm={orderDraft.createOrder}
        onUpdateDraft={orderDraft.updateDraft}
        onUpdateItem={orderDraft.updateItem}
        onToggleItemSelection={orderDraft.toggleItemSelection}
        onRemoveItem={orderDraft.removeItem}
      />
    </>
  );
}
