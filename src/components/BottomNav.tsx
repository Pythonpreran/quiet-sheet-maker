import { Home, MessageCircle, Rocket, FileCheck, User, Users, UsersRound } from "lucide-react";
import { NavLink } from "./NavLink";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";

const allNavItems = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/chat", icon: MessageCircle, label: "IONCONNECT" },
  { to: "/launchpad", icon: Rocket, label: "Launchpad" },
  { to: "/placement", icon: Users, label: "Mentors" },
  { to: "/lounge", icon: UsersRound, label: "Lounge" },
  { to: "/profile", icon: User, label: "Profile" },
];

const facultyNavItems = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/proofs", icon: FileCheck, label: "Proofs" },
  { to: "/mentor-interest", icon: Users, label: "Requests" },
  { to: "/profile", icon: User, label: "Profile" },
];

export const BottomNav = () => {
  const { role } = useUserRole();
  const navItems = role === 'faculty' ? facultyNavItems : allNavItems;
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 z-50">
      <div className="max-w-screen-xl mx-auto px-2">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-2xl transition-smooth min-w-[64px] active:scale-95"
              activeClassName="text-primary bg-primary/10"
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-[10px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};
