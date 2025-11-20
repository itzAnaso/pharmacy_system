
import { useState, useEffect } from 'react';

interface Settings {
  pharmacyName: string;
  ownerName: string;
  phone: string;
  currency: string;
  taxRate: number;
}

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>({
    pharmacyName: "",
    ownerName: "",
    phone: "",
    currency: "PKR",
    taxRate: 0
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('pharmacySettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings({
        pharmacyName: parsed.pharmacyName || "",
        ownerName: parsed.ownerName || "",
        phone: parsed.phone || "",
        currency: parsed.currency || "PKR",
        taxRate: parsed.taxRate || 0
      });
    }
  }, []);

  const getCurrencySymbol = (currencyCode: string) => {
    const symbols: Record<string, string> = {
      'PKR': 'PKR ',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹'
    };
    return symbols[currencyCode] || currencyCode;
  };

  return { settings, getCurrencySymbol };
};
