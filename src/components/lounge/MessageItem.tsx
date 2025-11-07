import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, ThumbsUp, Repeat2, Bookmark, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface MessageItemProps {
  message: {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    profiles?: { full_name: string; avatar_url?: string };
  };
}

export function MessageItem({ message }: MessageItemProps) {
  const [reactions, setReactions] = useState<{ [key: string]: number }>({});
  const [isSaved, setIsSaved] = useState(false);

  const handleReaction = async (emoji: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: message.id,
          user_id: user.id,
          emoji,
        });

      if (error && error.code !== '23505') {
        console.error('Error adding reaction:', error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isSaved) {
        await supabase
          .from('saved_messages')
          .delete()
          .eq('message_id', message.id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('saved_messages')
          .insert({
            message_id: message.id,
            user_id: user.id,
          });
      }
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const isAura = message.user_id === '00000000-0000-0000-0000-000000000000';
  const profileName = isAura ? "AURA" : (message.profiles?.full_name || "Unknown User");
  const initials = isAura ? "AI" : profileName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="group flex gap-3 hover:bg-muted/50 p-3 rounded-lg transition-colors">
      <Avatar className={cn("w-10 h-10", isAura && "bg-gradient-to-br from-primary to-accent")}>
        {!isAura && <AvatarImage src={message.profiles?.avatar_url} />}
        <AvatarFallback className={cn(isAura && "bg-transparent text-primary-foreground font-bold")}>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={cn("font-semibold text-sm", isAura && "bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent")}>{profileName}</span>
          {isAura && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">AI Assistant</span>}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        </div>
        
        <p className="text-sm mt-1 break-words">{message.content}</p>

        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => handleReaction('❤️')}
          >
            <Heart className="w-4 h-4 mr-1" />
            <span className="text-xs">0</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => handleReaction('👍')}
          >
            <ThumbsUp className="w-4 h-4 mr-1" />
            <span className="text-xs">0</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => handleReaction('🔁')}
          >
            <Repeat2 className="w-4 h-4 mr-1" />
            <span className="text-xs">0</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={cn("h-7 px-2", isSaved && "text-primary")}
            onClick={handleSave}
          >
            <Bookmark className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} />
          </Button>
        </div>
      </div>
    </div>
  );
}
