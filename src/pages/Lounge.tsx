import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, Hash, Plus, ArrowLeft, Bell } from "lucide-react";
import { ChannelList } from "@/components/lounge/ChannelList";
import { ChatArea } from "@/components/lounge/ChatArea";
import { DirectMessages } from "@/components/lounge/DirectMessages";
import { CreateChannelDialog } from "@/components/lounge/CreateChannelDialog";
import { InvitationsDialog } from "@/components/lounge/InvitationsDialog";

export default function Lounge() {
  const { role, loading } = useUserRole();
  const navigate = useNavigate();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("channels");
  const [pendingInvites, setPendingInvites] = useState(0);

  useEffect(() => {
    fetchPendingInvites();

    const channel = supabase
      .channel('invitations-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'channel_invitations' },
        () => fetchPendingInvites()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingInvites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('channel_invitations')
      .select('id')
      .eq('invited_user_id', user.id)
      .eq('status', 'pending');

    if (!error && data) {
      setPendingInvites(data.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Restrict to students and alumni only
  if (role !== "student" && role !== "alumni") {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/home')}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                VVCE Discussion Lounge
              </h1>
              <p className="text-muted-foreground text-sm">
                AI-Safe Community • Connect, Learn, Grow Together
              </p>
            </div>
          </div>
          <div className="relative">
            <InvitationsDialog onUpdate={fetchPendingInvites} />
            {pendingInvites > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {pendingInvites}
              </Badge>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar */}
          <Card className="lg:col-span-1 p-4 h-[calc(100vh-200px)] overflow-hidden flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="channels" className="text-xs">
                  <Hash className="w-4 h-4 mr-1" />
                  Channels
                </TabsTrigger>
                <TabsTrigger value="dms" className="text-xs">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  DMs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="channels" className="flex-1 overflow-hidden flex flex-col mt-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">Topics</h3>
                  <CreateChannelDialog />
                </div>
                <ChannelList 
                  selectedChannel={selectedChannel}
                  onSelectChannel={setSelectedChannel}
                />
              </TabsContent>

              <TabsContent value="dms" className="flex-1 overflow-auto mt-0">
                <DirectMessages />
              </TabsContent>
            </Tabs>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3 p-4 h-[calc(100vh-200px)] overflow-hidden">
            {selectedChannel ? (
              <ChatArea channelId={selectedChannel} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Users className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Welcome to the Lounge</h3>
                <p className="text-muted-foreground max-w-md">
                  Select a channel to join the conversation or start a direct message with a fellow member.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
