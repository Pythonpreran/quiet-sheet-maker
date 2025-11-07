import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Lightbulb, Send, Loader2, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const DOMAIN_OPTIONS = ["AI/ML", "EdTech", "HealthTech", "FinTech", "E-commerce", "SaaS", "IoT", "Social Media"];

const Placement = () => {
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [requestingMentor, setRequestingMentor] = useState<string | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  const toggleDomain = (domain: string) => {
    setSelectedDomains(prev => 
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
    );
  };

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscription for mentor request updates
    const channel = supabase
      .channel('mentor-request-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentor_requests'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: ideasData } = await supabase
      .from("startup_ideas")
      .select("*")
      .eq("user_id", user.id);

    setIdeas(ideasData || []);

    if (ideasData && ideasData.length > 0) {
      // Fetch matches with mentor profiles using a manual join
      const { data: matchesData, error: matchError } = await supabase
        .from("mentor_matches")
        .select("*")
        .eq("student_id", user.id)
        .order("overall_score", { ascending: false });

      if (matchError) {
        console.error("Error fetching matches:", matchError);
        toast({
          title: "Error Loading Mentors",
          description: "Could not load mentor matches. Please try again.",
          variant: "destructive",
        });
      }

      // Fetch mentor profiles separately
      if (matchesData && matchesData.length > 0) {
        const mentorIds = matchesData.map(m => m.mentor_id);
        const { data: profilesData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", mentorIds);

        if (profileError) {
          console.error("Error fetching mentor profiles:", profileError);
        }

        // Merge matches with mentor profiles
        const enrichedMatches = matchesData.map(match => ({
          ...match,
          mentor: profilesData?.find(p => p.user_id === match.mentor_id) || null
        }));

        setMatches(enrichedMatches);
      } else {
        setMatches([]);
      }

      const { data: requestsData } = await supabase
        .from("mentor_requests")
        .select("*")
        .eq("student_id", user.id);

      setRequests(requestsData || []);
    }

    setLoading(false);
  };

  const findMatches = async (ideaId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("match-mentors", {
        body: { ideaId },
      });

      if (error) throw error;

      toast({
        title: "Mentors Found",
        description: `Found ${data?.length || 0} potential mentors`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const requestMentorship = async (matchId: string, mentorId: string, ideaId: string) => {
    setRequestingMentor(matchId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("mentor_requests").insert({
        student_id: user!.id,
        mentor_id: mentorId,
        idea_id: ideaId,
        match_id: matchId,
        message,
      });

      if (error) throw error;

      toast({ title: "Request Sent", description: "Mentor will review your request" });
      setMessage("");
      setSelectedIdea(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setRequestingMentor(null);
    }
  };

  const getRequestStatus = (mentorId: string) => {
    const request = requests.find(r => r.mentor_id === mentorId);
    return request?.status || null;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground p-6 elevation-3">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7" />
            Find Mentors
          </h1>
          <p className="text-primary-foreground/90">Connect with alumni founders</p>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {!loading && ideas.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Filter by Domain</h3>
            <div className="flex flex-wrap gap-2">
              {DOMAIN_OPTIONS.map((domain) => (
                <Badge
                  key={domain}
                  variant={selectedDomains.includes(domain) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleDomain(domain)}
                >
                  {domain}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : ideas.length === 0 ? (
          <Card className="p-6 text-center">
            <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Create an idea first to find mentors</p>
          </Card>
        ) : (
          ideas.map((idea) => {
            const allIdeaMatches = matches.filter((m) => m.idea_id === idea.id);
            const ideaMatches = selectedDomains.length === 0 
              ? allIdeaMatches 
              : allIdeaMatches.filter(m => 
                  selectedDomains.some(domain => 
                    m.mentor?.startup_domain?.toLowerCase().includes(domain.toLowerCase()) ||
                    m.mentor?.domain_preferences?.some((d: string) => d.toLowerCase().includes(domain.toLowerCase())) ||
                    m.mentor?.expertise?.some((e: string) => e.toLowerCase().includes(domain.toLowerCase()))
                  )
                );
            return (
              <Card key={idea.id} className="p-5 elevation-2">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{idea.title}</h3>
                    <div className="flex gap-2 mt-2">
                      {idea.tags?.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  {ideaMatches.length === 0 && (
                    <Button onClick={() => findMatches(idea.id)} size="sm">
                      Find Mentors
                    </Button>
                  )}
                </div>

                {ideaMatches.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Matched Mentors</h4>
                    {ideaMatches.map((match) => (
                      <div key={match.id} className="p-4 bg-secondary rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{match.mentor?.full_name}</p>
                            <p className="text-sm text-muted-foreground">{match.mentor?.startup_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {match.mentor?.startup_domain} • {match.mentor?.expertise?.slice(0, 3).join(", ")}
                            </p>
                          </div>
                          <Badge>{match.overall_score}% Match</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{match.match_reason}</p>
                        
                        {(() => {
                          const status = getRequestStatus(match.mentor_id);
                          
                          if (status === "accepted") {
                            return (
                              <Button size="sm" className="bg-success text-success-foreground" disabled>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Accepted
                              </Button>
                            );
                          }
                          
                          if (status === "rejected") {
                            return (
                              <Button size="sm" variant="outline" disabled>
                                Request Declined
                              </Button>
                            );
                          }
                          
                          if (status === "pending") {
                            return (
                              <Button size="sm" variant="secondary" disabled>
                                <Clock className="w-4 h-4 mr-1" />
                                Request Sent
                              </Button>
                            );
                          }
                          
                          return (
                            <Button
                              size="sm"
                              onClick={() => requestMentorship(match.id, match.mentor_id, idea.id)}
                              disabled={requestingMentor === match.id}
                            >
                              {requestingMentor === match.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Send className="w-4 h-4 mr-1" />
                                  Request Mentor
                                </>
                              )}
                            </Button>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Placement;
