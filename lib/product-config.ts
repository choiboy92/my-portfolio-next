// lib/product-config.ts
interface SpecificationOption {
  name: string;                    // Display name
  price: number;                 // Optional price for this option
  description?: string;           // Optional description
  constraints?: Record<string, unknown>; // Flexible constraints
  //upgradeOptions?: string[];      // Available upgrade paths
  minRequirements?: Record<string, string>; // e.g., minStorage: '1TB'
  appleCarePrice?: number; // Price for AppleCare
}

interface MacbookSpecificationOption extends SpecificationOption {
  memoryOptions?: Record<string, number>; // e.g., { '16GB': 200, '32GB': 400 }
  storageOptions?: Record<string, number>; // e.g., { '256GB': 200, '512GB': 400 }
  chargerOptions?: Record<string, number>; // e.g., { '30W': 50, '67W': 100 }
  nanoTexture?: number;
}

interface iPhoneSpecificationOption extends SpecificationOption {
  storageOptions?: Record<string, number>; // e.g., { '128GB': 0, '256GB': 100, '512GB': 300, '1TB': 500 }
}

interface iPadSpecificationOption extends SpecificationOption {
  storageOptions?: Record<string, number>; // e.g., { '128GB': 0, '256GB': 100, '512GB': 300 }
  connectivityOptions?: Record<string, number>; // e.g., { 'Wi-Fi': 0, 'Wi-Fi + Cellular': 200 }
  nanoTexture?: number;
  applePencil?: Pencil[]; // e.g., [{ pencilType: '1st Gen', price: 99 }, { pencilType: '2nd Gen', price: 129 }]
  magicKeyboard?: number;
}

export type Pencil = {
  pencilType: string;
  price: number
}

interface AppleWatchSpecificationOption extends SpecificationOption {
  materialOptions?: Record<string, string[]>; // e.g., { 'Aluminum': ['Black', 'White'], 'Stainless Steel': ['Silver', 'Gold'] }
  colors?: string[]; // e.g., ['Black', 'White', 'Red']
  sizeOptions?: Record<string, number>; // e.g., { '40mm': 0, '44mm': 50 }
  bandOptions?: {
    material?: string;
    style: {
      styleName: string;
      price: number; // Price for this band style
      bandColor: string[]; // e.g., ['Black', 'White']
      bandSizeOptions?: string[]; // e.g., ['Small', 'Medium', 'Large']
    }[]
  }[]; // e.g., [{ material: 'Sport', style: [{ styleName: 'Sport Band', price: 49, color: ['Black', 'White'] }] }]
  connectivityOptions?: Record<string, number>; // e.g., { 'GPS': 0, 'GPS + Cellular': 200 }
}

export interface ProductSpecificationOptions extends iPhoneSpecificationOption, iPadSpecificationOption, MacbookSpecificationOption, AppleWatchSpecificationOption, SpecificationOption {}

interface ModelConfiguration<TSpec = SpecificationOption, TAdditionalOptions = Record<string, SpecificationOption>> {
  displayName: string
  colors: string[]
  specs: TSpec[]
  appleCarePrice?: number
  category?: string
  additionalOptions?: TAdditionalOptions[]
}

interface ProductCategoryConfiguration<TModel = ModelConfiguration> {
  category: string;
  models: Record<string, TModel>;
  appleCareAvailable: boolean;
}

const MACBOOK_CONFIGURATIONS: ProductCategoryConfiguration<ModelConfiguration<MacbookSpecificationOption>> = {
  category: 'Macbook',
  appleCareAvailable: true,
  models: {
    'MacBook Pro 16"': {
      displayName: 'MacBook Pro 16"',
      colors: ['Space Black', 'Silver'],
      specs: [
        {
          name: 'M4 Pro 14-Core CPU 20-Core GPU 24GB Unified Memory',
          price: 2499,
          constraints: { minStorage: '512GB', minMemory: '24GB' },
          memoryOptions: { '24GB': 0, '36GB': 200, '48GB': 400, '64GB': 600, '128GB': 1400},
          storageOptions: { '512GB': 0, '1TB': 200, '2TB': 600, '4TB': 1200, '8TB': 2400 },
          chargerOptions: { '70W': 0, '96W': 20 },
          nanoTexture: 150
        },
        {
          name: 'M4 Pro 14-Core CPU 20-Core GPU 48GB Unified Memory',
          price: 2899,
          constraints: { minStorage: '512GB', minMemory: '36GB' },
          memoryOptions: { '36GB': 0, '48GB': 0, '64GB': 200, '128GB': 1000},
          storageOptions: { '512GB': 0, '1TB': 200, '2TB': 600, '4TB': 1200, '8TB': 2400 },
          chargerOptions: { '70W': 0, '96W': 20 },
          nanoTexture: 150
        },
        {
          name:'M4 Max 14-Core CPU 32-Core GPU 36GB Unified Memory',
          price: 3499,
          constraints: { minStorage: '1TB', minMemory: '24GB' },
          memoryOptions: { '36GB': 0, '48GB': 200, '64GB': 400, '128GB': 1200},
          storageOptions: { '1TB': 0, '2TB': 400, '4TB': 1000, '8TB': 2200 },
          chargerOptions: { '70W': 0, '96W': 20 },
          nanoTexture: 150
        },
        {
          name:'M4 Max 16-Core CPU 40-Core GPU 48GB Unified Memory',
          price: 3999,
          constraints: { minStorage: '1TB', minMemory: '48GB' },
          memoryOptions: { '48GB': 0, '64GB': 200, '128GB': 1000},
          storageOptions: { '1TB': 0, '2TB': 400, '4TB': 1000, '8TB': 2200 },
          chargerOptions: { '70W': 0, '96W': 20 },
          nanoTexture: 150
        }
      ],
      appleCarePrice: 199
    },
    'MacBook Pro 14"': {
      displayName: 'MacBook Pro 14"',
      colors: ['Space Black', 'Silver'],
      specs: [
        {
          name: 'M4 10-Core CPU 10-Core GPU 16GB Unified Memory',
          price: 1599,
          constraints: { minStorage: '512GB', minMemory: '16GB' },
          memoryOptions: { '16GB': 0, '24GB': 200, '32GB': 400},
          storageOptions: { '512GB': 0, '1TB': 200, '2TB': 600},
          chargerOptions: { '70W': 0, '96W': 20 },
          nanoTexture: 150
        },
        {
          name: 'M4 10-Core CPU 10-Core GPU 24GB Unified Memory',
          price: 1999,
          constraints: { minStorage: '1TB', minMemory: '24GB' },
          memoryOptions: { '24GB': 0, '32GB': 200},
          storageOptions: { '1TB': 0, '2TB': 400},
          chargerOptions: { '70W': 0, '96W': 20 },
          nanoTexture: 150
        },
        {
          name: 'M4 Pro 12-Core CPU 16-Core GPU 24GB Unified Memory',
          price: 1999,
          constraints: { minStorage: '512GB', minMemory: '24GB' },
          memoryOptions: { '24GB': 0, '36GB': 200, '48GB': 400, '64GB': 600, '128GB': 1400},
          storageOptions: { '512GB': 0, '1TB': 200, '2TB': 600, '4TB': 1200, '8TB': 2400 },
          chargerOptions: { '70W': 0, '96W': 20 },
          nanoTexture: 150
        },
        {
          name: 'M4 Pro 14-Core CPU 20-Core GPU 24GB Unified Memory',
          price: 2399,
          constraints: { minStorage: '1TB', minMemory: '24GB' },
          memoryOptions: { '24GB': 0, '36GB': 200, '48GB': 400, '64GB': 600, '128GB': 1400},
          storageOptions: { '1TB': 0, '2TB': 400, '4TB': 1000, '8TB': 2200 },
          chargerOptions: { '70W': 0, '96W': 20 },
          nanoTexture: 150
        },
        {
          name: 'M4 Max 14-Core CPU 32-Core GPU 36GB Unified Memory',
          price: 3199,
          constraints: { minStorage: '1TB', minMemory: '36GB' },
          memoryOptions: { '36GB': 0, '48GB': 200, '64GB': 400, '128GB': 1200},
          storageOptions: { '1TB': 0, '2TB': 400, '4TB': 1000, '8TB': 2200 },
          chargerOptions: { '70W': 0, '96W': 20 },
          nanoTexture: 150
        }
      ],
      appleCarePrice: 199
    },
    'MacBook Air 15"': {
      displayName: 'MacBook Air 15"',
      colors: ['Starlight', 'Silver', 'Sky Blue', 'Midnight'],
      specs: [
        {
          name: 'M4 10-Core CPU 10-Core GPU 16GB Unified Memory',
          price: 1199,
          constraints: { minStorage: '256GB', minMemory: '16GB' },
          memoryOptions: { '16GB': 0, '24GB': 200, '32GB': 400},
          storageOptions: { '256GB':0, '512GB': 200, '1TB': 400, '2TB': 800},
          chargerOptions: { '35W Dual': 0, '70W': 0 },
        },
        {
          name: 'M4 10-Core CPU 10-Core GPU 24GB Unified Memory',
          price: 1599,
          constraints: { minStorage: '512GB', minMemory: '16GB' },
          memoryOptions: { '25GB': 0, '32GB': 200},
          storageOptions: { '512GB': 0, '1TB': 200, '2TB': 600},
          chargerOptions: { '35W Dual': 0, '70W': 0 },
        }
      ],
      appleCarePrice: 199
    },
    'MacBook Air 13"': {
      displayName: 'MacBook Air 13"',
      colors: ['Starlight', 'Silver', 'Sky Blue', 'Midnight'],
      specs: [
        {
          name: 'M4 10-Core CPU 8-Core GPU 16GB Unified Memory',
          price: 999,
          constraints: { minStorage: '256GB', minMemory: '16GB' },
          memoryOptions: { '16GB': 0, '24GB': 200, '32GB': 400},
          storageOptions: { '256GB':0, '512GB': 200, '1TB': 400, '2TB': 800},
          chargerOptions: { '30W': 0, '35W Dual': 20, '70W': 20 },
        },
        {
          name: 'M4 10-Core CPU 10-Core GPU 16GB Unified Memory',
          price: 1199,
          constraints: { minStorage: '512GB', minMemory: '16GB' },
          memoryOptions: { '16GB': 0, '24GB': 200, '32GB': 400},
          storageOptions: { '512GB': 0, '1TB': 200, '2TB': 600},
          chargerOptions: { '35W Dual': 0, '70W': 0 },
        },
        {
          name: 'M4 10-Core CPU 10-Core GPU 24GB Unified Memory',
          price: 1399,
          constraints: { minStorage: '512GB', minMemory: '24GB' },
          memoryOptions: { '24GB': 0, '32GB': 200},
          storageOptions: { '512GB': 0, '1TB': 200, '2TB': 600},
          chargerOptions: { '35W Dual': 0, '70W': 0 },
        }
      ],
      appleCarePrice: 199
    },
    'iMac': {
      displayName: 'iMac',
      colors: ['Silver', 'Blue', 'Green', 'Pink', 'Yellow', 'Purple', 'Orange', 'Red'],
      specs: [
        {
          name: 'M4 8-Core CPU 10-Core GPU 16GB Unified Memory',
          price: 1299,
          constraints: { minStorage: '256GB' },
          memoryOptions: { '16GB': 0, '24GB': 200 },
          storageOptions: { '256GB': 200, '512GB': 400, '1TB': 800 },
          chargerOptions: { '30W': 0, '67W': 0 }
        },
        {
          name: 'M4 8-Core CPU 10-Core GPU 24GB Unified Memory',
          price: 1499,
          constraints: { minStorage: '512GB' }
        }
      ],
      appleCarePrice: 199
    },
    'Mac mini': {
      displayName: 'Mac mini',
      colors: ['Silver'],
      specs: [
        {
          name: 'M4 8-Core CPU 10-Core GPU 16GB Unified Memory',
          price: 699,
          constraints: { minStorage: '256GB' },
          memoryOptions: { '16GB': 0, '24GB': 200 },
          storageOptions: { '256GB': 200, '512GB': 400, '1TB': 800 },
        },
        {
          name: 'M4 8-Core CPU 10-Core GPU 24GB Unified Memory',
          price: 899,
          constraints: { minStorage: '512GB' },
          memoryOptions: { '24GB': 0 },
          storageOptions: { '512GB': 0, '1TB': 400 },
        }
      ],
      appleCarePrice: 199
    },
    'Mac Studio': {
      displayName: 'Mac Studio',
      colors: ['Silver'],
      specs: [
        {
          name: 'M4 10-Core CPU 16-Core GPU 24GB Unified Memory',
          price: 1999,
          constraints: { minStorage: '512GB' },
          memoryOptions: { '24GB': 0, '48GB': 200 },
          storageOptions: { '512GB': 200, '1TB': 400, '2TB': 800 },
          chargerOptions: { '67W': 0, '96W': 0 }
        },
        {
          name: 'M4 10-Core CPU 16-Core GPU 48GB Unified Memory',
          price: 2499,
          constraints: { minStorage: '1TB' }
        }
      ],
      appleCarePrice: 199
    }
  }
}

const IPHONE_CONFIGURATIONS: ProductCategoryConfiguration<ModelConfiguration<iPhoneSpecificationOption>> = {
  category: 'iPhone',
  appleCareAvailable: true,
  models: {
    'iPhone 16 Pro & Pro Max': {
      displayName: 'iPhone 16 Pro & Pro Max',
      colors: ['Desert Titanium', 'Natural Titanium', 'White Titanium', 'Black Titanium'],
      specs: [
        {
          name: 'iPhone 16 Pro',
          price: 999,
          constraints: { minStorage: '128GB' },
          storageOptions: { '128GB': 0, '256GB': 100, '512GB': 300, '1TB': 500 },
        },
        {
          name: 'iPhone 16 Pro Max',
          price: 1199,
          constraints: { minStorage: '256GB' },
          storageOptions: { '256GB': 0, '512GB': 100, '1TB': 200 },
        }
      ],
      appleCarePrice: 179
    },
    'iPhone 16 & 16 Plus': {
      displayName: 'iPhone 16 & 16 Plus',
      colors: ['Ultramarine', 'Teal', 'Pink', 'White', 'Black'],
      specs: [
        {
          name: 'iPhone 16',
          price: 799,
          constraints: { minStorage: '128GB' },
          storageOptions: { '128GB': 0, '256GB': 100, '512GB': 300 },
        },
        {
          name: 'iPhone 16 Plus',
          price: 899,
          constraints: { minStorage: '128GB'},
          storageOptions: { '128GB': 0, '256GB': 100, '512GB': 300 },
        }
      ],
      appleCarePrice: 179
    },
    'iPhone 16e': {
      displayName: 'iPhone 16e',
      colors: ['Black', 'White'],
      specs: [
        {
          name: 'iPhone 16e',
          price: 599,
          constraints: { minStorage: '128GB' },
          storageOptions: { '128GB': 0, '256GB': 100, '512GB': 300 },
        }
      ],
      appleCarePrice: 99
    }
  }
}

const IPAD_CONFIGURATIONS: ProductCategoryConfiguration<ModelConfiguration<iPadSpecificationOption>> = {
  category: 'iPad',
  appleCareAvailable: true,
  models: {
    'iPad Pro': {
      displayName: 'iPad Pro',
      colors: ['Silver', 'Space Black'],
      specs: [
        {
          name: '11-inch iPad Pro',
          price: 999,
          constraints: { minStorage: '256GB', minStorageForNanotexture: '1TB' },
          storageOptions: { '256GB': 0, '512GB': 200, '1TB': 600, '2TB': 1000 },
          connectivityOptions: { 'Wi-Fi': 0, 'Wi-Fi + Cellular': 200 },
          nanoTexture: 100,
          applePencil: [
            { pencilType: 'None', price: 0 },
            { pencilType: 'Apple Pencil Pro', price: 129 },
            { pencilType: 'Apple Pencil (USB-C)', price: 79 }
          ],
          magicKeyboard: 299,
          appleCarePrice: 149
        },
        {
          name: '13-inch iPad Pro',
          price: 1299,
          constraints: { minStorage: '256GB', minStorageForNanotexture: '1TB' },
          storageOptions: { '256GB': 0, '512GB': 200, '1TB': 600, '2TB': 1000 },
          connectivityOptions: { 'Wi-Fi': 0, 'Wi-Fi + Cellular': 200 },
          nanoTexture: 100,
          applePencil: [
            { pencilType: 'None', price: 0 },
            { pencilType: 'Apple Pencil Pro', price: 129 },
            { pencilType: 'Apple Pencil (USB-C)', price: 79 }
          ],
          magicKeyboard: 349,
          appleCarePrice: 169
        }
      ],
    },
    'iPad Air': {
      displayName: 'iPad Air',
      colors: ['Space Gray', 'Blue', 'Purple', 'Starlight'],
      specs: [
        {
          name: '11-inch iPad Air',
          price: 599,
          constraints: { minStorage: '128GB' },
          storageOptions: { '128GB': 0, '256GB': 100, '512GB': 300, '1TB': 500 },
          connectivityOptions: { 'Wi-Fi': 0, 'Wi-Fi + Cellular': 150 },
          applePencil: [
            { pencilType: 'None', price: 0 },
            { pencilType: 'Apple Pencil Pro', price: 129 },
            { pencilType: 'Apple Pencil (USB-C)', price: 79 }
          ],
          magicKeyboard: 269,
          appleCarePrice: 79
        },
        {
          name: '13-inch iPad Air',
          price: 799,
          constraints: { minStorage: '128GB' },
          storageOptions: { '128GB': 0, '256GB': 100, '512GB': 300, '1TB': 500 },
          connectivityOptions: { 'Wi-Fi': 0, 'Wi-Fi + Cellular': 150 },
          applePencil: [
            { pencilType: 'None', price: 0 },
            { pencilType: 'Apple Pencil Pro', price: 129 },
            { pencilType: 'Apple Pencil (USB-C)', price: 79 }
          ],
          magicKeyboard: 299,
          appleCarePrice: 99
        }
      ],
    },
    'iPad': {
      displayName: 'iPad',
      colors: ['Silver', 'Blue', 'Pink', 'Yellow'],
      specs: [
        {
          name: 'default',
          price: 329,
          constraints: { minStorage: '128GB' },
          storageOptions: { '128GB': 0, '256GB': 100, '512GB': 300 },
          connectivityOptions: { 'Wi-Fi': 0, 'Wi-Fi + Cellular': 150 },
          applePencil: [
            { pencilType: 'None', price: 0 },
            { pencilType: 'Apple Pencil (USB-C)', price: 79 },
            { pencilType: 'Apple Pencil (1st Gen)', price: 99 }
          ],
          magicKeyboard: 249,
          appleCarePrice: 69
        }
      ],
    },
    'iPad mini': {
      displayName: 'iPad mini',
      colors: ['Space Gray', 'Blue', 'Purple', 'Starlight'],
      specs: [
        {
          name: 'default',
          price: 499,
          constraints: { minStorage: '128GB' },
          storageOptions: { '128GB': 0, '256GB': 100, '512GB': 300 },
          connectivityOptions: { 'Wi-Fi': 0, 'Wi-Fi + Cellular': 150 },
          applePencil: [
            { pencilType: 'None', price: 0 },
            { pencilType: 'Apple Pencil Pro', price: 129 },
            { pencilType: 'Apple Pencil (USB-C)', price: 79 }
          ],
          appleCarePrice: 69
        }
      ],
    }
  }
}

const WATCH_CONFIGURATIONS: ProductCategoryConfiguration<ModelConfiguration<AppleWatchSpecificationOption>> = {
  category: 'Apple Watch',
  appleCareAvailable: true,
  models: {
    'Apple Watch Series 10': {
      displayName: 'Apple Watch Series 10',
      colors: [],
      specs: [
        {
          name: 'Aluminium Case',
          price: 399,
          colors: ['Silver', 'Rose Gold', 'Jet Black'],
          sizeOptions: {'42mm': 0, '46mm': 30},
          connectivityOptions: { 'GPS': 0, 'GPS + Cellular': 100 },
          bandOptions: [
            {
              material: 'Rubber',
              style: [
                { 
                  styleName: 'Solo Loop',
                  price: 0,
                  bandColor: ['Northern Lights', 'Periwinkle', 'Peony', 'Black', 'Light Blush'],
                  bandSizeOptions: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
                },
                { 
                  styleName: 'Sport Band', 
                  price: 0, 
                  bandColor: ['Aquamarine', 'Periwinkle', 'Tangerine', 'Starlight', 'Black', 'Light Blush', 'Stone Grey', 'Pride', 'Black Unity'],
                  bandSizeOptions: ['S/M', 'M/L']
                },
                {
                  styleName: 'Nike Sport Band',
                  price: 0,
                  bandColor: ['Volt Splash', 'Magic Ember', 'Midnight Sky', 'Pure Platinum', 'Desert Stone', 'Cargo Khaki', 'Blue Flame'],
                  bandSizeOptions: ['S/M', 'M/L']
                }
              ]
            },
            {
              material: 'Textile',
              style: [
                {
                  styleName: 'Sport Loop',
                  price: 0,
                  bandColor: ['Black', 'White', 'Red', 'Blue', 'Green'],
                  bandSizeOptions: ['S/M', 'M/L']
                },
                {
                  styleName: 'Magnetic Link',
                  price: 50,
                  bandColor: ['Dark Taupe', 'Black', 'Blackberry'],
                  bandSizeOptions: ['S/M', 'M/L']
                },
                {
                  styleName: 'Modern Buckle',
                  price: 100,
                  bandColor: ['Deep Blue', 'Dark Taupe', 'Chartreuse'],
                  bandSizeOptions: ['Small', 'Medium', 'Large']
                },
                {
                  styleName: 'Braided Solo Loop',
                  price: 50,
                  bandColor: ['Black', 'White', 'Red', 'Blue', 'Green'],
                  bandSizeOptions: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
                },
                {
                  styleName: 'Nike Sport Loop',
                  price: 0,
                  bandColor: ['Black', 'White', 'Red', 'Blue', 'Green'],
                  bandSizeOptions: ['S/M', 'M/L']
                }
              ]
            },
            {
              material: 'Stainless Steel',
              style: [
                {
                  styleName: 'Milanese Loop',
                  price: 50,
                  bandColor: ['Natural', 'Gold', 'Slate'],
                },
                {
                  styleName: 'Link Bracelet',
                  price: 250,
                  bandColor: ['Natural', 'Gold', 'Slate'],
                },
              ]
            }
          ],
          appleCarePrice: 79
        },
        {
          name: 'Titanium Case',
          price: 699,
          sizeOptions: {'42mm': 0 , '46mm': 50},
          colors: ['Natural', 'Slate', 'Gold'],
          connectivityOptions: {'GPS + Cellular': 0},
          bandOptions: [
            {
              material: 'Rubber',
              style: [
                { 
                  styleName: 'Solo Loop',
                  price: 0,
                  bandColor: ['Northern Lights', 'Periwinkle', 'Peony', 'Black', 'Light Blush'],
                  bandSizeOptions: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
                },
                { 
                  styleName: 'Sport Band', 
                  price: 0, 
                  bandColor: ['Aquamarine', 'Periwinkle', 'Tangerine', 'Starlight', 'Black', 'Light Blush', 'Stone Grey', 'Pride', 'Black Unity'],
                  bandSizeOptions: ['S/M', 'M/L']
                },
                {
                  styleName: 'Nike Sport Band',
                  price: 0,
                  bandColor: ['Volt Splash', 'Magic Ember', 'Midnight Sky', 'Pure Platinum', 'Desert Stone', 'Cargo Khaki', 'Blue Flame'],
                  bandSizeOptions: ['S/M', 'M/L']
                }
              ]
            },
            {
              material: 'Textile',
              style: [
                {
                  styleName: 'Sport Loop',
                  price: 0,
                  bandColor: ['Black', 'White', 'Red', 'Blue', 'Green'],
                  bandSizeOptions: ['S/M', 'M/L']
                },
                {
                  styleName: 'Magnetic Link',
                  price: 50,
                  bandColor: ['Dark Taupe', 'Black', 'Blackberry'],
                  bandSizeOptions: ['S/M', 'M/L']
                },
                {
                  styleName: 'Modern Buckle',
                  price: 100,
                  bandColor: ['Deep Blue', 'Dark Taupe', 'Chartreuse'],
                  bandSizeOptions: ['Small', 'Medium', 'Large']
                },
                {
                  styleName: 'Braided Solo Loop',
                  price: 50,
                  bandColor: ['Black', 'White', 'Red', 'Blue', 'Green'],
                  bandSizeOptions: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
                },
                {
                  styleName: 'Nike Sport Loop',
                  price: 0,
                  bandColor: ['Black', 'White', 'Red', 'Blue', 'Green'],
                  bandSizeOptions: ['S/M', 'M/L']
                }
              ]
            },
            {
              material: 'Stainless Steel',
              style: [
                {
                  styleName: 'Milanese Loop',
                  price: 50,
                  bandColor: ['Natural', 'Gold', 'Slate'],
                },
                {
                  styleName: 'Link Bracelet',
                  price: 250,
                  bandColor: ['Natural', 'Gold', 'Slate'],
                },
              ]
            }
          ],
          appleCarePrice: 79
        }
      ]
    },
    'Apple Watch Ultra 2': {
      displayName: 'Apple Watch Ultra 2',
      colors: ['Natural', 'Black'],
      specs: [
        {
          name: 'default',
          price: 799,
          sizeOptions: {'49mm': 0},
          connectivityOptions: {'GPS + Cellular': 0},
          bandOptions: [
            {
              material: 'default',
              style: [
                { 
                  styleName: 'Trail Loop',
                  price: 0,
                  bandColor: ['Black', 'Green', 'Blue'],
                  bandSizeOptions: ['S/M', 'M/L']
                },
                { 
                  styleName: 'Ocean Band', 
                  price: 0, 
                  bandColor: ['Ice Blue', 'Black', 'Navy'],
                },
                {
                  styleName: 'Alpine Loop',
                  price: 0,
                  bandColor: ['Tan', 'Navy', 'Dark Green'],
                  bandSizeOptions: ['Small', 'Medium', 'Large']
                },
                { 
                  styleName: 'Titanium Milanese Loop',
                  price: 100,
                  bandColor: ['Natural', 'Black'],
                  bandSizeOptions: ['Small', 'Medium', 'Large']
                }
              ]
            }
          ],
          appleCarePrice: 99
        }
      ]
    },
    'Apple Watch SE': {
      displayName: 'Apple Watch SE 2nd Gen',
      colors: ['Midnight', 'Starlight', 'Silver'],
      appleCarePrice: 49,
      specs: [
        {
          name: 'default',
          price: 219,
          sizeOptions: {'40mm': 0, '44mm': 30},
          connectivityOptions: { 'GPS': 0, 'GPS + Cellular': 70 },
          bandOptions: [
            {
              material: 'Rubber',
              style: [
                { 
                  styleName: 'Solo Loop',
                  price: 0,
                  bandColor: ['Northern Lights', 'Periwinkle', 'Peony', 'Black', 'Light Blush'],
                  bandSizeOptions: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
                },
                { 
                  styleName: 'Sport Band', 
                  price: 0, 
                  bandColor: ['Aquamarine', 'Periwinkle', 'Tangerine', 'Starlight', 'Black', 'Light Blush', 'Stone Grey', 'Pride', 'Black Unity'],
                  bandSizeOptions: ['S/M', 'M/L']
                },
                {
                  styleName: 'Nike Sport Band',
                  price: 0,
                  bandColor: ['Volt Splash', 'Magic Ember', 'Midnight Sky', 'Pure Platinum', 'Desert Stone', 'Cargo Khaki', 'Blue Flame'],
                  bandSizeOptions: ['S/M', 'M/L']
                }
              ]
            },
            {
              material: 'Textile',
              style: [
                {
                  styleName: 'Sport Loop',
                  price: 0,
                  bandColor: ['Black', 'White', 'Red', 'Blue', 'Green'],
                  bandSizeOptions: ['S/M', 'M/L']
                },
                {
                  styleName: 'Magnetic Link',
                  price: 50,
                  bandColor: ['Dark Taupe', 'Black', 'Blackberry'],
                  bandSizeOptions: ['S/M', 'M/L']
                },
                {
                  styleName: 'Modern Buckle',
                  price: 100,
                  bandColor: ['Deep Blue', 'Dark Taupe', 'Chartreuse'],
                  bandSizeOptions: ['Small', 'Medium', 'Large']
                },
                {
                  styleName: 'Braided Solo Loop',
                  price: 50,
                  bandColor: ['Black', 'White', 'Red', 'Blue', 'Green'],
                  bandSizeOptions: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
                },
                {
                  styleName: 'Nike Sport Loop',
                  price: 0,
                  bandColor: ['Black', 'White', 'Red', 'Blue', 'Green'],
                  bandSizeOptions: ['S/M', 'M/L']
                }
              ]
            },
            {
              material: 'Stainless Steel',
              style: [
                {
                  styleName: 'Milanese Loop',
                  price: 50,
                  bandColor: ['Natural', 'Gold', 'Slate'],
                },
                {
                  styleName: 'Link Bracelet',
                  price: 250,
                  bandColor: ['Natural', 'Gold', 'Slate'],
                },
              ]
            }
          ],
        }
      ]
    }
  }
}

// Aggregate all product configurations
export const PRODUCT_CONFIGURATIONS = {
  'MacBook': MACBOOK_CONFIGURATIONS,
  'iPhone': IPHONE_CONFIGURATIONS,
  'iPad': IPAD_CONFIGURATIONS,
  'Apple Watch': WATCH_CONFIGURATIONS
} as const

export type ProductCategoryKey = keyof typeof PRODUCT_CONFIGURATIONS

// Helper Functions

/**
 * Get all models for a given product category
 */
export function getModelConfigurations<T extends ProductCategoryKey>(category: T): Array<{ key: string; config: ModelConfiguration }> | undefined {
  const productCategory = PRODUCT_CONFIGURATIONS[category]
  if (!productCategory) return undefined

  return Object.entries(productCategory.models).map(([key, config]) => ({ key, config }))
}

/**
 * Get configuration for a specific model
 */
export function getModelConfiguration<T extends ProductCategoryKey>(category: T, modelName: string): ModelConfiguration | undefined {
  const productCategory = PRODUCT_CONFIGURATIONS[category]
  if (!productCategory) return undefined

  return productCategory.models[modelName]
}

/**
 * Get available options filtered by selected spec and constraints
 */
export function getAvailableOptions<T extends ProductCategoryKey>(
  category: T,
  modelName: string,
  specName?: string
) {
  const model = getModelConfiguration(category, modelName)
  if (!model) return null

  const selectedSpec = specName ? model.specs.find(spec => spec.name === specName) : null

  // Helper function to filter options based on constraints
  function filterOptionsByConstraints(
    options: Record<string, number> | undefined,
    constraints: Record<string, unknown> | undefined,
    constraintKey: string
  ): string[] {
    if (!options) return []
    if (!constraints || !constraints[constraintKey]) return Object.keys(options)

    if (constraintKey === 'minMemory') {
      const minValue = constraints[constraintKey] as string
      const minMemoryGB = parseMemorySize(minValue)

      return Object.keys(options).filter(option => {
        const optionMemoryGB = parseMemorySize(option)
        return optionMemoryGB >= minMemoryGB
      })
    }

    if (constraintKey === 'minStorageForNanotexture') {
      const minValue = constraints[constraintKey] as string
      const minSizeGB = parseStorageSize(minValue)

      return Object.keys(options).filter(option => {
        const optionSizeGB = parseStorageSize(option)
        return optionSizeGB >= minSizeGB
      })
    }
    const minValue = constraints[constraintKey] as string
    const minSizeGB = parseStorageSize(minValue)

    return Object.keys(options).filter(option => {
      const optionSizeGB = parseStorageSize(option)
      return optionSizeGB >= minSizeGB
    })
  }

  // Parse storage sizes to GB for comparison
  function parseStorageSize(size: string): number {
    const match = size.match(/(\d+)(GB|TB)/i)
    if (!match) return 0
    const value = parseInt(match[1])
    const unit = match[2].toUpperCase()
    return unit === 'TB' ? value * 1024 : value
  }

  // Parse memory sizes to GB for comparison
  function parseMemorySize(memory: string): number {
    const match = memory.match(/(\d+)GB/i)
    return match ? parseInt(match[1]) : 0
  }

  const result = {
    colors: model.colors,
    specs: model.specs,
    appleCarePrice: getAppleCarePrice(category, modelName, specName)
  } as any

  if (selectedSpec) {
    // MacBook specific options
    if ('memoryOptions' in selectedSpec) {
      const macSpec = selectedSpec as MacbookSpecificationOption
      result.memoryOptions = filterOptionsByConstraints(
        macSpec.memoryOptions,
        macSpec.constraints,
        'minMemory'
      )
      result.storageOptions = filterOptionsByConstraints(
        macSpec.storageOptions,
        macSpec.constraints,
        'minStorage'
      )
      if (macSpec.chargerOptions) {
        result.chargerOptions = Object.keys(macSpec.chargerOptions)
      } else {
        result.chargerOptions = undefined
      }
      result.nanoTextureAvailable = typeof macSpec.nanoTexture === 'number'
      result.nanoTexturePrice = macSpec.nanoTexture
    }

    // iPhone specific options
    if ('storageOptions' in selectedSpec && category === 'iPhone') {
      const iphoneSpec = selectedSpec as iPhoneSpecificationOption
      result.storageOptions = filterOptionsByConstraints(
        iphoneSpec.storageOptions,
        iphoneSpec.constraints,
        'minStorage'
      )
    }

    // iPad specific options
    if ('connectivityOptions' in selectedSpec && category === 'iPad') {
      const ipadSpec = selectedSpec as iPadSpecificationOption
      result.storageOptions = filterOptionsByConstraints(
        ipadSpec.storageOptions,
        ipadSpec.constraints,
        'minStorage'
      )
      result.connectivityOptions = Object.keys(ipadSpec.connectivityOptions || {})
      result.applePencilOptions = ipadSpec.applePencil || []
      result.magicKeyboardPrice = ipadSpec.magicKeyboard
      result.nanoTextureAvailable = typeof ipadSpec.nanoTexture === 'number'
      result.nanoTexturePrice = ipadSpec.nanoTexture
    }

    // Apple Watch specific options
    if ('sizeOptions' in selectedSpec && category === 'Apple Watch') {
      const watchSpec = selectedSpec as AppleWatchSpecificationOption
      result.sizeOptions = Object.keys(watchSpec.sizeOptions || {})
      result.connectivityOptions = Object.keys(watchSpec.connectivityOptions || {})
      result.bandOptions = watchSpec.bandOptions || []
      result.colors = watchSpec.colors || model.colors
    }
  }

  return result
}

/**
 * Calculate total price based on selected options
 */
export function calculatePrice<T extends ProductCategoryKey>(
  category: T,
  modelName: string,
  specName: string,
  selectedOptions: {
    memory?: string
    storage?: string
    charger?: string
    connectivity?: string
    size?: string
    applePencil?: string
    magicKeyboard?: boolean
    nanoTexture?: boolean
    appleCare?: boolean
    band?: { material: string; style: string; color: string }
  } = {}
): number {
  const model = getModelConfiguration(category, modelName)
  if (!model) return 0

  const spec = model.specs.find(s => s.name === specName)
  if (!spec) return 0

  let totalPrice = spec.price

  // MacBook pricing
  if ('memoryOptions' in spec) {
    const macSpec = spec as MacbookSpecificationOption
    if (selectedOptions.memory && macSpec.memoryOptions) {
      totalPrice += macSpec.memoryOptions[selectedOptions.memory] || 0
    }
    if (selectedOptions.storage && macSpec.storageOptions) {
      totalPrice += macSpec.storageOptions[selectedOptions.storage] || 0
    }
    if (selectedOptions.charger && macSpec.chargerOptions) {
      totalPrice += macSpec.chargerOptions[selectedOptions.charger] || 0
    }
    if (selectedOptions.nanoTexture && macSpec.nanoTexture) {
      totalPrice += macSpec.nanoTexture
    }
  }

  // iPhone pricing
  if ('storageOptions' in spec && category === 'iPhone') {
    const iphoneSpec = spec as iPhoneSpecificationOption
    if (selectedOptions.storage && iphoneSpec.storageOptions) {
      totalPrice += iphoneSpec.storageOptions[selectedOptions.storage] || 0
    }
  }

  // iPad pricing
  if ('connectivityOptions' in spec && category === 'iPad') {
    const ipadSpec = spec as iPadSpecificationOption
    if (selectedOptions.storage && ipadSpec.storageOptions) {
      totalPrice += ipadSpec.storageOptions[selectedOptions.storage] || 0
    }
    if (selectedOptions.connectivity && ipadSpec.connectivityOptions) {
      totalPrice += ipadSpec.connectivityOptions[selectedOptions.connectivity] || 0
    }
    if (selectedOptions.applePencil && ipadSpec.applePencil) {
      const pencil = ipadSpec.applePencil.find(p => p.pencilType === selectedOptions.applePencil)
      if (pencil) totalPrice += pencil.price
    }
    if (selectedOptions.magicKeyboard && ipadSpec.magicKeyboard) {
      totalPrice += ipadSpec.magicKeyboard
    }
    if (selectedOptions.nanoTexture && ipadSpec.nanoTexture) {
      totalPrice += ipadSpec.nanoTexture
    }
  }

  // Apple Watch pricing
  if ('sizeOptions' in spec && category === 'Apple Watch') {
    const watchSpec = spec as AppleWatchSpecificationOption
    if (selectedOptions.size && watchSpec.sizeOptions) {
      totalPrice += watchSpec.sizeOptions[selectedOptions.size] || 0
    }
    if (selectedOptions.connectivity && watchSpec.connectivityOptions) {
      totalPrice += watchSpec.connectivityOptions[selectedOptions.connectivity] || 0
    }
    if (selectedOptions.band && watchSpec.bandOptions) {
      // Find the band price based on material, style, and color
      for (const bandGroup of watchSpec.bandOptions) {
        if (bandGroup.material === selectedOptions.band.material) {
          const style = bandGroup.style.find(s => s.styleName === selectedOptions.band?.style)
          if (style) {
            totalPrice += style.price
            break
          }
        }
      }
    }
  }
  // AppleCare pricing (common to all products)
  if (selectedOptions.appleCare && model.appleCarePrice) {
    totalPrice += model.appleCarePrice
  } else if (selectedOptions.appleCare && spec.appleCarePrice) {
    totalPrice += spec.appleCarePrice
  }
  

  return totalPrice
}

export function getAppleCarePrice<T extends ProductCategoryKey>(
  lineName: T,
  modelName: string,
  specName?: string
): number | undefined {
  const productLine = PRODUCT_CONFIGURATIONS[lineName]
  if (!productLine) return undefined

  const model = productLine.models[modelName]
  if (!model) return undefined

  // Priority 1: Check selected spec's appleCarePrice
  if (specName) {
    const selectedSpec = model.specs.find(spec => spec.name === specName)
    if (selectedSpec && 'appleCarePrice' in selectedSpec && typeof selectedSpec.appleCarePrice === 'number') {
      return selectedSpec.appleCarePrice
    }
  }

  // Priority 2: Check model's appleCarePrice
  if ('appleCarePrice' in model && typeof model.appleCarePrice === 'number') {
    return model.appleCarePrice
  }

  // Priority 3: Check product line's default appleCarePrice (if you have one)
  // This would be rare, but you could add it to your ProductLineConfiguration interface
  
  return undefined
}

/**
 * Format spec display name for better UX
 */
export function formatSpecDisplay(spec: SpecificationOption): string {
  return spec.name || 'Unnamed Configuration'
}

/**
 * Get product line display name
 */
export function getProductCategoryDisplayName<T extends ProductCategoryKey>(category: T): string {
  return PRODUCT_CONFIGURATIONS[category].category
}
