
import { useState } from 'react';
import { useUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SmartProductInput } from "./SmartProductInput";
import { BarcodeScanner } from "./BarcodeScanner";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { Package, Loader2, DollarSign, Calendar, Scan, ShoppingCart, TrendingUp } from "lucide-react";
import { pharmacyCategories } from "@/data/productSuggestions";

interface SimpleProductFormProps {
  onSuccess?: () => void;
}

export const SimpleProductForm = ({ onSuccess }: SimpleProductFormProps) => {
  const { user } = useUser();
  const { settings, getCurrencySymbol } = useSettings();
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [barcode, setBarcode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const handleBarcodeDetected = (detectedBarcode: string) => {
    setBarcode(detectedBarcode);
    toast({
      title: "Barcode Scanned!",
      description: `Barcode ${detectedBarcode} has been added to the product`,
    });
  };

  const calculateProfitMargin = () => {
    const purchase = parseFloat(purchasePrice);
    const sale = parseFloat(salePrice);
    if (purchase > 0 && sale > 0) {
      const margin = ((sale - purchase) / purchase * 100).toFixed(1);
      return `${margin}%`;
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productName || !purchasePrice || !salePrice || !stockQuantity) {
      toast({
        title: "Missing Information",
        description: "Please fill in product name, purchase price, sale price, and stock quantity",
        variant: "destructive",
      });
      return;
    }

    const purchase = parseFloat(purchasePrice);
    const sale = parseFloat(salePrice);
    
    if (purchase <= 0 || sale <= 0) {
      toast({
        title: "Invalid Prices",
        description: "Purchase and sale prices must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (sale <= purchase) {
      toast({
        title: "Price Warning",
        description: "Sale price should be higher than purchase price for profit",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add products",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          name: productName,
          category: category || 'General',
          cost: purchase, // Purchase price goes to cost field
          price: sale, // Sale price goes to price field
          stock_quantity: parseInt(stockQuantity),
          description: description || null,
          expiry_date: expiryDate || null,
          batch_number: barcode || null,
          user_id: user.id,
          minimum_stock: Math.ceil(parseInt(stockQuantity) * 0.1), // Auto-set minimum stock to 10% of initial stock
        });

      if (error) throw error;

      toast({
        title: "Product Added Successfully!",
        description: `${productName} has been added to your inventory`,
      });

      // Reset form
      setProductName('');
      setCategory('');
      setPurchasePrice('');
      setSalePrice('');
      setStockQuantity('');
      setDescription('');
      setExpiryDate('');
      setBarcode('');
      
      onSuccess?.();
    } catch (error) {
      // Error adding product
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Package className="h-6 w-6 text-blue-600" />
          Add New Product
        </CardTitle>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Fill in the required fields (*) to add a product to your inventory
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name with Smart Input */}
          <div className="space-y-2">
            <Label htmlFor="productName" className="text-base font-semibold">
              Product Name *
            </Label>
            <SmartProductInput
              value={productName}
              onChange={setProductName}
              placeholder="Type product name (e.g., Paracetamol 500mg)"
              className="h-12 text-base"
            />
          </div>

          {/* Barcode Scanner */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Scan className="h-4 w-4" />
              Barcode (Optional)
            </Label>
            <div className="flex gap-2">
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Enter or scan barcode"
                className="flex-1"
              />
              <BarcodeScanner onBarcodeDetected={handleBarcodeDetected} />
            </div>
          </div>

          {/* Purchase and Sale Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice" className="text-base font-semibold flex items-center gap-1">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                Cost Price ({getCurrencySymbol(settings.currency)}) *
              </Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="What you paid"
                className="h-12 text-base"
              />
              <p className="text-xs text-slate-500">What you bought it for</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice" className="text-base font-semibold flex items-center gap-1">
                <DollarSign className="h-5 w-5 text-green-600" />
                Selling Price ({getCurrencySymbol(settings.currency)}) *
              </Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="What you sell it for"
                className="h-12 text-base"
              />
              <p className="text-xs text-slate-500">What customers pay</p>
            </div>
          </div>

          {/* Profit Margin Display */}
          {purchasePrice && salePrice && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Profit Margin: {calculateProfitMargin()}
                </span>
                <span className="text-xs text-green-600">
                  (Profit: {getCurrencySymbol(settings.currency)}{(parseFloat(salePrice) - parseFloat(purchasePrice)).toFixed(2)})
                </span>
              </div>
            </div>
          )}

          {/* Stock Quantity */}
          <div className="space-y-2">
            <Label htmlFor="stockQuantity" className="text-base font-semibold">
              How Many In Stock? *
            </Label>
            <Input
              id="stockQuantity"
              type="number"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              placeholder="Enter number of items"
              className="h-12 text-base"
            />
            <p className="text-xs text-slate-500">Current quantity available</p>
          </div>

          {/* Category and Expiry */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {pharmacyCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate" className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Expiry Date
              </Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter product description (optional)"
              rows={3}
              className="resize-none"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Adding Product...
              </>
            ) : (
              <>
                <Package className="h-5 w-5 mr-2" />
                Add Product to Inventory
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
