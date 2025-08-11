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
  appleCare: z.boolean(),
  tradeIn: z.object({
    hasTradeIn: z.boolean(),
    serialNumber: z.string().optional(),
    model: z.string().optional()
  }).optional()
})

export const deliverySchema = z.object({
  method: z.enum(['delivery', 'pickup'], {
    error: 'Please select delivery or pickup'
  }),
  deliveryType: z.string().optional(),
  storeLocation: z.string().optional(),
  address: z.object({
    title: z.string().min(1, 'Title is required'),
    firstName: z.string().min(1, 'First name is required'),
    surname: z.string().min(1, 'Surname is required'),
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    postcode: z.string().min(1, 'Postcode is required').regex(/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i, 'Please enter a valid UK postcode')
  }).optional(),
  contact: z.object({
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Please enter a valid phone number')
  })
}).refine((data) => {
  if (data.method === 'delivery' && !data.address) {
    return false
  }
  if (data.method === 'pickup' && !data.storeLocation) {
    return false
  }
  return true
}, {
  message: 'Please complete all required fields for your selected delivery method',
  path: ['method']
})

export type BasketItemFormData = z.infer<typeof basketItemSchema>
export type DeliveryFormData = z.infer<typeof deliverySchema>
