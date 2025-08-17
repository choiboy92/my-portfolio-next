// components/apple-discount/ProductSelector.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Smartphone, Laptop, Tablet, Watch } from 'lucide-react'
import {
  PRODUCT_CONFIGURATIONS,
  getModelConfigurations,
  getAvailableOptions,
  calculatePrice,
  ProductCategoryKey,
  ProductSpecificationOptions,
  Pencil
} from '@/lib/product-config'
import { basketItemSchema, type BasketItemFormData } from '@/lib/validation-schema'
import type { BasketItem } from '@/types/basket'

interface ProductSelectorProps {
  onAdd: (item: BasketItem) => void
  onCancel: () => void
}

const CATEGORY_ICONS = {
  'iPhone': Smartphone,
  'MacBook': Laptop,
  'iPad': Tablet,
  'Apple Watch': Watch
}

export function ProductSelector({ onAdd, onCancel }: ProductSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<'iPhone' | 'MacBook' | 'iPad' | 'Apple Watch'>('iPhone')
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
    memory: '',
    charger: '',
    applePencil: '',
    magicKeyboard: false,
    nanoTexture: false,
    band: undefined,
    appleCare: false,
    tradeIn: {
      hasTradeIn: false,
      serialNumber: '',
      model: ''
    }
  }
  })

  // Watch form values
  const selectedCategory = watch('category')
  const selectedModel = watch('model')
  const selectedSpecs = watch('specs')
  const selectedAppleCare = watch('appleCare')
  const hasTradeIn = watch('tradeIn.hasTradeIn')

  // Get available models for current category
  const availableModels = getModelConfigurations(selectedCategory as ProductCategoryKey) || []
  
  // Get available options for selected model and spec
  const availableOptions = selectedModel 
    ? getAvailableOptions(selectedCategory as ProductCategoryKey, selectedModel, selectedSpecs)
    : null

    const watchedValues = useWatch({
        control,
        name: ['memory', 'storage', 'charger', 'connectivity', 'size', 'applePencil', 'magicKeyboard', 'nanoTexture', 'band']
    })
  // Calculate price whenever form values change
  useEffect(() => {
    if (availableOptions?.specs && availableOptions.specs.length === 1 && !selectedSpecs) {
        setValue('specs', availableOptions.specs[0].name || 'default')
    }
    if (selectedCategory && selectedModel && selectedSpecs) {
      const [memory, storage, charger, connectivity, size, applePencil, magicKeyboard, nanoTexture, band] = watchedValues

      const price = calculatePrice(
        selectedCategory as any,
        selectedModel,
        selectedSpecs,
        {
          memory: memory as string,
          storage: storage as string,
          charger: charger as string,
          connectivity: connectivity as string,
          size: size as string,
          applePencil: applePencil as string,
          magicKeyboard: magicKeyboard as boolean,
          nanoTexture: nanoTexture as boolean,
          appleCare: selectedAppleCare,
          band: band as { material: string; style: string; color: string }
        }
      )

      // Calculate 17% discount
      if (selectedAppleCare && availableOptions?.appleCarePrice) {
        setDiscountValue((price - availableOptions.appleCarePrice) * 0.17)
      } else {
        setDiscountValue(price * 0.17)
      }
      setEstimatedPrice(price)
    } else {
      setEstimatedPrice(0)
      setDiscountValue(0)
    }
  }, [selectedCategory, selectedModel, selectedSpecs, selectedAppleCare, availableOptions, watch])

  const handleCategoryChange = (value: string) => {
    setActiveCategory(value as 'iPhone' | 'MacBook' | 'iPad' | 'Apple Watch')
    // Reset ALL form fields when category changes
    setValue('category', value)
    setValue('model', '')
    setValue('specs', '')
    setValue('color', '')
    setValue('storage', '')
    setValue('memory', '')
    setValue('charger', '')
    setValue('connectivity', '')
    setValue('size', '')
    setValue('bands', '')
    setValue('applePencil', '')
    setValue('magicKeyboard', false)
    setValue('nanoTexture', false)
    setValue('band', undefined)
    setValue('appleCare', false)
    setValue('tradeIn', {
      hasTradeIn: false,
      serialNumber: '',
      model: ''
    })
  }

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
      discountValue: discountValue,
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
      <Card className="bg-portfolio-card border-portfolio-border max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-portfolio-text">Add Product to Basket</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-portfolio-text">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={handleCategoryChange}>
            {/* Category Tabs */}
            <TabsList className="grid w-full grid-cols-4 mb-6">
              {Object.keys(PRODUCT_CONFIGURATIONS).map((category) => {
                const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]
                if (!Icon) return null
                
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
                    <div className="lg:col-span-2 space-y-6 text-white">
                      
                      {/* Model Selection */}
                      <div className="">
                        <Label className="text-portfolio-text">Model *</Label>
                        <Controller
                          name="model"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={(value) => {
                              field.onChange(value)
                              setValue('specs', '')
                              setValue('color', '')
                              setValue('storage', '')
                              setValue('connectivity', '')
                              setValue('size', '')
                              setValue('bands', '')
                            }} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select model" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableModels.map((model) => (
                                  <SelectItem key={model.key} value={model.key}>
                                    <div className="flex flex-col">
                                      <span>{model.config.displayName}</span>
                                      {model.config.category && (
                                        <span className="text-xs text-muted-foreground">
                                          {model.config.category}
                                        </span>
                                      )}
                                    </div>
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

                      {/* Spec Selection */}
                      {selectedModel && availableOptions?.specs && (availableOptions.specs.length > 1) && (
                        <div>
                          <Label className="text-portfolio-text">Configuration *</Label>
                          <Controller
                            name="specs"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={(value) => {
                                field.onChange(value)
                                // Reset dependent fields when spec changes
                                setValue('storage', '')
                                setValue('memory', '')
                                setValue('charger', '')
                              }} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select configuration" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableOptions.specs.map((spec: ProductSpecificationOptions, index: number) => (
                                    <SelectItem key={index} value={spec.name}>
                                      <div className="flex flex-col text-left">
                                        <span className="font-medium">{spec.name}</span>
                                        <span className="text-sm text-green-600">
                                          From {'\u00A3'}{spec.price.toLocaleString()}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      )}

                      {/* Color Selection */}
                      {selectedModel && availableOptions?.colors && (
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

                      {/* Dynamic Options Based on Product Type */}
                      {selectedSpecs && availableOptions && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Memory Options (MacBook) */}
                          {availableOptions.memoryOptions && (
                            <div>
                              <Label className="text-portfolio-text">Memory</Label>
                              <Controller
                                name="memory"
                                control={control}
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select memory" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableOptions.memoryOptions.map((memory: string) => (
                                        <SelectItem key={memory} value={memory}>
                                          {memory}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                          )}

                          {/* Storage Options */}
                          {availableOptions.storageOptions && (
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
                                      {availableOptions.storageOptions.map((storage: string) => (
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

                          {/* Charger Options (MacBook) */}
                          {availableOptions.chargerOptions && (
                            <div>
                              <Label className="text-portfolio-text">Charger</Label>
                              <Controller
                                name="charger"
                                control={control}
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select charger" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableOptions.chargerOptions.map((charger: string) => (
                                        <SelectItem key={charger} value={charger}>
                                          {charger}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                          )}

                          {/* Connectivity Options (iPad/Apple Watch) */}
                          {availableOptions.connectivityOptions && (
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
                                      {availableOptions.connectivityOptions.map((conn: string) => (
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

                          {/* Size Options (Apple Watch) */}
                          {availableOptions.sizeOptions && (
                            <div>
                              <Label className="text-portfolio-text">Size</Label>
                              <Controller
                                name="size"
                                control={control}
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableOptions.sizeOptions.map((size: string) => (
                                        <SelectItem key={size} value={size}>
                                          {size}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                          )}

                          {/* Apple Pencil Options (iPad) */}
                          {availableOptions.applePencilOptions && (
                            <div>
                              <Label className="text-portfolio-text">Apple Pencil</Label>
                              <Controller
                                name="applePencil"
                                control={control}
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Apple Pencil" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableOptions.applePencilOptions.map((pencil: Pencil) => (
                                        <SelectItem key={pencil.pencilType} value={pencil.pencilType}>
                                          {pencil.pencilType} (+{'\u00A3'}{pencil.price})
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

                      {/* Nano-texture Option */}
                      {availableOptions?.nanoTextureAvailable && (
                        <div className="flex items-center space-x-2">
                          <Controller
                            name="nanoTexture"
                            control={control}
                            render={({ field }) => (
                              <Checkbox
                                id="nanotexture"
                                checked={field.value}
                                onCheckedChange={(checked) => field.onChange(checked === true)}
                              />
                            )}
                          />
                          <Label htmlFor="nanotexture" className="text-portfolio-text">
                            Add Nano-texture glass
                            {availableOptions.nanoTexturePrice && (
                              <span className="text-portfolio-muted ml-2">
                                (+{'\u00A3'}{availableOptions.nanoTexturePrice})
                              </span>
                            )}
                          </Label>
                        </div>
                      )}

                      {/* Magic Keyboard Option (iPad) */}
                      {availableOptions?.magicKeyboardPrice && (
                        <div className="flex items-center space-x-2">
                          <Controller
                            name="magicKeyboard"
                            control={control}
                            render={({ field }) => (
                              <Checkbox
                                id="magickeyboard"
                                checked={field.value}
                                onCheckedChange={(checked) => field.onChange(checked === true)}
                              />
                            )}
                          />
                          <Label htmlFor="magickeyboard" className="text-portfolio-text">
                            Add Magic Keyboard
                            <span className="text-portfolio-muted ml-2">
                              (+{'\u00A3'}{availableOptions.magicKeyboardPrice})
                            </span>
                          </Label>
                        </div>
                      )}

                      {/* AppleCare */}
                      {selectedModel && availableOptions?.appleCarePrice && (
                        <div className="flex items-center space-x-2">
                          <Controller
                            name="appleCare"
                            control={control}
                            render={({ field }) => (
                              <Checkbox
                                id="applecare"
                                checked={field.value}
                                onCheckedChange={(checked) => field.onChange(checked === true)}
                              />
                            )}
                          />
                          <Label htmlFor="applecare" className="text-portfolio-text">
                            Add AppleCare+ Protection
                            <span className="text-portfolio-muted ml-2">
                              (+{'\u00A3'}{availableOptions.appleCarePrice})
                            </span>
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
                                  onCheckedChange={(checked) => field.onChange(checked === true)}
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
                                      +{'\u00A3'}{availableOptions.appleCarePrice}
                                    </span>
                                  </div>
                                )}
                                
                                <div className="border-t border-portfolio-border pt-2">
                                  <div className="flex justify-between font-bold text-lg">
                                    <span>Final price:</span>
                                    <span className="text-green-600">
                                      {'\u00A3'}{(estimatedPrice - discountValue).toLocaleString()}
                                    </span>
                                  </div>
                                </div>                                
                                {hasTradeIn && (
                                  <div className="text-center pt-2">
                                    <span className="text-xs text-portfolio-muted">
                                      - Additional trade-in value will be calculated
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="border-t border-portfolio-border pt-3">
                                <p className="text-xs text-portfolio-muted">
                                  * Final pricing subject to verification
                                </p>
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
                      className="flex-3 bg-portfolio-accent bg-blue-600 hover:bg-blue-500 cursor-pointer"
                    >
                      Add to Basket
                    </Button>
                    <Button
                      type="button"
                      onClick={onCancel}
                      variant="outline"
                      className="flex-1 border-portfolio-border text-portfolio-text text-black cursor-pointer"
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
