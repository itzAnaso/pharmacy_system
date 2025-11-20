import React, { useState, useEffect } from 'react';
import { useUser } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Eye,
  TrendingDown,
  Calendar,
  Scan
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { SimpleProductForm } from "./SimpleProductForm";
import { ProductSuggestions } from "./ProductSuggestions";
import { ProductEditDialog } from "./ProductEditDialog";
import { ProductViewDialog } from "./ProductViewDialog";
import { ProductDeleteDialog } from "./ProductDeleteDialog";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  description?: string;
  expiry_date?: string;
  created_at: string;
  batch_number?: string;
  cost: number;
  manufacturer?: string;
  minimum_stock: number;
  updated_at: string;
  user_id: string;
}

export const ProductManagement = () => {
  const { user } = useUser();
  const { settings, getCurrencySymbol } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchProducts();
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      // Error deleting product
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(product => product.stock_quantity <= product.minimum_stock);
  const expiringSoonProducts = products.filter(product => {
    if (!product.expiry_date) return false;
    const expiryDate = new Date(product.expiry_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow;
  });

  const handleProductAdded = () => {
    fetchProducts();
    setActiveTab('list');
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowViewDialog(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Simple Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your inventory</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs sm:text-sm">{products.length} Products</Badge>
          {lowStockProducts.length > 0 && (
            <Badge variant="destructive" className="text-xs sm:text-sm">{lowStockProducts.length} Low Stock</Badge>
          )}
        </div>
      </div>

      {/* Simple Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-auto sm:h-10">
          <TabsTrigger value="list" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 text-xs sm:text-sm">
            <Package className="h-4 w-4" />
            <span>Products</span>
          </TabsTrigger>
          <TabsTrigger value="add" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 text-xs sm:text-sm">
            <Plus className="h-4 w-4" />
            <span>Add New</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 text-xs sm:text-sm">
            <Search className="h-4 w-4" />
            <span>Browse</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Simple Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 sm:h-9"
              />
            </div>
          </div>

          {/* Alert Cards */}
          {(lowStockProducts.length > 0 || expiringSoonProducts.length > 0) && (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {lowStockProducts.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      <span className="font-medium text-orange-800 text-sm sm:text-base">Low Stock Alert</span>
                    </div>
                    <p className="text-xs sm:text-sm text-orange-700">
                      {lowStockProducts.length} products running low
                    </p>
                  </CardContent>
                </Card>
              )}

              {expiringSoonProducts.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span className="font-medium text-red-800 text-sm sm:text-base">Expiry Alert</span>
                    </div>
                    <p className="text-xs sm:text-sm text-red-700">
                      {expiringSoonProducts.length} products expiring soon
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                <Package className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 text-center">No Products Found</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4 text-center">
                  {searchTerm ? 'Try adjusting your search' : 'Start by adding your first product'}
                </p>
                <Button onClick={() => setActiveTab('add')} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{product.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{product.category}</p>
                          {product.batch_number && (
                            <div className="flex items-center gap-1 mt-1">
                              <Scan className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span className="text-xs text-gray-500 truncate">{product.batch_number}</span>
                            </div>
                          )}
                        </div>
                        <Badge variant={product.stock_quantity <= product.minimum_stock ? 'destructive' : 'secondary'} className="ml-2 flex-shrink-0">
                          {product.stock_quantity}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-base sm:text-lg">
                          {getCurrencySymbol(settings.currency)}{product.price.toFixed(2)}
                        </span>
                        {product.expiry_date && (
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            Exp: {new Date(product.expiry_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 h-8 sm:h-9 text-xs sm:text-sm min-w-0"
                          onClick={() => handleViewProduct(product)}
                        >
                          <Eye className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="hidden sm:inline truncate">View</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 h-8 sm:h-9 text-xs sm:text-sm min-w-0"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="hidden sm:inline truncate">Edit</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 sm:h-9 w-8 sm:w-9 p-0 flex-shrink-0"
                          onClick={() => handleDeleteClick(product)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="add">
          <SimpleProductForm onSuccess={handleProductAdded} />
        </TabsContent>

        <TabsContent value="suggestions">
          <ProductSuggestions 
            onSelectProduct={() => setActiveTab('add')}
            onSelectCategory={() => setActiveTab('add')}
            onSelectBrand={() => setActiveTab('add')}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {selectedProduct && (
        <>
          <ProductViewDialog
            open={showViewDialog}
            onOpenChange={setShowViewDialog}
            product={selectedProduct}
            currency={settings.currency}
          />
          <ProductEditDialog
            open={showEditDialog}
            onOpenChange={(open) => {
              setShowEditDialog(open);
              if (!open) fetchProducts();
            }}
            product={selectedProduct}
            currency={settings.currency}
          />
          <ProductDeleteDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            product={selectedProduct}
            onConfirm={() => {
              handleDeleteProduct(selectedProduct.id);
              setShowDeleteDialog(false);
            }}
          />
        </>
      )}
    </div>
  );
};
