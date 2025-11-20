import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings
} from "lucide-react";

export const TabNavigation = () => {
  const tabs = [
    { value: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { value: 'products', label: 'Products', icon: Package },
    { value: 'sales', label: 'Sales', icon: ShoppingCart },
    { value: 'customers', label: 'Customers', icon: Users },
    { value: 'reports', label: 'Reports', icon: BarChart3 },
    { value: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-t-xl">
      <TabsList className="grid w-full grid-cols-6 h-auto bg-transparent p-0 gap-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 
                         data-[state=active]:bg-blue-600 data-[state=active]:text-white 
                         data-[state=active]:shadow-md
                         text-slate-600 dark:text-slate-400 
                         hover:text-slate-900 dark:hover:text-slate-200
                         hover:bg-slate-100 dark:hover:bg-slate-800
                         rounded-none rounded-t-xl
                         px-3 md:px-4 py-3 md:py-3 
                         font-semibold text-sm md:text-base
                         transition-all duration-200
                         border-b-2 border-transparent
                         data-[state=active]:border-blue-600"
            >
              <Icon className="h-5 w-5 md:h-5 md:w-5 flex-shrink-0" />
              <span className="text-xs md:text-sm font-medium">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </div>
  );
};
