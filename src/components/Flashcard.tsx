import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";

export type FlashcardData = {
  front: string;
  back: string[];
};

type FlashcardSetProps = {
  cards: FlashcardData[];
};

export const FlashcardSet = ({ cards }: FlashcardSetProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (cards.length === 0) return null;

  const currentCard = cards[currentIndex];

  return (
    <div className="space-y-3 my-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">Flashcard {currentIndex + 1} of {cards.length}</span>
        <span className="text-[10px] opacity-70">Click card to flip</span>
      </div>

      <Card 
        className="relative h-48 cursor-pointer transition-all hover:shadow-lg"
        onClick={handleFlip}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.6s",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 p-6 flex flex-col items-center justify-center backface-hidden bg-primary/5 border-primary/20"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
          }}
        >
          <div className="text-center">
            <div className="text-xs font-semibold text-primary mb-2">QUESTION</div>
            <p className="text-sm font-medium leading-relaxed">{currentCard.front}</p>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 p-6 flex flex-col justify-center backface-hidden bg-accent/5 border-accent/20"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="text-xs font-semibold text-accent mb-3 text-center">ANSWER</div>
          <div className="space-y-2 overflow-y-auto max-h-[130px]">
            {currentCard.back.map((line, idx) => (
              <p key={idx} className="text-xs leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="h-8"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleFlip}
          className="h-8 gap-2"
        >
          <RotateCw className="w-3 h-3" />
          Flip
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="h-8"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export const parseFlashcards = (content: string): FlashcardData[] | null => {
  const flashcardPattern = /\*\*Flashcard \d+:(.*?)\*\*/g;
  const matches = Array.from(content.matchAll(flashcardPattern));
  
  if (matches.length === 0) return null;

  const cards: FlashcardData[] = [];
  
  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const nextMatch = matches[i + 1];
    
    const startIndex = currentMatch.index! + currentMatch[0].length;
    const endIndex = nextMatch ? nextMatch.index! : content.length;
    
    const cardContent = content.substring(startIndex, endIndex).trim();
    
    // Parse the front (question)
    const front = currentMatch[1].trim();
    
    // Parse the back (answer points)
    const backLines = cardContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('*') || line.startsWith('-'))
      .map(line => line.replace(/^[\*\-]\s*/, '').trim())
      .filter(line => line.length > 0);
    
    if (front && backLines.length > 0) {
      cards.push({ front, back: backLines });
    }
  }
  
  return cards.length > 0 ? cards : null;
};
