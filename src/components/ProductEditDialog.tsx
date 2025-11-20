
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";

interface ProductEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  currency: string;
}

export const ProductEditDialog = ({
  open,
  onOpenChange,
  product,
  currency
}: ProductEditDialogProps) => {
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: 0,
    cost: 0,
    stock_quantity: 0,
    minimum_stock: 5,
    expiry_date: "",
    batch_number: "",
    manufacturer: "",
    description: ""
  });

  useEffect(() => {
    if (product && open) {
      setFormData({
        name: product.name || "",
        category: product.category || "",
        price: product.price || 0,
        cost: product.cost || 0,
        stock_quantity: product.stock_quantity || 0,
        minimum_stock: product.minimum_stock || 5,
        expiry_date: product.expiry_date || "",
        batch_number: product.batch_number || "",
        manufacturer: product.manufacturer || "",
        description: product.description || ""
      });
    }
  }, [product, open]);

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'PKR': return 'PKR ';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'INR': return '₹';
      case 'JPY': return '¥';
      case 'CAD': return 'C$';
      case 'AUD': return 'A$';
      default: return curr + ' ';
    }
  };

  const updateProductMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      if (!user?.id || !product?.id) throw new Error('User not authenticated or product not found');
      
      // Updating product
      
      const { data, error } = await supabase
        .from('products')
        .update(updatedData)
        .eq('id', product.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        // Error updating product
        throw error;
      }
      
      // Product updated successfully
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Product updated successfully"
      });
    },
    onError: (error: any) => {
      // Update product error
      toast({
        title: "Error",
        description: "Failed to update product: " + error.message,
        variant: "destructive"
      });
    }
  });

  const handleUpdateProduct = () => {
    if (!formData.name.trim() || !formData.category.trim()) {
      toast({
        title: "Error",
        description: "Product name and category are required",
        variant: "destructive"
      });
      return;
    }

    if (formData.price <= 0) {
      toast({
        title: "Error",
        description: "Price must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    updateProductMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Product</DialogTitle>
          <DialogDescription>Update product details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter product name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Input
                id="edit-category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="e.g., Tablet, Syrup"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price ({getCurrencySymbol(currency)}) *</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cost">Cost ({getCurrencySymbol(currency)})</Label>
              <Input
                id="edit-cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: Number(e.target.value)})}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-stock">Stock Quantity *</Label>
              <Input
                id="edit-stock"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({...formData, stock_quantity: Number(e.target.value)})}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-minStock">Minimum Stock</Label>
              <Input
                id="edit-minStock"
                type="number"
                value={formData.minimum_stock}
                onChange={(e) => setFormData({...formData, minimum_stock: Number(e.target.value)})}
                placeholder="5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-expiry">Expiry Date</Label>
            <Input
              id="edit-expiry"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-batch">Batch Number</Label>
              <Input
                id="edit-batch"
                value={formData.batch_number}
                onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                placeholder="Enter batch number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manufacturer">Manufacturer</Label>
              <Input
                id="edit-manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                placeholder="Enter manufacturer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Enter description"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateProduct}
            disabled={updateProductMutation.isPending}
          >
            {updateProductMutation.isPending ? 'Updating...' : 'Update Product'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
