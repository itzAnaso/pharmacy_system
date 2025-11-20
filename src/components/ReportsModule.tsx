import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, Package, Calendar, Download, AlertTriangle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";

export const ReportsModule = () => {
  const [dateRange, setDateRange] = useState("7days");
  const { user } = useUser();
  const { toast } = useToast();
  const { settings, getCurrencySymbol } = useSettings();

  // Fetch sales data for reports
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-reports', user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const daysBack = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : dateRange === '90days' ? 90 : 365;
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - daysBack);

      const { data: sales, error } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      // Fetch sale items and products for each sale
      const salesWithDetails = await Promise.all(
        (sales || []).map(async (sale) => {
          // Get sale items
          const { data: saleItems } = await supabase
            .from('sale_items')
            .select('*')
            .eq('sale_id', sale.id);

          // Get product details for each sale item
          const itemsWithProducts = await Promise.all(
            (saleItems || []).map(async (item) => {
              const { data: product } = await supabase
                .from('products')
                .select('*')
                .eq('id', item.product_id)
                .single();

              return {
                ...item,
                product: product || null
              };
            })
          );

          // Get customer if exists
          let customer = null;
          if (sale.customer_id) {
            const { data: customerData } = await supabase
              .from('customers')
              .select('*')
              .eq('id', sale.customer_id)
              .single();
            customer = customerData;
          }

          return {
            ...sale,
            sale_items: itemsWithProducts,
            customer: customer
          };
        })
      );

      return salesWithDetails;
    },
    enabled: !!user?.id,
    refetchInterval: 60000 // Refetch every minute
  });

  // Fetch products for stock alerts
  const { data: lowStockProducts, isLoading: stockLoading } = useQuery({
    queryKey: ['low-stock-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .lt('stock_quantity', 10)
        .order('stock_quantity', { ascending: true });

      if (error) return [];
      return products || [];
    },
    enabled: !!user?.id,
    refetchInterval: 60000
  });

  // Fetch expired products
  const { data: expiredProducts, isLoading: expiredLoading } = useQuery({
    queryKey: ['expired-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const today = new Date().toISOString().split('T')[0];
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .lte('expiry_date', today)
        .order('expiry_date', { ascending: true });

      if (error) return [];
      return products || [];
    },
    enabled: !!user?.id,
    refetchInterval: 60000
  });

  // Calculate metrics
  const totalSales = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0) || 0;
  const totalProfit = salesData?.reduce((sum, sale) => {
    const saleProfit = (sale.sale_items || []).reduce((itemSum: number, item: any) => {
      const cost = Number(item.product?.cost || 0);
      const profit = Number(item.total_price || 0) - (Number(item.quantity || 0) * cost);
      return itemSum + profit;
    }, 0);
    return sum + saleProfit;
  }, 0) || 0;
  const productsSold = salesData?.reduce((sum, sale) => {
    return sum + ((sale.sale_items || []).reduce((itemSum: number, item: any) => itemSum + Number(item.quantity || 0), 0));
  }, 0) || 0;
  const averageSale = salesData && salesData.length > 0 ? totalSales / salesData.length : 0;

  const handleExport = async () => {
    try {
      if (!salesData || salesData.length === 0) {
        toast({
          title: "No Data",
          description: "No sales data to export",
          variant: "destructive"
        });
        return;
      }

      // Create CSV content
      const csvHeaders = "Date,Time,Customer,Total Amount,Payment Method,Items Count\n";
      const csvContent = salesData.map(sale => {
        const date = new Date(sale.created_at);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString();
        const customer = sale.customer?.name || 'Walk-in Customer';
        const amount = Number(sale.total_amount).toFixed(2);
        const paymentMethod = sale.payment_method;
        const itemsCount = (sale.sale_items || []).length;
        return `${dateStr},${timeStr},"${customer}",${amount},${paymentMethod},${itemsCount}`;
      }).join('\n');

      const fullCsv = csvHeaders + csvContent;

      // Create and download file
      const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Sales report has been downloaded"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export sales report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isLoading = salesLoading || stockLoading || expiredLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            Reports & Analytics
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Business insights and performance metrics</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-48 border-slate-300 h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 3 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            className="border-blue-300 hover:bg-blue-50 text-blue-700 h-11 font-medium"
            onClick={handleExport}
            disabled={!salesData || salesData.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Expired Products Alert */}
          {expiredProducts && expiredProducts.length > 0 && (
            <Card className="border-red-300 bg-red-50 dark:bg-red-900/20 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Expired Products Alert
                </CardTitle>
                <CardDescription className="text-red-600 dark:text-red-300">
                  {expiredProducts.length} product{expiredProducts.length > 1 ? 's' : ''} have expired
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {expiredProducts.slice(0, 5).map((product, index) => (
                    <div key={product.id || `expired-${index}`} className="flex justify-between items-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <span className="font-medium text-red-900 dark:text-red-100 truncate flex-1 mr-2">{product.name}</span>
                      <span className="text-sm text-red-700 dark:text-red-300 flex-shrink-0">
                        {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  ))}
                  {expiredProducts.length > 5 && (
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                      +{expiredProducts.length - 5} more expired product{expiredProducts.length - 5 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-500 to-green-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Total Sales</CardTitle>
                <DollarSign className="h-5 w-5 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl lg:text-3xl font-bold">{getCurrencySymbol(settings.currency)}{totalSales.toFixed(2)}</div>
                <p className="text-xs opacity-90 mt-1">
                  {salesData?.length || 0} transaction{salesData?.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Total Profit</CardTitle>
                <TrendingUp className="h-5 w-5 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl lg:text-3xl font-bold">{getCurrencySymbol(settings.currency)}{totalProfit.toFixed(2)}</div>
                <p className="text-xs opacity-90 mt-1">
                  {totalSales > 0 ? `${((totalProfit / totalSales) * 100).toFixed(1)}% margin` : 'No sales yet'}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Products Sold</CardTitle>
                <Package className="h-5 w-5 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl lg:text-3xl font-bold">{productsSold}</div>
                <p className="text-xs opacity-90 mt-1">
                  {productsSold > 0 ? 'Items sold' : 'No products sold'}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Low Stock</CardTitle>
                <Calendar className="h-5 w-5 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl lg:text-3xl font-bold">{lowStockProducts?.length || 0}</div>
                <p className="text-xs opacity-90 mt-1">
                  {lowStockProducts?.length ? 'Need restocking' : 'All items stocked'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          {salesData && salesData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-md border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">Average Sale</CardTitle>
                  <CardDescription>Average transaction value</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{getCurrencySymbol(settings.currency)}{averageSale.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card className="shadow-md border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">Total Transactions</CardTitle>
                  <CardDescription>Number of sales in selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-indigo-600">{salesData.length}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Sales & Stock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Sales */}
            <Card className="shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  Recent Sales
                </CardTitle>
                <CardDescription>Latest transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {salesData && salesData.length > 0 ? (
                  <div className="space-y-3">
                    {salesData.slice(0, 8).map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {sale.customer?.name || 'Walk-in Customer'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(sale.created_at).toLocaleDateString()} • {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">{getCurrencySymbol(settings.currency)}{Number(sale.total_amount).toFixed(2)}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{sale.payment_method}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No sales recorded</p>
                    <p className="text-slate-400 text-sm mt-1">Your recent sales will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Low Stock Products */}
            <Card className="shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-amber-600" />
                  Stock Alerts
                </CardTitle>
                <CardDescription>Products running low</CardDescription>
              </CardHeader>
              <CardContent>
                {lowStockProducts && lowStockProducts.length > 0 ? (
                  <div className="space-y-3">
                    {lowStockProducts.slice(0, 8).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{product.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{product.category}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-amber-600 dark:text-amber-400">{product.stock_quantity} left</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Min: {product.minimum_stock}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No stock alerts</p>
                    <p className="text-slate-400 text-sm mt-1">All items are well stocked</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
