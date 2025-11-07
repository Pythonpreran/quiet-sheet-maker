import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Invitation {
  id: string;
  channel_id: string;
  invited_by: string;
  status: string;
  created_at: string;
  lounge_channels?: { name: string };
  profiles?: { full_name: string };
}

interface InvitationsDialogProps {
  onUpdate: () => void;
}

export function InvitationsDialog({ onUpdate }: InvitationsDialogProps) {
  const [open, setOpen] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchInvitations();
    }
  }, [open]);

  const fetchInvitations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: invites, error: invitesError } = await supabase
      .from('channel_invitations')
      .select('*')
      .eq('invited_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (invitesError) {
      console.error('Error fetching invitations:', invitesError);
      return;
    }

    if (invites && invites.length > 0) {
      // Fetch channel names
      const channelIds = invites.map(inv => inv.channel_id);
      const { data: channels } = await supabase
        .from('lounge_channels')
        .select('id, name')
        .in('id', channelIds);

      // Fetch inviter names
      const inviterIds = invites.map(inv => inv.invited_by);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', inviterIds);

      const channelMap = new Map(channels?.map(c => [c.id, c]));
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      const enrichedInvites = invites.map(inv => ({
        ...inv,
        lounge_channels: channelMap.get(inv.channel_id),
        profiles: profileMap.get(inv.invited_by)
      }));

      setInvitations(enrichedInvites as Invitation[]);
    } else {
      setInvitations([]);
    }
  };

  const handleResponse = async (invitationId: string, channelId: string, accept: boolean) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update invitation status
      const { error: updateError } = await supabase
        .from('channel_invitations')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      // If accepted, add user to channel members
      if (accept) {
        const { error: memberError } = await supabase
          .from('channel_members')
          .insert({
            channel_id: channelId,
            user_id: user.id
          });

        if (memberError && memberError.code !== '23505') {
          throw memberError;
        }
      }

      toast({
        title: accept ? "Invitation accepted" : "Invitation declined",
        description: accept 
          ? "You can now access this channel" 
          : "Invitation has been declined",
      });

      fetchInvitations();
      onUpdate();
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast({
        title: "Error",
        description: "Failed to process invitation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="rounded-full">
          <Bell className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Channel Invitations</DialogTitle>
          <DialogDescription>
            Accept or decline invitations to join channels
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] pr-4">
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No pending invitations
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((invite) => (
                <div
                  key={invite.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div>
                    <p className="font-medium">
                      #{invite.lounge_channels?.name || "Unknown Channel"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Invited by {invite.profiles?.full_name || "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleResponse(invite.id, invite.channel_id, true)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResponse(invite.id, invite.channel_id, false)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
