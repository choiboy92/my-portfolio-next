// components/apple-discount/BasketSummary.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Package, MapPin, Mail, Phone, Shield, Repeat } from 'lucide-react'
import type { BasketItem } from '@/types/basket'
import type { DeliveryFormData } from '@/lib/validation-schema'

interface BasketSummaryProps {
  basket: BasketItem[]
  deliveryData: DeliveryFormData
  onSubmit: () => void
  onBack: () => void
}

export function BasketSummary({ basket, deliveryData, onSubmit, onBack }: BasketSummaryProps) {
  const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="space-y-6">
      {/* Order Items */}
      <Card className="bg-portfolio-card border-portfolio-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-portfolio-text">
            <Package className="w-5 h-5" />
            Order Items ({totalItems} items)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {basket.map((item, index) => (
            <div key={item.id}>
              {index > 0 && <Separator className="bg-portfolio-border" />}
              <div className="pt-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-portfolio-text font-semibold text-lg">
                      {item.model}
                    </h4>
                    <p className="text-portfolio-muted text-sm mb-2">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-portfolio-text font-medium">Qty: {item.quantity}</p>
                  </div>
                </div>

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
                  {item.bands && (
                    <Badge variant="outline" className="border-portfolio-border text-portfolio-text">
                      {item.bands}
                    </Badge>
                  )}
                </div>

                {/* Services */}
                {(item.appleCare || item.tradeIn?.hasTradeIn) && (
                  <div className="flex flex-wrap gap-2">
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
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Delivery Information */}
      <Card className="bg-portfolio-card border-portfolio-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-portfolio-text">
            <MapPin className="w-5 h-5" />
            {deliveryData.method === 'delivery' ? 'Delivery Details' : 'Pickup Details'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {deliveryData.method === 'delivery' ? (
            <>
              <div>
                <p className="text-portfolio-muted text-sm">Delivery Type</p>
                <p className="text-portfolio-text font-medium">
                  {deliveryData.deliveryType === 'standard' && 'Standard Delivery (5-7 business days)'}
                  {deliveryData.deliveryType === 'express' && 'Express Delivery (2-3 business days)'}
                  {deliveryData.deliveryType === 'next-day' && 'Next Business Day Delivery'}
                </p>
              </div>
              
              {deliveryData.address && (
                <div>
                  <p className="text-portfolio-muted text-sm">Delivery Address</p>
                  <div className="text-portfolio-text">
                    <p className="font-medium">
                      {deliveryData.address.title} {deliveryData.address.firstName} {deliveryData.address.surname}
                    </p>
                    <p>{deliveryData.address.line1}</p>
                    {deliveryData.address.line2 && <p>{deliveryData.address.line2}</p>}
                    <p>{deliveryData.address.city} {deliveryData.address.postcode}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <p className="text-portfolio-muted text-sm">Pickup Location</p>
              <p className="text-portfolio-text font-medium">
                {deliveryData.storeLocation === 'regent-street' && 'Apple Regent Street'}
                {deliveryData.storeLocation === 'covent-garden' && 'Apple Covent Garden'}
                {deliveryData.storeLocation === 'oxford-street' && 'Apple Oxford Street'}
                {deliveryData.storeLocation === 'stratford-city' && 'Apple Stratford City'}
                {deliveryData.storeLocation === 'bluewater' && 'Apple Bluewater'}
                {deliveryData.storeLocation === 'kingston' && 'Apple Kingston'}
              </p>
            </div>
          )}

          <Separator className="bg-portfolio-border" />

          <div>
            <p className="text-portfolio-muted text-sm">Contact Information</p>
            <div className="text-portfolio-text space-y-1">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {deliveryData.contact.email}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {deliveryData.contact.phone}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="bg-yellow-900/20 border-yellow-600/30">
        <CardContent className="pt-6">
          <div className="text-yellow-200 text-sm space-y-2">
            <p className="font-medium">Important Notice:</p>
            <ul className="space-y-1 text-xs">
              <li>• This order will be reviewed and processed manually by an Apple employee</li>
              <li>• Final pricing and availability will be confirmed before placing the actual order</li>
              <li>• You will be contacted at the provided email/phone for payment and confirmation</li>
              <li>• Delivery estimates are approximate and subject to product availability</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 border-portfolio-border text-portfolio-text"
        >
          Back to Delivery
        </Button>
        <Button
          onClick={onSubmit}
          className="flex-1 bg-portfolio-accent hover:bg-blue-600"
        >
          Submit Order Request
        </Button>
      </div>
    </div>
  )
}
