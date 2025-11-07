import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Smile, Paperclip, BarChart3, UserPlus } from "lucide-react";
import { MessageItem } from "./MessageItem";
import { InviteAlumniDialog } from "./InviteAlumniDialog";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles?: { full_name: string; avatar_url?: string };
}

interface ChatAreaProps {
  channelId: string;
}

export function ChatArea({ channelId }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`channel-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lounge_messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('lounge_messages')
      .select('*')
      .eq('channel_id', channelId)
      .is('parent_message_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    // Fetch profiles separately
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      
      const messagesWithProfiles = data.map(msg => ({
        ...msg,
        profiles: profileMap.get(msg.user_id)
      }));

      setMessages(messagesWithProfiles as Message[]);
    } else {
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if message mentions @AURA
      const mentionsAura = newMessage.includes("@AURA");

      const { error } = await supabase
        .from('lounge_messages')
        .insert({
          channel_id: channelId,
          user_id: user.id,
          content: newMessage,
        });

      if (error) throw error;

      // If AURA is mentioned, trigger AI response
      if (mentionsAura) {
        handleAuraResponse(newMessage);
      }

      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleAuraResponse = async (userMessage: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create a placeholder AURA message with special system user ID
      const placeholderMsg = await supabase.from('lounge_messages').insert({
        channel_id: channelId,
        user_id: '00000000-0000-0000-0000-000000000000', // Special AURA user ID
        content: '🤖 AURA is thinking...',
      }).select().single();

      // Stream AURA's response
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aura-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: userMessage }]
          }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error('Failed to get AURA response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              // Update message in real-time
              await supabase.from('lounge_messages')
                .update({ content: `🤖 AURA: ${fullResponse}` })
                .eq('id', placeholderMsg.data?.id);
            }
          } catch (e) {
            console.error('Failed to parse SSE:', e);
          }
        }
      }

      // Final update
      if (fullResponse && placeholderMsg.data?.id) {
        await supabase.from('lounge_messages')
          .update({ content: `🤖 AURA: ${fullResponse}` })
          .eq('id', placeholderMsg.data.id);
      }
    } catch (error) {
      console.error('Error getting AURA response:', error);
      toast({
        title: "Error",
        description: "Failed to get AURA response",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-3 border-b">
        <h3 className="font-semibold">Channel Discussion</h3>
        <InviteAlumniDialog channelId={channelId} />
      </div>
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4 pb-4">
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="mt-4 flex items-center gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message... (@AURA to ask the bot)"
          className="flex-1"
        />
        <Button size="icon" variant="ghost">
          <Smile className="w-5 h-5" />
        </Button>
        <Button size="icon" variant="ghost">
          <Paperclip className="w-5 h-5" />
        </Button>
        <Button 
          size="icon" 
          onClick={handleSendMessage}
          disabled={sending || !newMessage.trim()}
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
