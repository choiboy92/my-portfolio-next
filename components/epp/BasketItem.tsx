// components/apple-discount/BasketItem.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Shield, Repeat } from 'lucide-react'
import type { BasketItem } from '@/types/basket'

interface BasketItemProps {
  item: BasketItem
  onRemove: () => void
  // Remove onUpdateQuantity since quantity is always 1
}

export function BasketItem({ item, onRemove }: BasketItemProps) {
  return (
    <Card className="bg-portfolio-dark border-portfolio-border text-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Product Info */}
            <div className="mb-3">
              <h4 className="text-portfolio-text font-semibold text-lg">
                {item.model}
              </h4>
              <p className="text-portfolio-muted text-sm">{item.category}</p>
            </div>

            {/* Configuration Details */}
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
              {item.connectivity && (
                <Badge variant="outline" className="border-portfolio-border text-portfolio-text">
                  {item.connectivity}
                </Badge>
              )}
            </div>

            {/* Additional Services */}
            <div className="flex flex-wrap gap-2 mb-3">
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

            {/* Price and Quantity */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-portfolio-muted">
                Quantity: 1
              </div>
              {item.estimatedPrice && (
                <div className="text-portfolio-accent font-semibold">
                  £{item.estimatedPrice.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Remove Button */}
          <Button
            onClick={onRemove}
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
