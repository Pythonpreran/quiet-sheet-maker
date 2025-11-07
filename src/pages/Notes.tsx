import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, MessageCircle } from "lucide-react";

const Notes = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground p-6 elevation-3">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-7 h-7" />
            Smart Notes
          </h1>
          <p className="text-primary-foreground/80">AI-powered summaries & flashcards</p>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 elevation-2">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-medium">Upload Lecture Notes</p>
              <p className="text-sm text-muted-foreground">Get instant summaries and flashcards</p>
            </div>
            <Button>Upload PDF</Button>
          </div>
        </Card>

        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Recent Notes</h3>
          <Card className="p-4 elevation-1">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm">AI Ethics Lecture</h4>
                <p className="text-xs text-muted-foreground">Summary: Key principles of AI fairness, transparency...</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">View Summary</Button>
                <Button size="sm">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Ask IONCONNECT
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Notes;
