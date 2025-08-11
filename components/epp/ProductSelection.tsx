// components/apple-discount/ProductSelector.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Smartphone, Laptop, Tablet, Watch } from 'lucide-react'
import { getAvailableOptions, calculateEstimatedPrice, PRODUCT_CONFIGURATIONS } from '@/lib/product-config'
import { basketItemSchema, type BasketItemFormData } from '@/lib/validation-schema'
import type { BasketItem } from '@/types/basket'

interface ProductSelectorProps {
  onAdd: (item: BasketItem) => void
  onCancel: () => void
}

type AvailableOptions = {
  models: string[];
  colors: string[];
  storage: string[];
  specs?: string[];
  connectivity?: string[];
  size?: string[];
  bands?: string[] | Record<string, string[]>;
  appleCareAvailable: boolean;
};

const CATEGORY_ICONS = {
  'iPhone': Smartphone,
  'MacBook': Laptop,
  'iPad': Tablet,
  'Apple Watch': Watch
}

export function ProductSelector({ onAdd, onCancel }: ProductSelectorProps) {
  const [activeCategory, setActiveCategory] = useState('iPhone')
  const [availableOptions, setAvailableOptions] = useState<AvailableOptions | null>(null)
  const [estimatedPrice, setEstimatedPrice] = useState(0)
  const [discountValue, setDiscountValue] = useState(0)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset
  } = useForm<BasketItemFormData>({
    resolver: zodResolver(basketItemSchema),
    mode: 'onChange',
    defaultValues: {
      category: 'iPhone',
      model: '',
      color: '',
      storage: '',
      specs: '',
      size: '',
      connectivity: '',
      bands: '',
      appleCare: false,
      tradeIn: {
        hasTradeIn: false,
        serialNumber: '',
        model: ''
      }
    }
  })

  const selectedCategory = watch('category')
  const selectedModel = watch('model')
  const selectedStorage = watch('storage')
  const selectedSpecs = watch('specs')
  const selectedConnectivity = watch('connectivity')
  const selectedSize = watch('size')
  const selectedBands = watch('bands')
  const selectedAppleCare = watch('appleCare')
  const hasTradeIn = watch('tradeIn.hasTradeIn')

  // Update category when tab changes
  useEffect(() => {
    setValue('category', activeCategory)
    setValue('model', '')
    setValue('color', '')
    setValue('storage', '')
    setValue('specs', '')
    setValue('connectivity', '')
    setValue('size', '')
    setValue('bands', '')
  }, [activeCategory, setValue])

  // Update available options when category or model changes
  useEffect(() => {
    if (selectedCategory) {
      const options = getAvailableOptions(selectedCategory, selectedModel)
      setAvailableOptions(options)
    }
  }, [selectedCategory, selectedModel])

  // Calculate price whenever form values change
  useEffect(() => {
    if (selectedCategory && selectedModel) {
      const price = calculateEstimatedPrice(
        selectedCategory,
        selectedModel,
        selectedStorage,
        selectedSpecs,
        selectedConnectivity,
        selectedSize, // size not applicable for all categories
        selectedBands, // bands not applicable for all categories
        selectedAppleCare
      )
      if (selectedAppleCare) {
        const applecarePrice = PRODUCT_CONFIGURATIONS[selectedCategory as keyof typeof PRODUCT_CONFIGURATIONS].appleCarePrice
        setDiscountValue((price - applecarePrice) * 0.17)
      } else {
        setDiscountValue(price * 0.17)
      }
      setEstimatedPrice(price)
    } else {
      setEstimatedPrice(0)
    }
  }, [selectedCategory, selectedModel, selectedStorage, selectedSpecs, selectedConnectivity, selectedSize, selectedBands, selectedAppleCare])

  const onSubmit = (data: BasketItemFormData) => {
    const item: BasketItem = {
      id: crypto.randomUUID(),
      category: data.category!,
      model: data.model!,
      color: data.color!,
      storage: data.storage,
      specs: data.specs,
      size: data.size,
      connectivity: data.connectivity,
      bands: data.bands,
      appleCare: data.appleCare,
      quantity: 1,
      estimatedPrice: estimatedPrice,
      tradeIn: data.tradeIn?.hasTradeIn ? {
        hasTradeIn: true,
        serialNumber: data.tradeIn.serialNumber,
        model: data.tradeIn.model
      } : { hasTradeIn: false }
    }

    onAdd(item)
    reset()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="bg-portfolio-card border-portfolio-border max-w-4xl w-full max-h-[90vh] overflow-y-auto text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-portfolio-text">Add Product to Basket</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-portfolio-text">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            {/* Category Tabs */}
            <TabsList className="grid w-full grid-cols-4 mb-6">
              {Object.keys(PRODUCT_CONFIGURATIONS).map((category) => {
                const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]
                console.log(`Category: ${category}, Icon: ${Icon}`) // Debugging line
                return (
                  <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {category}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* Tab Content for each category */}
            {Object.keys(PRODUCT_CONFIGURATIONS).map((category) => (
              <TabsContent key={category} value={category}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Product Configuration */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Model Selection */}
                      <div>
                        <Label className="text-portfolio-text">Model *</Label>
                        <Controller
                          name="model"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={(value) => {
                              field.onChange(value)
                              // Reset dependent fields
                              setValue('color', '')
                              setValue('storage', '')
                              setValue('specs', '')
                              setValue('connectivity', '')
                              setValue('size', '')
                              setValue('bands', '')
                            }} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select model" />
                              </SelectTrigger>
                              <SelectContent>
                                {PRODUCT_CONFIGURATIONS[category as keyof typeof PRODUCT_CONFIGURATIONS].models.map((model: string) => (
                                  <SelectItem key={model} value={model}>
                                    {model}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.model && (
                          <p className="text-red-500 text-sm mt-1">{errors.model.message}</p>
                        )}
                      </div>

                      {/* Dynamic Options */}
                      {selectedModel && availableOptions && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Color */}
                          {availableOptions.colors.length > 0 && (
                            <div>
                              <Label className="text-portfolio-text">Color *</Label>
                              <Controller
                                name="color"
                                control={control}
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableOptions.colors.map((color: string) => (
                                        <SelectItem key={color} value={color}>
                                          {color}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              {errors.color && (
                                <p className="text-red-500 text-sm mt-1">{errors.color.message}</p>
                              )}
                            </div>
                          )}

                          {/* Storage */}
                          {availableOptions.storage.length > 0 && (
                            <div>
                              <Label className="text-portfolio-text">
                                Storage {(category === 'iPhone' || category === 'iPad') && '*'}
                              </Label>
                              <Controller
                                name="storage"
                                control={control}
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select storage" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableOptions.storage.map((storage: string) => (
                                        <SelectItem key={storage} value={storage}>
                                          {storage}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                          )}

                          {/* Specs (for MacBooks) */}
                          {(availableOptions.specs?.length ?? 0) > 0 && (
                            <div>
                              <Label className="text-portfolio-text">Chip *</Label>
                              <Controller
                                name="specs"
                                control={control}
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select chip" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableOptions.specs?.map((spec: string) => (
                                        <SelectItem key={spec} value={spec}>
                                          {spec}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                          )}

                          {/* Connectivity (for Watch & iPad) */}
                          {(availableOptions.connectivity?.length ?? 0) > 0 && (
                            <div>
                              <Label className="text-portfolio-text">Connectivity</Label>
                              <Controller
                                name="connectivity"
                                control={control}
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select connectivity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableOptions.connectivity?.map((conn: string) => (
                                        <SelectItem key={conn} value={conn}>
                                          {conn}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                          )}

                          {/* Sizes (for Watch) */}
                          {(availableOptions.size?.length ?? 0) > 0 && (
                            <div>
                              <Label className="text-portfolio-text">Size</Label>
                              <Controller
                                name="size"
                                control={control}
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select watch size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableOptions.size?.map((conn: string) => (
                                        <SelectItem key={conn} value={conn}>
                                          {conn}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* AppleCare */}
                      {selectedModel && availableOptions?.appleCareAvailable && (
                        <div className="flex items-center space-x-2">
                          <Controller
                            name="appleCare"
                            control={control}
                            render={({ field }) => (
                              <Checkbox
                                id="applecare"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                          <Label htmlFor="applecare" className="text-portfolio-text">
                            Add AppleCare+ Protection
                            {PRODUCT_CONFIGURATIONS[category as keyof typeof PRODUCT_CONFIGURATIONS].appleCarePrice && (
                              <span className="text-portfolio-muted ml-2">
                                (+£{PRODUCT_CONFIGURATIONS[category as keyof typeof PRODUCT_CONFIGURATIONS].appleCarePrice})
                              </span>
                            )}
                          </Label>
                        </div>
                      )}

                      {/* Trade-in */}
                      {selectedModel && (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Controller
                              name="tradeIn.hasTradeIn"
                              control={control}
                              render={({ field }) => (
                                <Checkbox
                                  id="tradein"
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              )}
                            />
                            <Label htmlFor="tradein" className="text-portfolio-text">
                              I have a device to trade in
                            </Label>
                          </div>

                          {hasTradeIn && (
                            <div className="space-y-3 pl-6">
                              <div>
                                <Label className="text-portfolio-text">Trade-in Device Model</Label>
                                <Controller
                                  name="tradeIn.model"
                                  control={control}
                                  render={({ field }) => (
                                    <Input
                                      {...field}
                                      placeholder="e.g., iPhone 12 Pro Max"
                                      className="bg-portfolio-card text-portfolio-text border-portfolio-border"
                                    />
                                  )}
                                />
                              </div>
                              <div>
                                <Label className="text-portfolio-text">Serial Number</Label>
                                <Controller
                                  name="tradeIn.serialNumber"
                                  control={control}
                                  render={({ field }) => (
                                    <Input
                                      {...field}
                                      placeholder="Device serial number"
                                      className="bg-portfolio-card text-portfolio-text border-portfolio-border"
                                    />
                                  )}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Price Estimation Sidebar */}
                    <div className="space-y-1">
                      <Card className="bg-portfolio-dark border-portfolio-border text-white">
                        <CardHeader>
                          <CardTitle className="text-portfolio-text text-lg">Price Estimation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {estimatedPrice > 0 ? (
                            <>
                              <div className="text-center p-1 bg-portfolio-card rounded-lg">
                                <div className="text-2xl text-portfolio-accent">
                                  £{estimatedPrice.toLocaleString()}
                                </div>
                                <div className="text-xs text-portfolio-muted">
                                  Estimated retail price
                                </div>
                              </div>
                              <div className="text-center p-1 bg-portfolio-card rounded-lg">
                                <div className="text-2xl font-bold text-portfolio-accent text-red-500">
                                  - £{discountValue.toLocaleString()}
                                </div>
                                <div className="text-xs text-portfolio-muted">
                                  discount
                                </div>
                              </div>
                              <div className="space-y-2 text-sm">
                                {selectedAppleCare && (
                                  <div className="flex justify-between">
                                    <span className="text-portfolio-muted">AppleCare+</span>
                                    <span className="text-portfolio-text">
                                      + £{PRODUCT_CONFIGURATIONS[category as keyof typeof PRODUCT_CONFIGURATIONS].appleCarePrice}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="border-t text-center p-4 border-portfolio-border pt-3 bg-portfolio-card">
                                <div className="text-2xl font-bold text-portfolio-accent text-green-500">
                                  £{(estimatedPrice-discountValue).toLocaleString()}
                                </div>
                                <div className="text-xs text-portfolio-muted">
                                  Final price
                                </div>
                                {hasTradeIn && (
                                  <div className="text-xs text-portfolio-muted text-right text-green-500">
                                    - £TradeIn
                                  </div>
                                )}
                              </div>

                                
                            </>
                          ) : (
                            <div className="text-center py-8 text-portfolio-muted">
                              <p className="text-sm">
                                Select a model and configuration to see estimated pricing
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={!isValid || estimatedPrice === 0}
                      className="flex-1 bg-portfolio-accent hover:bg-blue-600"
                    >
                      Add to Basket
                    </Button>
                    <Button
                      type="button"
                      onClick={onCancel}
                      variant="outline"
                      className="border-portfolio-border text-portfolio-text"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
