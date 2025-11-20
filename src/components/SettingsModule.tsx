import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Settings, Store, Globe, Save, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SettingsManager, PharmacySettings } from "@/utils/settings";

interface BasicSettings {
  pharmacyName: string;
  ownerName: string;
  phone: string;
  currency: string;
  taxRate: number;
}

const currencies = [
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'PKR' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
];

export const SettingsModule = () => {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<BasicSettings>({
    pharmacyName: "",
    ownerName: "",
    phone: "",
    currency: "PKR",
    taxRate: 0
  });

  const [notifications, setNotifications] = useState(true);

  // Load settings from SettingsManager on component mount
  useEffect(() => {
    const pharmacySettings = SettingsManager.getPharmacySettings();
    const systemSettings = SettingsManager.getSystemSettings();

    setSettings({
      pharmacyName: pharmacySettings.pharmacyName,
      ownerName: pharmacySettings.ownerName,
      phone: pharmacySettings.phone,
      currency: pharmacySettings.currency,
      taxRate: pharmacySettings.taxRate
    });

    setNotifications(systemSettings.notifications);
  }, []);

  const saveSettings = () => {
    // Save pharmacy settings
    SettingsManager.savePharmacySettings({
      pharmacyName: settings.pharmacyName,
      ownerName: settings.ownerName,
      phone: settings.phone,
      currency: settings.currency,
      taxRate: settings.taxRate
    });

    // Save system settings
    SettingsManager.saveSystemSettings({
      notifications: notifications
    });
    
    toast({
      title: "Success",
      description: "Settings saved successfully"
    });
  };

  const resetSettings = () => {
    SettingsManager.resetAllSettings();
    
    setSettings({
      pharmacyName: "",
      ownerName: "",
      phone: "",
      currency: "PKR",
      taxRate: 0
    });
    
    setNotifications(true);
    
    toast({
      title: "Success",
      description: "All settings have been reset"
    });
  };

  const exportSettings = () => {
    const settingsData = SettingsManager.exportSettings();
    if (settingsData) {
      const blob = new Blob([settingsData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pharmacy-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Settings exported successfully"
      });
    }
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (SettingsManager.importSettings(content)) {
          // Reload settings
          const pharmacySettings = SettingsManager.getPharmacySettings();
          const systemSettings = SettingsManager.getSystemSettings();

          setSettings({
            pharmacyName: pharmacySettings.pharmacyName,
            ownerName: pharmacySettings.ownerName,
            phone: pharmacySettings.phone,
            currency: pharmacySettings.currency,
            taxRate: pharmacySettings.taxRate
          });

          setNotifications(systemSettings.notifications);
          
          toast({
            title: "Success",
            description: "Settings imported successfully"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to import settings",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
            Settings
          </h2>
          <p className="text-sm sm:text-base text-slate-600">Quick setup for your pharmacy</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={exportSettings}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <label className="w-full sm:w-auto">
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="hidden"
            />
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </span>
            </Button>
          </label>
          <Button 
            variant="outline" 
            onClick={resetSettings}
            className="border-red-200 hover:bg-red-50 text-red-700 w-full sm:w-auto"
          >
            Reset All
          </Button>
        </div>
      </div>

      {/* Main Settings Card */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Store className="h-5 w-5 text-purple-500" />
            Basic Information
          </CardTitle>
          <CardDescription className="text-sm">
            Essential details for your pharmacy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pharmacyName" className="text-sm font-medium">Pharmacy Name *</Label>
              <Input
                id="pharmacyName"
                value={settings.pharmacyName}
                onChange={(e) => setSettings({
                  ...settings,
                  pharmacyName: e.target.value
                })}
                placeholder="Your Pharmacy Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName" className="text-sm font-medium">Owner Name</Label>
              <Input
                id="ownerName"
                value={settings.ownerName}
                onChange={(e) => setSettings({
                  ...settings,
                  ownerName: e.target.value
                })}
                placeholder="Owner Name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
            <Input
              id="phone"
              value={settings.phone}
              onChange={(e) => setSettings({
                ...settings,
                phone: e.target.value
              })}
              placeholder="+92 300 1234567"
            />
          </div>

          {/* Currency & Tax */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
              <Select value={settings.currency} onValueChange={(value) => setSettings({
                ...settings,
                currency: value
              })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.name} ({curr.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate" className="text-sm font-medium">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={settings.taxRate}
                onChange={(e) => setSettings({
                  ...settings,
                  taxRate: Number(e.target.value) || 0
                })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button 
              onClick={saveSettings} 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex items-start space-x-3">
            <Globe className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-blue-900 text-sm sm:text-base">Quick Setup Tips</h4>
              <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
                <li>• Only pharmacy name is required to get started</li>
                <li>• Tax rate of 0% means no tax will be applied</li>
                <li>• You can always update these settings later</li>
                <li>• Export your settings to backup your configuration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
