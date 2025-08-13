// components/apple-discount/DeliveryOptions.tsx
'use client'

import { useState, useEffect } from 'react'
import { Controller, Control, FieldErrors, UseFormWatch, UseFormSetValue, UseFormTrigger } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Truck, Store } from 'lucide-react'
import type { DeliveryFormData } from '@/lib/validation-schema'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DeliveryOptionsProps {
  control: Control<DeliveryFormData>
  errors: FieldErrors<DeliveryFormData>
  onSubmit: (data: DeliveryFormData) => Promise<void>
  onBack: () => void
  watch: UseFormWatch<DeliveryFormData>
  setValue: UseFormSetValue<DeliveryFormData>
  trigger: UseFormTrigger<DeliveryFormData>
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


export function DeliveryOptions({ control, errors, onSubmit, onBack, watch, setValue, trigger }: DeliveryOptionsProps) {
    const [deliveryMethod, setDeliveryMethod] = useState('delivery')
    // Watch form values for validation
    const formValues = watch()
    
    // Update method in form when tab changes
    useEffect(() => {
        setValue('method', deliveryMethod as 'delivery' | 'pickup')
        // Clear method-specific fields when switching
        if (deliveryMethod === 'pickup') {
            setValue('deliveryType', undefined)
            setValue('address', undefined)
        } else {
            setValue('storeLocation', undefined)
        }
    }, [deliveryMethod, setValue])

    // Check if form is valid for submission
    const isFormValid = () => {
        const hasContact = formValues.contact?.email && formValues.contact?.phone
        
        if (deliveryMethod === 'delivery') {
        return hasContact &&
                formValues.deliveryType &&
                formValues.address?.title &&
                formValues.address?.firstName &&
                formValues.address?.surname &&
                formValues.address?.line1 &&
                formValues.address?.city &&
                formValues.address?.postcode
        } else {
            return hasContact && formValues.storeLocation
        }
    }

    const handleSubmit = async () => {
        const isValid = await trigger()
        console.log('Form validation result:', isValid)
        console.log('Current form values:', formValues)
        console.log('Form errors:', errors)
        
        if (isValid) {
            onSubmit(formValues)
        } else {
            console.log('Form validation failed')
        }
    }

    return (
    <div className="space-y-6">
      {/* Delivery Method Selection */}
      <Card className="bg-portfolio-card border-portfolio-border text-white">
        <CardHeader>
          <CardTitle className="text-portfolio-text">Delivery Method</CardTitle>
        </CardHeader>
        <CardContent>
            <Tabs value={deliveryMethod} onValueChange={setDeliveryMethod}>
            {/* Category Tabs */}
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-500">
                    <TabsTrigger key={"delivery"} value={"delivery"} className="flex items-center gap-2 transition-all duration-300 cursor-pointer hover:bg-gray-600">
                        <Truck className="w-5 h-5 text-portfolio-accent" />
                        Delivery
                    </TabsTrigger>
                    <TabsTrigger key={"pickup"} value={"pickup"} className="flex items-center gap-2 transition-all duration-300 cursor-pointer hover:bg-gray-600">
                        <Store className="w-5 h-5 text-portfolio-accent" />
                        Pickup
                    </TabsTrigger>
                </TabsList>
                <TabsContent key="delivery" value="delivery">
                    <div className="border-t p-4 border-portfolio-border pt-3 bg-portfolio-card text-white">
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
                    </div>
                    <div className="border-t p-4 border-portfolio-border pt-3 bg-portfolio-card text-white">
                        <CardHeader>
                            <CardTitle className="text-portfolio-text">Address</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
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
                    </div>
                </TabsContent>
                <TabsContent key="pickup" value="pickup">
                    <div className="border-t p-4 border-portfolio-border pt-3 bg-portfolio-card text-white">
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
                    </div>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-portfolio-card border-portfolio-border text-white">
        <CardHeader>
          <CardTitle className="text-portfolio-text">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
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
            <Controller
              name="contact.phone"
              control={control}
              render={({ field }) => (
                <Input {...field} type="tel" placeholder="Phone number (if int use +XX)" />
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
          className="flex-1 border-portfolio-border text-portfolio-text text-black cursor-pointer"
        >
          Back to Products
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid()}
          className="flex-1 bg-portfolio-accent bg-blue-600 hover:bg-blue-500 cursor-pointer"
        >
          Review Order
        </Button>
      </div>
    </div>
    )
}
