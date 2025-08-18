// types/basket.ts
export interface BasketItem {
  id: string
  category: string
  model: string
  color: string
  storage?: string
  specs?: string
  size?: string
  connectivity?: string
  appleCare: boolean
  memory?: string
  charger?: string
  applePencil?: string
  magicKeyboard?: boolean
  nanoTexture?: boolean
  band?: {
    material: string;
    style: string;
    color: string;
    size?: string
  }
  quantity: number
  estimatedPrice?: number
  discountValue?: number
  tradeIn?: {
    hasTradeIn: boolean
    serialNumber?: string
    model?: string
  }
}

export interface BasketState {
  items: BasketItem[]
  currentItem: Partial<BasketItem>
  isAddingProduct: boolean
}

export interface DeliveryInfo {
  method: 'delivery' | 'pickup'
  deliveryType?: string
  storeLocation?: string
  address?: {
    title: string
    firstName: string
    surname: string
    line1: string
    line2?: string
    city: string
    postcode: string
  }
  contact: {
    email: string
    phone: string
  }
}

export interface OrderData {
  basket: BasketItem[]
  delivery: DeliveryInfo
  additionalComments?: string
  checkCompleted: boolean
}
