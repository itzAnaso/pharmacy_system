
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProductFormData {
  name: string;
  category: string;
  price: number;
  cost: number;
  stock_quantity: number;
  minimum_stock: number;
  description?: string;
  manufacturer?: string;
  batch_number?: string;
  expiry_date?: string;
}

export const useProductDuplicateHandler = (userId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [existingProduct, setExistingProduct] = useState<any>(null);
  const [newProductData, setNewProductData] = useState<ProductFormData | null>(null);

  // Check if product exists
  const checkProductExists = async (productName: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', productName)
        .limit(1);

      if (error) {
        console.error('Error checking product existence:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error in checkProductExists:', error);
      return null;
    }
  };

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      if (!userId) throw new Error('User not authenticated');
      
      console.log('Adding new product:', productData);
      
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productData,
          user_id: userId
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding product:', error);
        throw error;
      }
      
      console.log('Product added successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: "Product added successfully"
      });
    },
    onError: (error: any) => {
      console.error('Add product error:', error);
      toast({
        title: "Error",
        description: "Failed to add product: " + error.message,
        variant: "destructive"
      });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<ProductFormData> }) => {
      if (!userId) throw new Error('User not authenticated');
      
      console.log('Updating product:', { id, data, userId });
      
      const { data: updatedProduct, error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating product:', error);
        throw error;
      }

      console.log('Product updated successfully:', updatedProduct);
      return updatedProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowUpdateDialog(false);
      setExistingProduct(null);
      setNewProductData(null);
      toast({
        title: "Success",
        description: "Product updated successfully"
      });
    },
    onError: (error: any) => {
      console.error('Update product error:', error);
      toast({
        title: "Error",
        description: "Failed to update product: " + error.message,
        variant: "destructive"
      });
    }
  });

  // Handle product submission
  const handleProductSubmit = async (productData: ProductFormData) => {
    try {
      console.log('Handling product submission:', productData);
      
      const existing = await checkProductExists(productData.name);
      
      if (existing) {
        console.log('Found existing product:', existing);
        setExistingProduct(existing);
        setNewProductData(productData);
        setShowUpdateDialog(true);
        return;
      }

      // Product doesn't exist, create new one
      console.log('Product does not exist, creating new one');
      addProductMutation.mutate(productData);
    } catch (error) {
      console.error('Error in handleProductSubmit:', error);
      toast({
        title: "Error",
        description: "Failed to process product",
        variant: "destructive"
      });
    }
  };

  // Handle updating existing product
  const handleUpdateExisting = (updateData: Partial<ProductFormData>) => {
    if (!existingProduct) {
      console.error('No existing product to update');
      return;
    }
    
    console.log('Updating existing product with data:', updateData);
    
    updateProductMutation.mutate({
      id: existingProduct.id,
      data: updateData
    });
  };

  // Handle creating new product despite duplicate name
  const handleCreateNew = () => {
    if (!newProductData) {
      console.error('No new product data to create');
      return;
    }
    
    console.log('Creating new product despite duplicate name');
    
    addProductMutation.mutate(newProductData);
    setShowUpdateDialog(false);
    setExistingProduct(null);
    setNewProductData(null);
  };

  return {
    showUpdateDialog,
    setShowUpdateDialog,
    existingProduct,
    newProductData,
    handleProductSubmit,
    handleUpdateExisting,
    handleCreateNew,
    isSubmitting: addProductMutation.isPending || updateProductMutation.isPending
  };
};
