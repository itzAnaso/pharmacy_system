import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, DollarSign } from "lucide-react";

interface ProductUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingProduct: any;
  newProductData: any;
  onUpdateExisting: (updateData: any) => void;
  onCreateNew: () => void;
  currency: string;
}

export const ProductUpdateDialog = ({
  open,
  onOpenChange,
  existingProduct,
  newProductData,
  onUpdateExisting,
  onCreateNew,
  currency
}: ProductUpdateDialogProps) => {
  const [updatePrice, setUpdatePrice] = useState(false);
  const [updateExpiry, setUpdateExpiry] = useState(false);
  const [newPrice, setNewPrice] = useState(newProductData?.price || "");
  const [newExpiry, setNewExpiry] = useState(newProductData?.expiry_date || "");
  const [additionalStock, setAdditionalStock] = useState(newProductData?.stock_quantity || 0);

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

  const handleUpdateExisting = () => {
    const updateData: any = {
      stock_quantity: existingProduct.stock_quantity + additionalStock
    };

    if (updatePrice && newPrice) {
      updateData.price = parseFloat(newPrice);
    }

    if (updateExpiry && newExpiry) {
      updateData.expiry_date = newExpiry;
    }

    onUpdateExisting(updateData);
  };

  const resetForm = () => {
    setUpdatePrice(false);
    setUpdateExpiry(false);
    setNewPrice(newProductData?.price || "");
    setNewExpiry(newProductData?.expiry_date || "");
    setAdditionalStock(newProductData?.stock_quantity || 0);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Product Already Exists
          </DialogTitle>
          <DialogDescription>
            A product with the name "{existingProduct?.name}" already exists. How would you like to proceed?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Product Info */}
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <h4 className="font-medium text-slate-900 dark:text-white mb-3">Current Product Details:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Current Stock:</p>
                <p className="font-medium">{existingProduct?.stock_quantity} units</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Current Price:</p>
                <p className="font-medium">{getCurrencySymbol(currency)}{existingProduct?.price}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Current Expiry:</p>
                <p className="font-medium">
                  {existingProduct?.expiry_date ? new Date(existingProduct.expiry_date).toLocaleDateString() : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Category:</p>
                <Badge variant="outline">{existingProduct?.category}</Badge>
              </div>
            </div>
          </div>

          {/* Update Options */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-900 dark:text-white">Update Options:</h4>
            
            {/* Stock Update */}
            <div className="space-y-2">
              <Label htmlFor="additional-stock">Add to Stock</Label>
              <Input
                id="additional-stock"
                type="number"
                min="0"
                value={additionalStock}
                onChange={(e) => setAdditionalStock(parseInt(e.target.value) || 0)}
                placeholder="Additional stock quantity"
                className="border-slate-200 dark:border-slate-700"
              />
              <p className="text-xs text-slate-500">
                New total stock: {existingProduct?.stock_quantity + additionalStock} units
              </p>
            </div>

            {/* Price Update */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="update-price"
                  checked={updatePrice}
                  onChange={(e) => setUpdatePrice(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <Label htmlFor="update-price" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Update Price
                </Label>
              </div>
              {updatePrice && (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="New price"
                  className="border-slate-200 dark:border-slate-700"
                />
              )}
            </div>

            {/* Expiry Update */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="update-expiry"
                  checked={updateExpiry}
                  onChange={(e) => setUpdateExpiry(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <Label htmlFor="update-expiry" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Update Expiry Date
                </Label>
              </div>
              {updateExpiry && (
                <Input
                  type="date"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  className="border-slate-200 dark:border-slate-700"
                />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleUpdateExisting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Update Existing Product
            </Button>
            <Button
              variant="outline"
              onClick={onCreateNew}
              className="flex-1"
            >
              Create New Product
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
