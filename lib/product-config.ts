// lib/product-config.ts
interface iPhoneConfig {
  models: string[];
  colors: Record<string, string[]>;
  storage: Record<string, string[]>;
  appleCareAvailable: boolean;
  basePrices: Record<string, Record<string, number>>;
  appleCarePrice: number;
}

interface MacBookConfig {
  models: string[];
  colors: Record<string, string[]>;
  specs: Record<string, string[]>;
  storage: string[];
  appleCareAvailable: boolean;
  basePrices: Record<string, Record<string, number>>;
  storageUpgrades: Record<string, number>;
  appleCarePrice: number;
}

interface iPadConfig {
  models: string[];
  colors: Record<string, string[]>;
  storage: Record<string, string[]>;
  connectivity: string[];
  appleCareAvailable: boolean;
  basePrices: Record<string, Record<string, number>>;
  cellularUpgrade: number;
  appleCarePrice: number;
}

interface AppleWatchConfig {
  models: string[];
  colors: Record<string, string[]>;
  size: Record<string, string[]>;
  bands: Record<string, string[]>;
  connectivity: string[];
  appleCareAvailable: boolean;
  basePrices: Record<string, Record<string, number>>;
  cellularUpgrade: number;
  appleCarePrice: number;
}

type ProductConfig = iPhoneConfig | MacBookConfig | iPadConfig | AppleWatchConfig;


export const PRODUCT_CONFIGURATIONS: Record<string, ProductConfig> = {
  'iPhone': {
    models: [
      'iPhone 15 Pro Max',
      'iPhone 15 Pro', 
      'iPhone 15',
      'iPhone 14'
    ],
    colors: {
      'iPhone 15 Pro Max': ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
      'iPhone 15 Pro': ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
      'iPhone 15': ['Pink', 'Yellow', 'Green', 'Blue', 'Black'],
      'iPhone 14': ['Purple', 'Blue', 'Starlight', 'Midnight', 'Red']
    },
    storage: {
      'iPhone 15 Pro Max': ['256GB', '512GB', '1TB'],
      'iPhone 15 Pro': ['128GB', '256GB', '512GB', '1TB'],
      'iPhone 15': ['128GB', '256GB', '512GB'],
      'iPhone 14': ['128GB', '256GB', '512GB']
    },
    appleCareAvailable: true,
    // Base prices for estimation (employee discount will be applied later)
    basePrices: {
      'iPhone 15 Pro Max': { '256GB': 1199, '512GB': 1399, '1TB': 1599 },
      'iPhone 15 Pro': { '128GB': 999, '256GB': 1199, '512GB': 1399, '1TB': 1599 },
      'iPhone 15': { '128GB': 799, '256GB': 899, '512GB': 1099 },
      'iPhone 14': { '128GB': 699, '256GB': 799, '512GB': 999 }
    },
    appleCarePrice: 199
  },
  'MacBook': {
    models: [
      'MacBook Pro 16"',
      'MacBook Pro 14"',
      'MacBook Air 15"',
      'MacBook Air 13"'
    ],
    colors: {
      'MacBook Pro 16"': ['Space Black', 'Silver'],
      'MacBook Pro 14"': ['Space Black', 'Silver'],
      'MacBook Air 15"': ['Starlight', 'Silver', 'Space Grey', 'Midnight'],
      'MacBook Air 13"': ['Starlight', 'Silver', 'Space Grey', 'Midnight']
    },
    specs: {
      'MacBook Pro 16"': ['M3 Pro', 'M3 Max'],
      'MacBook Pro 14"': ['M3', 'M3 Pro', 'M3 Max'],
      'MacBook Air 15"': ['M2'],
      'MacBook Air 13"': ['M2', 'M3']
    },
    storage: ['256GB', '512GB', '1TB', '2TB'],
    appleCareAvailable: true,
    basePrices: {
      'MacBook Pro 16"': { 'M3 Pro': 2499, 'M3 Max': 3499 },
      'MacBook Pro 14"': { 'M3': 1599, 'M3 Pro': 1999, 'M3 Max': 2999 },
      'MacBook Air 15"': { 'M2': 1299 },
      'MacBook Air 13"': { 'M2': 1099, 'M3': 1199 }
    },
    storageUpgrades: { '512GB': 200, '1TB': 400, '2TB': 800 },
    appleCarePrice: 299
  },
  'iPad': {
    models: [
      'iPad Pro 12.9"',
      'iPad Pro 11"',
      'iPad Air',
      'iPad mini'
    ],
    colors: {
      'iPad Pro 12.9"': ['Silver', 'Space Grey'],
      'iPad Pro 11"': ['Silver', 'Space Grey'],
      'iPad Air': ['Blue', 'Purple', 'Pink', 'Starlight', 'Space Grey'],
      'iPad mini': ['Purple', 'Starlight', 'Pink', 'Space Grey']
    },
    storage: {
      'iPad Pro 12.9"': ['128GB', '256GB', '512GB', '1TB', '2TB'],
      'iPad Pro 11"': ['128GB', '256GB', '512GB', '1TB', '2TB'],
      'iPad Air': ['64GB', '256GB'],
      'iPad mini': ['64GB', '256GB']
    },
    connectivity: ['Wi-Fi', 'Wi-Fi + Cellular'],
    appleCareAvailable: true,
    basePrices: {
      'iPad Pro 12.9"': { '128GB': 1099, '256GB': 1199, '512GB': 1399, '1TB': 1799, '2TB': 2199 },
      'iPad Pro 11"': { '128GB': 799, '256GB': 899, '512GB': 1099, '1TB': 1499, '2TB': 1899 },
      'iPad Air': { '64GB': 599, '256GB': 749 },
      'iPad mini': { '64GB': 499, '256GB': 649 }
    },
    cellularUpgrade: 130,
    appleCarePrice: 129
  },
  'Apple Watch': {
    models: [
      'Apple Watch Series 9',
      'Apple Watch SE',
      'Apple Watch Ultra 2'
    ],
    colors: {
      'Apple Watch Series 9': ['Starlight', 'Midnight', 'Silver', 'Red', 'Pink'],
      'Apple Watch SE': ['Starlight', 'Midnight', 'Silver'],
      'Apple Watch Ultra 2': ['Titanium']
    },
    size: {
      'Apple Watch Series 9': ['41mm', '45mm'],
      'Apple Watch SE': ['40mm', '44mm'],
      'Apple Watch Ultra 2': ['49mm']
    },
    bands: {
      'Apple Watch Series 9': ['Sport Band', 'Sport Loop', 'Milanese Loop'],
      'Apple Watch SE': ['Sport Band', 'Sport Loop'],
      'Apple Watch Ultra 2': ['Alpine Loop', 'Trail Loop', 'Ocean Band']
    },
    connectivity: ['Wi-Fi', 'Wi-Fi + Cellular'],
    appleCareAvailable: true,
    basePrices: {
      'Apple Watch Series 9': { '41mm': 399, '45mm': 429 },
      'Apple Watch SE': { '40mm': 249, '44mm': 279 },
      'Apple Watch Ultra 2': { '49mm': 799 }
    },
    cellularUpgrade: 130,
    appleCarePrice: 79
  }
}

export function calculateEstimatedPrice(category: string,
    model: string,
    storage?: string,
    specs?: string,
    connectivity?: string,
    size?: string,
    bands?: string,
    appleCare?: boolean): number {
  const config = PRODUCT_CONFIGURATIONS[category as keyof typeof PRODUCT_CONFIGURATIONS]
  if (!config) return 0

  let basePrice = 0;

  if (category === 'iPhone' || category === 'iPad') {
    const basePrices = (config as iPhoneConfig | iPadConfig).basePrices;
    if (storage && basePrices[model]?.[storage]) {
      basePrice = basePrices[model][storage];
    }
  } else if (category === 'MacBook') {
    const basePrices = (config as MacBookConfig).basePrices;
    if (specs && basePrices[model]?.[specs]) {
      basePrice = basePrices[model][specs];

      // Add storage upgrade cost
      const storageUpgrades = (config as MacBookConfig).storageUpgrades;
      if (storage && storageUpgrades?.[storage]) {
        basePrice += storageUpgrades[storage];
      }
    }
  } else if (category === 'Apple Watch') {
    const basePrices = (config as AppleWatchConfig).basePrices;
    if (size && basePrices[model]?.[size]) {
      basePrice = basePrices[model][size];
    }
    if (model === 'Apple Watch Ultra 2') {
        connectivity = 'Wi-Fi + Cellular'; // Ultra 2 only has cellular option
    }
  }
  // Add cellular upgrade (watch and iPad)
  if (connectivity === 'Wi-Fi + Cellular') {
    basePrice += (config as iPadConfig | AppleWatchConfig).cellularUpgrade || 0;
  }

  // Add AppleCare
  if (appleCare) {
    basePrice += config.appleCarePrice || 0;
  }

  return basePrice;
}

export function getAvailableOptions(category: string, model?: string) {
  const productConfig = PRODUCT_CONFIGURATIONS[category as keyof typeof PRODUCT_CONFIGURATIONS];
  if (!productConfig) return null;

  return {
    models: productConfig.models,
    colors: model && 'colors' in productConfig ? (productConfig as iPhoneConfig | MacBookConfig | iPadConfig).colors[model] || [] : [],
    storage: model && 'storage' in productConfig ? (productConfig as iPhoneConfig | iPadConfig).storage?.[model] || (productConfig as MacBookConfig).storage || [] : [],
    specs: model && 'specs' in productConfig ? (productConfig as MacBookConfig).specs?.[model] || [] : [],
    connectivity: 'connectivity' in productConfig ? (productConfig as iPadConfig).connectivity : [],
    size: model && 'size' in productConfig ? (productConfig as AppleWatchConfig).size?.[model] || [] : [],
    bands: 'bands' in productConfig ? (productConfig as AppleWatchConfig).bands : [],
    appleCareAvailable: productConfig.appleCareAvailable
  };
}
