
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Calendar, DollarSign, Scan, Building2, FileText, ShoppingCart, TrendingUp } from "lucide-react";

interface ProductViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  currency: string;
}

export const ProductViewDialog = ({
  open,
  onOpenChange,
  product,
  currency
}: ProductViewDialogProps) => {
  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'PKR': return 'PKR ';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'INR': return '₹';
      default: return curr + ' ';
    }
  };

  const calculateProfitMargin = () => {
    if (product?.cost && product?.price) {
      const margin = ((product.price - product.cost) / product.cost * 100).toFixed(1);
      return `${margin}%`;
    }
    return 'N/A';
  };

  const calculateProfit = () => {
    if (product?.cost && product?.price) {
      return (product.price - product.cost).toFixed(2);
    }
    return '0.00';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Product Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Product Name and Category */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{product?.name}</h3>
            <Badge variant="outline" className="mt-1">{product?.category}</Badge>
          </div>

          {/* Price Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <ShoppingCart className="h-4 w-4" />
                Purchase Price
              </div>
              <p className="font-semibold text-lg text-red-600">
                {getCurrencySymbol(currency)}{product?.cost?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <DollarSign className="h-4 w-4" />
                Sale Price
              </div>
              <p className="font-semibold text-lg text-green-600">
                {getCurrencySymbol(currency)}{product?.price?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          {/* Profit Margin */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-green-700">
                <TrendingUp className="h-4 w-4" />
                Profit Margin
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-800">{calculateProfitMargin()}</p>
                <p className="text-xs text-green-600">
                  Profit: {getCurrencySymbol(currency)}{calculateProfit()}
                </p>
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Package className="h-4 w-4" />
              Stock Quantity
            </div>
            <p className="font-semibold text-lg">{product?.stock_quantity} units</p>
          </div>

          {/* Additional Details */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Minimum Stock:</span>
              <span className="font-medium">{product?.minimum_stock} units</span>
            </div>

            {product?.batch_number && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Scan className="h-3 w-3" />
                  Batch Number:
                </span>
                <span className="font-medium">{product.batch_number}</span>
              </div>
            )}

            {product?.manufacturer && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Manufacturer:
                </span>
                <span className="font-medium">{product.manufacturer}</span>
              </div>
            )}

            {product?.expiry_date && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Expiry Date:
                </span>
                <span className="font-medium">
                  {new Date(product.expiry_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {product?.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <FileText className="h-3 w-3" />
                Description
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                {product.description}
              </p>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <span>Created:</span>
              <p>{new Date(product?.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <span>Updated:</span>
              <p>{new Date(product?.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
