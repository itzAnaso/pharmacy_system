export interface PharmacySettings {
  pharmacyName: string;
  ownerName: string;
  phone: string;
  currency: string;
  taxRate: number;
}

export interface SystemSettings {
  currency: string;
  taxRate: number;
  notifications: boolean;
  lowStockThreshold: number;
  autoBackup: boolean;
}

export class SettingsManager {
  private static PHARMACY_SETTINGS_KEY = 'pharmacySettings';
  private static SYSTEM_SETTINGS_KEY = 'systemSettings';

  static getPharmacySettings(): PharmacySettings {
    try {
      const saved = localStorage.getItem(this.PHARMACY_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          pharmacyName: parsed.pharmacyName || '',
          ownerName: parsed.ownerName || '',
          phone: parsed.phone || '',
          currency: parsed.currency || 'PKR',
          taxRate: parsed.taxRate || 0
        };
      }
    } catch (error) {
      console.error('Error loading pharmacy settings:', error);
    }
    
    return {
      pharmacyName: '',
      ownerName: '',
      phone: '',
      currency: 'PKR',
      taxRate: 0
    };
  }

  static getSystemSettings(): SystemSettings {
    try {
      const saved = localStorage.getItem(this.SYSTEM_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          currency: parsed.currency || 'PKR',
          taxRate: parsed.taxRate || 0,
          notifications: parsed.notifications !== false,
          lowStockThreshold: parsed.lowStockThreshold || 10,
          autoBackup: parsed.autoBackup !== false
        };
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
    }
    
    return {
      currency: 'PKR',
      taxRate: 0,
      notifications: true,
      lowStockThreshold: 10,
      autoBackup: true
    };
  }

  static savePharmacySettings(settings: Partial<PharmacySettings>): void {
    try {
      const current = this.getPharmacySettings();
      const updated = { ...current, ...settings };
      
      localStorage.setItem(this.PHARMACY_SETTINGS_KEY, JSON.stringify(updated));
      
      // Also save to system settings for backward compatibility
      const systemSettings = this.getSystemSettings();
      systemSettings.currency = updated.currency;
      systemSettings.taxRate = updated.taxRate;
      localStorage.setItem(this.SYSTEM_SETTINGS_KEY, JSON.stringify(systemSettings));
      
      // Trigger storage event to update other components
      window.dispatchEvent(new Event('storage'));
      
      console.log('Pharmacy settings saved:', updated);
    } catch (error) {
      console.error('Error saving pharmacy settings:', error);
    }
  }

  static saveSystemSettings(settings: Partial<SystemSettings>): void {
    try {
      const current = this.getSystemSettings();
      const updated = { ...current, ...settings };
      
      localStorage.setItem(this.SYSTEM_SETTINGS_KEY, JSON.stringify(updated));
      
      // Trigger storage event to update other components
      window.dispatchEvent(new Event('storage'));
      
      console.log('System settings saved:', updated);
    } catch (error) {
      console.error('Error saving system settings:', error);
    }
  }

  static getCurrencySymbol(currencyCode: string): string {
    const symbols: Record<string, string> = {
      'PKR': 'PKR ',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹'
    };
    return symbols[currencyCode] || currencyCode + ' ';
  }

  static resetAllSettings(): void {
    try {
      localStorage.removeItem(this.PHARMACY_SETTINGS_KEY);
      localStorage.removeItem(this.SYSTEM_SETTINGS_KEY);
      localStorage.removeItem('receiptSettings');
      
      // Trigger storage event to update other components
      window.dispatchEvent(new Event('storage'));
      
      console.log('All settings reset');
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  }

  static exportSettings(): string {
    try {
      const pharmacySettings = this.getPharmacySettings();
      const systemSettings = this.getSystemSettings();
      
      return JSON.stringify({
        pharmacySettings,
        systemSettings,
        exportDate: new Date().toISOString()
      }, null, 2);
    } catch (error) {
      console.error('Error exporting settings:', error);
      return '';
    }
  }

  static importSettings(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.pharmacySettings) {
        localStorage.setItem(this.PHARMACY_SETTINGS_KEY, JSON.stringify(data.pharmacySettings));
      }
      
      if (data.systemSettings) {
        localStorage.setItem(this.SYSTEM_SETTINGS_KEY, JSON.stringify(data.systemSettings));
      }
      
      // Trigger storage event to update other components
      window.dispatchEvent(new Event('storage'));
      
      console.log('Settings imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  }
} 