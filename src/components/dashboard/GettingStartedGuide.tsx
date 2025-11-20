import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Settings, ShoppingCart } from "lucide-react";

export const GettingStartedGuide = () => {
  const steps = [
    {
      number: 1,
      title: "Add Your Products",
      description: "Start by adding medicines and products to your inventory. Include details like name, price, and stock quantity.",
      icon: ShoppingCart,
      color: "blue",
    },
    {
      number: 2,
      title: "Configure Settings",
      description: "Set up your pharmacy name, contact information, and preferences in the Settings section.",
      icon: Settings,
      color: "emerald",
    },
    {
      number: 3,
      title: "Start Processing Sales",
      description: "Begin selling products and serving customers. Track all transactions and manage inventory automatically.",
      icon: Sparkles,
      color: "violet",
    },
  ];

  return (
    <Card className="card-elevated bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/50">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          Getting Started
        </CardTitle>
        <CardDescription className="text-base">
          Follow these simple steps to set up your pharmacy management system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            const colorClasses = {
              blue: {
                bg: 'bg-blue-100 dark:bg-blue-900/30',
                text: 'text-blue-600 dark:text-blue-400',
                gradient: 'from-blue-600 to-blue-700'
              },
              emerald: {
                bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                text: 'text-emerald-600 dark:text-emerald-400',
                gradient: 'from-emerald-600 to-emerald-700'
              },
              violet: {
                bg: 'bg-violet-100 dark:bg-violet-900/30',
                text: 'text-violet-600 dark:text-violet-400',
                gradient: 'from-violet-600 to-violet-700'
              }
            };
            const colors = colorClasses[step.color as keyof typeof colorClasses];
            return (
              <div
                key={step.number}
                className="relative p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700"
              >
                <div className={`absolute -top-3 -left-3 h-10 w-10 rounded-full bg-gradient-to-br ${colors.gradient} text-white flex items-center justify-center text-lg font-bold shadow-lg`}>
                  {step.number}
                </div>
                <div className={`mt-2 mb-4 h-12 w-12 rounded-lg ${colors.bg} flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${colors.text}`} />
                </div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                  {step.title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
