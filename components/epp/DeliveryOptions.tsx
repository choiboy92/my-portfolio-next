// components/apple-discount/DeliveryOptions.tsx
'use client'

import { Controller, Control, FieldErrors, UseFormWatch } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Truck, Store } from 'lucide-react'
import type { DeliveryFormData } from '@/lib/validation-schema'

interface DeliveryOptionsProps {
  control: Control<DeliveryFormData>
  errors: FieldErrors<DeliveryFormData>
  onSubmit: () => void
  onBack: () => void
  watch: UseFormWatch<DeliveryFormData>
}

const DELIVERY_TYPES = [
  { value: 'standard', label: 'Standard Delivery (5-7 business days)' },
  { value: 'express', label: 'Express Delivery (2-3 business days)' },
  { value: 'next-day', label: 'Next Business Day Delivery' }
]

const APPLE_STORES = [
  { value: 'regent-street', label: 'Apple Regent Street' },
  { value: 'covent-garden', label: 'Apple Covent Garden' },
  { value: 'oxford-street', label: 'Apple Oxford Street' },
  { value: 'stratford-city', label: 'Apple Stratford City' },
  { value: 'bluewater', label: 'Apple Bluewater' },
  { value: 'kingston', label: 'Apple Kingston' }
]

const TITLES = [
  { value: 'Mr', label: 'Mr' },
  { value: 'Mrs', label: 'Mrs' },
  { value: 'Miss', label: 'Miss' },
  { value: 'Ms', label: 'Ms' },
  { value: 'Dr', label: 'Dr' }
]

export function DeliveryOptions({ control, errors, onSubmit, onBack, watch }: DeliveryOptionsProps) {
  const deliveryMethod = watch('method')

  return (
    <div className="space-y-6">
      {/* Delivery Method Selection */}
      <Card className="bg-portfolio-card border-portfolio-border text-white">
        <CardHeader>
          <CardTitle className="text-portfolio-text">Delivery Method</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            name="method"
            control={control}
            render={({ field }) => (
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="space-y-4"
              >
                <div className="flex items-center space-x-3 p-4 border border-portfolio-border rounded-lg hover:bg-portfolio-dark transition-colors">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex items-center gap-3 cursor-pointer flex-1">
                    <Truck className="w-5 h-5 text-portfolio-accent" />
                    <div>
                      <div className="text-portfolio-text font-medium">Delivery</div>
                      <div className="text-sm text-portfolio-muted">Have your order delivered to your address</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border border-portfolio-border rounded-lg hover:bg-portfolio-dark transition-colors">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="flex items-center gap-3 cursor-pointer flex-1">
                    <Store className="w-5 h-5 text-portfolio-accent" />
                    <div>
                      <div className="text-portfolio-text font-medium">Store Pickup</div>
                      <div className="text-sm text-portfolio-muted">Collect from your chosen Apple Store</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            )}
          />
          {errors.method && (
            <p className="text-red-500 text-sm mt-2">{errors.method.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Delivery Type Selection (for delivery method) */}
      {deliveryMethod === 'delivery' && (
        <Card className="bg-portfolio-card border-portfolio-border text-white">
          <CardHeader>
            <CardTitle className="text-portfolio-text">Delivery Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              name="deliveryType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </CardContent>
        </Card>
      )}

      {/* Store Selection (for pickup method) */}
      {deliveryMethod === 'pickup' && (
        <Card className="bg-portfolio-card border-portfolio-border text-white">
          <CardHeader>
            <CardTitle className="text-portfolio-text">Select Apple Store</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              name="storeLocation"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your preferred Apple Store" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLE_STORES.map((store) => (
                      <SelectItem key={store.value} value={store.value}>
                        {store.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.storeLocation && (
              <p className="text-red-500 text-sm mt-2">{errors.storeLocation.message}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delivery Address (for delivery method) */}
      {deliveryMethod === 'delivery' && (
        <Card className="bg-portfolio-card border-portfolio-border text-white">
          <CardHeader>
            <CardTitle className="text-portfolio-text">Delivery Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-portfolio-text">Title *</Label>
                <Controller
                  name="address.title"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Title" />
                      </SelectTrigger>
                      <SelectContent>
                        {TITLES.map((title) => (
                          <SelectItem key={title.value} value={title.value}>
                            {title.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.address?.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.address.title.message}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <Label className="text-portfolio-text">First Name *</Label>
                <Controller
                  name="address.firstName"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="First name" />
                  )}
                />
                {errors.address?.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.address.firstName.message}</p>
                )}
              </div>
              <div>
                <Label className="text-portfolio-text">Surname *</Label>
                <Controller
                  name="address.surname"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Surname" />
                  )}
                />
                {errors.address?.surname && (
                  <p className="text-red-500 text-sm mt-1">{errors.address.surname.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-portfolio-text">Address Line 1 *</Label>
              <Controller
                name="address.line1"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Street address" />
                )}
              />
              {errors.address?.line1 && (
                <p className="text-red-500 text-sm mt-1">{errors.address.line1.message}</p>
              )}
            </div>

            <div>
              <Label className="text-portfolio-text">Address Line 2</Label>
              <Controller
                name="address.line2"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Apartment, suite, etc. (optional)" />
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-portfolio-text">City *</Label>
                <Controller
                  name="address.city"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="City" />
                  )}
                />
                {errors.address?.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.address.city.message}</p>
                )}
              </div>
              <div>
                <Label className="text-portfolio-text">Postcode *</Label>
                <Controller
                  name="address.postcode"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="SW1A 1AA" />
                  )}
                />
                {errors.address?.postcode && (
                  <p className="text-red-500 text-sm mt-1">{errors.address.postcode.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      <Card className="bg-portfolio-card border-portfolio-border text-white">
        <CardHeader>
          <CardTitle className="text-portfolio-text">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-portfolio-text">Email Address *</Label>
            <Controller
              name="contact.email"
              control={control}
              render={({ field }) => (
                <Input {...field} type="email" placeholder="your.email@example.com" />
              )}
            />
            {errors.contact?.email && (
              <p className="text-red-500 text-sm mt-1">{errors.contact.email.message}</p>
            )}
          </div>
          <div>
            <Label className="text-portfolio-text">Phone Number *</Label>
            <Controller
              name="contact.phone"
              control={control}
              render={({ field }) => (
                <Input {...field} type="tel" placeholder="+44 7123 456789" />
              )}
            />
            {errors.contact?.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.contact.phone.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 border-portfolio-border text-portfolio-text"
        >
          Back to Products
        </Button>
        <Button
          onClick={onSubmit}
          className="flex-1 bg-portfolio-accent hover:bg-blue-600"
        >
          Review Order
        </Button>
      </div>
    </div>
  )
}
