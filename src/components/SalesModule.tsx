import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Search, Plus, Minus, Trash2, Receipt, CreditCard, Banknote, User, Scan, Calculator, Clock, AlertCircle, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { USBBarcodeScanner } from "./USBBarcodeScanner";
import { SettingsManager } from "@/utils/settings";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface Sale {
  id: string;
  billNumber: string;
  date: string;
  time: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
}

export const SalesModule = () => {
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [activeTab, setActiveTab] = useState("products");

  // Get settings from SettingsManager
  const getSettings = () => {
    const pharmacySettings = SettingsManager.getPharmacySettings();
    const systemSettings = SettingsManager.getSystemSettings();
    
    return {
      currency: pharmacySettings.currency || systemSettings.currency || 'PKR',
      taxRate: pharmacySettings.taxRate || systemSettings.taxRate || 0
    };
  };

  const { currency, taxRate } = getSettings();

  const getCurrencySymbol = (curr: string) => {
    return SettingsManager.getCurrencySymbol(curr);
  };

  // Fetch products from database
  const { data: products = [] } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .gt('stock_quantity', 0)
        .order('name');

      if (error) {
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch customers from database
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id
  });

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      let customerId = selectedCustomerId;
      
      // For debt payments, we need a customer
      if (paymentMethod === 'debt') {
        if (!customerId && customerName.trim()) {
          // Create new customer if name is provided
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert([{
              name: customerName.trim(),
              phone: customerPhone.trim() || null,
              user_id: user.id,
              outstanding_balance: 0 // Initial balance, will be updated below
            }])
            .select()
            .single();

          if (customerError) throw customerError;
          customerId = newCustomer.id;
        }
        
        if (!customerId) {
          throw new Error('Customer selection or name is required for debt transactions');
        }

        // Update customer's outstanding balance
        const { data: currentCustomer, error: fetchError } = await supabase
          .from('customers')
          .select('outstanding_balance')
          .eq('id', customerId)
          .single();

        if (fetchError) throw fetchError;

        const currentBalance = currentCustomer.outstanding_balance || 0;
        const newBalance = currentBalance + saleData.total;

        const { error: updateError } = await supabase
          .from('customers')
          .update({ outstanding_balance: newBalance })
          .eq('id', customerId);

        if (updateError) throw updateError;
      }
      
      // Create the sale record
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          user_id: user.id,
          customer_id: customerId || null,
          total_amount: saleData.total,
          discount: saleData.discount,
          payment_method: saleData.paymentMethod,
          notes: paymentMethod === 'debt' 
            ? `Debt transaction for ${customerName || 'Selected Customer'}. Products: ${cart.map(item => `${item.name} (${item.quantity})`).join(', ')}` 
            : saleData.customerName
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items and update product stock
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Create loan record for debt transactions with detailed product info
      if (paymentMethod === 'debt' && customerId) {
        const productDetails = cart.map(item => `${item.name} x${item.quantity}`).join(', ');
        
        const { error: loanError } = await supabase
          .from('customer_loans')
          .insert([{
            customer_id: customerId,
            sale_id: sale.id,
            amount: saleData.total,
            remaining_balance: saleData.total,
            notes: `Debt for products: ${productDetails}. Total amount: ${getCurrencySymbol(currency)}${saleData.total.toFixed(2)}`
          }]);

        if (loanError) {
          // Error creating loan record - non-critical
          // Don't throw error here to avoid blocking the sale, but log it
        }
      }

      // Update product stock quantities
      for (const item of cart) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            stock_quantity: item.stock - item.quantity 
          })
          .eq('id', item.id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Sale Completed",
        description: paymentMethod === 'debt' 
          ? "Sale recorded and debt added to customer account with product details" 
          : "Sale recorded successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete sale: " + error.message,
        variant: "destructive"
      });
    }
  });

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock_quantity) {
        setCart(cart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      } else {
        toast({
          title: "Stock Limit Reached",
          description: "Cannot add more items than available in stock",
          variant: "destructive"
        });
      }
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        stock: product.stock_quantity
      }]);
    }
    setSearchTerm("");
  };

  // Handle barcode scanned products
  const handleBarcodeScanned = (barcode: string) => {
    // Find the actual product from our products list by barcode
    const actualProduct = products.find(p => p.batch_number === barcode);
    
    if (actualProduct) {
      addToCart(actualProduct);
      toast({
        title: "Product Added!",
        description: `${actualProduct.name} has been added to cart`,
      });
    } else {
      // Product not found - don't add to cart
      toast({
        title: "Product Not Found",
        description: `Barcode ${barcode} not found in inventory. Please add this product first.`,
        variant: "destructive",
      });
    }
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    const item = cart.find(item => item.id === id);
    
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else if (item && newQuantity <= item.stock) {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    } else {
      toast({
        title: "Insufficient Stock",
        description: "Cannot add more items than available in stock",
        variant: "destructive"
      });
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = taxRate > 0 ? subtotal * (taxRate / 100) : 0;
  const total = subtotal - discount + tax;

  const generateBill = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before generating bill",
        variant: "destructive"
      });
      return;
    }

    if (paymentMethod === 'debt' && !customerName.trim() && !selectedCustomerId) {
      toast({
        title: "Customer Required",
        description: "Please select a customer or enter customer name for debt transactions",
        variant: "destructive"
      });
      return;
    }

    const sale: Sale = {
      id: Date.now().toString(),
      billNumber: `BILL-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      items: [...cart],
      subtotal,
      discount,
      tax,
      total,
      paymentMethod,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined
    };

    setCurrentSale(sale);
    setShowReceiptDialog(true);
    
    // Save to database
    await createSaleMutation.mutateAsync({
      total,
      discount,
      paymentMethod,
      customerName
    });

    // Clear cart after generating bill
    setCart([]);
    setDiscount(0);
    setCustomerName("");
    setCustomerPhone("");
    setSelectedCustomerId("");
    setPaymentMethod("cash");
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCustomerName("");
    setCustomerPhone("");
    setSelectedCustomerId("");
    setPaymentMethod("cash");
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from cart"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            Sales & Billing
          </h2>
          <p className="text-slate-600 mt-1">Generate bills and manage sales transactions</p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-600">{getCurrencySymbol(currency)}{total.toFixed(2)}</div>
            <div className="text-sm text-slate-500">Total Amount</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold text-slate-700">{cart.length}</div>
            <div className="text-sm text-slate-500">Items in Cart</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Products & Cart */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Products Section */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Search className="h-5 w-5 text-blue-500" />
                Search & Add Products
              </CardTitle>
              <CardDescription className="text-sm">Search products by name or use barcode scanner below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 sm:space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search products by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Search Results */}
                {searchTerm && (
                  <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => addToCart(product)}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{product.name}</div>
                            <div className="text-sm text-slate-500 flex items-center gap-4">
                              <span>{getCurrencySymbol(currency)}{Number(product.price).toFixed(2)}</span>
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                Stock: {product.stock_quantity}
                              </span>
                            </div>
                          </div>
                          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-slate-500">
                        No products found matching "{searchTerm}"
                      </div>
                    )}
                  </div>
                )}
                
                {!searchTerm && (
                  <div className="text-center py-8 text-slate-500">
                    <Search className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>Start typing to search products</p>
                    <p className="text-sm">Or use the barcode scanner below</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shopping Cart */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-emerald-500" />
                  Shopping Cart
                  <Badge variant="secondary" className="ml-2">{cart.length} items</Badge>
                </div>
                {cart.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Clear Cart
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 font-medium">Your cart is empty</p>
                  <p className="text-slate-400 text-sm">Add products to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{item.name}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-4">
                          <span>{getCurrencySymbol(currency)}{item.price.toFixed(2)} each</span>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            Stock: {item.stock}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 bg-white rounded-lg border px-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <div className="font-semibold text-emerald-600">{getCurrencySymbol(currency)}{(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Barcode Scanner Section */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5 text-green-500" />
                Barcode Scanner
              </CardTitle>
              <CardDescription>Scan product barcodes to quickly add to cart</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <USBBarcodeScanner 
                  onBarcodeScanned={handleBarcodeScanned}
                  className="w-full max-w-md"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Bill Summary & Payment */}
        <div className="space-y-4 sm:space-y-6">
          {/* Customer Information */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <User className="h-5 w-5 text-violet-500" />
                Customer Information
                {paymentMethod === 'debt' && <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="customer" className="text-sm font-medium">Select Existing Customer</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{customer.name}</span>
                            {customer.outstanding_balance > 0 && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                Debt: {getCurrencySymbol(currency)}{Number(customer.outstanding_balance).toFixed(2)}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">Or</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="customerName" className="text-sm font-medium">Enter New Customer Name</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                    className="mt-1"
                  />
                </div>
                
                {paymentMethod === 'debt' && (
                  <div>
                    <Label htmlFor="customerPhone" className="text-sm font-medium">Phone Number</Label>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone number"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bill Summary */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Calculator className="h-5 w-5 text-emerald-600" />
                Bill Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-3 sm:space-y-4">
                {/* Summary Details */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-base sm:text-lg">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-semibold">{getCurrencySymbol(currency)}{subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="discount" className="text-sm font-medium">Discount</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      placeholder="0.00"
                      className="text-right"
                    />
                  </div>

                  {taxRate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tax ({taxRate}%):</span>
                      <span className="font-semibold">{getCurrencySymbol(currency)}{tax.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg sm:text-xl font-bold text-emerald-600">
                      <span>Total:</span>
                      <span>{getCurrencySymbol(currency)}{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">
                        <div className="flex items-center">
                          <Banknote className="h-4 w-4 mr-2" />
                          Cash Payment
                        </div>
                      </SelectItem>
                      <SelectItem value="card">
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Card Payment
                        </div>
                      </SelectItem>
                      <SelectItem value="debt">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Debt Transaction
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {paymentMethod === 'debt' && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-amber-800">
                        <strong>Note:</strong> Amount will be added to customer's debt account and can be paid later.
                      </div>
                    </div>
                  )}
                </div>

                {/* Generate Bill Button */}
                <Button 
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg text-base sm:text-lg py-4 sm:py-6 mt-4 sm:mt-6"
                  onClick={generateBill}
                  disabled={cart.length === 0 || createSaleMutation.isPending}
                >
                  <Receipt className="h-5 w-5 mr-2" />
                  {createSaleMutation.isPending ? 'Processing...' : 'Generate Bill'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bill Receipt</DialogTitle>
            <DialogDescription>Transaction completed successfully</DialogDescription>
          </DialogHeader>
          {currentSale && (
            <div className="space-y-4 font-mono text-sm">
              <div className="text-center border-b pb-4">
                <h3 className="font-bold text-lg">
                  {(() => {
                    const settings = localStorage.getItem('pharmacySettings');
                    if (settings) {
                      const parsed = JSON.parse(settings);
                      return parsed.pharmacyName || 'Pharmacy';
                    }
                    return 'Pharmacy';
                  })()}
                </h3>
                <p>Thank you for your business</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Bill No:</span>
                  <span>{currentSale.billNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{currentSale.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span>{currentSale.time}</span>
                </div>
                {currentSale.customerName && (
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{currentSale.customerName}</span>
                  </div>
                )}
                {currentSale.customerPhone && (
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span>{currentSale.customerPhone}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-b py-4 space-y-2">
                {currentSale.items.map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between">
                      <span>{item.name}</span>
                      <span>{getCurrencySymbol(currency)}{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.quantity} x {getCurrencySymbol(currency)}{item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{getCurrencySymbol(currency)}{currentSale.subtotal.toFixed(2)}</span>
                </div>
                {currentSale.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-{getCurrencySymbol(currency)}{currentSale.discount.toFixed(2)}</span>
                  </div>
                )}
                {currentSale.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{getCurrencySymbol(currency)}{currentSale.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-1">
                  <span>Total:</span>
                  <span>{getCurrencySymbol(currency)}{currentSale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <span className="capitalize">{currentSale.paymentMethod}</span>
                </div>
                {currentSale.paymentMethod === 'debt' && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-2">
                    Amount added to customer's debt account
                  </div>
                )}
              </div>

              <div className="text-center text-xs text-slate-500 border-t pt-4">
                <p>Thank you for your business!</p>
                <p>Have a great day!</p>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              Print Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
