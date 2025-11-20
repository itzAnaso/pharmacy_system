import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Scan, 
  Camera, 
  Upload, 
  Target, 
  X, 
  Package, 
  DollarSign, 
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Volume2,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface BarcodeScannerProps {
  onBarcodeDetected: (product: any) => void;
  onProductFound?: (product: any) => void;
  mode?: 'scan' | 'add-to-cart';
  className?: string;
}

interface ScannedProduct {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  category: string;
  batch_number?: string;
  manufacturer?: string;
}

export const BarcodeScanner = ({ 
  onBarcodeDetected, 
  onProductFound,
  mode = 'scan',
  className 
}: BarcodeScannerProps) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [lastScannedProduct, setLastScannedProduct] = useState<ScannedProduct | null>(null);
  const [scanHistory, setScanHistory] = useState<ScannedProduct[]>([]);
  const [scanSound, setScanSound] = useState(true);
  const [scanVolume, setScanVolume] = useState(0.5);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Fetch all products for barcode lookup
  const { data: products = [] } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .gt('stock_quantity', 0)
        .order('name');

      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id
  });

  // Generate realistic barcode patterns
  const generateRealisticBarcode = () => {
    const patterns = [
      // EAN-13 format
      () => {
        const countryCode = ['400', '401', '402', '403', '404', '405', '406', '407', '408', '409'][Math.floor(Math.random() * 10)];
        const manufacturer = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
        const product = Math.floor(Math.random() * 999).toString().padStart(3, '0');
        const code = countryCode + manufacturer + product;
        // Calculate check digit
        let sum = 0;
        for (let i = 0; i < 12; i++) {
          sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        return code + checkDigit;
      },
      // UPC-A format
      () => {
        const manufacturer = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
        const product = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
        const code = '0' + manufacturer + product;
        // Calculate check digit
        let sum = 0;
        for (let i = 0; i < 11; i++) {
          sum += parseInt(code[i]) * (i % 2 === 0 ? 3 : 1);
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        return code + checkDigit;
      },
      // Code 128 format (alphanumeric)
      () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 12; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      }
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)]();
  };

  // Play scan sound
  const playScanSound = () => {
    if (!scanSound || !audioContextRef.current) return;
    
    try {
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(scanVolume * 0.3, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  // Find product by barcode
  const findProductByBarcode = (barcode: string): ScannedProduct | null => {
    const product = products.find(p => p.batch_number === barcode);
    if (product) {
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        stock_quantity: product.stock_quantity,
        category: product.category,
        batch_number: product.batch_number,
        manufacturer: product.manufacturer
      };
    }
    return null;
  };

  // Handle barcode detection
  const handleBarcodeDetected = (barcode: string) => {
    playScanSound();
    
    const product = findProductByBarcode(barcode);
    
    if (product) {
      setLastScannedProduct(product);
      setScanHistory(prev => [product, ...prev.slice(0, 9)]); // Keep last 10 scans
      
      toast({
        title: "Product Found!",
        description: `${product.name} - ${product.price.toFixed(2)}`,
      });
      
      onProductFound?.(product);
      onBarcodeDetected(product);
      
      if (mode === 'add-to-cart') {
        setIsOpen(false);
      }
    } else {
      // Product not found in database
      toast({
        title: "Product Not Found",
        description: `Barcode ${barcode} not found in database. Please add this product first.`,
        variant: "destructive",
      });
    }
  };

  // Demo mode: Use existing products for testing
  const handleDemoScan = () => {
    if (products.length === 0) {
      toast({
        title: "No Products Available",
        description: "Please add some products to your inventory first to test the scanner.",
        variant: "destructive",
      });
      return;
    }
    
    // Pick a random product from existing inventory
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    if (randomProduct.batch_number) {
      handleBarcodeDetected(randomProduct.batch_number);
    } else {
      toast({
        title: "No Barcodes Available",
        description: "Please add barcodes to your products to test the scanner.",
        variant: "destructive",
      });
    }
  };

  // Start camera simulation
  const startCamera = async () => {
    setIsCameraMode(true);
    setScannerReady(false);
    
    // Simulate camera initialization
    setTimeout(() => {
      setScannerReady(true);
      startContinuousScanning();
    }, 2000);
  };

  // Start continuous scanning simulation
  const startContinuousScanning = () => {
    setIsScanning(true);
    
    // Demo mode: Use existing products instead of random barcodes
    scanIntervalRef.current = setInterval(() => {
      if (Math.random() > 0.7 && products.length > 0) { // 30% chance to detect
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        if (randomProduct.batch_number) {
          handleBarcodeDetected(randomProduct.batch_number);
        }
      }
    }, Math.random() * 5000 + 3000);
  };

  // Stop camera
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    setIsCameraMode(false);
    setIsScanning(false);
    setScannerReady(false);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Demo mode: Use existing products for image upload
      if (products.length > 0) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        if (randomProduct.batch_number) {
          handleBarcodeDetected(randomProduct.batch_number);
          toast({
            title: "Image Scanned",
            description: `Barcode detected: ${randomProduct.name}`,
          });
        } else {
          toast({
            title: "No Barcode Found",
            description: "Selected product doesn't have a barcode assigned.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "No Products Available",
          description: "Please add products with barcodes to test image scanning.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle manual submit
  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      handleBarcodeDetected(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      stopCamera();
      setManualBarcode('');
    }
  };

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return () => {
      stopCamera();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={`flex items-center gap-2 ${className}`}>
          <Scan className="h-4 w-4" />
          {mode === 'add-to-cart' ? 'Scan & Add' : 'Scan Barcode'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-blue-600" />
            Professional Barcode Scanner
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!isCameraMode ? (
            <>
              {/* Scanner Options */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={startCamera}
                  className="flex flex-col items-center gap-3 h-24 hover:bg-blue-50"
                >
                  <Camera className="h-8 w-8 text-blue-600" />
                  <div className="text-center">
                    <div className="font-medium">Live Scanner</div>
                    <div className="text-xs text-gray-500">Camera-based scanning</div>
                  </div>
                </Button>
                
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-3 h-24 w-full hover:bg-green-50"
                  >
                    <Upload className="h-8 w-8 text-green-600" />
                    <div className="text-center">
                      <div className="font-medium">Upload Image</div>
                      <div className="text-xs text-gray-500">Scan from image file</div>
                    </div>
                  </Button>
                </div>
              </div>
              
              {/* Manual Input */}
              <div className="space-y-3">
                <Label htmlFor="manualBarcode" className="font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Manual Entry
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="manualBarcode"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="Enter barcode manually..."
                    onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                    className="flex-1"
                  />
                  <Button onClick={handleManualSubmit} disabled={!manualBarcode.trim()}>
                    Scan
                  </Button>
                </div>
              </div>

              {/* Scanner Settings */}
              <div className="space-y-3">
                <Label className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Scanner Settings
                </Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="scanSound"
                      checked={scanSound}
                      onChange={(e) => setScanSound(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="scanSound" className="text-sm">Scan Sound</Label>
                  </div>
                  {scanSound && (
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={scanVolume}
                        onChange={(e) => setScanVolume(parseFloat(e.target.value))}
                        className="w-20"
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Professional Scanner View */
            <div className="space-y-6">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-80 object-cover"
                />
                
                {/* Scanner Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Scanning Frame */}
                    <div className="w-64 h-40 border-2 border-red-500 relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500"></div>
                      
                      {/* Scanning Line */}
                      {isScanning && (
                        <div className="absolute inset-x-0 h-1 bg-red-500 animate-pulse"
                             style={{ 
                               top: '50%',
                               animation: 'scan 2s linear infinite'
                             }}></div>
                      )}
                    </div>
                    
                    {/* Target Icon */}
                    <Target className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-red-500 animate-pulse" />
                  </div>
                </div>
                
                {/* Status Indicators */}
                <div className="absolute top-3 left-3 bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${scannerReady ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                    {scannerReady ? 'Scanning Active' : 'Initializing...'}
                  </div>
                </div>
                
                <div className="absolute bottom-3 left-3 right-3 bg-black bg-opacity-80 text-white px-4 py-3 rounded-lg text-sm text-center">
                  {isScanning ? 'Position barcode within frame - Auto-detecting...' : 'Starting scanner...'}
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={stopCamera}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Stop Scanner
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleDemoScan}
                  className="flex-1"
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Test Scan
                </Button>
              </div>
            </div>
          )}

          {/* Last Scanned Product */}
          {lastScannedProduct && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">Last Scanned Product</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{lastScannedProduct.name}</span>
                    <Badge variant="secondary">{lastScannedProduct.category}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Price: {lastScannedProduct.price.toFixed(2)}</span>
                    <span className="text-gray-600">Stock: {lastScannedProduct.stock_quantity}</span>
                  </div>
                  {lastScannedProduct.batch_number && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Scan className="h-3 w-3" />
                      {lastScannedProduct.batch_number}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <div className="space-y-3">
              <Label className="font-medium">Recent Scans</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {scanHistory.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.batch_number}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">{product.price.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Stock: {product.stock_quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Demo Mode Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Demo Mode - Using Real Products</p>
                <p className="text-blue-700">
                  This scanner uses your actual product database. To test:
                </p>
                <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                  <li>Add products with barcodes in the Products section</li>
                  <li>Use "Test Scan" to scan random products from your inventory</li>
                  <li>Manual entry works with any barcode you've assigned to products</li>
                  <li>For production: integrate with real barcode scanning libraries</li>
                </ul>
                {products.length === 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <strong>No products found:</strong> Add some products with barcodes to test the scanner.
                  </div>
                )}
                {products.length > 0 && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                    <strong>{products.length} products available</strong> for scanning demo.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes scan {
            0% { top: 10%; }
            50% { top: 90%; }
            100% { top: 10%; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};
