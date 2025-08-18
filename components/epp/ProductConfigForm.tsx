// components/apple-discount/BasketItem.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2, Shield, Repeat } from 'lucide-react'
import type { BasketItem } from '@/types/basket'

interface BasketItemProps {
  item: BasketItem
  onRemove: () => void
  onUpdateQuantity: (quantity: number) => void
}

export function BasketItem({ item, onRemove, onUpdateQuantity }: BasketItemProps) {
  return (
    <Card className="bg-portfolio-dark border-portfolio-border">
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

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-portfolio-muted">Quantity:</span>
                <Select 
                  value={item.quantity.toString()}
                  onValueChange={(value) => onUpdateQuantity(parseInt(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
