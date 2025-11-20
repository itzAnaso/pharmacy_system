
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Package, 
  Users, 
  ShoppingCart,
  Lightbulb,
  X
} from 'lucide-react';

interface QuickAddProps {
  type: 'product' | 'customer' | 'sale';
  onAdd: (data: any) => void;
  suggestions?: string[];
}

export const QuickAdd = ({ type, onAdd, suggestions = [] }: QuickAddProps) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);

  const getIcon = () => {
    switch (type) {
      case 'product': return <Package className="h-4 w-4" />;
      case 'customer': return <Users className="h-4 w-4" />;
      case 'sale': return <ShoppingCart className="h-4 w-4" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'product': return 'Quick Add Product';
      case 'customer': return 'Quick Add Customer';
      case 'sale': return 'Quick Sale';
    }
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'product': return 'Enter product name...';
      case 'customer': return 'Enter customer name...';
      case 'sale': return 'Search product...';
    }
  };

  const quickSuggestions = {
    product: [
      'Paracetamol 500mg',
      'Ibuprofen 400mg',
      'Vitamin C',
      'Cough Syrup',
      'Hand Sanitizer',
      'Face Masks'
    ],
    customer: [
      'Walk-in Customer',
      'Regular Customer',
      'Senior Citizen'
    ],
    sale: [
      'Cash Sale',
      'Card Payment'
    ]
  };

  const currentSuggestions = suggestions.length > 0 ? suggestions : quickSuggestions[type];

  const handleQuickAdd = () => {
    if (!inputValue.trim()) return;

    const quickData = {
      product: {
        name: inputValue,
        price: 0,
        stock_quantity: 1,
        category: 'Medicine'
      },
      customer: {
        name: inputValue,
        phone: '',
        email: ''
      },
      sale: {
        product_name: inputValue,
        quantity: 1
      }
    };

    onAdd(quickData[type]);
    setInputValue('');
    setSelectedSuggestions([]);
  };

  const addSuggestion = (suggestion: string) => {
    if (!selectedSuggestions.includes(suggestion)) {
      setSelectedSuggestions([...selectedSuggestions, suggestion]);
    }
  };

  const removeSuggestion = (suggestion: string) => {
    setSelectedSuggestions(selectedSuggestions.filter(s => s !== suggestion));
  };

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-lg border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-white">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            {getIcon()}
          </div>
          {getTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={getPlaceholder()}
            className="pr-12 h-10 border-slate-200 dark:border-slate-700"
          />
          <Button
            onClick={handleQuickAdd}
            disabled={!inputValue.trim()}
            size="sm"
            className="absolute right-1 top-1 h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Selected Items */}
        {selectedSuggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Selected:</p>
            <div className="flex flex-wrap gap-2">
              {selectedSuggestions.map((suggestion, index) => (
                <Badge
                  key={index}
                  className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer px-2 py-1 flex items-center gap-1"
                  onClick={() => removeSuggestion(suggestion)}
                >
                  {suggestion}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Quick suggestions:
          </p>
          <div className="flex flex-wrap gap-2">
            {currentSuggestions.slice(0, 6).map((suggestion, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-600 px-2 py-1"
                onClick={() => addSuggestion(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>

        {/* Batch Add Button */}
        {selectedSuggestions.length > 0 && (
          <Button
            onClick={() => {
              selectedSuggestions.forEach(suggestion => {
                const quickData = {
                  product: {
                    name: suggestion,
                    price: 0,
                    stock_quantity: 1,
                    category: 'Medicine'
                  },
                  customer: {
                    name: suggestion,
                    phone: '',
                    email: ''
                  },
                  sale: {
                    product_name: suggestion,
                    quantity: 1
                  }
                };
                onAdd(quickData[type]);
              });
              setSelectedSuggestions([]);
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {selectedSuggestions.length} Items
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
