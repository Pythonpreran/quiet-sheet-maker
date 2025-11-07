import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const MentorInterest = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("mentor_requests")
      .select(`
        *,
        startup_ideas(*),
        student:profiles!student_id(full_name, email, avatar_url),
        mentor_matches(domain_match_score, tech_match_score, overall_score, match_reason)
      `)
      .eq("mentor_id", user.id)
      .order("created_at", { ascending: false });

    setRequests(data || []);
    setLoading(false);
  };

  const respondToRequest = async (requestId: string, status: "accepted" | "rejected") => {
    setResponding(requestId);
    try {
      const request = requests.find(r => r.id === requestId);
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("mentor_requests")
        .update({
          status,
          mentor_feedback: feedback[requestId] || null,
        })
        .eq("id", requestId);

      if (error) throw error;

      // Create channel if accepted
      if (status === "accepted" && request) {
        const channelName = `${request.student.full_name} & ${request.startup_ideas.title}`;
        const { data: channel, error: channelError } = await supabase
          .from("lounge_channels")
          .insert({
            name: channelName,
            type: "startups",
            description: `Mentorship channel for ${request.startup_ideas.title}`,
            created_by: user!.id,
          })
          .select()
          .single();

        if (channelError) throw channelError;

        // Add student as member
        const { error: memberError } = await supabase
          .from("channel_members")
          .insert({
            channel_id: channel.id,
            user_id: request.student_id,
          });

        if (memberError) throw memberError;
      }

      toast({
        title: status === "accepted" ? "Request Accepted" : "Request Declined",
        description: status === "accepted" 
          ? "Mentorship channel created in Lounge" 
          : "Student has been notified",
      });

      fetchRequests();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setResponding(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-r from-accent to-warning text-accent-foreground p-6 elevation-3">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="w-7 h-7" />
            Mentorship Requests
          </h1>
          <p className="text-accent-foreground/90">Students seeking your guidance</p>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <Card className="p-6 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No mentorship requests yet</p>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="p-5 elevation-2">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{request.startup_ideas.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    by {request.student?.full_name || 'Unknown'}
                  </p>
                </div>
                <Badge
                  variant={
                    request.status === "accepted"
                      ? "default"
                      : request.status === "rejected"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {request.status}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-sm font-semibold mb-1">Problem</p>
                  <p className="text-sm text-muted-foreground">{request.startup_ideas.problem}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-1">Solution</p>
                  <p className="text-sm text-muted-foreground">{request.startup_ideas.solution}</p>
                </div>

                <div className="flex gap-2">
                  {request.startup_ideas.tags?.map((tag: string) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>

                {request.mentor_matches?.[0] && (
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-xs font-semibold mb-2">Why You're Matched</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {request.mentor_matches[0].match_reason}
                    </p>
                    <div className="flex gap-3 text-xs">
                      <span>Domain: {request.mentor_matches[0].domain_match_score}%</span>
                      <span>Tech: {request.mentor_matches[0].tech_match_score}%</span>
                      <span>Overall: {request.mentor_matches[0].overall_score}%</span>
                    </div>
                  </div>
                )}

                {request.message && (
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-xs font-semibold mb-1">Student Message</p>
                    <p className="text-sm">{request.message}</p>
                  </div>
                )}
              </div>

              {request.status === "pending" && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Optional: Add feedback or guidance"
                    value={feedback[request.id] || ""}
                    onChange={(e) =>
                      setFeedback({ ...feedback, [request.id]: e.target.value })
                    }
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => respondToRequest(request.id, "accepted")}
                      disabled={responding === request.id}
                      className="flex-1"
                    >
                      {responding === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accept
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => respondToRequest(request.id, "rejected")}
                      disabled={responding === request.id}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MentorInterest;
