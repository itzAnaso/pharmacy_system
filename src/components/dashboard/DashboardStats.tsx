import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, AlertTriangle, Users, TrendingUp } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

interface DashboardStatsProps {
  stats: {
    todaysRevenue: number;
    totalProducts: number;
    lowStockCount: number;
    expiredCount: number;
    totalCustomers: number;
  } | null;
}

export const DashboardStats = ({ stats }: DashboardStatsProps) => {
  const { getCurrencySymbol } = useSettings();
  const totalAlerts = (stats?.lowStockCount || 0) + (stats?.expiredCount || 0);

  const statCards = [
    {
      title: "Today's Revenue",
      value: `${getCurrencySymbol('PKR')}${stats?.todaysRevenue?.toFixed(2) || '0.00'}`,
      description: stats?.todaysRevenue && stats.todaysRevenue > 0 
        ? 'Revenue generated today' 
        : 'No sales today',
      icon: DollarSign,
      gradient: "from-emerald-500 to-green-600",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      description: stats?.totalProducts && stats.totalProducts > 0 
        ? 'Items in inventory' 
        : 'Add your first product',
      icon: Package,
      gradient: "from-blue-500 to-indigo-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Active Alerts",
      value: totalAlerts,
      description: `${stats?.lowStockCount || 0} low stock, ${stats?.expiredCount || 0} expired`,
      icon: AlertTriangle,
      gradient: "from-amber-500 to-orange-600",
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Total Customers",
      value: stats?.totalCustomers || 0,
      description: stats?.totalCustomers && stats.totalCustomers > 0 
        ? 'Registered customers' 
        : 'Add your first customer',
      icon: Users,
      gradient: "from-violet-500 to-purple-600",
      iconBg: "bg-violet-100 dark:bg-violet-900/30",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index}
            className="card-elevated overflow-hidden border-0"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {stat.title}
              </CardTitle>
              <div className={`${stat.iconBg} p-2.5 rounded-lg`}>
                <Icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
