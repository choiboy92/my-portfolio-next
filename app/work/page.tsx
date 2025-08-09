'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface WorkItem {
  title: string
  category: string
  description: string
  mediaType: 'video' | 'image'
  mediaSrc: string
  mediaAlt: string
  tags: string[]
  gradient: string
}

export default function CurrentWorkPage() {
  const [visibleCards, setVisibleCards] = useState<number[]>([])

  const workItems: WorkItem[] = [
    {
      title: "Parallax Errors in Knee Surgery",
      category: "ENGINEERING DESIGN",
      description: "Total Knee Arthroplasty (TKA) is an important procedure in restoring mobility in the knee that has been damaged by arthritis. With growing elderly populations, the rates of this surgery have grown over the last couple of decades and, as such, it is important that these procedures and the consequent implants are placed accurately so as to reduce the need for revision surgeries.\n\nDuring the procedure, bone references are used to place cuts, holes and fixings for implants. However different surgeons take slightly different references depending on viewing angle, distance, surgeon height, light, surrounding tissue that leads to parallax errors that contribute to implant misalignment.\n\n- Design and test experimental rig\n- Evaluate sources of parallax error\n- Quantify effects of error on misalignment\n- Design and test surgical tool as a solution",
      mediaType: "video",
      mediaSrc: "/assets/currentwork/femur_Talbot_video.mov",
      mediaAlt: "Talbot 2015 Parallax Error video",
      tags: ["Medical", "Engineering", "Research"],
      gradient: "from-red-500 to-pink-500"
    },
    {
      title: "Gestures for the Blind & Visually Impaired",
      category: "ACCESSIBILITY",
      description: "My experiences at Apple taught me a lot about what user-orientated design and engineering really means when it comes to industry. As much as we can go about trying to implement \"good design\", it is often hard to see how we might realise this in our products if we never even first consider the variety of different users. This led me to question interactions for the blind or visually impaired.\n\nSince the conception of the touch screen, as a society, we have developed a set standard of gestures. One example is the pinch to zoom, or drag and slide to scroll. These have defined the way we interact with the content produced. However, for the blind and visually impaired, their interactive experience is largely diminished down to screen-readers. The inaccessible nature of the powerful tools we take for granted highlights a large divide, and I think we can do better.",
      mediaType: "image",
      mediaSrc: "/assets/currentwork/ryoji-iwata-_dVxl4eE1rk-unsplash.jpg",
      mediaAlt: "By Ryoji Iwata from Unsplash",
      tags: ["UX", "Accessibility", "Design"],
      gradient: "from-blue-500 to-purple-500"
    },
    {
      title: "Smart Film: making film photography sustainable",
      category: "ENGINEERING DESIGN",
      description: "Despite the prevalence of advanced digital and computational photography methods, in the current day age, we are seeing a renewal in film photography. As enthusiasts and beginners alike explore film photography and its unique characteristics that make it such an attractive medium of expression, this growth includes with it the added cost of film canisters, both money-wise and environmentally.\n\nSo the question I asked myself is how can we keep the timeless characteristics of film such as limited shots, granularity, noise and added hue, while making the whole process more eco-friendly?\n\nTo answer this, I am interested in exploring uses of reusable film similar to how e-ink operates or augmenting film cameras with digital camera sensors without a viewfinder. These methods removes the currently disposable nature of film photography while maintaining some of the quirks of the process that many seem to love and appreciate.",
      mediaType: "image",
      mediaSrc: "/assets/currentwork/hello-i-m-nik-odbndb-HFi4-unsplash.jpg",
      mediaAlt: "By helloimnik from Unsplash",
      tags: ["Photography", "Sustainability", "Innovation"],
      gradient: "from-green-500 to-blue-500"
    },
    {
      title: "Mechanical Keyboards: an endless spiral",
      category: "HOBBIES",
      description: "What started off as a quarantine hobby has quickly devolved into a full-on spiral into the depths of sound analysis, vibration damping and materials evaluation. If you haven't read the title so far, I'm talking about mechanical keyboards; an item that most normal people don't question. However, over the course of my quarantine, I have become more and more obsessed with the array of sounds and typing feels that can be produced by an array of mounting methods, switch materials, and damping qualities of keyboards.\n\nThis consequently led me to design and manufacture my own 3D printed mechanical keyboard using a purchased PCB. The design involved a gasket-mount system to mount the PCB, as well as a design that could be easily and accurately printed with a hobbyist printer and assembled quickly.",
      mediaType: "image",
      mediaSrc: "/assets/currentwork/keyboard.jpeg",
      mediaAlt: "Taken by me",
      tags: ["Hardware", "Design", "Manufacturing"],
      gradient: "from-orange-500 to-red-500"
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleCards(prev => {
        if (prev.length < workItems.length) {
          return [...prev, prev.length]
        }
        clearInterval(timer)
        return prev
      })
    }, 200)

    return () => clearInterval(timer)
  }, [workItems.length])

  return (
    <div className="min-h-screen bg-black py-8 px-4 lg:px-[10%]">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4 font-shippori">
            Current Work
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Ongoing projects and research spanning engineering design, accessibility, and innovation
          </p>
        </div>

        {workItems.map((item, index) => (
          <Card 
            key={index} 
            className={`bg-gradient-to-br from-gray-900 to-black border-gray-800 overflow-hidden transition-all duration-1000 hover:border-green-400/50 hover:shadow-2xl hover:shadow-green-400/10 ${
              visibleCards.includes(index) 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}
          >
            <CardHeader className="relative">
              {/* Background gradient */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.gradient} opacity-10 blur-3xl`} />
              
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl lg:text-3xl text-white mb-2 hover:text-green-400 transition-colors cursor-default">
                    {item.title}
                  </CardTitle>
                  <Badge variant="outline" className="border-green-400 text-green-400 hover:bg-green-400/10">
                    {item.category}
                  </Badge>
                </div>
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
                        className="w-full h-auto rounded-lg shadow-lg" 
                        src={item.mediaSrc}
                        autoPlay 
                        loop 
                        muted
                        playsInline
                        poster="/assets/video-placeholder.jpg"
                      />
                    ) : (
                      <Image 
                        src={item.mediaSrc}
                        alt={item.mediaAlt}
                        width={459}
                        height={306}
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 space-y-4">
                    <div className="prose prose-invert max-w-none">
                      {item.description.split('\n\n').map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-gray-300 leading-relaxed mb-4 last:mb-0">
                          {paragraph.split('\n').map((line, lIndex) => (
                            <span key={lIndex}>
                              {line}
                              {lIndex < paragraph.split('\n').length - 1 && <br />}
                            </span>
                          ))}
                        </p>
                      ))}
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 pt-4">
                      {item.tags.map((tag, tagIndex) => (
                        <Badge 
                          key={tagIndex} 
                          variant="secondary"
                          className="bg-gray-800 text-gray-300 hover:bg-green-400/20 hover:text-green-400 transition-all duration-300"
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
      </div>
    </div>
  )
}