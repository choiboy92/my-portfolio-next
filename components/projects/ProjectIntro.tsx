'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

interface ProjectIntroProps {
  name: string
  date: string
  id: string
  description?: string
  tags?: string[]
}

export default function ProjectIntro({ name, date, id, description, tags = [] }: ProjectIntroProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    setIsVisible(true)
    // Placeholder for custom animations - you can add these later
    // if (window.init) {
    //   window.init(id, name, date)
    // }
    // if (window.sideQuickNav_bounce) {
    //   window.sideQuickNav_bounce()
    // }
  }, [id, name, date])

  // Create a gradient based on project ID
  const getGradient = (projectId: string) => {
    const gradients = {
      apple: 'from-blue-500 via-purple-500 to-pink-500',
      kitchen: 'from-orange-500 via-red-500 to-pink-500',
      neutoy: 'from-purple-500 via-pink-500 to-red-500',
      engdes: 'from-green-500 via-blue-500 to-purple-500',
      presweather: 'from-cyan-500 via-blue-500 to-indigo-500',
      jsviewhkl: 'from-yellow-500 via-orange-500 to-red-500'
    }
    return gradients[projectId as keyof typeof gradients] || 'from-gray-500 to-gray-700'
  }

  return (
    <div className="relative min-h-[60vh] flex flex-col justify-center items-center overflow-hidden">
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(id)} opacity-20 animate-pulse`} />
      <div className="absolute inset-0 bg-black/80" />
      
      {/* Animated particles/dots */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className={`relative z-10 text-center px-4 transition-all duration-1000 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      }`}>
        
        {/* Project Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 font-shippori leading-tight">
          {name.split('\n').map((line, index) => (
            <span key={index} className="block">
              {line}
            </span>
          ))}
        </h1>

        {/* Date */}
        <div className={`mb-6 transition-all duration-1000 delay-300 ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4'
        }`}>
          <Badge 
            variant="outline" 
            className="border-green-400 text-green-400 text-lg px-6 py-2 bg-green-400/10 backdrop-blur-sm hover:bg-green-400/20 transition-all"
          >
            {date}
          </Badge>
        </div>

        {/* Description (if provided) */}
        {description && (
          <div className={`max-w-2xl mx-auto mb-6 transition-all duration-1000 delay-500 ${
            isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4'
          }`}>
            <p className="text-gray-300 text-lg leading-relaxed">
              {description}
            </p>
          </div>
        )}

        {/* Tags (if provided) */}
        {tags.length > 0 && (
          <div className={`flex flex-wrap justify-center gap-2 transition-all duration-1000 delay-700 ${
            isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4'
          }`}>
            {tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="bg-gray-800/50 text-gray-300 backdrop-blur-sm hover:bg-green-400/20 hover:text-green-400 transition-all duration-300"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Scroll indicator */}
        <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-1000 delay-1000 ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4'
        }`}>
          <div className="flex flex-col items-center text-gray-400 animate-bounce">
            <span className="text-sm mb-2">Scroll to explore</span>
            <div className="w-6 h-10 border-2 border-gray-400 rounded-full relative">
              <div className="w-1 h-3 bg-gray-400 rounded-full absolute top-2 left-1/2 transform -translate-x-1/2 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}