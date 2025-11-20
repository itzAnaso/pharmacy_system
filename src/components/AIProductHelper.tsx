
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  MessageCircle,
  Lightbulb
} from "lucide-react";
import { useOpenRouterAI } from "@/hooks/useOpenRouterAI";
import { useToast } from "@/hooks/use-toast";

interface AIProductHelperProps {
  productName?: string;
  category?: string;
  cost?: number;
  onSuggestionApply?: (suggestion: any) => void;
}

export const AIProductHelper = ({ productName, category, cost, onSuggestionApply }: AIProductHelperProps) => {
  const [activeFeature, setActiveFeature] = useState<'description' | 'pricing' | 'analysis' | 'suggestions'>('description');
  const [result, setResult] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  
  const { 
    generateProductDescription, 
    suggestPricing, 
    analyzeProduct,
    getInventorySuggestion,
    isLoading 
  } = useOpenRouterAI();
  
  const { toast } = useToast();

  const handleAIAction = async (action: string) => {
    if (!productName && action !== 'suggestions') {
      toast({
        title: "Product Name Required",
        description: "Please enter a product name first.",
        variant: "destructive",
      });
      return;
    }

    let response: string | null = null;

    switch (action) {
      case 'description':
        response = await generateProductDescription(productName!, category);
        break;
      case 'pricing':
        response = await suggestPricing(productName!, category || 'Medicine', cost);
        break;
      case 'analysis':
        response = await analyzeProduct({ name: productName, category, cost });
        break;
      case 'suggestions':
        response = await getInventorySuggestion(customPrompt || 'Suggest popular pharmacy products for general inventory');
        break;
    }

    if (response) {
      setResult(response);
      toast({
        title: "AI Analysis Complete",
        description: "AI has generated helpful insights for your product!",
      });

      // Auto-apply suggestions if callback provided
      if (onSuggestionApply && action === 'description') {
        onSuggestionApply({ description: response });
      }
    }
  };

  const aiFeatures = [
    {
      id: 'description',
      title: 'Smart Description',
      description: 'Generate professional product descriptions',
      icon: Sparkles,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'pricing',
      title: 'Pricing AI',
      description: 'Get intelligent pricing suggestions',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'analysis',
      title: 'Product Analysis',
      description: 'Analyze product data and market position',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'suggestions',
      title: 'Inventory Ideas',
      description: 'Get AI-powered inventory suggestions',
      icon: Lightbulb,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    }
  ];

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-r from-indigo-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          AI Product Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Feature Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {aiFeatures.map((feature) => (
            <Button
              key={feature.id}
              variant={activeFeature === feature.id ? "default" : "outline"}
              className={`h-auto p-3 flex-col gap-2 ${
                activeFeature === feature.id 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                  : `hover:${feature.bgColor} hover:${feature.color}`
              }`}
              onClick={() => setActiveFeature(feature.id as any)}
            >
              <feature.icon className={`h-5 w-5 ${
                activeFeature === feature.id ? 'text-white' : feature.color
              }`} />
              <div className="text-center">
                <div className="font-medium text-xs">{feature.title}</div>
                <div className="text-xs opacity-75">{feature.description}</div>
              </div>
            </Button>
          ))}
        </div>

        {/* Custom Prompt for Suggestions */}
        {activeFeature === 'suggestions' && (
          <div className="space-y-2">
            <Input
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ask AI for specific inventory suggestions..."
              className="border-purple-200 focus:border-purple-400"
            />
          </div>
        )}

        {/* Current Product Info */}
        {productName && (
          <Card className="bg-white/70 border-indigo-200">
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="outline" className="bg-white">
                  <strong>Product:</strong> {productName}
                </Badge>
                {category && (
                  <Badge variant="outline" className="bg-white">
                    <strong>Category:</strong> {category}
                  </Badge>
                )}
                {cost && cost > 0 && (
                  <Badge variant="outline" className="bg-white">
                    <strong>Cost:</strong> ${cost}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Action Button */}
        <Button 
          onClick={() => handleAIAction(activeFeature)}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 h-12"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isLoading ? 'AI is thinking...' : `Generate ${aiFeatures.find(f => f.id === activeFeature)?.title}`}
        </Button>

        {/* AI Result */}
        {result && (
          <Card className="bg-white border-2 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-purple-700">
                <MessageCircle className="h-5 w-5" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={result}
                onChange={(e) => setResult(e.target.value)}
                rows={6}
                className="bg-purple-50 border-purple-200 text-slate-700"
                placeholder="AI insights will appear here..."
              />
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="border-purple-200 hover:bg-purple-50"
                >
                  Copy Result
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResult('')}
                  className="border-purple-200 hover:bg-purple-50"
                >
                  Clear
                </Button>
                {onSuggestionApply && activeFeature === 'description' && (
                  <Button
                    size="sm"
                    onClick={() => onSuggestionApply!({ description: result })}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Apply Description
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
