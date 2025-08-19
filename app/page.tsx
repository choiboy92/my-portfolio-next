'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

// Enhanced project links component with shadcn components
function ProjectLinks() {
  const [mounted, setMounted] = useState(false)

  const projects = [
    { 
      href: '/projects/apple', 
      title: 'APPLE', 
      subtitle: 'Machine Learning Internship',
      tags: ['ML', 'Product'],
      gradient: 'from-blue-500 to-purple-600'
    },
    { 
      href: '/projects/engdes', 
      title: 'ENGINEERING DESIGN', 
      subtitle: 'Multiple Design Projects',
      tags: ['CAD', 'Manufacturing'],
      gradient: 'from-green-500 to-blue-500'
    },
    { 
      href: '/projects/neutoy', 
      title: 'NEUTOY', 
      subtitle: 'Computer Vision Health Tool',
      tags: ['CV', 'Health'],
      gradient: 'from-purple-500 to-pink-500'
    },
    { 
      href: '/projects/kitchen', 
      title: 'ACCESSIBLE KITCHENS', 
      subtitle: 'Design for Accessibility',
      tags: ['UX', 'Design'],
      gradient: 'from-orange-500 to-red-500'
    },
    { 
      href: '/projects/presweather', 
      title: 'WEATHER NEURAL NETWORK', 
      subtitle: 'ML Weather Classification',
      tags: ['ML', 'Data'],
      gradient: 'from-cyan-500 to-blue-500'
    },
    { 
      href: '/projects/jsviewhkl', 
      title: 'X-RAY CRYSTALLOGRAPHY', 
      subtitle: 'Research & Development',
      tags: ['Research', 'Web'],
      gradient: 'from-yellow-500 to-orange-500'
    }
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6 max-w-6xl mx-auto">
      {projects.map((project, index) => (
        <Link 
          key={index}
          href={project.href} 
          className="group block"
        >
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 p-6 transition-all duration-500 hover:border-green-400/50 hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-400/20 min-h-[200px] flex flex-col justify-between">
            {/* Background gradient effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
            
            {/* Content */}
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors duration-300">
                {project.title}
              </h3>
              <p className="text-gray-400 text-sm mb-4 group-hover:text-gray-300 transition-colors">
                {project.subtitle}
              </p>
            </div>
            
            {/* Tags */}
            <div className="relative z-10 flex flex-wrap gap-2">
              {project.tags.map((tag, tagIndex) => (
                <Badge 
                  key={tagIndex} 
                  variant="secondary"
                  className="bg-gray-800 text-gray-300 hover:bg-green-400/20 hover:text-green-400 transition-all duration-300"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Hover indicator */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    // Placeholder for animations - you can add these later
    // if (window.homePage_anime) {
    //   window.homePage_anime()
    // }
  }, [])

  return (
    <div className="flex flex-1 w-full h-full bg-black items-center justify-center flex-col lg:flex-row lg:px-[20%] py-8">
      {/* Left side - Label */}
      <div className={`flex flex-1 min-w-[200px] justify-start mb-8 lg:mb-0 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
        <div className="border-b border-white pb-2">
          <p className="text-white text-2xl lg:text-3xl ml-2 mb-0 font-light">
            my-portfolio
          </p>
        </div>
      </div>

      {/* Right side - Project grid */}
      <div className={`flex flex-col justify-center items-center transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="flex justify-center mb-6">
          <p className="text-white text-center font-light tracking-wider">
            — EXPLORE MY WORK —
          </p>
        </div>
        <ProjectLinks />
      </div>
    </div>
  )
}