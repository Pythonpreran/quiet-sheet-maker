import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Edit2, Save, X, ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  title: string;
  content: string;
  notes: string;
}

interface PitchDeckContent {
  slides: Slide[];
}

const PitchDeck = () => {
  const { ideaId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [deckContent, setDeckContent] = useState<PitchDeckContent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSlides, setEditedSlides] = useState<Slide[]>([]);

  useEffect(() => {
    loadPitchDeck();
  }, [ideaId]);

  const loadPitchDeck = async () => {
    try {
      const { data, error } = await supabase
        .from('pitch_decks')
        .select('content')
        .eq('idea_id', ideaId)
        .single();

      if (error) throw error;
      
      const content = data.content as unknown as PitchDeckContent;
      setDeckContent(content);
      setEditedSlides(content.slides);
    } catch (error) {
      console.error('Error loading pitch deck:', error);
      toast({
        title: "Error",
        description: "Failed to load pitch deck",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveDeck = async () => {
    try {
      const { error } = await supabase
        .from('pitch_decks')
        .update({ content: { slides: editedSlides } as any })
        .eq('idea_id', ideaId);

      if (error) throw error;

      setDeckContent({ slides: editedSlides });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Pitch deck updated successfully",
      });
    } catch (error) {
      console.error('Error saving pitch deck:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  const updateSlide = (index: number, field: keyof Slide, value: string) => {
    const updated = [...editedSlides];
    updated[index] = { ...updated[index], [field]: value };
    setEditedSlides(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading pitch deck...</p>
      </div>
    );
  }

  if (!deckContent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No pitch deck found</p>
      </div>
    );
  }

  const slides = isEditing ? editedSlides : deckContent.slides;
  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/launchpad')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Launchpad
          </Button>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => {
                  setIsEditing(false);
                  setEditedSlides(deckContent.slides);
                }}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button size="sm" onClick={saveDeck}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Deck
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Slide Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8 elevation-2 min-h-[500px]">
          {isEditing ? (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Slide Title
                </label>
                <Input
                  value={slide.title}
                  onChange={(e) => updateSlide(currentSlide, 'title', e.target.value)}
                  className="text-2xl font-bold"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Content
                </label>
                <Textarea
                  value={slide.content}
                  onChange={(e) => updateSlide(currentSlide, 'content', e.target.value)}
                  className="min-h-[200px] text-base"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Presenter Notes
                </label>
                <Textarea
                  value={slide.notes}
                  onChange={(e) => updateSlide(currentSlide, 'notes', e.target.value)}
                  className="min-h-[100px] text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-foreground">{slide.title}</h1>
              <div className="text-base text-foreground whitespace-pre-wrap">{slide.content}</div>
              {slide.notes && (
                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Presenter Notes:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{slide.notes}</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === slides.length - 1}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="text-center mt-4 text-sm text-muted-foreground">
          Slide {currentSlide + 1} of {slides.length}
        </div>
      </div>
    </div>
  );
};

export default PitchDeck;
