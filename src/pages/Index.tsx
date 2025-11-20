import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useUser } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductManagement } from "@/components/ProductManagement";
import { SalesModule } from "@/components/SalesModule";
import CustomerManagement from "@/components/CustomerManagement";
import { ReportsModule } from "@/components/ReportsModule";
import { SettingsModule } from "@/components/SettingsModule";
import { AppHeader } from "@/components/layout/AppHeader";
import { TabNavigation } from "@/components/navigation/TabNavigation";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { QuickActionsSection } from "@/components/dashboard/QuickActionsSection";
import { GettingStartedGuide } from "@/components/dashboard/GettingStartedGuide";
import { SettingsManager } from "@/utils/settings";
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import { TrendingUp, Package, ShoppingCart, Users, BarChart3, Settings } from "lucide-react";

const navItems = [
  { value: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { value: 'products', label: 'Products', icon: Package },
  { value: 'sales', label: 'Sales', icon: ShoppingCart },
  { value: 'customers', label: 'Customers', icon: Users },
  { value: 'reports', label: 'Reports', icon: BarChart3 },
  { value: 'settings', label: 'Settings', icon: Settings },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [pharmacyName, setPharmacyName] = useState("Pharmacy Management");
  const { user } = useUser();

  // Fetch dashboard statistics
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch today's sales
      const { data: sales } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch low stock products
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .lt('stock_quantity', 10);

      // Fetch expired products
      const todayStr = today.toISOString().split('T')[0];
      const { data: expiredProducts } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .lte('expiry_date', todayStr);

      // Fetch customers count
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const todaysRevenue = sales?.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0) || 0;

      return {
        todaysRevenue,
        totalProducts: productsCount || 0,
        lowStockCount: lowStockProducts?.length || 0,
        expiredCount: expiredProducts?.length || 0,
        totalCustomers: customersCount || 0
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000
  });

  useEffect(() => {
    // Load pharmacy name from settings
    const settings = SettingsManager.getPharmacySettings();
    if (settings.pharmacyName) {
      setPharmacyName(settings.pharmacyName);
    }
  }, []);

  const handleQuickAdd = () => {
    setActiveTab('products');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Navigation Drawer for Mobile */}
      <Drawer>
        <AppHeader pharmacyName={pharmacyName} userFirstName={user?.firstName} />
        <DrawerContent className="block md:hidden border-t">
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => { 
                  setActiveTab(value); 
                  (document.activeElement as HTMLElement)?.blur(); 
                }}
                className={`flex items-center gap-3 px-4 py-3 text-base font-semibold rounded-lg transition-all
                  ${activeTab === value 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                aria-current={activeTab === value ? 'page' : undefined}
                aria-label={label}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{label}</span>
              </button>
            ))}
            <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
            <DrawerClose className="w-full px-4 py-3 text-base font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              Close Menu
            </DrawerClose>
          </nav>
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <TabNavigation />
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <div className="fade-in">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Dashboard Overview
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Monitor your pharmacy performance and key metrics
                </p>
              </div>
              <DashboardStats stats={stats} />
              <QuickActionsSection 
                setActiveTab={setActiveTab} 
                handleQuickAdd={handleQuickAdd} 
              />
              <GettingStartedGuide />
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6 mt-6">
            <div className="fade-in">
              <ProductManagement />
            </div>
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-6 mt-6">
            <div className="fade-in">
              <SalesModule />
            </div>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6 mt-6">
            <div className="fade-in">
              <CustomerManagement />
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6 mt-6">
            <div className="fade-in">
              <ReportsModule />
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 mt-6">
            <div className="fade-in">
              <SettingsModule />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              © 2025 Pharmacy Management System
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Developed by TEAM [M.Abubakkar,Amun Masud,Adan Mirza,Ali, Ayesha]
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
