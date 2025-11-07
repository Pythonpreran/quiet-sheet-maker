import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/auth");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10" />
      
      <div className="relative text-center space-y-6 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            IONCONNECT
          </h1>
          <p className="text-lg text-muted-foreground">Your pocket mentor</p>
        </div>
        
        <div className="flex justify-center">
          <div className="w-16 h-1 bg-accent rounded-full animate-pulse" />
        </div>
        
        <Button 
          size="lg" 
          onClick={() => navigate("/auth")}
          className="mt-8"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
