import type { CategoryKey, Model } from '@/lib/catalogue/schema'
import type { SelectedOptions } from '@/lib/catalogue/helpers'

export type Page = { url: string; html: string }

export type PublishedPrice = {
  spec: string
  label: string
  options: SelectedOptions
  price: number
}

export type MappedModel = {
  category: CategoryKey
  key: string
  model: Model
  published: PublishedPrice[]
}

export type MapResult = {
  models: MappedModel[]
  unmapped: string[]
  warnings: string[]
}
