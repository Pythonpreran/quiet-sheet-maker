import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, User, Settings, Users } from "lucide-react";

const AlumniHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card text-foreground p-6 border-b border-border/50">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-2xl font-bold">Alumni Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Connect and mentor students</p>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground px-1">Quick Access</h3>
          <div className="grid grid-cols-1 gap-3">
            <Card 
              className="p-5 elevation-1 hover:elevation-2 active:scale-[0.97] transition-smooth cursor-pointer border-border/50"
              onClick={() => navigate('/lounge')}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-0.5">Lounge</h4>
                  <p className="text-xs text-muted-foreground">Join discussions and connect with students</p>
                </div>
              </div>
            </Card>

            <Card 
              className="p-5 elevation-1 hover:elevation-2 active:scale-[0.97] transition-smooth cursor-pointer border-border/50"
              onClick={() => navigate('/profile')}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-0.5">Profile</h4>
                  <p className="text-xs text-muted-foreground">Manage your profile and mentorship preferences</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Card className="p-5 elevation-1 bg-primary/5 border-primary/10">
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-foreground">Welcome to the Alumni Community</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Connect with students in the Lounge, share your experiences, and help guide the next generation of professionals. 
              Your insights and mentorship can make a real difference!
            </p>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default AlumniHome;
