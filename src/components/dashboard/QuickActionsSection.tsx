import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, Users, BarChart3, ArrowRight } from "lucide-react";
import { QuickAdd } from "@/components/QuickAdd";

interface QuickActionsSectionProps {
  setActiveTab: (tab: string) => void;
  handleQuickAdd: (data: any) => void;
}

export const QuickActionsSection = ({ setActiveTab, handleQuickAdd }: QuickActionsSectionProps) => {
  const actions = [
    {
      label: "Manage Products",
      description: "Add, edit, or view your inventory",
      icon: Package,
      onClick: () => setActiveTab("products"),
      color: "blue",
      variant: "default" as const,
    },
    {
      label: "Process Sale",
      description: "Create a new transaction",
      icon: ShoppingCart,
      onClick: () => setActiveTab("sales"),
      color: "emerald",
      variant: "outline" as const,
    },
    {
      label: "Manage Customers",
      description: "View and manage customer records",
      icon: Users,
      onClick: () => setActiveTab("customers"),
      color: "violet",
      variant: "outline" as const,
    },
    {
      label: "View Reports",
      description: "Analyze sales and performance",
      icon: BarChart3,
      onClick: () => setActiveTab("reports"),
      color: "orange",
      variant: "outline" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Quick Actions */}
      <Card className="lg:col-span-2 card-elevated">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            Quick Actions
          </CardTitle>
          <CardDescription className="text-base">
            Access frequently used features quickly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            const colorMap: Record<string, { bg: string; text: string }> = {
              blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
              emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
              violet: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400' },
              orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
            };
            const colors = colorMap[action.color] || colorMap.blue;
            return (
              <Button
                key={index}
                variant={action.variant}
                className={`w-full justify-between h-14 px-4 ${
                  action.variant === 'default'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={action.onClick}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    action.variant === 'default' 
                      ? 'bg-white/20' 
                      : colors.bg
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      action.variant === 'default'
                        ? 'text-white'
                        : colors.text
                    }`} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-base">{action.label}</div>
                    <div className={`text-sm ${
                      action.variant === 'default' 
                        ? 'text-white/90' 
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {action.description}
                    </div>
                  </div>
                </div>
                <ArrowRight className={`h-4 w-4 ${
                  action.variant === 'default' 
                    ? 'text-white' 
                    : 'text-slate-400'
                }`} />
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {/* Quick Add Widget */}
      <div className="space-y-6">
        <QuickAdd type="product" onAdd={handleQuickAdd} />
      </div>
    </div>
  );
};
