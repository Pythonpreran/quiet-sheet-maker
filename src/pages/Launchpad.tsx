import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Rocket, Code, Users, ArrowRight, Sparkles, FileText, Loader2 } from "lucide-react";

interface StartupIdea {
  id: string;
  title: string;
  problem: string;
  created_at: string;
  stage: string;
}

const Launchpad = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ideaTitle, setIdeaTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<StartupIdea[]>([]);

  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    try {
      const { data, error } = await supabase
        .from('startup_ideas')
        .select('id, title, problem, created_at, stage')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIdeas(data || []);
    } catch (error) {
      console.error('Error loading ideas:', error);
    }
  };

  const generatePitchDeck = async () => {
    if (!ideaTitle || !problem || !solution || !targetUser || !domain) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields including domain",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create the idea
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: ideaData, error: ideaError } = await supabase
        .from('startup_ideas')
        .insert({
          user_id: user.id,
          title: ideaTitle,
          problem: problem,
          solution: solution,
          target_user: targetUser,
          stage: 'idea',
          tags: [domain], // Add domain as a tag for matching
        })
        .select()
        .single();

      if (ideaError) throw ideaError;

      // Generate pitch deck
      const { data: deckData, error: deckError } = await supabase.functions.invoke('generate-pitch-deck', {
        body: { ideaId: ideaData.id }
      });

      if (deckError) throw deckError;

      // Match with mentors based on domain
      try {
        await supabase.functions.invoke('match-mentors', {
          body: { ideaId: ideaData.id }
        });
      } catch (matchError) {
        console.error('Error matching mentors:', matchError);
        // Don't block the flow if mentor matching fails
      }

      toast({
        title: "Success!",
        description: "Your pitch deck has been generated and mentors matched",
      });

      // Navigate to pitch deck
      navigate(`/pitch-deck/${ideaData.id}`);
    } catch (error: any) {
      console.error('Error generating pitch deck:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate pitch deck",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-accent to-warning text-accent-foreground p-6 elevation-3">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Rocket className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Launchpad</h1>
          </div>
          <p className="text-accent-foreground/80">Transform your idea into a pitch deck</p>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* New Idea Form */}
        <Card className="p-6 elevation-2">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Create Your Pitch Deck
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Idea Title</label>
                <Input
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  placeholder="What's your big idea?"
                  className="w-full"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Problem Statement
                </label>
                <Textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="What problem are you solving?"
                  className="w-full min-h-[80px]"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Your Solution
                </label>
                <Textarea
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="How does your solution work?"
                  className="w-full min-h-[80px]"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Target User
                </label>
                <Input
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  placeholder="Who is this for?"
                  className="w-full"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Startup Domain
                </label>
                <Input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="E.g., FinTech, HealthTech, EdTech, E-commerce"
                  className="w-full"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This helps us match you with relevant mentors
                </p>
              </div>

              <Button
                className="w-full" 
                size="lg" 
                onClick={generatePitchDeck}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate 5-Slide Pitch Deck
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* What You'll Get */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">What You'll Get</h3>
          <div className="grid gap-3">
            <Card className="p-4 elevation-1">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">5-Slide Pitch Deck</h4>
                  <p className="text-xs text-muted-foreground">
                    AI-generated concise pitch with Title, Solution, Market, Traction, and Ask slides
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 elevation-1">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Editable & Reviewable</h4>
                  <p className="text-xs text-muted-foreground">
                    Edit any slide content and save your changes for later
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 elevation-1">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Presenter Notes</h4>
                  <p className="text-xs text-muted-foreground">
                    Each slide includes helpful presenter notes to guide your pitch
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Ideas */}
        {ideas.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Your Pitch Decks</h3>
            <div className="space-y-3">
              {ideas.map((idea) => (
                <Card key={idea.id} className="p-4 elevation-1">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{idea.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(idea.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium">
                        {idea.stage}
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate(`/pitch-deck/${idea.id}`)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Pitch Deck
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Launchpad;
