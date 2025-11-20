
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AIRequest {
  prompt?: string;
  type: 'product_description' | 'search_enhancement' | 'inventory_suggestion' | 'customer_support' | 'product_analysis' | 'pricing_suggestion';
  productName?: string;
  category?: string;
  context?: any;
}

export const useOpenRouterAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateAIContent = async (request: AIRequest): Promise<string | null> => {
    setIsLoading(true);
    try {
      console.log('AI request:', request);
      
      // Check if functions are available
      if (!supabase.functions || typeof supabase.functions.invoke !== 'function') {
        throw new Error('AI functions are not available in local mode');
      }
      
      const { data, error } = await supabase.functions.invoke('deepseek-ai', {
        body: request
      });

      console.log('AI response:', data, error);

      if (error) {
        console.error('AI function error:', error);
        // Check if it's a local mode error
        if (error.name === 'LocalModeError' || error.message?.includes('local mode')) {
          toast({
            title: "AI Feature Unavailable",
            description: "AI features require Supabase setup. The app is running in local mode.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "AI Error",
            description: "Failed to generate AI content. Please try again.",
            variant: "destructive",
          });
        }
        return null;
      }

      if (data?.success && data?.generatedText) {
        return data.generatedText;
      } else {
        console.error('AI response error:', data?.error);
        toast({
          title: "AI Error",
          description: data?.error || "Failed to generate content",
          variant: "destructive",
        });
        return null;
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      // Handle local mode gracefully
      if (error?.message?.includes('local mode') || error?.name === 'LocalModeError') {
        toast({
          title: "AI Feature Unavailable",
          description: "AI features are not available in local mode. Other features work normally.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "AI Error",
          description: "Failed to connect to AI service. Please try again.",
          variant: "destructive",
        });
      }
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

  const analyzeProduct = async (productData: any) => {
    return generateAIContent({
      type: 'product_analysis',
      prompt: `Analyze this product data and provide insights: ${JSON.stringify(productData)}`,
      context: productData
    });
  };

  const suggestPricing = async (productName: string, category: string, cost?: number) => {
    return generateAIContent({
      type: 'pricing_suggestion',
      prompt: `Suggest optimal pricing for ${productName} in ${category} category${cost ? ` with cost ${cost}` : ''}`,
      productName,
      category,
      context: { cost }
    });
  };

  return {
    isLoading,
    generateProductDescription,
    enhanceSearch,
    getInventorySuggestion,
    getCustomerSupport,
    analyzeProduct,
    suggestPricing,
    generateAIContent
  };
};
