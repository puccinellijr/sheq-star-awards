import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  Users, 
  UserCheck, 
  BarChart3, 
  Settings, 
  Home, 
  LogOut 
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      path: "/",
    },
    {
      title: "Colaboradores",
      icon: UserCheck,
      path: "/admin/collaborators",
    },
    {
      title: "Usuários",
      icon: Users,
      path: "/admin/users",
    },
    {
      title: "Relatórios",
      icon: BarChart3,
      path: "/admin/reports",
    },
    {
      title: "Configurações",
      icon: Settings,
      path: "/admin/settings",
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarContent>
            <div className="p-4">
              <Logo />
            </div>
            
            <nav className="flex-1 px-4 space-y-2">
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              ))}
            </nav>

            <div className="p-4 border-t">
              <div className="mb-4">
                <p className="font-medium text-sm">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.department}</p>
              </div>
              <Button variant="outline" onClick={logout} className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1">
          <header className="border-b bg-card">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold">{title}</h1>
              </div>
            </div>
          </header>

          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}