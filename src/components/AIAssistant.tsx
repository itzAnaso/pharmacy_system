import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, MessageCircle, Search, TrendingUp } from "lucide-react";
import { useOpenRouterAI } from "@/hooks/useDeepSeekAI";
import { useToast } from "@/hooks/use-toast";

export const AIAssistant = () => {
  const [activeFeature, setActiveFeature] = useState<'description' | 'search' | 'inventory' | 'support'>('description');
  const [input, setInput] = useState('');
  const [category, setCategory] = useState('');
  const [result, setResult] = useState('');
  
  const { 
    generateProductDescription, 
    enhanceSearch, 
    getInventorySuggestion, 
    getCustomerSupport,
    isLoading 
  } = useOpenRouterAI();
  
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter some text to generate AI content.",
        variant: "destructive",
      });
      return;
    }

    let response: string | null = null;

    switch (activeFeature) {
      case 'description':
        response = await generateProductDescription(input, category);
        break;
      case 'search':
        response = await enhanceSearch(input);
        break;
      case 'inventory':
        response = await getInventorySuggestion(input);
        break;
      case 'support':
        response = await getCustomerSupport(input);
        break;
    }

    if (response) {
      setResult(response);
      toast({
        title: "AI Content Generated",
        description: "Successfully generated AI-powered content!",
      });
    }
  };

  const features = [
    {
      id: 'description' as const,
      title: 'Product Description',
      description: 'Generate professional product descriptions',
      icon: Sparkles,
      placeholder: 'Enter product name (e.g., Paracetamol 500mg)',
      categoryPlaceholder: 'Enter category (e.g., Tablet, optional)'
    },
    {
      id: 'search' as const,
      title: 'Search Enhancement',
      description: 'Get intelligent search suggestions',
      icon: Search,
      placeholder: 'Enter search query (e.g., pain relief medicine)',
      categoryPlaceholder: ''
    },
    {
      id: 'inventory' as const,
      title: 'Inventory Suggestions',
      description: 'Get AI-powered inventory recommendations',
      icon: TrendingUp,
      placeholder: 'Describe your inventory needs',
      categoryPlaceholder: ''
    },
    {
      id: 'support' as const,
      title: 'Customer Support',
      description: 'AI-powered customer assistance',
      icon: MessageCircle,
      placeholder: 'Enter customer question or concern',
      categoryPlaceholder: ''
    }
  ];

  const activeFeatureData = features.find(f => f.id === activeFeature)!;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mt-2 sm:mt-4 text-3xl font-bold text-slate-900 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          AI Assistant
        </h2>
        <p className="text-slate-600">Powered by OpenRouter AI for pharmacy management</p>
      </div>

      {/* Feature Selection */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {features.map((feature) => (
          <Card 
            key={feature.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              activeFeature === feature.id 
                ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                : 'hover:shadow-md'
            }`}
            onClick={() => setActiveFeature(feature.id)}
          >
            <CardContent className="p-4 text-center">
              <feature.icon className={`h-8 w-8 mx-auto mb-2 ${
                activeFeature === feature.id ? 'text-purple-600' : 'text-slate-400'
              }`} />
              <h3 className="font-medium text-sm">{feature.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Generation Interface */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <activeFeatureData.icon className="h-5 w-5 text-purple-600" />
            {activeFeatureData.title}
          </CardTitle>
          <CardDescription>{activeFeatureData.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="input">Input</Label>
              <Input
                id="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeFeatureData.placeholder}
              />
            </div>
            {activeFeatureData.categoryPlaceholder && (
              <div className="space-y-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder={activeFeatureData.categoryPlaceholder}
                />
              </div>
            )}
          </div>

          <Button 
            onClick={handleGenerate}
            disabled={isLoading || !input.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isLoading ? 'Generating...' : 'Generate AI Content'}
          </Button>

          {result && (
            <div className="space-y-2">
              <Label htmlFor="result">AI Generated Content</Label>
              <Textarea
                id="result"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                rows={6}
                className="bg-slate-50 dark:bg-slate-800"
                placeholder="AI-generated content will appear here..."
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(result)}
                >
                  Copy to Clipboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResult('')}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features Overview */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="text-purple-900 dark:text-purple-100">AI Features</CardTitle>
          <CardDescription className="text-purple-700 dark:text-purple-300">
            How AI enhances your pharmacy management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-purple-900 dark:text-purple-100">✨ Product Descriptions</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Automatically generate professional, informative product descriptions with usage instructions and safety information.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-purple-900 dark:text-purple-100">🔍 Smart Search</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Enhance customer searches by understanding symptoms and suggesting relevant products and categories.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-purple-900 dark:text-purple-100">📊 Inventory Intelligence</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Get AI-powered suggestions for inventory management, restocking, and product recommendations.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-purple-900 dark:text-purple-100">💬 Customer Support</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Provide professional, caring responses to customer inquiries about medicines and health products.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};