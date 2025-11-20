
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ProductDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  onConfirm: () => void;
}

export const ProductDeleteDialog = ({
  open,
  onOpenChange,
  product,
  onConfirm
}: ProductDeleteDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Product
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this product? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">Product to be deleted:</h4>
          <div className="space-y-1">
            <p className="font-semibold text-red-900">{product?.name}</p>
            <p className="text-sm text-red-700">Category: {product?.category}</p>
            <p className="text-sm text-red-700">Stock: {product?.stock_quantity} units</p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
          >
            Delete Product
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
