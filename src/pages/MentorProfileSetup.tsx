import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Sparkles, Plus, X, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

const DOMAINS = ["AgriTech", "HealthTech", "FinTech", "EdTech", "SaaS", "E-commerce", "AI/ML", "IoT", "Robotics", "Web3"];
const TECH_STACK = ["Python", "React", "Node.js", "Django", "Flutter", "TensorFlow", "PostgreSQL", "MongoDB", "AWS", "Firebase"];
const HELP_AREAS = ["Product Guidance", "Technical Guidance", "UX Feedback", "Market Validation", "Fundraising", "Team Building"];

// Idea stages - map display labels to database enum values
const IDEA_STAGE_OPTIONS = [
  { label: "Idea Stage", value: "idea" },
  { label: "POC (Proof of Concept)", value: "poc" },
  { label: "MVP (Minimum Viable Product)", value: "mvp" }
] as const;

const MentorProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Profile data
  const [startupName, setStartupName] = useState("");
  const [startupDomain, setStartupDomain] = useState<string[]>([]);
  const [techStack, setTechStack] = useState<string[]>([]);
  const [expertise, setExpertise] = useState<string[]>([]);
  const [helpAreas, setHelpAreas] = useState<string[]>([]);
  const [preferredStages, setPreferredStages] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string>("1hr/week");
  const [traction, setTraction] = useState("");

  useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile && profile.startup_name) {
      // Profile already exists, redirect to mentor interest page
      navigate('/mentor-interest');
    }
  };

  const toggleArrayItem = (array: string[], setArray: (arr: string[]) => void, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const handleSubmit = async () => {
    if (!startupName || startupDomain.length === 0 || helpAreas.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('profiles')
        .update({
          startup_name: startupName,
          startup_domain: startupDomain[0],
          tech_stack: techStack,
          expertise: expertise.length > 0 ? expertise : startupDomain,
          help_areas: helpAreas,
          preferred_idea_stages: preferredStages.length > 0 ? [preferredStages[0] as any] : null,
          mentorship_availability: true,
          traction: traction || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated!",
        description: "You can now start mentoring students"
      });

      navigate('/mentor-interest');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-accent to-warning rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Setup Your Mentor Profile</h1>
          <p className="text-muted-foreground">Help us match you with the right students</p>
        </div>

        {/* Step 1: Startup Details */}
        {step === 1 && (
          <Card className="p-6 space-y-6 animate-in fade-in slide-in-from-right duration-500">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Startup Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="startupName">Startup Name *</Label>
                  <Input
                    id="startupName"
                    placeholder="e.g., AgroSense AI"
                    value={startupName}
                    onChange={(e) => setStartupName(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Domain(s) *</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DOMAINS.map((domain) => (
                      <Badge
                        key={domain}
                        variant={startupDomain.includes(domain) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayItem(startupDomain, setStartupDomain, domain)}
                      >
                        {domain}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Tech Stack Used</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {TECH_STACK.map((tech) => (
                      <Badge
                        key={tech}
                        variant={techStack.includes(tech) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayItem(techStack, setTechStack, tech)}
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="traction">Current Traction (Optional)</Label>
                  <Input
                    id="traction"
                    placeholder="e.g., 1000+ users, $50K ARR"
                    value={traction}
                    onChange={(e) => setTraction(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button onClick={() => setStep(2)} className="w-full" disabled={!startupName || startupDomain.length === 0}>
              Continue
            </Button>
          </Card>
        )}

        {/* Step 2: Mentorship Details */}
        {step === 2 && (
          <Card className="p-6 space-y-6 animate-in fade-in slide-in-from-right duration-500">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Mentorship Preferences
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label>What help can you offer? *</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {HELP_AREAS.map((area) => (
                      <Badge
                        key={area}
                        variant={helpAreas.includes(area) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayItem(helpAreas, setHelpAreas, area)}
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Preferred Idea Stages</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {IDEA_STAGE_OPTIONS.map((stage) => (
                      <Badge
                        key={stage.value}
                        variant={preferredStages.includes(stage.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayItem(preferredStages, setPreferredStages, stage.value)}
                      >
                        {stage.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="availability">Availability</Label>
                  <select
                    id="availability"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="1hr/week">1 hour per week</option>
                    <option value="2hrs/week">2 hours per week</option>
                    <option value="async">Async feedback only</option>
                  </select>
                </div>

                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Tip:</strong> Students with matching domains and tech stacks will be automatically recommended to you.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit} className="flex-1" disabled={loading || helpAreas.length === 0}>
                {loading ? "Saving..." : "Complete Setup"}
              </Button>
            </div>
          </Card>
        )}

        {/* Info Cards */}
        <Card className="p-4 bg-accent/10 border-accent">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Next: Verify Your Identity</p>
              <p className="text-xs text-muted-foreground mt-1">
                After setup, you'll be asked to upload proof of your alumni/faculty status for verification.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MentorProfileSetup;
