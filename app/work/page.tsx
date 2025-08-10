'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ExternalLink, Github, FileText } from 'lucide-react'

interface WorkItem {
  id: string
  title: string
  category: string
  description: string
  mediaType: 'video' | 'image'
  mediaSrc: string
  mediaAlt: string
  tags: string[]
  gradient: string
  status: 'ongoing' | 'completed' | 'paused'
  links?: {
    github?: string
    demo?: string
    paper?: string
  }
}

export default function CurrentWorkPage() {
  const [visibleCards, setVisibleCards] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'ongoing' | 'completed' | 'paused'>('all')

  const workItems: WorkItem[] = [
    {
      id: 'knee-surgery',
      title: "Parallax Errors in Knee Surgery",
      category: "ENGINEERING DESIGN",
      description: "Total Knee Arthroplasty (TKA) is an important procedure in restoring mobility in the knee that has been damaged by arthritis. With growing elderly populations, the rates of this surgery have grown over the last couple of decades and, as such, it is important that these procedures and the consequent implants are placed accurately so as to reduce the need for revision surgeries.\n\nDuring the procedure, bone references are used to place cuts, holes and fixings for implants. However different surgeons take slightly different references depending on viewing angle, distance, surgeon height, light, surrounding tissue that leads to parallax errors that contribute to implant misalignment.\n\n• Design and test experimental rig\n• Evaluate sources of parallax error\n• Quantify effects of error on misalignment\n• Design and test surgical tool as a solution",
      mediaType: "video",
      mediaSrc: "/assets/currentwork/femur_Talbot_video.mov",
      mediaAlt: "Talbot 2015 Parallax Error video demonstration",
      tags: ["Medical", "Engineering", "Research", "Biomechanics"],
      gradient: "from-red-500 to-pink-500",
      status: "ongoing",
      links: {
        paper: "https://example.com/paper"
      }
    },
    {
      id: 'blind-gestures',
      title: "Gestures for the Blind & Visually Impaired",
      category: "ACCESSIBILITY",
      description: "My experiences at Apple taught me a lot about what user-orientated design and engineering really means when it comes to industry. As much as we can go about trying to implement \"good design\", it is often hard to see how we might realise this in our products if we never even first consider the variety of different users. This led me to question interactions for the blind or visually impaired.\n\nSince the conception of the touch screen, as a society, we have developed a set standard of gestures. One example is the pinch to zoom, or drag and slide to scroll. These have defined the way we interact with the content produced. However, for the blind and visually impaired, their interactive experience is largely diminished down to screen-readers. The inaccessible nature of the powerful tools we take for granted highlights a large divide, and I think we can do better.\n\n• Research existing accessibility solutions\n• Design novel gesture interactions\n• Prototype haptic feedback systems\n• User testing with visually impaired community",
      mediaType: "image",
      mediaSrc: "/assets/currentwork/ryoji-iwata-_dVxl4eE1rk-unsplash.jpg",
      mediaAlt: "Person using smartphone with accessibility features",
      tags: ["UX", "Accessibility", "Design", "Human-Computer Interaction"],
      gradient: "from-blue-500 to-purple-500",
      status: "ongoing",
      links: {
        github: "https://github.com/choiboy92/accessibility-gestures"
      }
    },
    {
      id: 'smart-film',
      title: "Smart Film: making film photography sustainable",
      category: "ENGINEERING DESIGN",
      description: "Despite the prevalence of advanced digital and computational photography methods, in the current day age, we are seeing a renewal in film photography. As enthusiasts and beginners alike explore film photography and its unique characteristics that make it such an attractive medium of expression, this growth includes with it the added cost of film canisters, both money-wise and environmentally.\n\nFrom a personal perspective, as an environmentally-conscious engineer and keen film photographer, the impact of film and the canister itself on unsustainable waste divides my opinion on whether film photography's renewal is a good thing.\n\nSo the question I asked myself is how can we keep the timeless characteristics of film such as limited shots, granularity, noise and added hue, while making the whole process more eco-friendly?\n\n• Develop reusable film alternatives\n• Research e-ink photography applications\n• Design digital sensors for analog cameras\n• Environmental impact analysis",
      mediaType: "image",
      mediaSrc: "/assets/currentwork/hello-i-m-nik-odbndb-HFi4-unsplash.jpg",
      mediaAlt: "Vintage film camera with modern twist",
      tags: ["Photography", "Sustainability", "Innovation", "Materials"],
      gradient: "from-green-500 to-blue-500",
      status: "paused",
      links: {
        github: "https://github.com/choiboy92/smart-film"
      }
    },
    {
      id: 'mechanical-keyboards',
      title: "Mechanical Keyboards: an endless spiral",
      category: "HOBBIES",
      description: "What started off as a quarantine hobby has quickly devolved into a full-on spiral into the depths of sound analysis, vibration damping and materials evaluation. If you haven't read the title so far, I'm talking about mechanical keyboards; an item that most normal people don't question.\n\nHowever, over the course of my quarantine, I have become more and more obsessed with the array of sounds and typing feels that can be produced by an array of mounting methods, switch materials, and damping qualities of keyboards.\n\nThis consequently led me to design and manufacture my own 3D printed mechanical keyboard using a purchased PCB. The design involved a gasket-mount system to mount the PCB, as well as a design that could be easily and accurately printed with a hobbyist printer and assembled quickly.\n\n• Custom keyboard design and manufacturing\n• Sound analysis and optimization\n• 3D printing and material testing\n• Open-source hardware documentation",
      mediaType: "image",
      mediaSrc: "/assets/currentwork/keyboard.jpeg",
      mediaAlt: "Custom mechanical keyboard with gasket mount system",
      tags: ["Hardware", "Design", "Manufacturing", "Open Source"],
      gradient: "from-orange-500 to-red-500",
      status: "completed",
      links: {
        github: "https://github.com/choiboy92/custom-keyboard",
        demo: "https://keyboard-demo.vercel.app"
      }
    }
  ]

  const filteredItems = workItems.filter(item => 
    selectedStatus === 'all' || item.status === selectedStatus
  )

  const getStatusColor = (status: string) => {
    const colors = {
      ongoing: 'bg-green-500/20 text-green-400 border-green-400/50',
      completed: 'bg-blue-500/20 text-blue-400 border-blue-400/50',
      paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-400/50'
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      ongoing: '🚧',
      completed: '✅',
      paused: '⏸️'
    }
    return icons[status as keyof typeof icons] || '📋'
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleCards(prev => {
        const nextIndex = prev.length
        if (nextIndex < filteredItems.length) {
          return [...prev, filteredItems[nextIndex].id]
        }
        clearInterval(timer)
        return prev
      })
    }, 200)

    return () => clearInterval(timer)
  }, [filteredItems])

  useEffect(() => {
    setVisibleCards([])
  }, [selectedStatus])

  return (
    <div className="min-h-screen bg-black py-8 px-4 lg:px-[10%]">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4 font-shippori">
            Current Work
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Ongoing projects and research spanning engineering design, accessibility, and innovation
          </p>
          
          {/* Status Filter */}
          <div className="flex flex-wrap justify-center gap-3">
            {(['all', 'ongoing', 'completed', 'paused'] as const).map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-full border transition-all duration-300 capitalize ${
                  selectedStatus === status
                    ? 'bg-green-400 text-black border-green-400'
                    : 'bg-transparent text-gray-400 border-gray-600 hover:border-green-400 hover:text-green-400'
                }`}
              >
                {status === 'all' ? 'All Projects' : `${getStatusIcon(status)} ${status}`}
              </button>
            ))}
          </div>
        </div>

        {/* Project Cards */}
        {filteredItems.map((item, index) => (
          <Card 
            key={item.id} 
            className={`bg-gradient-to-br from-gray-900 to-black border-gray-800 overflow-hidden transition-all duration-1000 hover:border-green-400/50 hover:shadow-2xl hover:shadow-green-400/10 ${
              visibleCards.includes(item.id) 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}
          >
            <CardHeader className="relative">
              {/* Background gradient */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.gradient} opacity-10 blur-3xl`} />
              
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <CardTitle className="text-2xl lg:text-3xl text-white hover:text-green-400 transition-colors cursor-default">
                      {item.title}
                    </CardTitle>
                    <Badge variant="outline" className={getStatusColor(item.status)}>
                      {getStatusIcon(item.status)} {item.status}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="border-green-400 text-green-400 hover:bg-green-400/10 mb-4">
                    {item.category}
                  </Badge>
                </div>

                {/* Action Links */}
                {item.links && (
                  <div className="flex flex-wrap gap-2">
                    {item.links.github && (
                      <a
                        href={item.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-300"
                        title="View on GitHub"
                      >
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                    {item.links.demo && (
                      <a
                        href={item.links.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-300"
                        title="View Demo"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                    {item.links.paper && (
                      <a
                        href={item.links.paper}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-300"
                        title="Read Paper"
                      >
                        <FileText className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Separator className="mb-6" />
              
              <div className="px-6 pb-6">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  
                  {/* Media Content */}
                  <div className="w-full lg:w-[459px] flex-shrink-0">
                    {item.mediaType === 'video' ? (
                      <video 
                        className="w-full h-auto rounded-lg shadow-lg border border-gray-700" 
                        src={item.mediaSrc}
                        autoPlay 
                        loop 
                        muted
                        playsInline
                        poster="/assets/video-placeholder.jpg"
                      />
                    ) : (
                      <div className="relative overflow-hidden rounded-lg shadow-lg border border-gray-700">
                        <Image 
                          src={item.mediaSrc}
                          alt={item.mediaAlt}
                          width={459}
                          height={306}
                          className="w-full h-auto transition-transform duration-500 hover:scale-105"
                        />
                      </div>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 space-y-4">
                    <div className="prose prose-invert max-w-none">
                      {item.description.split('\n\n').map((paragraph, pIndex) => (
                        <div key={pIndex} className="mb-4 last:mb-0">
                          {paragraph.split('\n').map((line, lIndex) => {
                            if (line.startsWith('• ')) {
                              return (
                                <div key={lIndex} className="flex items-start gap-3 mb-2">
                                  <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                                  <span className="text-gray-300 leading-relaxed">{line.substring(2)}</span>
                                </div>
                              )
                            }
                            return (
                              <p key={lIndex} className="text-gray-300 leading-relaxed mb-2">
                                {line}
                              </p>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 pt-4">
                      {item.tags.map((tag, tagIndex) => (
                        <Badge 
                          key={tagIndex} 
                          variant="secondary"
                          className="bg-gray-800/50 text-gray-300 hover:bg-green-400/20 hover:text-green-400 transition-all duration-300"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* No items message */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No projects found for this status</p>
          </div>
        )}
      </div>
    </div>
  )
}