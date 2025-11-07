import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, RotateCcw } from "lucide-react";

const Planner = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground p-6 elevation-3">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-7 h-7" />
            Smart Study Planner
          </h1>
          <p className="text-primary-foreground/80">Your adaptive learning schedule</p>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-5 elevation-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Today's Schedule</h3>
            <Button variant="ghost" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Auto-adjust
            </Button>
          </div>
          
          <div className="space-y-3">
            {[
              { time: "9:00 AM", subject: "DSA Practice", status: "completed" },
              { time: "11:00 AM", subject: "AI Lecture Review", status: "active" },
              { time: "2:00 PM", subject: "Database Lab", status: "upcoming" },
              { time: "4:30 PM", subject: "Project Work", status: "upcoming" },
            ].map((block, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  block.status === "completed"
                    ? "bg-success/5 border-success"
                    : block.status === "active"
                    ? "bg-primary/5 border-primary"
                    : "bg-muted/30 border-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{block.subject}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {block.time}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      block.status === "completed"
                        ? "bg-success/10 text-success"
                        : block.status === "active"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {block.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Planner;
