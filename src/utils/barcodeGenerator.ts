/**
 * Barcode Generator Utility
 * Generates realistic barcodes for testing purposes
 */

export class BarcodeGenerator {
  // Generate EAN-13 barcode
  static generateEAN13(): string {
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
  }

  // Generate UPC-A barcode
  static generateUPCA(): string {
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
  }

  // Generate Code 128 barcode (alphanumeric)
  static generateCode128(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Generate random barcode of any supported type
  static generateRandom(): string {
    const types = [this.generateEAN13, this.generateUPCA, this.generateCode128];
    const randomType = types[Math.floor(Math.random() * types.length)];
    return randomType();
  }

  // Generate multiple barcodes for testing
  static generateMultiple(count: number): string[] {
    const barcodes: string[] = [];
    for (let i = 0; i < count; i++) {
      barcodes.push(this.generateRandom());
    }
    return barcodes;
  }

  // Validate EAN-13 barcode
  static validateEAN13(barcode: string): boolean {
    if (barcode.length !== 13 || !/^\d+$/.test(barcode)) {
      return false;
    }
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return parseInt(barcode[12]) === checkDigit;
  }

  // Validate UPC-A barcode
  static validateUPCA(barcode: string): boolean {
    if (barcode.length !== 12 || !/^\d+$/.test(barcode)) {
      return false;
    }
    
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += parseInt(barcode[i]) * (i % 2 === 0 ? 3 : 1);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return parseInt(barcode[11]) === checkDigit;
  }
}

// Common pharmacy product barcodes for testing
export const TEST_BARCODES = {
  // Common medicine barcodes (fictional for testing)
  PARACETAMOL: '4001234567890',
  ASPIRIN: '4009876543210',
  IBUPROFEN: '4012345678901',
  VITAMIN_C: '4018765432109',
  OMEPRAZOLE: '4023456789012',
  AMOXICILLIN: '4027654321098',
  CETIRIZINE: '4034567890123',
  LORATADINE: '4036543210987',
  METFORMIN: '4045678901234',
  ATORVASTATIN: '4045432109876'
};

// Generate test barcodes for common pharmacy products
export const generatePharmacyTestBarcodes = () => {
  return {
    PARACETAMOL_500MG: BarcodeGenerator.generateEAN13(),
    ASPIRIN_100MG: BarcodeGenerator.generateEAN13(),
    IBUPROFEN_400MG: BarcodeGenerator.generateEAN13(),
    VITAMIN_C_1000MG: BarcodeGenerator.generateEAN13(),
    OMEPRAZOLE_20MG: BarcodeGenerator.generateEAN13(),
    AMOXICILLIN_500MG: BarcodeGenerator.generateEAN13(),
    CETIRIZINE_10MG: BarcodeGenerator.generateEAN13(),
    LORATADINE_10MG: BarcodeGenerator.generateEAN13(),
    METFORMIN_500MG: BarcodeGenerator.generateEAN13(),
    ATORVASTATIN_10MG: BarcodeGenerator.generateEAN13()
  };
}; 