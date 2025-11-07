import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Smile, Frown, Meh } from "lucide-react";

const Wellness = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-r from-success to-success/80 text-success-foreground p-6 elevation-3">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-7 h-7" />
            Wellness Check
          </h1>
          <p className="text-success-foreground/90">How are you feeling today?</p>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 elevation-2">
          <h3 className="font-semibold text-foreground mb-4 text-center">Rate Your Mood</h3>
          <div className="flex justify-around mb-6">
            {[
              { icon: Smile, label: "Great", color: "text-success" },
              { icon: Meh, label: "Okay", color: "text-warning" },
              { icon: Frown, label: "Low", color: "text-destructive" },
            ].map(({ icon: Icon, label, color }) => (
              <button
                key={label}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-smooth"
              >
                <Icon className={`w-12 h-12 ${color}`} />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5 elevation-1">
          <h4 className="font-medium mb-3">Suggested Micro-Actions</h4>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">5-minute breathing exercise</Button>
            <Button variant="outline" className="w-full justify-start">Take a short walk</Button>
            <Button variant="outline" className="w-full justify-start">Chat with a friend</Button>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Wellness;
