
export const pharmacyCategories = [
  'Tablets',
  'Capsules',
  'Syrup',
  'Injections',
  'Ointments',
  'Drops',
  'Inhalers',
  'Patches',
  'Suppositories',
  'Powders',
  'Creams',
  'Gels',
  'Lozenges',
  'Sprays',
  'Solutions'
];

export const commonMedicines = [
  // Pain Relief & Fever
  'Paracetamol 500mg',
  'Paracetamol 650mg',
  'Ibuprofen 400mg',
  'Ibuprofen 600mg',
  'Aspirin 75mg',
  'Aspirin 300mg',
  'Diclofenac 50mg',
  'Tramadol 50mg',
  
  // Antibiotics
  'Amoxicillin 250mg',
  'Amoxicillin 500mg',
  'Azithromycin 250mg',
  'Azithromycin 500mg',
  'Ciprofloxacin 250mg',
  'Ciprofloxacin 500mg',
  'Cephalexin 250mg',
  'Cephalexin 500mg',
  
  // Cold & Cough
  'Cough Syrup (Dextromethorphan)',
  'Cough Syrup (Guaifenesin)',
  'Lozenges (Menthol)',
  'Throat Spray',
  'Nasal Decongestant',
  'Antihistamine (Cetirizine)',
  'Antihistamine (Loratadine)',
  
  // Digestive Health
  'Omeprazole 20mg',
  'Omeprazole 40mg',
  'Ranitidine 150mg',
  'Antacid Tablets',
  'Loperamide 2mg',
  'Oral Rehydration Salt',
  'Probiotics',
  
  // Vitamins & Supplements
  'Vitamin C 500mg',
  'Vitamin C 1000mg',
  'Vitamin D3 1000IU',
  'Vitamin D3 2000IU',
  'Multivitamin',
  'Calcium + Vitamin D',
  'Iron Tablets',
  'Folic Acid 5mg',
  'Vitamin B Complex',
  
  // Diabetes
  'Metformin 500mg',
  'Metformin 850mg',
  'Glimepiride 1mg',
  'Glimepiride 2mg',
  'Insulin (Rapid Acting)',
  'Insulin (Long Acting)',
  'Glucose Test Strips',
  
  // Blood Pressure
  'Amlodipine 5mg',
  'Amlodipine 10mg',
  'Lisinopril 10mg',
  'Atenolol 50mg',
  'Losartan 50mg',
  
  // Heart Health
  'Atorvastatin 20mg',
  'Atorvastatin 40mg',
  'Clopidogrel 75mg',
  'Isosorbide Mononitrate',
  
  // Skin Care
  'Hydrocortisone Cream 1%',
  'Antifungal Cream',
  'Antiseptic Cream',
  'Moisturizing Lotion',
  'Sunscreen SPF 30',
  'Sunscreen SPF 50',
  
  // Eye & Ear Care
  'Artificial Tears',
  'Antibiotic Eye Drops',
  'Ear Wax Removal Drops',
  'Eye Lubricant Gel',
  
  // Women\'s Health
  'Folic Acid (Pregnancy)',
  'Iron + Folic Acid',
  'Calcium (Pregnancy)',
  'Contraceptive Pills',
  
  // Children\'s Medicine
  'Paracetamol Syrup (Children)',
  'Ibuprofen Syrup (Children)',
  'Multivitamin Syrup',
  'Gripe Water',
  'Teething Gel',
  
  // First Aid
  'Bandages (Assorted)',
  'Adhesive Tape',
  'Cotton Wool',
  'Antiseptic Solution',
  'Thermometer',
  'Blood Pressure Monitor',
  'Glucose Meter',
  
  // Personal Care
  'Hand Sanitizer 100ml',
  'Hand Sanitizer 500ml',
  'Face Masks (Surgical)',
  'Face Masks (N95)',
  'Disposable Gloves',
  'Digital Thermometer'
];

export const popularBrands = [
  'GSK', 'Pfizer', 'Novartis', 'Abbott', 'Johnson & Johnson',
  'Roche', 'Merck', 'Bayer', 'Sanofi', 'AstraZeneca',
  'Cipla', 'Dr. Reddy\'s', 'Sun Pharma', 'Lupin', 'Aurobindo'
];

export const dosageForms = [
  '10mg', '20mg', '25mg', '50mg', '100mg', '200mg', '250mg', '300mg', 
  '400mg', '500mg', '600mg', '650mg', '750mg', '850mg', '1000mg',
  '1mg', '2mg', '5mg', '10mg', '15mg', '30mg', '40mg', '75mg',
  '100ml', '200ml', '300ml', '500ml', '1000ml',
  '5ml', '10ml', '15ml', '20ml', '30ml'
];

export const getProductSuggestions = (input: string): string[] => {
  const searchTerm = input.toLowerCase();
  
  // Filter medicines based on input
  const filteredMedicines = commonMedicines.filter(medicine =>
    medicine.toLowerCase().includes(searchTerm)
  );
  
  // If no direct matches, suggest based on category or use case
  if (filteredMedicines.length === 0) {
    if (searchTerm.includes('pain') || searchTerm.includes('fever')) {
      return ['Paracetamol 500mg', 'Ibuprofen 400mg', 'Aspirin 300mg'];
    }
    if (searchTerm.includes('cold') || searchTerm.includes('cough')) {
      return ['Cough Syrup (Dextromethorphan)', 'Lozenges (Menthol)', 'Antihistamine (Cetirizine)'];
    }
    if (searchTerm.includes('stomach') || searchTerm.includes('acid')) {
      return ['Omeprazole 20mg', 'Antacid Tablets', 'Ranitidine 150mg'];
    }
    if (searchTerm.includes('vitamin')) {
      return ['Vitamin C 500mg', 'Vitamin D3 1000IU', 'Multivitamin'];
    }
    if (searchTerm.includes('antibiotic')) {
      return ['Amoxicillin 500mg', 'Azithromycin 250mg', 'Ciprofloxacin 500mg'];
    }
  }
  
  return filteredMedicines.slice(0, 10);
};

export const getRandomSuggestions = (count: number = 8): string[] => {
  const shuffled = [...commonMedicines].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
