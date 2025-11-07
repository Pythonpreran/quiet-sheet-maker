import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Launchpad from "./pages/Launchpad";
import Proofs from "./pages/Proofs";
import Profile from "./pages/Profile";
import Planner from "./pages/Planner";
import Notes from "./pages/Notes";
import Wellness from "./pages/Wellness";
import Placement from "./pages/Placement";
import Auth from "./pages/Auth";
import PitchDeck from "./pages/PitchDeck";
import MentorInterest from "./pages/MentorInterest";
import MentorProfileSetup from "./pages/MentorProfileSetup";
import Lounge from "./pages/Lounge";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/home" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/launchpad" element={<Launchpad />} />
          <Route path="/proofs" element={<Proofs />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/wellness" element={<Wellness />} />
          <Route path="/placement" element={<Placement />} />
          <Route path="/pitch-deck/:ideaId" element={<PitchDeck />} />
          <Route path="/mentor-interest" element={<MentorInterest />} />
          <Route path="/mentor-profile-setup" element={<MentorProfileSetup />} />
          <Route path="/lounge" element={<Lounge />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
