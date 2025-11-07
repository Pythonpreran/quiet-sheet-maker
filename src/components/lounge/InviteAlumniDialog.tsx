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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AlumniUser {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  email: string;
}

interface InviteAlumniDialogProps {
  channelId: string;
}

export function InviteAlumniDialog({ channelId }: InviteAlumniDialogProps) {
  const [open, setOpen] = useState(false);
  const [alumni, setAlumni] = useState<AlumniUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviting, setInviting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchAlumni();
    }
  }, [open]);

  const fetchAlumni = async () => {
    // Get alumni user IDs
    const { data: alumniRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'alumni');

    if (rolesError) {
      console.error('Error fetching alumni roles:', rolesError);
      toast({
        title: "Error",
        description: "Failed to fetch alumni users",
        variant: "destructive",
      });
      return;
    }

    if (!alumniRoles || alumniRoles.length === 0) {
      console.log('No alumni roles found');
      setAlumni([]);
      return;
    }

    const alumniIds = alumniRoles.map(r => r.user_id);

    // Get their profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, email')
      .in('user_id', alumniIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      toast({
        title: "Error",
        description: "Failed to fetch alumni profiles",
        variant: "destructive",
      });
      return;
    }

    console.log('Fetched alumni profiles:', profiles);
    setAlumni(profiles as AlumniUser[] || []);
  };

  const handleInvite = async (alumniUserId: string) => {
    setInviting(alumniUserId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('channel_invitations')
        .insert({
          channel_id: channelId,
          invited_by: user.id,
          invited_user_id: alumniUserId,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already invited",
            description: "This user has already been invited to this channel",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Invitation sent",
          description: "The alumni will receive your invitation",
        });
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setInviting(null);
    }
  };

  const filteredAlumni = alumni.filter(a =>
    a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Alumni
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Alumni to Channel</DialogTitle>
          <DialogDescription>
            Search and invite alumni members to join this discussion
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alumni by name or email..."
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {filteredAlumni.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No alumni found
                </div>
              ) : (
                filteredAlumni.map((alumnus) => (
                  <div
                    key={alumnus.user_id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={alumnus.avatar_url} />
                      <AvatarFallback>
                        {alumnus.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{alumnus.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{alumnus.email}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleInvite(alumnus.user_id)}
                      disabled={inviting === alumnus.user_id}
                    >
                      {inviting === alumnus.user_id ? "Sending..." : "Invite"}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
