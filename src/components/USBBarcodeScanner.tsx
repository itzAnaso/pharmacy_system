import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Scan, 
  Usb, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  Volume2,
  VolumeX,
  TestTube
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarcodeGenerator } from "@/utils/barcodeGenerator";

interface USBBarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export const USBBarcodeScanner = ({ 
  onBarcodeScanned, 
  className = "",
  placeholder = "Scan barcode or type manually...",
  autoFocus = true
}: USBBarcodeScannerProps) => {
  const { toast } = useToast();
  const [barcode, setBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanSound, setScanSound] = useState(true);
  const [lastScanned, setLastScanned] = useState<string>('');
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

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
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  // Handle barcode input
  const handleBarcodeInput = (value: string) => {
    setBarcode(value);
    
    // USB barcode scanners typically send a return/enter key after scanning
    // This simulates that behavior for manual testing
    if (value.length > 3 && value.includes('\n')) {
      const cleanBarcode = value.replace('\n', '').trim();
      if (cleanBarcode) {
        handleBarcodeDetected(cleanBarcode);
      }
    }
  };

  // Handle barcode detection
  const handleBarcodeDetected = (scannedBarcode: string) => {
    if (!scannedBarcode.trim()) return;
    
    playScanSound();
    setIsScanning(true);
    
    // Add to history
    setLastScanned(scannedBarcode);
    setScanHistory(prev => [scannedBarcode, ...prev.slice(0, 9)]); // Keep last 10
    
    // Call the callback
    onBarcodeScanned(scannedBarcode);
    
    // Clear input
    setBarcode('');
    
    // Reset scanning state
    setTimeout(() => {
      setIsScanning(false);
    }, 500);
    
    // Focus back to input for next scan
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle manual submit
  const handleManualSubmit = () => {
    if (barcode.trim()) {
      handleBarcodeDetected(barcode.trim());
    }
  };

  // Handle test scan (for testing without real scanner)
  const handleTestScan = () => {
    const testBarcode = BarcodeGenerator.generateRandom();
    handleBarcodeDetected(testBarcode);
    toast({
      title: "Test Scan",
      description: `Generated test barcode: ${testBarcode}`,
    });
  };

  // Handle key press (for Enter key)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && barcode.trim()) {
      e.preventDefault();
      handleBarcodeDetected(barcode.trim());
    }
  };

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Auto focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Scanner Input */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Usb className="h-5 w-5" />
            USB Barcode Scanner
          </CardTitle>
          <CardDescription className="text-blue-600">
            Connect your USB barcode scanner and start scanning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={barcode}
              onChange={(e) => handleBarcodeInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className={`flex-1 text-lg font-mono ${isScanning ? 'border-green-500 bg-green-50' : ''}`}
              autoFocus={autoFocus}
            />
            <Button 
              onClick={handleManualSubmit}
              disabled={!barcode.trim()}
              className="shrink-0"
            >
              <Scan className="h-4 w-4 mr-2" />
              Scan
            </Button>
            <Button 
              onClick={handleTestScan}
              variant="outline"
              className="shrink-0"
              title="Generate test barcode"
            >
              <TestTube className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Scanner Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600">
                {isScanning ? 'Scanning...' : 'Ready'}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setScanSound(!scanSound)}
              className="text-gray-500 hover:text-gray-700"
            >
              {scanSound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Scanned */}
      {lastScanned && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Last Scanned</span>
            </div>
            <div className="font-mono text-lg bg-white p-2 rounded border">
              {lastScanned}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {scanHistory.map((barcode, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <span className="font-mono">{barcode}</span>
                  <Badge variant="secondary">{index + 1}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-2">USB Barcode Scanner Setup:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Connect your USB barcode scanner to your computer</li>
                <li>Wait for the device to be recognized (usually automatic)</li>
                <li>Click in the input field above to focus it</li>
                <li>Scan any barcode - it will automatically appear and be processed</li>
                <li>Most USB scanners work as keyboard input devices</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 