// lib/validation-schemas.ts
import { z } from 'zod'

export const basketItemSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  model: z.string().min(1, 'Model is required'),
  color: z.string().min(1, 'Color is required'),
  storage: z.string().optional(),
  specs: z.string().optional(),
  size: z.string().optional(),
  connectivity: z.string().optional(),
  bands: z.string().optional(),
  memory: z.string().optional(),
  charger: z.string().optional(),
  applePencil: z.string().optional(),
  magicKeyboard: z.boolean().optional(),
  nanoTexture: z.boolean().optional(),
  band: z.object({
    material: z.string(),
    style: z.string(),
    color: z.string(),
    size: z.string().optional()
  }).optional(),
  appleCare: z.boolean(),
  tradeIn: z.object({
    hasTradeIn: z.boolean(),
    serialNumber: z.string().optional(),
    model: z.string().optional()
  }).optional(),
  estimatedPrice: z.number().optional(),
  discountValue: z.number().optional(),
})

const baseSchema = z.object({
  contact: z.object({
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Please enter a valid phone number')
  })
})

const deliveryMethodSchema = baseSchema.extend({
  method: z.literal('delivery'),
  deliveryType: z.string().optional(),
  address: z.object({
    title: z.string().optional(),
    firstName: z.string().min(1, 'First name is required'),
    surname: z.string().min(1, 'Surname is required'),
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    postcode: z.string()
      .min(1, 'Postcode is required')
      .regex(/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i, 'Please enter a valid UK postcode')
  }),
  // storeLocation not needed for delivery
  storeLocation: z.string().optional()
})

const pickupMethodSchema = baseSchema.extend({
  method: z.literal('pickup'),
  storeLocation: z.string().min(1, 'Please select a store location'),
  // address not needed for pickup
  address: z.object({
    title: z.string().optional(),
    firstName: z.string().optional(),
    surname: z.string().optional(),
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    postcode: z.string().optional()
  }).optional(),
  deliveryType: z.string().optional()
})

export const deliverySchema = z.discriminatedUnion('method', [
  deliveryMethodSchema,
  pickupMethodSchema
])


export const orderSchema = z.object({
  basket: z.array(basketItemSchema).min(1, 'Your basket cannot be empty'),
  delivery: deliverySchema,
  additionalComments: z.string().optional(),
  checkCompleted: z.boolean()
})

export type BasketItemFormData = z.infer<typeof basketItemSchema>
export type DeliveryFormData = z.infer<typeof deliverySchema>
export type OrderFormData = z.infer<typeof orderSchema>
