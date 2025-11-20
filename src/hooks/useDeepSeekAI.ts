import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface AIRequest {
  prompt?: string;
  type: 'product_description' | 'search_enhancement' | 'inventory_suggestion' | 'customer_support';
  productName?: string;
  category?: string;
}

export const useOpenRouterAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateAIContent = async (request: AIRequest): Promise<string | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('deepseek-ai', {
        body: request
      });

      if (error) {
        console.error('AI function error:', error);
        toast({
          title: "AI Error",
          description: "Failed to generate AI content. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      if (data?.success) {
        return data.generatedText;
      } else {
        throw new Error(data?.error || 'Unknown AI error');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: "AI Error",
        description: "Failed to connect to AI service. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateProductDescription = async (productName: string, category?: string) => {
    return generateAIContent({
      type: 'product_description',
      productName,
      category
    });
  };

  const enhanceSearch = async (searchQuery: string) => {
    return generateAIContent({
      type: 'search_enhancement',
      prompt: searchQuery
    });
  };

  const getInventorySuggestion = async (prompt: string) => {
    return generateAIContent({
      type: 'inventory_suggestion',
      prompt
    });
  };

  const getCustomerSupport = async (query: string) => {
    return generateAIContent({
      type: 'customer_support',
      prompt: query
    });
  };

  return {
    isLoading,
    generateProductDescription,
    enhanceSearch,
    getInventorySuggestion,
    getCustomerSupport,
    generateAIContent
  };
};