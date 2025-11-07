import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface DMContact {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  last_message?: string;
  unread_count: number;
}

export function DirectMessages() {
  const [contacts, setContacts] = useState<DMContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    // This would fetch users who have DM'd with the current user
    // For now, showing empty state
    setContacts([]);
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1">
        {contacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No direct messages yet.<br />
            Start a conversation!
          </div>
        ) : (
          contacts.map((contact) => (
            <button
              key={contact.user_id}
              onClick={() => setSelectedContact(contact.user_id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                selectedContact === contact.user_id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted"
              )}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={contact.avatar_url} />
                <AvatarFallback>
                  {contact.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium truncate">
                  {contact.full_name}
                </div>
                {contact.last_message && (
                  <div className="text-xs text-muted-foreground truncate">
                    {contact.last_message}
                  </div>
                )}
              </div>
              {contact.unread_count > 0 && (
                <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {contact.unread_count}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
