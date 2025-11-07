import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface Channel {
  id: string;
  name: string;
  type: string;
}

interface ChannelListProps {
  selectedChannel: string | null;
  onSelectChannel: (channelId: string) => void;
}

export function ChannelList({ selectedChannel, onSelectChannel }: ChannelListProps) {
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    fetchChannels();

    const channel = supabase
      .channel('lounge-channels')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lounge_channels' },
        () => fetchChannels()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchChannels = async () => {
    const { data, error } = await supabase
      .from('lounge_channels')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching channels:', error);
      return;
    }

    setChannels(data || []);
  };

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-1">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onSelectChannel(channel.id)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
              selectedChannel === channel.id
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Hash className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{channel.name}</span>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
