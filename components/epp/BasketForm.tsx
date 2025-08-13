// components/epp/BasketForm.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ShoppingCart, CheckCircle } from 'lucide-react'
import { ProductSelector } from './ProductSelection'
import { DeliveryOptions } from './DeliveryOptions'
import { BasketItem as BasketItemComponent } from './BasketItem'
import { OrderConfirmation } from './OrderConfirmation'
import type { BasketItem, OrderData } from '@/types/basket'
import { deliverySchema, type DeliveryFormData } from '@/lib/validation-schema'

export function BasketForm() {
  const [basket, setBasket] = useState<BasketItem[]>([])
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [currentStep, setCurrentStep] = useState<'products' | 'delivery' | 'summary'>('products')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)

  const {
    control: deliveryControl,
    handleSubmit: handleDeliverySubmit,
    formState: { errors: deliveryErrors },
    watch: watchDelivery,
    reset: resetDelivery,
    setValue: setDeliveryValue,
    trigger: triggerValidation
  } = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    mode: 'onChange',
    defaultValues: {
      method: 'delivery',
      deliveryType: '',
    storeLocation: '',
    address: {
      title: '',
      firstName: '',
      surname: '',
      line1: '',
      line2: '',
      city: '',
      postcode: ''
    },
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

  const onDeliverySubmit = async (deliveryFormData: DeliveryFormData) => {
    console.log('Delivery form submitted:', deliveryFormData)
    setCurrentStep('summary')
  }

  // const onReviewConfirm = () => {
  //   setCurrentStep('confirm')
  // }

  const submitOrder = async (deliveryData: DeliveryFormData) => {
    if (isSubmitting) return

    const orderData: OrderData = {
      basket,
      delivery: deliveryData,
      specialInstructions: ''
    }

    setIsSubmitting(true)
    setOrderError(null)

    try {
      const response = await fetch('/api/epp/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (response.ok) {
        setOrderSubmitted(true)
        setBasket([])
        resetDelivery()
        // setTimeout(() => {
        //   setCurrentStep('products')
        //   setOrderSubmitted(false)
        // }, 5000)
      } else {
        throw new Error(result.error || 'Failed to submit order')
      }
    } catch (error) {
      console.error('Order submission error:', error)
      setOrderError(error instanceof Error ? error.message : 'Failed to submit order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success screen
  if (orderSubmitted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-portfolio-card border-portfolio-border text-white text-center">
          <CardContent className="pt-12 pb-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-portfolio-text mb-4">Order Submitted Successfully!</h2>
            <p className="text-portfolio-muted mb-6">
              Thank you for your EPP order request. I&apos;ll let you know when I receive your request and contact you separately about the order.
            </p>
            <Button
              onClick={() => {
                setOrderSubmitted(false)
                setCurrentStep('products')
              }}
              className="bg-portfolio-accent bg-blue-600 hover:bg-blue-500 cursor-pointer"
            >
              Submit Another Order
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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

      {/* Error Display */}
      {orderError && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
          <p className="text-red-400 text-sm">{orderError}</p>
        </div>
      )}

      {currentStep !== 'summary' && (
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
                      className="bg-portfolio-accent bg-blue-600 hover:bg-blue-500 cursor-pointer"
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

              <div className="space-y-3">
                {currentStep === 'products' && basket.length > 0 && (
                  <Button 
                    onClick={() => setCurrentStep('delivery')}
                    className="w-full bg-portfolio-accent bg-blue-600 hover:bg-blue-500 cursor-pointer"
                  >
                    Continue to Delivery
                  </Button>
                )}
              </div>
            </>
          )}

          {currentStep === 'delivery' && (
            <DeliveryOptions
              control={deliveryControl}
              errors={deliveryErrors}
              onSubmit={onDeliverySubmit}
              onBack={() => setCurrentStep('products')}
              watch={watchDelivery}
              setValue={setDeliveryValue}
              trigger={triggerValidation}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="bg-portfolio-card border-portfolio-border text-white">
            <CardHeader>
              <CardTitle className="text-portfolio-text">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-portfolio-muted">Items:</span>
                <span className="text-portfolio-text">{basket.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-portfolio-muted">Total savings:</span>
                <span className="text-portfolio-text text-green-500">
                  £{basket.reduce((sum, item) => sum + (item.discountValue ?? 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-portfolio-muted">Estimated retail:</span>
                <span className="text-portfolio-text">
                  £{basket.reduce((sum, item) => sum + (item.estimatedPrice ?? 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-portfolio-border pt-2">
                <span className="text-portfolio-muted">Final cost:</span>
                <span className="text-green-500">
                  £{basket.reduce((sum, item) => sum + (item.estimatedPrice ?? 0) - (item.discountValue ?? 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="border-t border-portfolio-border pt-3">
                <p className="text-xs text-portfolio-muted">
                  Final pricing will be communicated after review
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {currentStep === 'summary' && (
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <OrderConfirmation
              basket={basket}
              deliveryData={watchDelivery()}
              onSubmit={() => handleDeliverySubmit(submitOrder)()}
              onBack={() => setCurrentStep('delivery')}
              isSubmitting={false}
            />
        </div>
      </div>
      )}
    </div>
  )
}