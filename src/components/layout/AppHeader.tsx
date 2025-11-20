import { Package, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { NotificationPanel } from "@/components/NotificationPanel";
import { DrawerTrigger } from "@/components/ui/drawer";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  pharmacyName: string;
  userFirstName?: string;
}

export const AppHeader = ({ pharmacyName, userFirstName }: AppHeaderProps) => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <DrawerTrigger className="md:hidden" aria-label="Open navigation menu">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </Button>
            </DrawerTrigger>
            
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {pharmacyName}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Management System
                </p>
              </div>
            </div>
          </div>
          
          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <NotificationPanel />
            
            <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700" />
            
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {userFirstName || user?.firstName || 'User'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Administrator</p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-10 w-10 rounded-full p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {userFirstName || user?.firstName || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => signOut()}
                    className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
