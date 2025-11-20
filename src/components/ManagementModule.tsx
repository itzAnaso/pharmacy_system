import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Scan, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  TrendingDown,
  Calendar,
  Settings,
  History,
  Search,
  Plus,
  Minus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { USBBarcodeScanner } from "./USBBarcodeScanner";
import { BarcodeGenerator } from "@/utils/barcodeGenerator";

interface ScannedProduct {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  category: string;
  batch_number?: string;
  manufacturer?: string;
  expiry_date?: string;
  minimum_stock: number;
  cost: number;
}

export const ManagementModule = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>([]);
  const [scanHistory, setScanHistory] = useState<ScannedProduct[]>([]);
  const [activeTab, setActiveTab] = useState('scanner');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all products for barcode lookup
  const { data: products = [] } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id
  });

  // Handle barcode scanned
  const handleBarcodeScanned = (barcode: string) => {
    // Find the actual product from our products list
    const actualProduct = products.find(p => p.batch_number === barcode);
    
    if (actualProduct) {
      const productWithDetails: ScannedProduct = {
        id: actualProduct.id,
        name: actualProduct.name,
        price: actualProduct.price,
        stock_quantity: actualProduct.stock_quantity,
        category: actualProduct.category,
        batch_number: actualProduct.batch_number,
        manufacturer: actualProduct.manufacturer,
        expiry_date: actualProduct.expiry_date,
        minimum_stock: actualProduct.minimum_stock,
        cost: actualProduct.cost
      };

      setScannedProducts(prev => [productWithDetails, ...prev]);
      setScanHistory(prev => [productWithDetails, ...prev.slice(0, 49)]); // Keep last 50 scans
      
      toast({
        title: "Product Found!",
        description: `${actualProduct.name} - Stock: ${actualProduct.stock_quantity}`,
      });
    } else {
      // Product not found
      toast({
        title: "Product Not Found",
        description: `Barcode ${barcode} not found in database. Please add this product first.`,
        variant: "destructive",
      });
    }
  };

  // Clear scanned products
  const clearScannedProducts = () => {
    setScannedProducts([]);
    toast({
      title: "Cleared",
      description: "Scanned products list has been cleared",
    });
  };

  // Get stock status
  const getStockStatus = (product: ScannedProduct) => {
    if (product.stock_quantity <= 0) {
      return { status: 'out', label: 'Out of Stock', color: 'destructive' as const };
    } else if (product.stock_quantity <= product.minimum_stock) {
      return { status: 'low', label: 'Low Stock', color: 'destructive' as const };
    } else {
      return { status: 'ok', label: 'In Stock', color: 'secondary' as const };
    }
  };

  // Get expiry status
  const getExpiryStatus = (product: ScannedProduct) => {
    if (!product.expiry_date) return null;
    
    const expiryDate = new Date(product.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expired', color: 'destructive' as const };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', label: `Expires in ${daysUntilExpiry} days`, color: 'destructive' as const };
    } else if (daysUntilExpiry <= 90) {
      return { status: 'warning', label: `Expires in ${daysUntilExpiry} days`, color: 'secondary' as const };
    }
    return null;
  };

  // Filter products by status
  const lowStockProducts = scannedProducts.filter(p => getStockStatus(p).status === 'low' || getStockStatus(p).status === 'out');
  const expiringProducts = scannedProducts.filter(p => getExpiryStatus(p)?.status === 'expired' || getExpiryStatus(p)?.status === 'expiring');

  // Filter products for search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.batch_number && product.batch_number.includes(searchTerm))
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Scan className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </div>
          <span className="text-lg sm:text-2xl lg:text-3xl">Management & Scanner</span>
        </h2>
        <p className="text-sm sm:text-base text-slate-600">Manage inventory, scan products, and monitor stock levels</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto sm:h-10">
          <TabsTrigger value="scanner" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 text-xs sm:text-sm">
            <Scan className="h-4 w-4" />
            <span>Scanner</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 text-xs sm:text-sm">
            <Package className="h-4 w-4" />
            <span>Inventory ({scannedProducts.length})</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 text-xs sm:text-sm">
            <Search className="h-4 w-4" />
            <span>Search</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 text-xs sm:text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Alerts</span>
            {(lowStockProducts.length > 0 || expiringProducts.length > 0) && (
              <Badge variant="destructive" className="ml-1 sm:ml-2 text-xs">
                {lowStockProducts.length + expiringProducts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4 sm:space-y-6">
          {/* USB Barcode Scanner */}
          <USBBarcodeScanner 
            onBarcodeScanned={handleBarcodeScanned}
            placeholder="Scan product barcode for inventory check..."
          />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm opacity-90">Scanned Today</p>
                    <p className="text-lg sm:text-xl font-bold">{scannedProducts.length}</p>
                  </div>
                  <Scan className="h-4 w-4 sm:h-5 sm:w-5 opacity-90" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm opacity-90">In Stock</p>
                    <p className="text-lg sm:text-xl font-bold">
                      {scannedProducts.filter(p => getStockStatus(p).status === 'ok').length}
                    </p>
                  </div>
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 opacity-90" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm opacity-90">Low Stock</p>
                    <p className="text-lg sm:text-xl font-bold">{lowStockProducts.length}</p>
                  </div>
                  <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 opacity-90" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm opacity-90">Expiring</p>
                    <p className="text-lg sm:text-xl font-bold">{expiringProducts.length}</p>
                  </div>
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 opacity-90" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Scans */}
          {scannedProducts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                  <CardTitle className="text-sm sm:text-base">Recent Scans</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearScannedProducts}
                    className="h-8 sm:h-9 text-xs sm:text-sm flex-shrink-0"
                  >
                  Clear All
                </Button>
              </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {scannedProducts.slice(0, 5).map((product) => {
                    const stockStatus = getStockStatus(product);
                    const expiryStatus = getExpiryStatus(product);
                    
                    return (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1 min-w-0 mr-3">
                          <h4 className="font-medium text-slate-900 text-sm sm:text-base truncate">{product.name}</h4>
                          <p className="text-xs sm:text-sm text-slate-500 truncate">{product.category}</p>
                          {product.batch_number && (
                            <p className="text-xs text-slate-400">Batch: {product.batch_number}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={stockStatus.color} className="text-xs">
                            {stockStatus.label}
                          </Badge>
                          {expiryStatus && (
                            <Badge variant={expiryStatus.color} className="text-xs">
                              {expiryStatus.label}
                            </Badge>
                          )}
                          <p className="text-sm sm:text-base font-semibold text-slate-900">
                            Stock: {product.stock_quantity}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base">Scanned Inventory</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Products scanned in current session
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {scannedProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Scan className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium text-sm sm:text-base">No products scanned</p>
                  <p className="text-slate-400 text-xs sm:text-sm">Use the scanner to check inventory</p>
                </div>
              ) : (
                <div className="space-y-3">
                    {scannedProducts.map((product) => {
                      const stockStatus = getStockStatus(product);
                      const expiryStatus = getExpiryStatus(product);
                      
                      return (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1 min-w-0 mr-3">
                          <h4 className="font-medium text-slate-900 text-sm sm:text-base truncate">{product.name}</h4>
                          <p className="text-xs sm:text-sm text-slate-500 truncate">{product.category}</p>
                              {product.batch_number && (
                            <p className="text-xs text-slate-400">Batch: {product.batch_number}</p>
                              )}
                            </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={stockStatus.color} className="text-xs">
                            {stockStatus.label}
                          </Badge>
                              {expiryStatus && (
                            <Badge variant={expiryStatus.color} className="text-xs">
                                    {expiryStatus.label}
                                  </Badge>
                                )}
                          <p className="text-sm sm:text-base font-semibold text-slate-900">
                            Stock: {product.stock_quantity}
                          </p>
                        </div>
                              </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base">Search Products</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Search by name, category, or batch number
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 sm:h-9"
                />
                </div>

                <div className="space-y-3">
                  {filteredProducts.slice(0, 10).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1 min-w-0 mr-3">
                        <h4 className="font-medium text-slate-900 text-sm sm:text-base truncate">{product.name}</h4>
                        <p className="text-xs sm:text-sm text-slate-500 truncate">{product.category}</p>
                          {product.batch_number && (
                          <p className="text-xs text-slate-400">Batch: {product.batch_number}</p>
                          )}
                        </div>
                      <div className="text-right">
                        <p className="text-sm sm:text-base font-semibold text-slate-900">
                          Stock: {product.stock_quantity}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500">
                          PKR {product.price.toFixed(2)}
                        </p>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4 sm:space-y-6">
          {/* Low Stock Alerts */}
          {lowStockProducts.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-orange-800 flex items-center gap-2 text-sm sm:text-base">
                  <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  Low Stock Alerts
                </CardTitle>
                <CardDescription className="text-orange-600 text-xs sm:text-sm">
                  {lowStockProducts.length} products need attention
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-orange-100 rounded-lg">
                      <div className="flex-1 min-w-0 mr-3">
                        <h4 className="font-medium text-orange-900 text-sm sm:text-base truncate">{product.name}</h4>
                        <p className="text-xs sm:text-sm text-orange-700 truncate">{product.category}</p>
                        </div>
                      <div className="text-right">
                        <p className="text-sm sm:text-base font-semibold text-orange-800">
                          {product.stock_quantity} left
                        </p>
                        <p className="text-xs sm:text-sm text-orange-600">
                          Min: {product.minimum_stock}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expiry Alerts */}
          {expiringProducts.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-800 flex items-center gap-2 text-sm sm:text-base">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  Expiry Alerts
                </CardTitle>
                <CardDescription className="text-red-600 text-xs sm:text-sm">
                  {expiringProducts.length} products expiring soon
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {expiringProducts.map((product) => {
                    const expiryStatus = getExpiryStatus(product);
                    return (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-red-100 rounded-lg">
                        <div className="flex-1 min-w-0 mr-3">
                          <h4 className="font-medium text-red-900 text-sm sm:text-base truncate">{product.name}</h4>
                          <p className="text-xs sm:text-sm text-red-700 truncate">{product.category}</p>
                          </div>
                        <div className="text-right">
                          <p className="text-sm sm:text-base font-semibold text-red-800">
                            {expiryStatus?.label}
                          </p>
                          <p className="text-xs sm:text-sm text-red-600">
                            Stock: {product.stock_quantity}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {lowStockProducts.length === 0 && expiringProducts.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-slate-500 font-medium text-sm sm:text-base">No alerts</p>
                <p className="text-slate-400 text-xs sm:text-sm">All products are well stocked and not expiring soon</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 