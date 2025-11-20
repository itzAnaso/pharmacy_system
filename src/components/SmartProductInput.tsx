
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Sparkles, Plus } from "lucide-react";
import { getProductSuggestions, commonMedicines } from "@/data/productSuggestions";
import { cn } from "@/lib/utils";

interface SmartProductInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SmartProductInput = ({ 
  value, 
  onChange, 
  placeholder = "Search products...",
  className 
}: SmartProductInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (value.length > 0) {
      const filtered = getProductSuggestions(value);
      setSuggestions(filtered.slice(0, 8));
      setIsOpen(filtered.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [value]);

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-4"
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onBlur={() => {
            // Delay closing to allow clicking on suggestions
            setTimeout(() => setIsOpen(false), 200);
          }}
        />
        {value && (
          <Sparkles className="absolute right-3 top-3 h-4 w-4 text-blue-500" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg border">
          <CardContent className="p-2 max-h-64 overflow-y-auto">
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-2 hover:bg-blue-50"
                  onClick={() => handleSelect(suggestion)}
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-3 w-3 text-blue-600" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
