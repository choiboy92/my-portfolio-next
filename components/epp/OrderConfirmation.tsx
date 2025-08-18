// components/epp/OrderConfirmation.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Shield, Loader2, CheckCircle, Info, Repeat, MessageSquare } from 'lucide-react'
import { useState, useCallback } from 'react'
import type { BasketItem } from '@/types/basket'
import { orderSchema, type DeliveryFormData, type OrderFormData } from '@/lib/validation-schema'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Controller, useForm, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Textarea } from '@/components/ui/textarea'
import { debounce } from 'lodash'


interface OrderConfirmationProps {
  basket: BasketItem[]
  deliveryData: any
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
}

export function OrderConfirmation({ 
  basket, 
  deliveryData, 
  onSubmit, 
  onBack, 
  isSubmitting = false 
}: OrderConfirmationProps) {

  const {
    control,
    formState: { errors },
    watch 
} = useFormContext<OrderFormData>()

  const additionalComments = watch('additionalComments')
  const checkCompleted = watch('checkCompleted')
  const [commentLength, setCommentLength] = useState(0)
  const maxLength = 1000

  const totalEstimatedPrice = basket.reduce((sum, item) => sum + (item.estimatedPrice ?? 0), 0)
  const totalDiscount = basket.reduce((sum, item) => sum + (item.discountValue ?? 0), 0)
  const finalPrice = totalEstimatedPrice - totalDiscount

  const canSubmit = !isSubmitting && checkCompleted

//   const handleFormSubmit = ( data: OrderFormData) => {
//     console.log('Submitting order data:', data)
//     onSubmit(data.additionalComments)
//   }

  const debouncedSetLength = useCallback(
    debounce((length: number) => setCommentLength(length), 300),
    []
  )

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Final Order Summary */}
      <Card className="bg-portfolio-card border-portfolio-border text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-portfolio-text text-xl">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Final Order Confirmation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {basket.map((item, index) => (
            <div key={item.id}>
                {index > 0 && <Separator className="bg-portfolio-border" />}
                <div className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                        <h4 className="text-portfolio-text font-semibold text-lg">
                        {item.model}
                        </h4>
                        {/* Configuration */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="outline" className="border-portfolio-border text-portfolio-text">
                                {item.color}
                            </Badge>
                        {item.storage && (
                            <Badge variant="outline" className="border-portfolio-border text-portfolio-text">
                            {item.storage}
                            </Badge>
                        )}
                        {item.specs && (
                            <Badge variant="outline" className="border-portfolio-border text-portfolio-text">
                            {item.specs}
                            </Badge>
                        )}
                        {item.size && (
                            <Badge variant="outline" className="border-portfolio-border text-portfolio-text">
                            {item.size}
                            </Badge>
                        )}
                        {item.connectivity && (
                            <Badge variant="outline" className="border-portfolio-border text-portfolio-text">
                            {item.connectivity}
                            </Badge>
                        )}
                        {item.band && (
                            <Badge variant="outline" className="border-portfolio-border text-portfolio-text">
                            {item.band.material} - {item.band.style} - {item.band.color} - {item.band.size}
                            </Badge>
                        )}
                        {/* Services */}
                        {item.appleCare && (
                            <Badge className="bg-blue-600 text-white">
                                <Shield className="w-3 h-3 mr-1" />
                                AppleCare+
                            </Badge>
                        )}
                        {item.tradeIn?.hasTradeIn && (
                            <Badge className="bg-green-600 text-white">
                                <Repeat className="w-3 h-3 mr-1" />
                                Trade-in: {item.tradeIn.model}
                            </Badge>
                        )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-portfolio-text font-medium">Qty: {item.quantity}</p>
                        {item.estimatedPrice && (
                        <div className="text-sm space-y-1">
                            <p className="text-portfolio-muted line-through">£{item.estimatedPrice.toLocaleString()}</p>
                            <p className="text-green-500 font-semibold">£{((item.estimatedPrice ?? 0) - (item.discountValue ?? 0)).toLocaleString()}</p>
                        </div>
                        )}
                    </div>
                </div>
              </div>
            </div>
          ))}

          {/* ✅ Additional Comments Section */}
        <Card className="bg-portfolio-card border-portfolio-border text-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-portfolio-accent" />
              <CardTitle className="text-portfolio-text">Additional Instructions</CardTitle>
            </div>
            <p className="text-sm text-portfolio-muted mt-2">
              Add any special requests, engravings, configuration changes, or delivery instructions
            </p>
          </CardHeader>
          <CardContent>
            <Controller
              name="additionalComments"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Textarea
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      debouncedSetLength(e.target.value.length)
                    }}
                    maxLength={maxLength}
                    placeholder="Examples: Engraving requests, color preferences if unavailable, delivery preferences, and other 

                    Enter any additional requirements here..."
                    className="min-h-[150px] bg-portfolio-dark text-portfolio-text border-portfolio-border resize-none"
                  />
                  
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1 text-portfolio-muted">
                      <Info className="w-3 h-3" />
                      <span>These instructions will be reviewed manually and may affect final pricing</span>
                    </div>
                    <span className="text-portfolio-muted">
                      {commentLength}/{maxLength}
                    </span>
                  </div>

                  {commentLength > maxLength * 0.8 && (
                    <div className="text-xs text-orange-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Approaching character limit
                    </div>
                  )}
                </div>
              )}
            />
          </CardContent>
        </Card>

          
          {/* Quick Summary */}
          <div className="bg-portfolio-dark rounded-lg p-4 border border-portfolio-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-portfolio-accent">{basket.length}</div>
                <div className="text-sm text-portfolio-muted">Items</div>
              </div>
              <div>
                <div className="text-2xl text-portfolio-text">£{totalEstimatedPrice.toLocaleString()}</div>
                <div className="text-sm text-portfolio-muted">Retail Price</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">£{totalDiscount.toLocaleString()}</div>
                <div className="text-sm text-portfolio-muted">Your Savings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">£{finalPrice.toLocaleString()}</div>
                <div className="text-sm text-portfolio-muted">Final Price</div>
              </div>
            </div>
          </div>

          {/* Delivery Summary */}
          <div className="bg-portfolio-dark rounded-lg p-4 border border-portfolio-border">
            <h3 className="font-semibold text-portfolio-text mb-2">
              {deliveryData.method === 'delivery' ? 'Delivery to:' : 'Pickup from:'}
            </h3>
            {deliveryData.method === 'delivery' && deliveryData.address ? (
              <div className="text-portfolio-muted">
                <p>{deliveryData.address.title} {deliveryData.address.firstName} {deliveryData.address.surname}</p>
                <p>{deliveryData.address.line1}</p>
                {deliveryData.address.line2 && <p>{deliveryData.address.line2}</p>}
                <p>{deliveryData.address.city} {deliveryData.address.postcode}</p>
                <p className="mt-1 text-sm">
                  {deliveryData.deliveryType === 'standard' && 'Standard Delivery (5-7 business days)'}
                  {deliveryData.deliveryType === 'express' && 'Express Delivery (2-3 business days)'}
                  {deliveryData.deliveryType === 'next-day' && 'Next Business Day Delivery'}
                </p>
              </div>
            ) : (
              <p className="text-portfolio-muted">
                {deliveryData.storeLocation === 'regent-street' && 'Apple Regent Street'}
                {deliveryData.storeLocation === 'covent-garden' && 'Apple Covent Garden'}
                {deliveryData.storeLocation === 'oxford-street' && 'Apple Oxford Street'}
                {deliveryData.storeLocation === 'stratford-city' && 'Apple Stratford City'}
                {deliveryData.storeLocation === 'bluewater' && 'Apple Bluewater'}
                {deliveryData.storeLocation === 'kingston' && 'Apple Kingston'}
              </p>
            )}
            <p className="text-portfolio-muted text-sm mt-2">
              Contact: {deliveryData.contact.email} • {deliveryData.contact.phone}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Important Information */}
      <Card className="bg-amber-900/20 border-amber-600/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-200">
            <Info className="w-5 h-5" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-amber-200 space-y-3">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Order Processing</h4>
              Orders will be processed manually and I will contact you within 1-2 business days to confirm final pricing, availability, and delivery details.
            </div>
            <div>
              <h4 className="font-semibold mb-2">Payment & Delivery</h4>
                Payment arranged after confirmation with Delivery & Tracking information provided.
                Do let me know if there are any additional things you would like to add to your order
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Checkboxes */}
      <Card className="bg-portfolio-card border-portfolio-border text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-portfolio-text">
            <Shield className="w-5 h-5" />
            Confirmation Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Controller
                  name="checkCompleted"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="confirm-order"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  )}
                />
              <Label htmlFor="terms" className="text-sm text-portfolio-text leading-relaxed">
                I have checked my order configurations and understand and accept that this may change subject to availability. Final pricing, 
                availability, and delivery terms will be confirmed before processing.
              </Label>
            </div>
          </div>

          {!canSubmit && errors.checkCompleted && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                Please confirm above to proceed with your order submission.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          onClick={onBack}
          disabled={isSubmitting}
          variant="outline"
          className="flex-1 border-portfolio-border text-portfolio-text text-black cursor-pointer"
        >
          Back to Review
        </Button>
        <Button
          type="submit"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="flex-1 bg-portfolio-accent bg-blue-600 hover:bg-blue-500 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting Order...
            </>
          ) : ('Submit Order')}
        </Button>
      </div>
    </div>
  )
}