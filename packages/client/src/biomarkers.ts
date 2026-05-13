export const BIOMARKERS = [
  { key: 'creatine', unitKey: 'creatineUnit', label: 'Creatine', color: '#2563eb', units: ['mgdl', 'umoll'] },
  { key: 'chloride', unitKey: 'chlorideUnit', label: 'Chloride', color: '#059669', units: ['mmoll'] },
  { key: 'fastingGlucose', unitKey: 'fastingGlucoseUnit', label: 'Fasting Glucose', color: '#d97706', units: ['mgdl', 'mmoll'] },
  { key: 'potassium', unitKey: 'potassiumUnit', label: 'Potassium', color: '#7c3aed', units: ['mmoll'] },
  { key: 'sodium', unitKey: 'sodiumUnit', label: 'Sodium', color: '#dc2626', units: ['mmoll', 'ul'] },
  { key: 'totalCalcium', unitKey: 'totalCalciumUnit', label: 'Total Calcium', color: '#0891b2', units: ['mgdl', 'mmoll'] },
  { key: 'totalProtein', unitKey: 'totalProteinUnit', label: 'Total Protein', color: '#be185d', units: ['gdl'] },
] as const;
