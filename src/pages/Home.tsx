import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, BookOpen, Target, Wallet, CheckCircle, AlertCircle } from "lucide-react";
import ionConnectAvatar from "@/assets/ionconnect-avatar.png";
import { useUserRole } from "@/hooks/useUserRole";
import AlumniHome from "./AlumniHome";

const Home = () => {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (role === 'alumni') {
    return <AlumniHome />;
  }
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card text-foreground p-6 border-b border-border/50">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Hello, Alex!</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Let's make today productive</p>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
              <Wallet className="w-4 h-4" />
              <span className="font-semibold text-sm">₹2,450</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Student Twin Card */}
        <Card className="p-5 elevation-1 bg-primary/5 border-primary/10">
          <div className="flex items-start gap-4">
            <img src={ionConnectAvatar} alt="IONCONNECT" className="w-14 h-14 rounded-2xl elevation-1" />
            <div className="flex-1">
              <h2 className="text-base font-semibold text-foreground mb-1.5">Your Study Companion</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Today's focus: Data Structures & Algorithms. You have 3 study blocks scheduled.
              </p>
              <Button size="sm" className="rounded-full">
                Chat with IONCONNECT
              </Button>
            </div>
          </div>
        </Card>

        {/* Today's Plan */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2 px-1">
            <Calendar className="w-4 h-4 text-primary" />
            Today's Study Plan
          </h3>
          <Card className="p-5 elevation-1 border-border/50">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-14 bg-success rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm">DSA Practice - Recursion</h4>
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground">9:00 AM - 9:30 AM • Completed</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1 h-14 bg-primary rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm">Review Lecture Notes - AI</h4>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium flex-shrink-0">Now</span>
                  </div>
                  <p className="text-xs text-muted-foreground">2:00 PM - 3:00 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1 h-14 bg-muted rounded-full" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-muted-foreground">Database Lab Assignment</h4>
                  <p className="text-xs text-muted-foreground">4:30 PM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Pending Approvals */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2 px-1">
            <AlertCircle className="w-4 h-4 text-warning" />
            Pending Approvals
          </h3>
          <Card className="p-4 elevation-1 border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-warning/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-warning" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-sm">Event Refund - Tech Fest</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Submitted 2 hours ago</p>
                </div>
              </div>
              <span className="text-xs bg-warning/10 text-warning px-3 py-1.5 rounded-full font-medium flex-shrink-0 ml-2">
                Processing
              </span>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground px-1">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-5 elevation-1 hover:elevation-2 active:scale-[0.97] transition-smooth cursor-pointer border-border/50">
              <div className="space-y-3">
                <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-0.5">Upload Notes</h4>
                  <p className="text-xs text-muted-foreground">Get AI summary</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 elevation-1 hover:elevation-2 active:scale-[0.97] transition-smooth cursor-pointer border-border/50">
              <div className="space-y-3">
                <div className="w-11 h-11 bg-accent/10 rounded-2xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-0.5">New Idea</h4>
                  <p className="text-xs text-muted-foreground">Launch startup</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;
