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
    serialNumber: z.string().max(50).optional(),
    model: z.string().max(100).optional()
  }).optional(),
  estimatedPrice: z.number().nonnegative().optional(),
  discountValue: z.number().nonnegative().optional(),
})

const baseSchema = z.object({
  contact: z.object({
    email: z.string().max(254).email('Please enter a valid email address'),
    phone: z.string().min(10, 'Please enter a valid phone number').max(20)
  })
})

const deliveryMethodSchema = baseSchema.extend({
  method: z.literal('delivery'),
  deliveryType: z.string().optional(),
  address: z.object({
    title: z.string().max(100).optional(),
    firstName: z.string().min(1, 'First name is required').max(100),
    surname: z.string().min(1, 'Surname is required').max(100),
    line1: z.string().min(1, 'Address line 1 is required').max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(1, 'City is required').max(100),
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
    title: z.string().max(100).optional(),
    firstName: z.string().min(1, 'First name is required').max(100),
    surname: z.string().min(1, 'Surname is required').max(100),
    line1: z.string().max(200).optional(),
    line2: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    postcode: z.string().optional()
  }).optional(),
  deliveryType: z.string().optional()
})

export const deliverySchema = z.discriminatedUnion('method', [
  deliveryMethodSchema,
  pickupMethodSchema
])


export const orderSchema = z.object({
  basket: z.array(basketItemSchema).min(1, 'Your basket cannot be empty').max(20),
  delivery: deliverySchema,
  additionalComments: z.string().max(1000).optional(),
  checkCompleted: z.boolean()
}).strict()

export type BasketItemFormData = z.infer<typeof basketItemSchema>
export type DeliveryFormData = z.infer<typeof deliverySchema>
export type OrderFormData = z.infer<typeof orderSchema>
