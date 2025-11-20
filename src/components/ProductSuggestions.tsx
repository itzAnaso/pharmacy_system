
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Plus, 
  Lightbulb, 
  Package, 
  TrendingUp,
  Sparkles,
  ShoppingCart
} from "lucide-react";
import { getProductSuggestions, getRandomSuggestions, pharmacyCategories, popularBrands, dosageForms } from "@/data/productSuggestions";

interface ProductSuggestionsProps {
  onSelectProduct: (productName: string) => void;
  onSelectCategory: (category: string) => void;
  onSelectBrand: (brand: string) => void;
}

export const ProductSuggestions = ({ onSelectProduct, onSelectCategory, onSelectBrand }: ProductSuggestionsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState(getRandomSuggestions(12));

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      const newSuggestions = getProductSuggestions(term);
      setSuggestions(newSuggestions.length > 0 ? newSuggestions : getRandomSuggestions(8));
    } else {
      setSuggestions(getRandomSuggestions(12));
    }
  };

  return (
    <div className="space-y-6">
      {/* Smart Search */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-blue-600" />
            Smart Product Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, symptom, or use case (e.g., 'pain relief', 'cough')"
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Product Suggestions */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            {searchTerm ? 'Search Results' : 'Popular Products'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggestions.map((product, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:bg-blue-50 hover:border-blue-300"
                onClick={() => onSelectProduct(product)}
              >
                <div className="flex items-center gap-2 w-full">
                  <Package className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{product}</span>
                </div>
              </Button>
            ))}
          </div>
          {suggestions.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-2 text-slate-300" />
              <p>No products found. Try a different search term.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Product Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {pharmacyCategories.map((category) => (
              <Badge
                key={category}
                variant="outline"
                className="cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 px-3 py-1"
                onClick={() => onSelectCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Popular Brands */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Popular Brands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {popularBrands.map((brand) => (
              <Badge
                key={brand}
                variant="outline"
                className="cursor-pointer hover:bg-purple-50 hover:border-purple-300 px-3 py-1"
                onClick={() => onSelectBrand(brand)}
              >
                {brand}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-5 w-5 text-indigo-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="h-auto p-4 flex-col gap-2 hover:bg-indigo-50"
              onClick={() => setSuggestions(getRandomSuggestions(12))}
            >
              <TrendingUp className="h-6 w-6 text-indigo-600" />
              <span className="font-medium">Refresh Suggestions</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex-col gap-2 hover:bg-indigo-50"
              onClick={() => handleSearch('vitamin')}
            >
              <Sparkles className="h-6 w-6 text-emerald-600" />
              <span className="font-medium">View Vitamins</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex-col gap-2 hover:bg-indigo-50"
              onClick={() => handleSearch('antibiotic')}
            >
              <Plus className="h-6 w-6 text-amber-600" />
              <span className="font-medium">View Antibiotics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
