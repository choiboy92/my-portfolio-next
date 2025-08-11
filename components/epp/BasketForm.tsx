// components/apple-discount/BasketForm.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ShoppingCart } from 'lucide-react'
import { ProductSelector } from './ProductSelection'
import { BasketSummary } from './BasketSummary'
import { DeliveryOptions } from './DeliveryOptions'
import { BasketItem as BasketItemComponent } from './BasketItem'
import type { BasketItem, OrderData } from '@/types/basket'
import { deliverySchema, type DeliveryFormData } from '@/lib/validation-schema'

export function BasketForm() {
  const [basket, setBasket] = useState<BasketItem[]>([])
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [currentStep, setCurrentStep] = useState<'products' | 'delivery' | 'summary'>('products')

  const {
    control: deliveryControl,
    handleSubmit: handleDeliverySubmit,
    formState: { errors: deliveryErrors, isValid: isDeliveryValid },
    watch: watchDelivery,
    reset: resetDelivery
  } = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    mode: 'onChange',
    defaultValues: {
      method: 'delivery',
      contact: {
        email: '',
        phone: ''
      }
    }
  })

  const addToBasket = (item: BasketItem) => {
    setBasket(prev => [...prev, { ...item, id: crypto.randomUUID() }])
    setIsAddingProduct(false)
  }

  const removeFromBasket = (itemId: string) => {
    setBasket(prev => prev.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    setBasket(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ))
  }

  const onDeliverySubmit = (deliveryFormData: DeliveryFormData) => {
    setCurrentStep('summary')
  }

  const submitOrder = async (deliveryData: DeliveryFormData) => {
    const orderData: OrderData = {
      basket,
      delivery: deliveryData,
      specialInstructions: ''
    }

    try {
      const response = await fetch('/api/apple-discount/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        // Handle successful submission
        alert('Order submitted successfully!')
        setBasket([])
        resetDelivery()
        setCurrentStep('products')
      } else {
        throw new Error('Failed to submit order')
      }
    } catch (error) {
      alert('Failed to submit order. Please try again.')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {[
            { key: 'products', label: 'Products' },
            { key: 'delivery', label: 'Delivery' },
            { key: 'summary', label: 'Summary' }
          ].map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                currentStep === step.key ? 'bg-blue-600 text-white' : 
                index < ['products', 'delivery', 'summary'].indexOf(currentStep) ? 'bg-green-600 text-white' : 'bg-gray-300'
              }`}>
                {index + 1}
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:block">{step.label}</span>
              {index < 2 && <div className="w-8 sm:w-12 h-0.5 bg-gray-300 mx-2 sm:mx-4" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {currentStep === 'products' && (
            <>
              {/* Current Basket */}
              <Card className="bg-portfolio-card border-portfolio-border text-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-portfolio-text">
                      <ShoppingCart className="w-5 h-5" />
                      Your Basket ({basket.length} items)
                    </CardTitle>
                    <Button
                      onClick={() => setIsAddingProduct(true)}
                      className="bg-portfolio-accent hover:bg-blue-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {basket.length === 0 ? (
                    <div className="text-center py-8 text-portfolio-muted">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Your basket is empty. Add some products to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {basket.map((item) => (
                        <BasketItemComponent
                          key={item.id}
                          item={item}
                          onRemove={() => removeFromBasket(item.id)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Product Selector Modal */}
              {isAddingProduct && (
                <ProductSelector
                  onAdd={addToBasket}
                  onCancel={() => setIsAddingProduct(false)}
                />
              )}
            </>
          )}

          {currentStep === 'delivery' && (
            <DeliveryOptions
              control={deliveryControl}
              errors={deliveryErrors}
              onSubmit={handleDeliverySubmit(onDeliverySubmit)}
              onBack={() => setCurrentStep('products')}
              watch={watchDelivery}
            />
          )}

          {currentStep === 'summary' && (
            <BasketSummary
              basket={basket}
              deliveryData={watchDelivery()}
              onSubmit={() => handleDeliverySubmit(submitOrder)()}
              onBack={() => setCurrentStep('delivery')}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="bg-portfolio-card border-portfolio-border text-white">
            <CardHeader>
              <CardTitle className="text-portfolio-text">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-portfolio-muted">Items in basket:</span>
                <span className="text-portfolio-text">{basket.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-portfolio-muted">Total quantity:</span>
                <span className="text-portfolio-text">
                  {basket.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="border-t border-portfolio-border pt-3">
                <p className="text-xs text-portfolio-muted">
                  Final pricing will be calculated by the Apple employee after reviewing your order.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="space-y-3">
            {currentStep === 'products' && basket.length > 0 && (
              <Button 
                onClick={() => setCurrentStep('delivery')}
                className="w-full bg-portfolio-accent hover:bg-blue-600"
              >
                Continue to Delivery
              </Button>
            )}
            {currentStep === 'delivery' && (
              <Button 
                onClick={handleDeliverySubmit(onDeliverySubmit)}
                disabled={!isDeliveryValid}
                className="w-full bg-portfolio-accent hover:bg-blue-600"
              >
                Review Order
              </Button>
            )}
            {(currentStep === 'delivery' || currentStep === 'summary') && (
              <Button 
                onClick={() => setCurrentStep(currentStep === 'summary' ? 'delivery' : 'products')}
                variant="outline"
                className="w-full border-portfolio-border text-portfolio-text"
              >
                {currentStep === 'summary' ? 'Back to Delivery' : 'Back to Products'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
