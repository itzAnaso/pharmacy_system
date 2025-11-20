import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  TrendingDown,
  Calendar,
  Building2,
  Scan,
  History,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarcodeScanner } from "./BarcodeScanner";

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

export const InventoryScanner = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>([]);
  const [scanHistory, setScanHistory] = useState<ScannedProduct[]>([]);
  const [activeTab, setActiveTab] = useState('scanner');

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
  const handleBarcodeScanned = (scannedProduct: any) => {
    // Find the actual product from our products list
    const actualProduct = products.find(p => p.id === scannedProduct.id);
    
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
      // Handle unknown products (from simulation)
      const unknownProduct: ScannedProduct = {
        id: scannedProduct.id,
        name: scannedProduct.name,
        price: scannedProduct.price,
        stock_quantity: scannedProduct.stock_quantity,
        category: scannedProduct.category,
        batch_number: scannedProduct.batch_number,
        manufacturer: scannedProduct.manufacturer,
        minimum_stock: 5,
        cost: scannedProduct.price * 0.7 // Estimate cost
      };

      setScannedProducts(prev => [unknownProduct, ...prev]);
      setScanHistory(prev => [unknownProduct, ...prev.slice(0, 49)]);
      
      toast({
        title: "Unknown Product",
        description: `${scannedProduct.name} not found in database`,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <Scan className="h-4 w-4 text-white" />
          </div>
          Inventory Scanner
        </h2>
        <p className="text-slate-600">Scan products to check inventory status and manage stock</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scanner">
            <Scan className="h-4 w-4 mr-2" />
            Scanner
          </TabsTrigger>
          <TabsTrigger value="scanned">
            <Package className="h-4 w-4 mr-2" />
            Scanned ({scannedProducts.length})
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alerts
            {(lowStockProducts.length > 0 || expiringProducts.length > 0) && (
              <Badge variant="destructive" className="ml-2">
                {lowStockProducts.length + expiringProducts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-6">
          {/* Scanner Interface */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Barcode Scanner</span>
                <BarcodeScanner 
                  onBarcodeDetected={handleBarcodeScanned}
                  mode="scan"
                />
              </CardTitle>
              <CardDescription>
                Use the scanner to check product inventory, stock levels, and expiry dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <Scan className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">Ready to Scan</p>
                <p className="text-sm">Click the scan button above to start scanning products</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Scanned</p>
                    <p className="text-2xl font-bold">{scannedProducts.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Low Stock</p>
                    <p className="text-2xl font-bold text-red-600">{lowStockProducts.length}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Expiring Soon</p>
                    <p className="text-2xl font-bold text-orange-600">{expiringProducts.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scanned" className="space-y-4">
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recently Scanned Products</CardTitle>
                <Button variant="outline" onClick={clearScannedProducts} disabled={scannedProducts.length === 0}>
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {scannedProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No products scanned yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expiry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scannedProducts.map((product) => {
                      const stockStatus = getStockStatus(product);
                      const expiryStatus = getExpiryStatus(product);
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-slate-500">{product.category}</div>
                              {product.batch_number && (
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                  <Scan className="h-3 w-3" />
                                  {product.batch_number}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{product.stock_quantity}</span>
                              <Badge variant={stockStatus.color}>{stockStatus.label}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">${product.price.toFixed(2)}</div>
                            <div className="text-sm text-slate-500">Cost: ${product.cost.toFixed(2)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant={stockStatus.color}>{stockStatus.label}</Badge>
                              {expiryStatus && (
                                <Badge variant={expiryStatus.color}>{expiryStatus.label}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.expiry_date ? (
                              <div className="text-sm">
                                {new Date(product.expiry_date).toLocaleDateString()}
                                {expiryStatus && (
                                  <Badge variant={expiryStatus.color} className="ml-2">
                                    {expiryStatus.label}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">No expiry</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {/* Low Stock Alerts */}
          {lowStockProducts.length > 0 && (
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  Low Stock Alerts ({lowStockProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-red-600">
                          Current: {product.stock_quantity} | Minimum: {product.minimum_stock}
                        </div>
                      </div>
                      <Badge variant="destructive">
                        {product.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expiry Alerts */}
          {expiringProducts.length > 0 && (
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Calendar className="h-5 w-5" />
                  Expiry Alerts ({expiringProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expiringProducts.map((product) => {
                    const expiryStatus = getExpiryStatus(product);
                    return (
                      <div key={product.id} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-orange-600">
                            Expires: {product.expiry_date && new Date(product.expiry_date).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="destructive">
                          {expiryStatus?.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {lowStockProducts.length === 0 && expiringProducts.length === 0 && (
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <p className="text-lg font-medium text-green-800">All Good!</p>
                  <p className="text-slate-600">No stock or expiry alerts at the moment</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Scan History</CardTitle>
              <CardDescription>Last 50 scanned products</CardDescription>
            </CardHeader>
            <CardContent>
              {scanHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <History className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No scan history available</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {scanHistory.map((product, index) => (
                    <div key={`${product.id}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-slate-500">
                          {product.category} • Stock: {product.stock_quantity}
                        </div>
                        {product.batch_number && (
                          <div className="text-xs text-slate-400">{product.batch_number}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${product.price.toFixed(2)}</div>
                        <Badge variant={getStockStatus(product).color}>
                          {getStockStatus(product).label}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 