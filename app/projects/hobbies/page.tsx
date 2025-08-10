'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, Pause } from 'lucide-react'

interface MediaItem {
  id: string
  title: string
  description: string
  type: 'image' | 'video'
  src: string
  category: string
  aspectRatio: string
}

export default function HobbiesPage() {
  const [visibleItems, setVisibleItems] = useState<string[]>([])
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set())

  const mediaItems: MediaItem[] = [
    {
      id: 'photography_self',
      title: 'Film Photography',
      description: 'self-portrait c2019',
      type: 'image',
      src: '/assets/hobbies/photography_self.jpg',
      category: 'Photography',
      aspectRatio: 'aspect-[2/3]'
    },
    {
      id: 'photography_bwport',
      title: 'Film Photography',
      description: 'not always black and white',
      type: 'image',
      src: '/assets/hobbies/photography_bwport.JPG',
      category: 'Photography',
      aspectRatio: 'aspect-[3/2]'
    },
    {
      id: 'brighton_trip',
      title: 'Travel Videos',
      description: 'Trip to Brighton 2020',
      type: 'video',
      src: '/assets/hobbies/brighton_trip.mov',
      category: 'Travel',
      aspectRatio: 'aspect-video'
    },
    {
      id: 'photography_window',
      title: 'Film Photography',
      description: 'above the clouds',
      type: 'image',
      src: '/assets/hobbies/photography_window.jpg',
      category: 'Photography',
      aspectRatio: 'aspect-[4/5]'
    },
    {
      id: 'scuba_photo',
      title: 'Scuba Diving',
      description: 'Jeju Island 2020',
      type: 'image',
      src: '/assets/hobbies/scuba.JPG',
      category: 'Adventure',
      aspectRatio: 'aspect-[2/3]'
    },
    {
      id: 'scuba_video',
      title: 'Scuba Diving',
      description: 'Jeju Island 2017',
      type: 'video',
      src: '/assets/hobbies/scuba_video.mp4',
      category: 'Adventure',
      aspectRatio: 'aspect-video'
    },
    {
      id: 'squash_photo',
      title: 'Squash',
      description: 'Imperial Varsity 2019',
      type: 'image',
      src: '/assets/hobbies/squash_photo.JPG',
      category: 'Sports',
      aspectRatio: 'aspect-[3/2]'
    }
  ]

  const categories = ['All', ...Array.from(new Set(mediaItems.map(item => item.category)))]
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [layoutStyle, setLayoutStyle] = useState<'masonry' | 'grid'>('masonry')

  const filteredItems = mediaItems.filter(item => 
    selectedCategory === 'All' || item.category === selectedCategory
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleItems(prev => {
        const nextIndex = prev.length
        if (nextIndex < filteredItems.length) {
          return [...prev, filteredItems[nextIndex].id]
        }
        clearInterval(timer)
        return prev
      })
    }, 150)

    return () => clearInterval(timer)
  }, [filteredItems])

  useEffect(() => {
    setVisibleItems([])
  }, [selectedCategory])

  const toggleVideoPlay = (itemId: string) => {
    const video = document.getElementById(`video-${itemId}`) as HTMLVideoElement
    if (video) {
      if (playingVideos.has(itemId)) {
        video.pause()
        setPlayingVideos(prev => {
          const newSet = new Set(prev)
          newSet.delete(itemId)
          return newSet
        })
      } else {
        video.play()
        setPlayingVideos(prev => new Set(prev).add(itemId))
      }
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      Photography: 'bg-purple-500/20 text-purple-400 border-purple-400/50',
      Travel: 'bg-blue-500/20 text-blue-400 border-blue-400/50',
      Adventure: 'bg-green-500/20 text-green-400 border-green-400/50',
      Sports: 'bg-red-500/20 text-red-400 border-red-400/50'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-400/50'
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 font-shippori">
            Hobbies & Interests
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            A visual journey through my personal interests - from film photography to underwater adventures
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full border transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-green-400 text-black border-green-400'
                    : 'bg-transparent text-gray-400 border-gray-600 hover:border-green-400 hover:text-green-400'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Layout Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setLayoutStyle('masonry')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                layoutStyle === 'masonry'
                  ? 'bg-green-400 text-black'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Masonry
            </button>
            <button
              onClick={() => setLayoutStyle('grid')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                layoutStyle === 'grid'
                  ? 'bg-green-400 text-black'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Grid
            </button>
          </div>
        </div>

        {/* Media Gallery */}
        <div className={`gap-4 ${
          layoutStyle === 'masonry' 
            ? 'columns-1 md:columns-2 lg:columns-3 xl:columns-4' 
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {filteredItems.map((item, index) => (
            <Card
              key={item.id}
              className={`bg-gray-900/50 border-gray-700 overflow-hidden hover:border-green-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-green-400/10 group ${
                layoutStyle === 'masonry' ? 'break-inside-avoid mb-4' : ''
              } ${
                visibleItems.includes(item.id)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="relative overflow-hidden">
                {item.type === 'image' ? (
                  <div className={`relative ${item.aspectRatio} w-full`}>
                    <img
                      src={item.src}
                      alt={item.description}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className={`relative ${item.aspectRatio} w-full`}>
                    <video
                      id={`video-${item.id}`}
                      src={item.src}
                      className="absolute inset-0 w-full h-full object-cover"
                      loop
                      muted
                      playsInline
                    />
                    <button
                      onClick={() => toggleVideoPlay(item.id)}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-all duration-300"
                    >
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                        {playingVideos.has(item.id) ? (
                          <Pause className="w-8 h-8 text-white ml-0" />
                        ) : (
                          <Play className="w-8 h-8 text-white ml-1" />
                        )}
                      </div>
                    </button>
                  </div>
                )}

                {/* Overlay Content */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <CardContent className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-semibold">{item.title}</h3>
                        <Badge variant="outline" className={getCategoryColor(item.category)}>
                          {item.category}
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm">{item.description}</p>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* No items message */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No items found for this category</p>
          </div>
        )}
      </div>
    </div>
  )
}